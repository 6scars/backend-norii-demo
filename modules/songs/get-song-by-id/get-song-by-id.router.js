import express from "express"
import getSongById from "./get-song-by-id.controller.js"

const router = express.Router()

router.get('/getSong', getSongById)

export default router