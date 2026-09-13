import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createDeleteExpiredDemoSongsService } from '#scheduled-tasks/delete-expired-demo-songs/delete-expired-demo-songs.service.js';

test('removes expired demo publications and processes pending storage jobs', async () => {
  const deleted = [];
  const cleaned = [];
  const service = createDeleteExpiredDemoSongsService({
    queries: {
      async getExpiredPublications() {
        return [{ author_id: 7, song_id: 12 }, { author_id: 8, song_id: 13 }];
      },
      async getPendingCleanupJobs() { return [{ id: 44 }]; },
    },
    deleteRepository: {
      async deleteOwned(authorId, songId) {
        deleted.push([authorId, songId]);
        return { cleanupJobId: String(songId + 100) };
      },
      async processCleanupJob(jobId) {
        cleaned.push(jobId);
        return true;
      },
    },
  });

  const result = await service.run();

  assert.deepEqual(deleted, [[7, 12], [8, 13]]);
  assert.deepEqual(cleaned, ['112', '113', '44']);
  assert.deepEqual(result, { processed: 2, failed: 0 });
});
