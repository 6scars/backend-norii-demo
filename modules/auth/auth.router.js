import express from 'express';

import signInRouter from './sign-in/sign-in.router.js';
import signUpRouter from './sign-up/sign-up.router.js';
import validateSessionRouter from './validate-session/validate-session.router.js';

const router = express.Router();

router.use(signInRouter);
router.use(signUpRouter);
router.use(validateSessionRouter);

export default router;
