import express          from 'express'
import getSongs         from './getSongs.controller.js'

const router = express.Router();

router.get('/fetchSongs', getSongs)

export default router