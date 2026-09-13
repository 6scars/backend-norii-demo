import {sql}                 from "../../../../config/db.js"


export default async function insertSongIntoPlaylistQuery(song_id, playlist_id, user_id){
        const data = await sql`
            INSERT INTO playlists_songs (playlist_id, song_id)
            SELECT p.id, ${song_id}
            FROM playlists p
            JOIN authors_playlists ap ON ap.playlist_id = p.id
            WHERE p.id = ${playlist_id} AND ap.author_id = ${user_id}
            RETURNING *;

        `
        return data;
}