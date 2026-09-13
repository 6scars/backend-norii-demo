import express              from 'express'
import createPlaylist       from './createPlaylist.controller.js'

const router = express.Router()

router.post('/createPlaylist', createPlaylist);

export default router