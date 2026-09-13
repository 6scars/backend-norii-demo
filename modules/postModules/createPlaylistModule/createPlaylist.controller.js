import jwt                          from "jsonwebtoken"
import AppError                     from "../../../config/errorHandler/errorHandler.js"
import insertNewAuthorsPlaylist     from "./createPlaylist-helper-functions/createPlaylist.query.js" 
const JWT_SECRET = process.env.JWT_SECRET




export default async function createPlaylist(req, res, next) {
    try {
        const authHeader                            = req.headers.authorization
        const { playlistName, songsToAddArray }     = req.body
        /*----verify-----*/
        if (!authHeader || !authHeader.startsWith('Bearer '))
            throw new AppError("createPlaylist authHeader doesn't contain Bearer or authorization header is empty", 500)

        const token                                 = authHeader.split(' ')[1]
        const { id: authorId }                      = jwt.verify(token, JWT_SECRET);
        
        await insertNewAuthorsPlaylist(authorId, playlistName, songsToAddArray)

        return res.status(201).json({ message: 'createPlaylist function' })
    } catch (err) {
        next(err)
    }
}

