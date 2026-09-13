import cron from 'node-cron';

import MySongsRepository from './mySongs.repository.js';

export function startMySongsCleanupSchedule(repository = MySongsRepository) {
  return cron.schedule('* * * * *', async () => {
    try {
      const expiration = await repository.processExpiredPublications(20);
      if (expiration.failed > 0) {
        console.error(`Failed to expire ${expiration.failed} demo publication(s).`);
      }
      await repository.processPendingCleanups(20);
    } catch (error) {
      console.error('Song Storage cleanup failed:', error);
    }
  }, { noOverlap: true });
}
