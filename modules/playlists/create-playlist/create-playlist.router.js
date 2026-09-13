import express              from 'express'
import createPlaylist       from './create-playlist.controller.js'

const router = express.Router()

router.post('/createPlaylist', createPlaylist);

export default router