import env from 'dotenv';
import { sql } from '../../config/db.js';
import cron from 'node-cron';



async function insertTop10OfPreviousMonth() {
    try {
        await sql`
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
            WHERE rank <= 10;
        `;
        console.log('✅ insertTop10OfPreviousMonth executed successfully!');
    } catch (err) {
        console.error('❌ insertTop10OfPreviousMonth ERROR:', err);
    }
}

// Run every minute
// cron.schedule('* * * * *', () => {
//     console.log('⏱ Cron running every minute...');
//     insertTop10OfPreviousMonth();
// });
cron.schedule('1 0 1 * *', () => {
    console.log('⏱ Cron running every minute...');
    insertTop10OfPreviousMonth();
})