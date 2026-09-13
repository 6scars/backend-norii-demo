import express          from 'express'
import getSongs         from './get-all-songs.controller.js'

const router = express.Router();

router.get('/fetchSongs', getSongs)

export default router