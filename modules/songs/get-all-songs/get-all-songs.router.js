import express          from 'express'
import getAllSongs      from './get-all-songs.controller.js'

const router = express.Router();

router.get('/fetchSongs', getAllSongs)

export default router