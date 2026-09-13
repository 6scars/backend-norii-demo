import express              from 'express'
import signInController     from './sign-in.controller.js'


const router = express.Router();

router.post("/signin", signInController);

export default router;