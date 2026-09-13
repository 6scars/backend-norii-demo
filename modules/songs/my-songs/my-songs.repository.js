import { createClient } from '@supabase/supabase-js';
import AppError from '#error-handler';
import { sql } from '#db';

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

export function createMySongsRepository(database = sql, storage) {
  let storageClient = storage;
  const getStorage = () => {
    if (!storageClient) {
      storageClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY).storage;
    }
    return storageClient;
  };
  return {
    async list(authorId, cursor, pageSize) {
      const rows = await database`
        SELECT s.id, s."song_Name" AS song_name, s."song_Image" AS song_image,
               s.credit, s.created_at, s.views
        FROM songs s
        WHERE EXISTS (
          SELECT 1 FROM authors_songs association
          WHERE association.song_id = s.id AND association.author_id = ${authorId}
        )
        AND (${cursor}::bigint IS NULL OR s.id < ${cursor}::bigint)
        ORDER BY s.id DESC
        LIMIT ${pageSize + 1}
      `;
      const page = rows.slice(0, pageSize);
      return {
        data: page.map((song) => ({
          id: String(song.id),
          songName: song.song_name,
          songImage: song.song_image,
          credit: song.credit,
          createdAt: song.created_at,
          views: Number(song.views || 0),
        })),
        nextCursor: rows.length > pageSize ? String(page.at(-1).id) : null,
      };
    },

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

        const audioPath = storageObjectPath('songs', song.file, AUDIO_EXTENSION);
        const imagePath = storageObjectPath('images/songPictures', song.song_image, IMAGE_EXTENSION);
        const paths = [audioPath, imagePath];

        await transaction`DELETE FROM views WHERE song_id = ${songId}`;
        await transaction`DELETE FROM monthly_song_stats WHERE song_id = ${songId}`;
        await transaction`DELETE FROM songs WHERE id = ${songId}`;

        if (paths.length === 0) return { cleanupJobId: null };
        const [job] = await transaction`
          INSERT INTO song_storage_cleanup_jobs (bucket, object_paths)
          VALUES ('spotify', ${database.json(paths)}::jsonb)
          RETURNING id
        `;
        return { cleanupJobId: String(job.id) };
      });
    },

    async processCleanupJob(jobId) {
      const [job] = await database`
        SELECT id, bucket, object_paths
        FROM song_storage_cleanup_jobs
        WHERE id = ${jobId}
      `;
      if (!job) return true;

      const removablePaths = [];
      for (const objectPath of job.object_paths) {
        if (typeof objectPath !== 'string') continue;
        const audioMatch = /^songs\/([^/\\]+\.mp3)$/i.exec(objectPath);
        const imageMatch = /^images\/songPictures\/([^/\\]+\.(?:jpe?g|png))$/i.exec(objectPath);
        if (!audioMatch && !imageMatch) continue;
        const [reference] = audioMatch
          ? await database`SELECT EXISTS (SELECT 1 FROM songs WHERE file = ${audioMatch[1]}) AS in_use`
          : await database`SELECT EXISTS (SELECT 1 FROM songs WHERE "song_Image" = ${imageMatch[1]}) AS in_use`;
        if (!reference.in_use) removablePaths.push(objectPath);
      }

      if (removablePaths.length === 0) {
        await database`DELETE FROM song_storage_cleanup_jobs WHERE id = ${jobId}`;
        return true;
      }

      try {
        const { error } = await getStorage().from(job.bucket).remove(removablePaths);
        if (error) throw error;
      } catch (error) {
        const message = String(error?.message || 'Nieznany błąd Storage').slice(0, 500);
        await database`
          UPDATE song_storage_cleanup_jobs
          SET attempts = attempts + 1,
              last_error = ${message},
              next_attempt_at = now() + interval '1 minute'
          WHERE id = ${jobId}
        `;
        return false;
      }

      await database`DELETE FROM song_storage_cleanup_jobs WHERE id = ${jobId}`;
      return true;
    },

    async processExpiredPublications(limit = 20) {
      const publications = await database`
        SELECT consent.author_id, consent.song_id
        FROM song_publication_consents consent
        WHERE consent.expires_at <= now()
        ORDER BY consent.expires_at, consent.song_id
        LIMIT ${limit}
      `;
      let processed = 0;
      let failed = 0;

      for (const publication of publications) {
        try {
          const { cleanupJobId } = await this.deleteOwned(
            publication.author_id,
            publication.song_id
          );
          if (cleanupJobId) await this.processCleanupJob(cleanupJobId);
          processed += 1;
        } catch {
          failed += 1;
        }
      }
      return { processed, failed };
    },

    async processPendingCleanups(limit = 5) {
      const jobs = await database`
        SELECT id FROM song_storage_cleanup_jobs
        WHERE next_attempt_at <= now()
        ORDER BY id
        LIMIT ${limit}
      `;
      for (const job of jobs) {
        await this.processCleanupJob(String(job.id));
      }
    },
  };
}

export default createMySongsRepository();
