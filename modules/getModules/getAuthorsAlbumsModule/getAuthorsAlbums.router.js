import express              from 'express'
import getAuthorsAlbums     from './getAuthorsAlbums.controller.js';
import verifyToken          from '../../middleware/verifyToken.middleware.js';

const router = express.Router();

router.get('/getAuthorsAlbums', verifyToken, getAuthorsAlbums);

export default router 