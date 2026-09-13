import {sql}            from '../../../../config/db.js'
import AppError         from '../../../../config/errorHandler/errorHandler.js';


export default async function getOwnUserPlaylists(id){
    try{
    const data = await sql`
            SELECT
                authors.id                              AS author_id,
                authors.author                          AS author_name,
                authors.email,
                playlists.id                            AS playlist_id,
                playlists.name                          AS playlist_name,
                ARRAY_AGG(DISTINCT songs.id)            AS song_ids,
                ARRAY_AGG(DISTINCT songs."song_Image")  AS song_images
            FROM authors
            INNER JOIN          authors_playlists           ON authors.id = authors_playlists.author_id
            INNER JOIN          playlists                   ON playlists.id = authors_playlists.playlist_id
            FULL  OUTER JOIN    playlists_songs             ON playlists_songs.playlist_id = playlists.id
            FULL OUTER JOIN     authors_songs               ON playlists_songs.song_id = authors_songs.song_id
            LEFT JOIN           songs                       ON authors_songs.song_id = songs.id
            WHERE authors.id = ${id}
            GROUP BY authors.id, authors.author, authors.email, playlists.id, playlists.name;
        `;
        return data;
    }catch(err){
        throw new AppError(err.message || "playlists querry error", 500)
    }
}