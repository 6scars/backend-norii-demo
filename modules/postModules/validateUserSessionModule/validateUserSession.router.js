import express                  from 'express'
import validateUserSession      from './validateUserSession.controller.js';

const router = express.Router();

router.post('/checkToken', validateUserSession);

export default router;