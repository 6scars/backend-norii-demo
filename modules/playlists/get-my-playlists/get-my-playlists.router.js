import express          from "express"
import getPlaylists        from "./get-my-playlists.controller.js"

const router = express.Router();

router.post('/playlists', getPlaylists)
export default router