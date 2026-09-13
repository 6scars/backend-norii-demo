import getSongBySongId              from "./get-song-by-id.query.js"
import AppError                     from "#error-handler";

export default async function getSong(req, res, next) {
    try {
        const id            = req.query.id;

        if (id) {
            const data      = await getSongBySongId(id)
            if (data) return res.status(200).json({ message: "", data: data })
        } else {
            throw new AppError("getSong controller error", 500)
        }
    } catch (err) {
        next(err)
    }
}

