import express from 'express';

import verifyToken from '#authentication/verify-token.middleware.js';
import saveSongInBase from './publish-song.controller.js';
import DemoPublishingPolicy from './publish-song.demo-policy.js';
import { parseUpload, validateFiles } from './publish-song.upload.validation.js';

export { uploadDir } from './publish-song.upload.validation.js';

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
