import express                  from "express" ;
import handleRemoveSong         from "./remove-song-from-playlist.controller.js";
import verifyToken              from "#authentication/verify-token.middleware.js";

const router = express.Router()

router.post('/handleRemoveSong', verifyToken, handleRemoveSong)

export default router
