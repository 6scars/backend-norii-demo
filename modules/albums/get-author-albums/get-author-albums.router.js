import express              from 'express'
import getAuthorAlbums      from './get-author-albums.controller.js';
import verifyToken          from '#authentication/verify-token.middleware.js';

const router = express.Router();

router.get('/getAuthorsAlbums', verifyToken, getAuthorAlbums);

export default router 