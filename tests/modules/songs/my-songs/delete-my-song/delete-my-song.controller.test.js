import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createDeleteMySongController } from '#songs/my-songs/delete-my-song/delete-my-song.controller.js';

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

test('deletes an owned song through the service', async () => {
  const calls = [];
  const controller = createDeleteMySongController({
    service: async (authorId, songId) => {
      calls.push([authorId, songId]);
      return { status: 200, message: 'Utwór został usunięty.' };
    },
  });
  const res = createResponse();

  await controller({ payloadJWT: { id: 7 }, params: { songId: '12' } }, res, assert.fail);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload, { message: 'Utwór został usunięty.' });
  assert.deepEqual(calls, [[7, 12]]);
});

test('returns accepted status when storage cleanup is queued for retry', async () => {
  const controller = createDeleteMySongController({
    service: async () => ({
      status: 202,
      message: 'Utwór został usunięty. Pliki zostaną usunięte automatycznie.',
    }),
  });
  const res = createResponse();

  await controller({ payloadJWT: { id: 7 }, params: { songId: '12' } }, res, assert.fail);

  assert.equal(res.statusCode, 202);
  assert.deepEqual(res.payload, {
    message: 'Utwór został usunięty. Pliki zostaną usunięte automatycznie.',
  });
});

test('rejects an invalid song identifier before calling the service', async () => {
  let called = false;
  const controller = createDeleteMySongController({
    service: async () => { called = true; },
  });
  let forwarded;

  await controller(
    { payloadJWT: { id: 7 }, params: { songId: '12abc' } },
    createResponse(),
    (error) => { forwarded = error; }
  );

  assert.equal(forwarded.status, 400);
  assert.equal(called, false);
});
