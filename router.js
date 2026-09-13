import express from 'express';

import albumsRouter from '#albums/albums.router.js';
import authRouter from '#auth/auth.router.js';
import playlistsRouter from '#playlists/playlists.router.js';
import songsRouter from '#songs/songs.router.js';

const router = express.Router();

router.use(albumsRouter);
router.use(authRouter);
router.use(playlistsRouter);
router.use(songsRouter);

export default router;
