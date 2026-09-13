import getSongsQuery        from "./get-all-songs.query.js";

export default async function getSong(req, res, next) {
    try {
        const data = await getSongsQuery();
        return res.status(201).json({ message: "accompllished", data })
    } catch (err) {
        next(err)
    }
}
