import express from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import AppError from '#error-handler';
import verifyToken from '#authentication/verify-token.middleware.js';
import saveSongInBase from './publish-song.controller.js';
import DemoPublishingPolicy from './publish-song.demo-policy.js';

export const uploadDir = path.resolve(process.env.SONG_UPLOAD_DIR || 'uploads');
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination(_req, _file, callback) {
    fs.mkdirSync(uploadDir, { recursive: true });
    callback(null, uploadDir);
  },
  filename(_req, file, callback) {
    callback(null, randomUUID() + path.extname(file.originalname).toLowerCase());
  },
});

const parseFiles = multer({
  storage,
  limits: { fileSize: MAX_AUDIO_BYTES, files: 2, fields: 12, parts: 14 },
  fileFilter(_req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const isAudio = file.fieldname === 'mp3';
    const isImage = file.fieldname === 'img';
    const validAudio = isAudio && extension === '.mp3' && file.mimetype === 'audio/mpeg';
    const validImage = isImage && (
      (extension === '.png' && file.mimetype === 'image/png')
      || (['.jpg', '.jpeg'].includes(extension) && file.mimetype === 'image/jpeg')
    );

    if (validAudio || validImage) return callback(null, true);
    const message = isAudio
      ? 'Nagranie musi być plikiem MP3.'
      : 'Okładka musi być plikiem JPG lub PNG.';
    return callback(new AppError(message, 415), false);
  },
}).fields([{ name: 'mp3', maxCount: 1 }, { name: 'img', maxCount: 1 }]);

async function removeTemporaryFiles(req) {
  await Promise.all(Object.values(req.files || {}).flat().map(async (file) => {
    try {
      await fs.promises.unlink(file.path);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }));
}

function parseUpload(req, res, next) {
  parseFiles(req, res, async (error) => {
    if (!error) return next();
    try {
      await removeTemporaryFiles(req);
    } catch (cleanupError) {
      return next(cleanupError);
    }
    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE';
      const sizeMessage = error.field === 'img'
        ? 'Okładka jest za duża. Maksymalny rozmiar to 5 MB.'
        : 'Nagranie jest za duże. Maksymalny rozmiar to 25 MB.';
      return next(new AppError(tooLarge ? sizeMessage : 'Nieprawidłowe dane uploadu.', tooLarge ? 413 : 400));
    }
    return next(error);
  });
}

async function hasExpectedSignature(file) {
  const handle = await fs.promises.open(file.path, 'r');
  try {
    const bytes = Buffer.alloc(10);
    const { bytesRead } = await handle.read(bytes, 0, bytes.length, 0);
    if (file.fieldname === 'mp3') {
      const id3 = bytesRead >= 10 && bytes.toString('ascii', 0, 3) === 'ID3'
        && [2, 3, 4].includes(bytes[3]) && bytes[4] !== 0xff;
      const frame = bytesRead >= 4 && bytes[0] === 0xff
        && (bytes[1] & 0xe0) === 0xe0 && (bytes[1] & 0x18) !== 0x08;
      return id3 || frame;
    }
    if (path.extname(file.filename) === '.png') {
      return bytesRead >= 8 && bytes.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      );
    }
    return bytesRead >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  } finally {
    await handle.close();
  }
}

async function validateFiles(req, _res, next) {
  try {
    const audio = req.files?.mp3?.[0];
    const image = req.files?.img?.[0];
    if (!audio || !image) throw new AppError('Dodaj nagranie MP3 i okładkę JPG lub PNG.', 400);
    if (image.size > MAX_IMAGE_BYTES) {
      throw new AppError('Okładka jest za duża. Maksymalny rozmiar to 5 MB.', 413);
    }
    if (!await hasExpectedSignature(audio)) {
      throw new AppError('Zawartość nagrania nie jest prawidłowym plikiem MP3.', 415);
    }
    if (!await hasExpectedSignature(image)) {
      throw new AppError('Zawartość okładki nie jest prawidłowym plikiem JPG lub PNG.', 415);
    }
    next();
  } catch (error) {
    try {
      await removeTemporaryFiles(req);
    } catch (cleanupError) {
      return next(cleanupError);
    }
    next(error);
  }
}

export function createSongUploadRouter(
  controller = saveSongInBase,
  { publishingPolicy = DemoPublishingPolicy } = {}
) {
  const router = express.Router();
  router.get('/demo-publishing-status', verifyToken, async (req, res, next) => {
    try {
      return res.status(200).json(await publishingPolicy.getStatus(req.payloadJWT.id));
    } catch (error) {
      return next(error);
    }
  });
  router.post(
    '/saveSongInBase',
    verifyToken,
    async (req, _res, next) => {
      try {
        await publishingPolicy.assertCanStartUpload(req.payloadJWT.id);
        next();
      } catch (error) {
        next(error);
      }
    },
    parseUpload,
    validateFiles,
    controller
  );
  return router;
}

export default createSongUploadRouter();
