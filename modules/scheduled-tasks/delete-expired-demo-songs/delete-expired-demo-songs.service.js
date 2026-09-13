import DeleteMySongRepository from '#songs/my-songs/delete-my-song/delete-my-song.repository.js';
import DeleteExpiredDemoSongsQueries from './delete-expired-demo-songs.query.js';

export function createDeleteExpiredDemoSongsService({
  queries = DeleteExpiredDemoSongsQueries,
  deleteRepository = DeleteMySongRepository,
} = {}) {
  return {
    async run(expirationLimit = 20, cleanupLimit = 20) {
      const publications = await queries.getExpiredPublications(expirationLimit);
      let processed = 0;
      let failed = 0;

      for (const publication of publications) {
        try {
          const { cleanupJobId } = await deleteRepository.deleteOwned(
            publication.author_id,
            publication.song_id
          );
          if (cleanupJobId) await deleteRepository.processCleanupJob(cleanupJobId);
          processed += 1;
        } catch {
          failed += 1;
        }
      }

      const cleanupJobs = await queries.getPendingCleanupJobs(cleanupLimit);
      for (const job of cleanupJobs) {
        await deleteRepository.processCleanupJob(String(job.id));
      }

      return { processed, failed };
    },
  };
}

export default createDeleteExpiredDemoSongsService();
