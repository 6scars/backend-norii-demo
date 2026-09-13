import getAllSongsQuery        from "./get-all-songs.query.js";

export default async function getAllSongs(req, res, next) {
    try {
        const data = await getAllSongsQuery();
        return res.status(201).json({ message: "accompllished", data })
    } catch (err) {
        next(err)
    }
}
