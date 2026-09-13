import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createMySongsController } from '../modules/postModules/mySongsModule/mySongs.controller.js';

function createResponse() {
  return {
    statusCode: 200,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test('lists only songs returned for the authenticated author', async () => {
  let received;
  const repository = {
    async list(authorId, cursor, pageSize) {
      received = { authorId, cursor, pageSize };
      return { data: [{ id: '9', songName: 'Cienie' }], nextCursor: null };
    },
    async processPendingCleanups() {},
  };
  const controller = createMySongsController({ repository });
  const res = createResponse();

  await controller.list({ payloadJWT: { id: 7 }, query: {} }, res, assert.fail);

  assert.deepEqual(received, { authorId: 7, cursor: null, pageSize: 20 });
  assert.deepEqual(res.payload, { data: [{ id: '9', songName: 'Cienie' }], nextCursor: null });
});

test('deletes an owned song and immediately processes its storage cleanup job', async () => {
  const calls = [];
  const repository = {
    async deleteOwned(authorId, songId) {
      calls.push(['delete', authorId, songId]);
      return { cleanupJobId: '31' };
    },
    async processCleanupJob(jobId) {
      calls.push(['cleanup', jobId]);
      return true;
    },
  };
  const controller = createMySongsController({ repository });
  const res = createResponse();

  await controller.remove({ payloadJWT: { id: 7 }, params: { songId: '12' } }, res, assert.fail);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload, { message: 'Utwór został usunięty.' });
  assert.deepEqual(calls, [['delete', 7, 12], ['cleanup', '31']]);
});

test('keeps deletion successful when storage cleanup is queued for retry', async () => {
  const repository = {
    async deleteOwned() { return { cleanupJobId: '31' }; },
    async processCleanupJob() { return false; },
  };
  const controller = createMySongsController({ repository });
  const res = createResponse();

  await controller.remove({ payloadJWT: { id: 7 }, params: { songId: '12' } }, res, assert.fail);

  assert.equal(res.statusCode, 202);
  assert.deepEqual(res.payload, {
    message: 'Utwór został usunięty. Pliki zostaną usunięte automatycznie.',
  });
});

test('rejects an invalid song identifier before calling the repository', async () => {
  let called = false;
  const controller = createMySongsController({
    repository: {
      async deleteOwned() { called = true; },
    },
  });
  let forwarded;

  await controller.remove(
    { payloadJWT: { id: 7 }, params: { songId: '12abc' } },
    createResponse(),
    (error) => { forwarded = error; }
  );

  assert.equal(forwarded.status, 400);
  assert.equal(called, false);
});
