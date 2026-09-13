import { sql } from "../../../../config/db.js"

export default async function handleRemoveSongQuery(song_id, playlist_id, user_id ){
        await sql`
            DELETE FROM playlists_songs
            USING playlists
            JOIN authors_playlists ON playlists.id = authors_playlists.playlist_id
            WHERE playlists_songs.playlist_id = ${playlist_id} 
            AND playlists.id = ${playlist_id}
            AND playlists_songs.song_id = ${song_id}
            AND authors_playlists.author_id = ${user_id}
        `
} 