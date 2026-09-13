import express from 'express';
import verifyToken from '#authentication/verify-token.middleware.js';
import MySongsController from './my-songs.controller.js';

export function createMySongsRouter(controller = MySongsController) {
  const router = express.Router();
  router.get('/my-songs', verifyToken, controller.list);
  router.delete('/my-songs/:songId', verifyToken, controller.remove);
  return router;
}

export default createMySongsRouter();
