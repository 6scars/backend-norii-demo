import express          from "express"
import getPlaylists        from "./getPlaylist.controller.js"

const router = express.Router();

router.post('/playlists', getPlaylists)
export default router