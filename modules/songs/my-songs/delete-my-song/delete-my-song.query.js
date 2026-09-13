import { sql } from '#db';
import AppError from '#error-handler';

const AUDIO_EXTENSION = /\.mp3$/i;
const IMAGE_EXTENSION = /\.(jpe?g|png)$/i;

function storageObjectPath(folder, filename, extension) {
  if (typeof filename !== 'string'
    || filename.length === 0
    || filename.includes('/')
    || filename.includes('\\')
    || filename === '.'
    || filename === '..'
    || !extension.test(filename)) {
    throw new AppError('Plik utworu ma nieprawidłową ścieżkę w bazie.', 409);
  }
  return `${folder}/${filename}`;
}

export function createDeleteMySongQueries(database = sql) {
  return {
    async deleteOwned(authorId, songId) {
      return database.begin(async (transaction) => {
        const [song] = await transaction`
          SELECT s.id, s.file, s."song_Image" AS song_image,
                 consent.author_id AS publisher_id,
                 (SELECT count(*) FROM authors_songs association WHERE association.song_id = s.id) AS author_count,
                 EXISTS (
                   SELECT 1 FROM authors_songs association
                   WHERE association.song_id = s.id AND association.author_id = ${authorId}
                 ) AS is_author
          FROM songs s
          LEFT JOIN song_publication_consents consent ON consent.song_id = s.id
          WHERE s.id = ${songId}
          FOR UPDATE OF s
        `;
        if (!song || !song.is_author) {
          throw new AppError('Nie znaleziono Twojego utworu.', 404);
        }
        if (Number(song.author_count) !== 1
          || (song.publisher_id != null && String(song.publisher_id) !== String(authorId))) {
          throw new AppError(
            'Ten utwór ma innych uprawnionych autorów i nie może zostać usunięty samodzielnie.',
            409
          );
        }

        const paths = [
          storageObjectPath('songs', song.file, AUDIO_EXTENSION),
          storageObjectPath('images/songPictures', song.song_image, IMAGE_EXTENSION),
        ];

        await transaction`DELETE FROM views WHERE song_id = ${songId}`;
        await transaction`DELETE FROM monthly_song_stats WHERE song_id = ${songId}`;
        await transaction`DELETE FROM songs WHERE id = ${songId}`;

        const [job] = await transaction`
          INSERT INTO song_storage_cleanup_jobs (bucket, object_paths)
          VALUES ('spotify', ${database.json(paths)}::jsonb)
          RETURNING id
        `;
        return { cleanupJobId: String(job.id) };
      });
    },

    async getCleanupJob(jobId) {
      const [job] = await database`
        SELECT id, bucket, object_paths
        FROM song_storage_cleanup_jobs
        WHERE id = ${jobId}
      `;
      return job;
    },

    async isAudioInUse(filename) {
      const [reference] = await database`
        SELECT EXISTS (SELECT 1 FROM songs WHERE file = ${filename}) AS in_use
      `;
      return Boolean(reference?.in_use);
    },

    async isImageInUse(filename) {
      const [reference] = await database`
        SELECT EXISTS (SELECT 1 FROM songs WHERE "song_Image" = ${filename}) AS in_use
      `;
      return Boolean(reference?.in_use);
    },

    async completeCleanupJob(jobId) {
      await database`DELETE FROM song_storage_cleanup_jobs WHERE id = ${jobId}`;
    },

    async failCleanupJob(jobId, message) {
      await database`
        UPDATE song_storage_cleanup_jobs
        SET attempts = attempts + 1,
            last_error = ${message},
            next_attempt_at = now() + interval '1 minute'
        WHERE id = ${jobId}
      `;
    },
  };
}

export default createDeleteMySongQueries();
