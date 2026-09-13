import express          from 'express'
import getPlaylists     from './getPlaylist.controller.js'

const router = express.Router()

router.get('/getPlaylistData', getPlaylists)

export default router