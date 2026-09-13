import AppError                         from "#error-handler";
import getPlaylistDataByPlaylistId      from "./get-playlist.query.js"


export default async function getPlaylist(req, res, next) {
    try {
        const id            = req.query.id;
        console.log(id)

        if (!id) throw new AppError('getPlaylists no id', 500)

        const dataPlaylist  = await getPlaylistDataByPlaylistId(id)

        return res.status(201).json({ message: "fetchThePlaylistData", data: dataPlaylist })
    } catch (err) {
        next(err)
    }

}

