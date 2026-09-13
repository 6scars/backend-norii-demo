import AppError from '../../../../config/errorHandler/errorHandler.js';
import { sql } from '../../../../config/db.js';
import {
  DEMO_PUBLICATION_TTL_MINUTES,
  createDemoPublishingPolicy,
} from '../demoPublishingPolicy.js';

export function createSaveSongQueries(
  database = sql,
  { publishingPolicy = createDemoPublishingPolicy(database) } = {}
) {
  return {
    async insertSongWithAuthorQuery(
      songName,
      mp3Name,
      imgName,
      credit,
      albumIdValue,
      authorId,
      publicationConsent
    ) {
      try {
        return await database.begin(async (transaction) => {
          await publishingPolicy.assertCanCommit(transaction, authorId);
          const insertedSongs = await transaction`
            INSERT INTO songs ("song_Name", file, "song_Image", credit, album_id)
            VALUES (${songName}, ${mp3Name}, ${imgName}, ${credit}, ${albumIdValue})
            RETURNING id;
          `;
          const songId = insertedSongs?.[0]?.id;
          if (!songId) throw new AppError('Failed to insert song (no id returned)', 500);

          await transaction`
            INSERT INTO authors_songs (author_id, song_id)
            VALUES (${authorId}, ${songId});
          `;

          await transaction`
            INSERT INTO song_publication_consents (
              author_id,
              song_id,
              audio_rights_confirmed,
              cover_rights_confirmed,
              publishing_terms_accepted,
              policy_version,
              expires_at
            )
            VALUES (
              ${authorId},
              ${songId},
              ${publicationConsent.audioRightsConfirmed},
              ${publicationConsent.coverRightsConfirmed},
              ${publicationConsent.publishingTermsAccepted},
              ${publicationConsent.policyVersion},
              now() + (${DEMO_PUBLICATION_TTL_MINUTES} * interval '1 minute')
            );
          `;
          return songId;
        });
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(error.message || 'Failed to save song publication', 500);
      }
    },
  };
}

export default createSaveSongQueries();
