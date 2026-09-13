import getOwnUserPlaylists      from './get-my-playlists.query.js'
import AppError                 from '#error-handler'

export default async function getPlaylists(req, res, next) {
    try {
        const { id }    = req.body

        if (typeof(id) != 'number') {
            throw new AppError(`Playlists.controller id isn't number`, 500)
        }

        const data      = await getOwnUserPlaylists(id)

        return res.status(202).json({ message: "accomplished", data: data })
    } catch (err) {
        next(err)
    }

}

