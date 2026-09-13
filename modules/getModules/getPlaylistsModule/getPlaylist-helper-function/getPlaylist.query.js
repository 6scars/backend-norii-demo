import {sql}        from "../../../../config/db.js" 

export default async function getPlaylistDataByPlaylistId(id){
        const dataPlaylist = await sql`
            SELECT playlists.id, playlists.name, songs.id AS song_id,  songs."song_Name" AS song_name, songs."song_Image" AS song_image, songs.album_id, songs.views ,authors.id AS author_id, authors.author
            FROM playlists
            FULL JOIN playlists_songs
            ON playlists_songs.playlist_id = playlists.id
            FULL JOIN songs
            ON playlists_songs.song_id = songs.id
            FULL JOIN authors_songs
            ON songs.id = authors_songs.song_id
            FULL JOIN authors
            ON authors_songs.author_id = authors.id
            WHERE playlists.id = ${id}
        `
        return dataPlaylist;

}