import express                  from 'express'
import validateUserSession      from './validate-session.controller.js';

const router = express.Router();

router.post('/checkToken', validateUserSession);

export default router;