import express                  from "express" ;
import removeSongFromPlaylist from "./remove-song-from-playlist.controller.js";
import verifyToken              from "#authentication/verify-token.middleware.js";

const router = express.Router()

router.post('/handleRemoveSong', verifyToken, removeSongFromPlaylist)

export default router
