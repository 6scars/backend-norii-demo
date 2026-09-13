import express              from 'express';
import signUpController     from './sign-up.controller.js'

const router = express.Router();

router.post("/newAccount", signUpController);

export default router;