import jwt              from "jsonwebtoken"
import AppError         from "#error-handler";

const JWT_SECRET = process.env.JWT_SECRET;


export default function jwtVerifyReturnPayload(token){
    try{
        const payload = jwt.verify(token, JWT_SECRET);
        return payload
    }catch(err){
        throw new AppError("Token is not valid or expired", 401);
    }
}