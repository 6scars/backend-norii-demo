import './config/env.js';
import { sql } from '#db';
import { errorHandler } from '#error-handler';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import router from './router.js';

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan('tiny'));
app.use('/api', router);

app.use('/api/respondTest', (_req, res) => {
  return res.status(201).json({ message: 'i live' });
});

// It is used for checking the state of the backend.
app.use('/api/health', async (_req, res) => {
  try {
    await sql`SELECT 1`;
    return res.status(200).json({ status: 'ok', database: 'connected' });
  } catch {
    return res
      .status(503)
      .json({ status: 'error', database: 'disconnected' });
  }
});

app.use(errorHandler);

export default app;
