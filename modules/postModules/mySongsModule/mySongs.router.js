import express from 'express';
import verifyToken from '../../middleware/verifyToken.middleware.js';
import MySongsController from './mySongs.controller.js';

export function createMySongsRouter(controller = MySongsController) {
  const router = express.Router();
  router.get('/my-songs', verifyToken, controller.list);
  router.delete('/my-songs/:songId', verifyToken, controller.remove);
  return router;
}

export default createMySongsRouter();
