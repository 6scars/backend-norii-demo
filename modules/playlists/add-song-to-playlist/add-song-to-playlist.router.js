import express from "express"
import addSongToPlaylist from "./add-song-to-playlist.controller.js";
import verifyToken from "#authentication/verify-token.middleware.js";

const router = express.Router();

router.post('/addSongToPlaylist', verifyToken, addSongToPlaylist)

export default router