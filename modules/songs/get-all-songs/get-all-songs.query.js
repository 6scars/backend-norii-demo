import {sql}            from '#db'
import AppError         from '#error-handler';


export default async function getAllSongsQuery(){
    try{
        const data = await sql`
            SELECT
                song_id,
                "song_Name" AS song_name,
                songs."song_Image" AS song_image,
                songs.created_at,
                songs.views,
                authors.follows,
                file,
                credit,
                album_id,
                author_image AS author_image,
                author,
                author_id,
                biograph
            FROM songs
            INNER JOIN authors_songs ON authors_songs.song_id = songs.id
            INNER JOIN authors ON authors.id = authors_songs.author_id
        `
        return data;
    }catch(err){
        throw new AppError('getAllSongsQuery query error', 500)
    }
}

