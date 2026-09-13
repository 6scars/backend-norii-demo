import {sql}                from '../../../../config/db.js'
import AppError             from '../../../../config/errorHandler/errorHandler.js';


export default async function addViewQuery(song_id, user_id){
    try{
        await sql.begin(async sql => {
            await sql`
            UPDATE songs
            SET views = views + 1
            WHERE id = ${song_id}
        `
            await sql`
            INSERT INTO views (user_id, song_id)
            VALUES (${user_id}, ${song_id})
        `
        })
    }catch(err){
        throw new AppError('addViewQuery error', 500)
    }

}