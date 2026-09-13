import insertSongIntoPlaylistQuery              from "./addSongIntoPlaylist-helper-functions/addSongIntoPlaylist.query.js"

export default async function addSongToPlaylist(req, res, next) {
    try {
        const { playlist_id, song_id }  = req.body
        const user_id                   = req.payloadJWT.id
        const data                      = await insertSongIntoPlaylistQuery(song_id, playlist_id, user_id)
        console.log(data)
        return res.status(201).json({ message: 'addSongToPlaylist accomplished! song has been added to the playlist.' })
    } catch (err) {
        next(err)
    }

}

