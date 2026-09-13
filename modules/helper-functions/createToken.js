import jwt          from "jsonwebtoken"
import AppError     from "../../config/errorHandler/errorHandler.js";
const JWT_SECRET = process.env.JWT_SECRET;

export default async function createToken(userId, userEmail){
    try{
        return await jwt.sign({
                id:     userId,
                email:  userEmail
            },
                JWT_SECRET,
                { expiresIn: '1h' }
            )
    }catch(err){
       throw new AppError( err.message || "create token error", err.status || 500);
    }

}