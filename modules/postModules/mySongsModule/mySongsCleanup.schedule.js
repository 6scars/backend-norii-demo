import cron from 'node-cron';

import MySongsRepository from './mySongs.repository.js';

export function startMySongsCleanupSchedule(repository = MySongsRepository) {
  return cron.schedule('*/5 * * * *', async () => {
    try {
      await repository.processPendingCleanups(20);
    } catch (error) {
      console.error('Song Storage cleanup failed:', error);
    }
  }, { noOverlap: true });
}
