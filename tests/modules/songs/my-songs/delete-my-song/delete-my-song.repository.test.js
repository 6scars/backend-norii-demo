import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createDeleteMySongRepository } from '#songs/my-songs/delete-my-song/delete-my-song.repository.js';

test('preserves a shared cover while removing an unreferenced audio object', async () => {
  const calls = [];
  const queries = {
    async getCleanupJob() {
      return { id: 31, bucket: 'spotify', object_paths: ['songs/song.mp3', 'images/songPictures/shared.png'] };
    },
    async isAudioInUse() { return false; },
    async isImageInUse() { return true; },
    async completeCleanupJob(jobId) { calls.push(['complete', jobId]); },
  };
  const removed = [];
  const repository = createDeleteMySongRepository(queries, {
    from() {
      return { async remove(paths) { removed.push(paths); return { error: null }; } };
    },
  });

  const completed = await repository.processCleanupJob('31');

  assert.equal(completed, true);
  assert.deepEqual(removed, [['songs/song.mp3']]);
  assert.deepEqual(calls, [['complete', '31']]);
});

test('records a failed storage cleanup for retry', async () => {
  const calls = [];
  const queries = {
    async getCleanupJob() {
      return { id: 31, bucket: 'spotify', object_paths: ['songs/song.mp3'] };
    },
    async isAudioInUse() { return false; },
    async failCleanupJob(jobId, message) { calls.push([jobId, message]); },
  };
  const repository = createDeleteMySongRepository(queries, {
    from() {
      return { async remove() { return { error: { message: 'storage unavailable' } }; } };
    },
  });

  const completed = await repository.processCleanupJob('31');

  assert.equal(completed, false);
  assert.deepEqual(calls, [['31', 'storage unavailable']]);
});
