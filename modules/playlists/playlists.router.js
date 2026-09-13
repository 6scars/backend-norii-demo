import express from 'express';

import addSongToPlaylistRouter from './add-song-to-playlist/add-song-to-playlist.router.js';
import createPlaylistRouter from './create-playlist/create-playlist.router.js';
import getMyPlaylistsRouter from './get-my-playlists/get-my-playlists.router.js';
import getPlaylistRouter from './get-playlist/get-playlist.router.js';
import removeSongFromPlaylistRouter from './remove-song-from-playlist/remove-song-from-playlist.router.js';

const router = express.Router();

router.use(addSongToPlaylistRouter);
router.use(createPlaylistRouter);
router.use(getMyPlaylistsRouter);
router.use(getPlaylistRouter);
router.use(removeSongFromPlaylistRouter);

export default router;
