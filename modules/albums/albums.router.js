import express from 'express';

import getAuthorAlbumsRouter from './get-author-albums/get-author-albums.router.js';

const router = express.Router();

router.use(getAuthorAlbumsRouter);

export default router;
