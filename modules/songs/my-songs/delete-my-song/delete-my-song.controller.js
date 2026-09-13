import AppError from '#error-handler';
import deleteMySongService from './delete-my-song.service.js';

function positiveInteger(value, fieldName) {
  if (!/^\d+$/.test(String(value || '')) || Number(value) < 1 || !Number.isSafeInteger(Number(value))) {
    throw new AppError(`${fieldName} ma nieprawidłową wartość.`, 400);
  }
  return Number(value);
}

export function createDeleteMySongController({ service = deleteMySongService } = {}) {
  return async function deleteMySong(req, res, next) {
    try {
      const songId = positiveInteger(req.params.songId, 'Identyfikator utworu');
      const result = await service(req.payloadJWT.id, songId);
      return res.status(result.status).json({ message: result.message });
    } catch (error) {
      next(error);
    }
  };
}

export default createDeleteMySongController();
