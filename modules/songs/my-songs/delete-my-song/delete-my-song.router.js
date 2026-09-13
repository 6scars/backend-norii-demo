import express from 'express';

import verifyToken from '#authentication/verify-token.middleware.js';
import deleteMySongController from './delete-my-song.controller.js';

export function createDeleteMySongRouter(controller = deleteMySongController) {
  const router = express.Router();
  router.delete('/my-songs/:songId', verifyToken, controller);
  return router;
}

export default createDeleteMySongRouter();
