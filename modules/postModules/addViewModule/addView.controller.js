import jwt                  from 'jsonwebtoken'
import addViewQuery         from './addView-helper-functions/addView.query.js'
import AppError             from '../../../config/errorHandler/errorHandler.js'
const JWT_SECRET = process.env.JWT_SECRET;



export default async function addView(req, res, next) {
    try {
        const song_id           = extractSongId(req);
        const auth              = extractHeadToken(req);
        let user_id             = null;
        let token               = auth.split(' ')[1];

        token                   = checkIsTokenNull(token)
    if (token) {
        const verifiedUserData  = verifyToken(token);
        user_id                 = verifiedUserData.id
    }
    
        await addViewQuery(song_id, user_id)

        return res.sendStatus(204)
    } catch (err) {
        next(err)
    }

}

function extractSongId(req){
    if(req.body.song_id){
        return req.body.song_id
    }else{
        throw new AppError('addView controller no data in req.body.song_id', 500)
    }
}

function extractHeadToken(req){
    if(req.headers.authorization){
        return req.headers.authorization;
    }else{
        throw new AppError('addView controller no data in req.headers.authorization', 500)
    }
    
}

function verifyToken(token){
    if(token){
        return jwt.verify(token, JWT_SECRET)
    }else{
        throw new AppError("addView controller verifyToken there is no token to verify", 500)
    }
}


function checkIsTokenNull(token){
    if (token === 'null' || !token) {
        token = null;
        return token
}
}

