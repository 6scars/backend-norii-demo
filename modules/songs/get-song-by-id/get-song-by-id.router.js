import express from "express"
import getSong from "./get-song-by-id.controller.js"

const router = express.Router()

router.get('/getSong', getSong)

export default router