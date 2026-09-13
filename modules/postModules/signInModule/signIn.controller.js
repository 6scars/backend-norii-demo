
import passwordCompare          from '../../helper-functions/passwordCompare.js';
import createToken              from '../../helper-functions/createToken.js';
import AppError                 from '../../../config/errorHandler/errorHandler.js';
import getUserByEmailQuery      from './signIn-helper-functions/signIn.query.js';

export async function signIn(req, res, next) {
    
    const { email, password }       = req.body;

    try {
        checkIsEmailAndPasswordExist(email, password)

        const data                  =  await getUserByEmailQuery(email)
        checkIsReturnedUserData(data)

        const { 
            id: userId,
            password: userPassword,
            email: userEmail
        }                           = data[0];
        checkIsNoEmpty(userId, userPassword, userEmail)

        const isMatch               = await passwordCompare(password, userPassword);
        checkMatchExist(isMatch)

        const token                 = await createToken(userId, userEmail);
        checkTokenExist(token)

        return res.status(200).json({ message: 'logedIn', user_id: userId, token })
    } catch (err) {
        next(err)
    }
}




function checkIsEmailAndPasswordExist(email, password){
    if(!email || !password) {
        throw new AppError("No email or password", 400)
    };
}

function checkIsReturnedUserData(data){
    if(!data || data.length === 0) {
        throw new AppError("Invalid email or password", 400); 
    }
}

function checkIsNoEmpty(userId, userPassword, userEmail){
    if(!userId || !userPassword || !userEmail) {
        throw new AppError("Invalid user data from database", 500)
    }
}

function checkMatchExist(isMatch){
    if(!isMatch){
        throw new AppError("Invalid email or password", 400)
    }
}

function checkTokenExist(token){
    if(!token){
        throw new AppError("There is not created token", 500)
    }
}


export default signIn;