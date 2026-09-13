import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import AppError from '#error-handler';
import publishSongQueries from './publish-song.query.js';
import { parsePublicationConsent } from './publish-song.publication-consent.js';

export const fsp = fs.promises;

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export function createPublishSongController({ storage = supabase.storage, queries = publishSongQueries } = {}) {
  return async function publishSong(req, res, next) {
    let mp3File;
    let imgFile;
    let publicationCreated = false;
    const uploadedPaths = [];

    try {
      mp3File = req.files?.mp3?.[0];
      imgFile = req.files?.img?.[0];
      if (!mp3File || !imgFile) {
        throw new AppError('Dodaj nagranie MP3 i okładkę JPG lub PNG.', 400);
      }

      if (!req.body?.addSongForm) {
        throw new AppError('Prześlij informacje o utworze.', 400);
      }

      let addSongForm;
      try {
        addSongForm = JSON.parse(req.body.addSongForm);
      } catch {
        throw new AppError('Informacje o utworze mają nieprawidłowy format.', 400);
      }
      const songName = String(addSongForm.song_name || '').trim();
      if (songName.length < 5) {
        throw new AppError('Tytuł musi mieć co najmniej 5 znaków.', 422);
      }

      const publicationConsent = parsePublicationConsent(req.body.publicationConsent);
      const mp3Buffer = await fsp.readFile(mp3File.path);
      const imgBuffer = await fsp.readFile(imgFile.path);
      const mp3Name = path.basename(mp3File.filename);
      const imgName = path.basename(imgFile.filename);
      const mp3Path = `songs/${mp3Name}`;
      const imagePath = `images/songPictures/${imgName}`;

      await uploadFile(storage, 'spotify', mp3Path, mp3Buffer, mp3File.mimetype);
      uploadedPaths.push(mp3Path);
      await uploadFile(storage, 'spotify', imagePath, imgBuffer, imgFile.mimetype);
      uploadedPaths.push(imagePath);

      const { credit, album_id } = addSongForm;
      const albumIdValue = album_id && album_id !== '' ? album_id : null;
      await queries.insertPublishedSong(
        songName,
        mp3Name,
        imgName,
        credit,
        albumIdValue,
        req.payloadJWT.id,
        publicationConsent
      );
      publicationCreated = true;

      return res.status(201).json({
        message: 'Songs have been uploaded!',
      });
    } catch (error) {
      try {
        if (!publicationCreated) {
          await removeUploadedFiles(storage, 'spotify', uploadedPaths);
        }
        next(error);
      } catch (cleanupError) {
        next(new AppError(
          `${error.message}; Supabase cleanup failed: ${cleanupError.message}`,
          500
        ));
      }
    } finally {
      await safeUnlink(mp3File?.path);
      await safeUnlink(imgFile?.path);
    }
  };
}

async function safeUnlink(filePath) {
  if (!filePath) return;

  try {
    await fsp.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to remove temporary upload:', error.message);
    }
  }
}

async function uploadFile(storage, bucketName, objectPath, fileBuffer, fileMimetype) {
  try {
    const { error } = await storage
      .from(bucketName)
      .upload(objectPath, fileBuffer, {
        contentType: fileMimetype,
        upsert: false,
      });

    if (error) throw new AppError(error.message, 500);
  } catch (error) {
    throw new AppError(
      error.message || 'publish-song controller error uploading file to Supabase',
      500
    );
  }
}

async function removeUploadedFiles(storage, bucketName, uploadedPaths) {
  if (uploadedPaths.length === 0) return;

  const { error } = await storage.from(bucketName).remove(uploadedPaths);
  if (error) {
    throw new AppError(error.message || 'Failed to remove uploaded files from Supabase', 500);
  }
}

export default createPublishSongController();
