import express from 'express';

import verifyToken from '#authentication/verify-token.middleware.js';
import getMySongsController from './get-my-songs.controller.js';

export function createGetMySongsRouter(controller = getMySongsController) {
  const router = express.Router();
  router.get('/my-songs', verifyToken, controller);
  return router;
}

export default createGetMySongsRouter();
