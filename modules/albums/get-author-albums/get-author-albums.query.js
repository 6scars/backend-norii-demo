import { sql }              from "#db";
import AppError             from '#error-handler'

export default async function getAuthorAlbumsByUserIdQuery(id){
    try{
        const response = await sql`
            SELECT album_name, album.id
            FROM album
            INNER JOIN authors
            ON album.author_id = authors.id
            WHERE authors.id = ${id}
        `
        return response;
    }catch(err){
        return new AppError(err || "getAuthorAlbumsByUserIdQuery error", 500)
    }
}
