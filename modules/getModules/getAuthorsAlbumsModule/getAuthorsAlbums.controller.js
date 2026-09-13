import getAuthorAlbumsByUserIdQuery from "./getAuthors-helper-functions/getAuthorsAlbums.query.js";

export default async function getAuthorsAlbums(req, res, next) {
    const { id, email }     = req.payloadJWT;
    try {
        const response      = await getAuthorAlbumsByUserIdQuery(id)
        return res.status(200).json({ message: "good", data: response });
    } catch (err) {
        next(err)
    }
}


