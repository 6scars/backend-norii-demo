import AppError from '#error-handler';
import jwtVerifyReturnPayload from './verify-token.js';

export default function verifyToken(req, _res, next) {
  try {
    const match = /^Bearer ([^\s]+)$/i.exec(req.get('authorization') || '');
    if (!match) throw new AppError('Authentication required', 401);

    req.payloadJWT = jwtVerifyReturnPayload(match[1]);
    next();
  } catch (error) {
    next(error);
  }
}
