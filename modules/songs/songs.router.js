import express from 'express';

import addSongViewRouter from './add-song-view/add-song-view.router.js';
import getAllSongsRouter from './get-all-songs/get-all-songs.router.js';
import getSongByIdRouter from './get-song-by-id/get-song-by-id.router.js';
import mySongsRouter from './my-songs/my-songs.router.js';
import publishSongRouter from './publish-song/publish-song.router.js';

const router = express.Router();

router.use(addSongViewRouter);
router.use(getAllSongsRouter);
router.use(getSongByIdRouter);
router.use(mySongsRouter);
router.use(publishSongRouter);

export default router;
