import express                  from "express" ;
import handleRemoveSong         from "./handleRemoveSong.controller.js";
import verifyToken              from "../../middleware/verifyToken.middleware.js";

const router = express.Router()

router.post('/handleRemoveSong', verifyToken, handleRemoveSong)

export default router
