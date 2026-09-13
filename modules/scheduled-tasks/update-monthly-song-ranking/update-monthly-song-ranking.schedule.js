import cron from 'node-cron';

import updateMonthlySongRanking from './update-monthly-song-ranking.service.js';

export function startUpdateMonthlySongRankingSchedule(service = updateMonthlySongRanking) {
  return cron.schedule('1 0 1 * *', async () => {
    try {
      await service();
    } catch (error) {
      console.error('Monthly song ranking update failed:', error);
    }
  }, { noOverlap: true });
}
