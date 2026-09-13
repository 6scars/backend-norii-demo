import {sql}                from "../../../../config/db.js"

export default async function insertNewAuthorsPlaylist(authorId, playlistName, songsToAddArray){
    await sql.begin(async tx => {
        const insertPlaylists   = 
            await sql`
                INSERT INTO playlists (name)
                VALUES (${playlistName})
                RETURNING *
            `

        const newPlaylistId     = insertPlaylists[0].id

        await tx`
            INSERT INTO authors_playlists (author_id,playlist_id)
            VALUES (${authorId},${newPlaylistId})
        `

        let tuples;

        if (songsToAddArray.length > 0) {
            tuples              = songsToAddArray
                .map((id) => tx`(${newPlaylistId},${id})`)
                .reduce((acc, curr) => tx`${acc}, ${curr}`)
        }

        if (tuples) {
            await tx`
                INSERT INTO playlists_songs (playlist_id, song_id)
                VALUES ${tuples}
            `;
        }
    })
}

