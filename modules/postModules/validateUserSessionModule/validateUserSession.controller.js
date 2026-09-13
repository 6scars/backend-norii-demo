import jwt          from 'jsonwebtoken'
import AppError     from '../../../config/errorHandler/errorHandler.js'
const JWT_SECRET = process.env.JWT_SECRET


export default async function validateUserSession(req, res, next) {
    try {
        const authHeader                = extractHeadToken(req);
        if (!authHeader) throw new AppError('validateUserSession no req authorization atribute', 500)

        const token                     = authHeader.split(' ')[1];
        if(!token || token == 'null') throw new AppError("validateUserSession no token (Bearer token)", 500)

        const verifiedToken             = verifyToken(token);
        if(!verifiedToken || verifiedToken == 'null') throw new AppError("validateUserSession no verified token OR jwt malformed", 500)

        const DoesTokenExist            = checkDoesExist(verifiedToken)
        if(DoesTokenExist) return res.status(201).json({ message: "accomplished", token: token })

        throw new AppError("validateUserSession - Token doesnt exist", 500);
    } catch (err) {
        next(err)
    }
}


function extractHeadToken(req){
    return req.headers.authorization;
}

function verifyToken(token){
    return jwt.verify(token, JWT_SECRET);
}



function checkDoesExist(token){
    if(token){
        return true
    }else{
        return false;
    }

}