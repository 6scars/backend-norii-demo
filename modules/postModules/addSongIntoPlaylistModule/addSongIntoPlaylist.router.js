import express from "express"
import addSongToPlaylist from "./addSongIntoPlaylist.controller.js";
import verifyToken from "../../middleware/verifyToken.middleware.js";

const router = express.Router();

router.post('/addSongToPlaylist', verifyToken, addSongToPlaylist)

export default router