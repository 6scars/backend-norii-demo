import handleRemoveSongQuery from "./handleRemoveSong-helper-functions/handleRemoveSong.query.js"

export default async function handleRemoveSong(req, res, next) {
    try {
        const { playlist_id, song_id }  = req.body
        const user_id                   = req.payloadJWT.id
        await handleRemoveSongQuery(song_id, playlist_id, user_id)

        return res.status(201).json({ message: 'addSongToPlaylist accomplished! song has been removed from the playlist.' })
    } catch (err) {
        next(err)
    }
}

