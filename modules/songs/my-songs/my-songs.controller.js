import AppError from '#error-handler';
import MySongsRepository from './my-songs.repository.js';

const PAGE_SIZE = 20;

function positiveInteger(value, fieldName) {
  if (!/^\d+$/.test(String(value || '')) || Number(value) < 1 || !Number.isSafeInteger(Number(value))) {
    throw new AppError(`${fieldName} ma nieprawidłową wartość.`, 400);
  }
  return Number(value);
}

export function createMySongsController({ repository = MySongsRepository } = {}) {
  return {
    async list(req, res, next) {
      try {
        const cursor = req.query.cursor == null ? null : positiveInteger(req.query.cursor, 'Cursor');
        const result = await repository.list(req.payloadJWT.id, cursor, PAGE_SIZE);
        return res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    async remove(req, res, next) {
      try {
        const songId = positiveInteger(req.params.songId, 'Identyfikator utworu');
        const { cleanupJobId } = await repository.deleteOwned(req.payloadJWT.id, songId);
        if (!cleanupJobId) {
          return res.status(200).json({ message: 'Utwór został usunięty.' });
        }
        const cleaned = await repository.processCleanupJob(cleanupJobId);
        return res.status(cleaned ? 200 : 202).json({
          message: cleaned
            ? 'Utwór został usunięty.'
            : 'Utwór został usunięty. Pliki zostaną usunięte automatycznie.',
        });
      } catch (error) {
        next(error);
      }
    },
  };
}

export default createMySongsController();
