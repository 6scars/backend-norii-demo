import updateMonthlySongRankingQuery from './update-monthly-song-ranking.query.js';

export function createUpdateMonthlySongRankingService(query = updateMonthlySongRankingQuery) {
  return async function updateMonthlySongRanking() {
    await query();
    console.log('Monthly song ranking updated successfully.');
  };
}

export default createUpdateMonthlySongRankingService();
