import express from 'express';

import { createDeleteMySongRouter } from './delete-my-song/delete-my-song.router.js';
import { createGetMySongsRouter } from './get-my-songs/get-my-songs.router.js';

export function createMySongsRouter(controller) {
  const router = express.Router();
  router.use(createGetMySongsRouter(controller?.list));
  router.use(createDeleteMySongRouter(controller?.remove));
  return router;
}

export default createMySongsRouter();
