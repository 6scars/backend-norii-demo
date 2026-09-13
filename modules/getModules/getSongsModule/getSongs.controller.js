import getSongsQuery        from "./getSongs-helper-functions/getSongs.query.js";

export default async function getSong(req, res, next) {
    try {
        const data = await getSongsQuery();
        return res.status(201).json({ message: "accompllished", data })
    } catch (err) {
        next(err)
    }
}
