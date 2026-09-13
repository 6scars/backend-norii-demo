import { sql } from '#db';

export function createUpdateMonthlySongRankingQuery(database = sql) {
  return async function updateMonthlySongRanking() {
    await database`
      INSERT INTO monthly_song_stats (song_id, year, month, views, rank)
      WITH last_month_views AS (
        SELECT
          song_id,
          EXTRACT(YEAR FROM created_at)::int AS year,
          EXTRACT(MONTH FROM created_at)::int AS month,
          COUNT(*) AS views
        FROM views
        WHERE created_at >= date_trunc('month', current_date - interval '1 month')
          AND created_at < date_trunc('month', current_date)
        GROUP BY song_id, year, month
      ),
      ranked AS (
        SELECT
          song_id,
          year,
          month,
          views,
          RANK() OVER (ORDER BY views DESC) AS rank
        FROM last_month_views
      )
      SELECT *
      FROM ranked
      WHERE rank <= 10
    `;
  };
}

export default createUpdateMonthlySongRankingQuery();
