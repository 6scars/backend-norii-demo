import { sql } from '#db';

export function createDeleteExpiredDemoSongsQueries(database = sql) {
  return {
    getExpiredPublications(limit) {
      return database`
        SELECT consent.author_id, consent.song_id
        FROM song_publication_consents consent
        WHERE consent.expires_at <= now()
        ORDER BY consent.expires_at, consent.song_id
        LIMIT ${limit}
      `;
    },

    getPendingCleanupJobs(limit) {
      return database`
        SELECT id FROM song_storage_cleanup_jobs
        WHERE next_attempt_at <= now()
        ORDER BY id
        LIMIT ${limit}
      `;
    },
  };
}

export default createDeleteExpiredDemoSongsQueries();
