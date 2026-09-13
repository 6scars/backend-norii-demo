import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createGetMySongsController } from '#songs/my-songs/get-my-songs/get-my-songs.controller.js';

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
  const query = async (authorId, cursor, pageSize) => {
    received = { authorId, cursor, pageSize };
    return [{
      id: 9,
      song_name: 'Cienie',
      song_image: 'cienie.png',
      credit: null,
      created_at: '2026-01-01',
      views: 3,
    }];
  };
  const controller = createGetMySongsController({ query });
  const res = createResponse();

  await controller({ payloadJWT: { id: 7 }, query: {} }, res, assert.fail);

  assert.deepEqual(received, { authorId: 7, cursor: null, pageSize: 20 });
  assert.deepEqual(res.payload, {
    data: [{
      id: '9',
      songName: 'Cienie',
      songImage: 'cienie.png',
      credit: null,
      createdAt: '2026-01-01',
      views: 3,
    }],
    nextCursor: null,
  });
});
