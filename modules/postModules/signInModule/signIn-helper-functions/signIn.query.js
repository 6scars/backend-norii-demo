import { sql }              from '../../../../config/db.js'


export default async function getUserByEmailQuery(email){
    try{
        const data = await sql`
                SELECT id, email, password
                FROM authors
                WHERE authors.email = ${email}
            `;
        return data;
    }catch(err){
        throw new AppError(err.message || "singIn querry error", err.status || 500);
    }
}
