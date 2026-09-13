import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createDeleteMySongService } from '#songs/my-songs/delete-my-song/delete-my-song.service.js';

test('deletes a song and immediately processes its storage cleanup job', async () => {
  const calls = [];
  const service = createDeleteMySongService({
    async deleteOwned(authorId, songId) {
      calls.push(['delete', authorId, songId]);
      return { cleanupJobId: '31' };
    },
    async processCleanupJob(jobId) {
      calls.push(['cleanup', jobId]);
      return true;
    },
  });

  const result = await service(7, 12);

  assert.deepEqual(result, { status: 200, message: 'Utwór został usunięty.' });
  assert.deepEqual(calls, [['delete', 7, 12], ['cleanup', '31']]);
});

test('keeps deletion successful when storage cleanup is queued for retry', async () => {
  const service = createDeleteMySongService({
    async deleteOwned() { return { cleanupJobId: '31' }; },
    async processCleanupJob() { return false; },
  });

  const result = await service(7, 12);

  assert.deepEqual(result, {
    status: 202,
    message: 'Utwór został usunięty. Pliki zostaną usunięte automatycznie.',
  });
});
