import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'my-songs-router-test-secret';

const { createMySongsRouter } = await import('../modules/postModules/mySongsModule/mySongs.router.js');
let server;
let origin;
let receivedAuthorId;

before(async () => {
  const controller = {
    list(req, res) {
      receivedAuthorId = req.payloadJWT.id;
      return res.status(200).json({ data: [], nextCursor: null });
    },
    remove(_req, res) {
      return res.status(204).end();
    },
  };
  const app = express();
  app.use('/api', createMySongsRouter(controller));
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ message: error.message }));
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

test('protects the my-songs endpoint before reaching its controller', async () => {
  const response = await fetch(`${origin}/api/my-songs`);

  assert.equal(response.status, 401);
  assert.equal(receivedAuthorId, undefined);
});

test('takes the author identity from a verified bearer token', async () => {
  const token = jwt.sign({ id: 17, email: 'author@example.com' }, process.env.JWT_SECRET, { expiresIn: '1m' });
  const response = await fetch(`${origin}/api/my-songs`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(response.status, 200);
  assert.equal(receivedAuthorId, 17);
});
