import express          from 'express'
import addView          from './add-song-view.controller.js';

const router = express.Router();

router.post('/addView', addView )

export default router