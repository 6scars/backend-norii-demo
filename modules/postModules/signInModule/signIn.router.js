import express              from 'express'
import signInController     from './signIn.controller.js'


const router = express.Router();

router.post("/signin", signInController);

export default router;