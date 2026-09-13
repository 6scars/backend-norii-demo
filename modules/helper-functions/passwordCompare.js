import bcrypt       from "bcrypt"
import AppError     from "../../config/errorHandler/errorHandler.js";

export default async function passwordCompare(password, userPassword){
    try{
        const isMatch = await bcrypt.compare(password, userPassword);
        doIsBoolean(isMatch);
        return isMatch;
    }catch(err){
        throw new AppError(err.message || "passwordCompare function error", err.status || 500)
    }
}

function doIsBoolean(variable){
    if(typeof(variable) !== "boolean") throw new AppError("passwordCompare error is match is not bool type", 500);
}