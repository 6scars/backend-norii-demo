import express          from 'express'
import addView          from './addView.controller.js';

const router = express.Router();

router.post('/addView', addView )

export default router