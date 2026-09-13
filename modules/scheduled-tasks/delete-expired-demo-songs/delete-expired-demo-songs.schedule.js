import cron from 'node-cron';

import DeleteExpiredDemoSongsService from './delete-expired-demo-songs.service.js';

export function startDeleteExpiredDemoSongsSchedule(service = DeleteExpiredDemoSongsService) {
  return cron.schedule('* * * * *', async () => {
    try {
      const result = await service.run();
      if (result.failed > 0) {
        console.error(`Failed to expire ${result.failed} demo publication(s).`);
      }
    } catch (error) {
      console.error('Song Storage cleanup failed:', error);
    }
  }, { noOverlap: true });
}
