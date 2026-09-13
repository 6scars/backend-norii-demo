import AppError from '#error-handler';
import getMySongsQuery from './get-my-songs.query.js';

const PAGE_SIZE = 20;

function positiveInteger(value, fieldName) {
  if (!/^\d+$/.test(String(value || '')) || Number(value) < 1 || !Number.isSafeInteger(Number(value))) {
    throw new AppError(`${fieldName} ma nieprawidłową wartość.`, 400);
  }
  return Number(value);
}

export function createGetMySongsController({ query = getMySongsQuery } = {}) {
  return async function getMySongs(req, res, next) {
    try {
      const cursor = req.query.cursor == null ? null : positiveInteger(req.query.cursor, 'Cursor');
      const rows = await query(req.payloadJWT.id, cursor, PAGE_SIZE);
      const page = rows.slice(0, PAGE_SIZE);
      return res.status(200).json({
        data: page.map((song) => ({
          id: String(song.id),
          songName: song.song_name,
          songImage: song.song_image,
          credit: song.credit,
          createdAt: song.created_at,
          views: Number(song.views || 0),
        })),
        nextCursor: rows.length > PAGE_SIZE ? String(page.at(-1).id) : null,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default createGetMySongsController();
