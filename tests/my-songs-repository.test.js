import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createMySongsRepository } from '../modules/postModules/mySongsModule/mySongs.repository.js';

function createDatabase(responses) {
  const statements = [];
  const query = async (strings, ...values) => {
    statements.push({ sql: strings.join('?'), values });
    return responses.shift() || [];
  };
  query.begin = async (callback) => callback(query);
  query.json = (value) => ({ type: 'json', value });
  return { query, statements };
}

test('lists songs through an ownership predicate and cursor pagination', async () => {
  const { query, statements } = createDatabase([[
    { id: 8, song_name: 'Noc', song_image: 'noc.png', credit: null, created_at: '2026-01-01', views: 3 },
    { id: 7, song_name: 'Dzień', song_image: 'dzien.png', credit: 'Autor', created_at: '2026-01-02', views: 4 },
  ]]);
  const repository = createMySongsRepository(query);

  const result = await repository.list(5, null, 1);

  assert.match(statements[0].sql, /association\.author_id/);
  assert.deepEqual(result, {
    data: [{ id: '8', songName: 'Noc', songImage: 'noc.png', credit: null, createdAt: '2026-01-01', views: 3 }],
    nextCursor: '8',
  });
});

test('refuses to delete a song not owned by the authenticated author', async () => {
  const { query } = createDatabase([[]]);
  const repository = createMySongsRepository(query);

  await assert.rejects(
    repository.deleteOwned(7, 12),
    (error) => error.status === 404 && error.message === 'Nie znaleziono Twojego utworu.'
  );
});

test('refuses self-service deletion when another author owns the same song', async () => {
  const { query } = createDatabase([[
    { id: 12, file: 'song.mp3', song_image: 'cover.png', publisher_id: 7, author_count: 2, is_author: true },
  ]]);
  const repository = createMySongsRepository(query);

  await assert.rejects(repository.deleteOwned(7, 12), (error) => error.status === 409);
});

test('deletes dependent rows and durably queues both storage candidates', async () => {
  const { query, statements } = createDatabase([
    [{ id: 12, file: 'song.mp3', song_image: 'shared.png', publisher_id: 7, author_count: 1, is_author: true }],
    [],
    [],
    [],
    [{ id: 31 }],
  ]);
  const repository = createMySongsRepository(query);

  const result = await repository.deleteOwned(7, 12);

  assert.deepEqual(result, { cleanupJobId: '31' });
  assert.match(statements[1].sql, /DELETE FROM views/);
  assert.match(statements[2].sql, /DELETE FROM monthly_song_stats/);
  assert.match(statements[3].sql, /DELETE FROM songs/);
  assert.deepEqual(statements[4].values[0], {
    type: 'json',
    value: ['songs/song.mp3', 'images/songPictures/shared.png'],
  });
});

test('preserves a shared cover while removing an unreferenced audio object', async () => {
  const removed = [];
  const { query, statements } = createDatabase([
    [{ id: 31, bucket: 'spotify', object_paths: ['songs/song.mp3', 'images/songPictures/shared.png'] }],
    [{ in_use: false }],
    [{ in_use: true }],
    [],
  ]);
  const repository = createMySongsRepository(query, {
    from() {
      return { async remove(paths) { removed.push(paths); return { error: null }; } };
    },
  });

  const completed = await repository.processCleanupJob('31');

  assert.equal(completed, true);
  assert.deepEqual(removed, [['songs/song.mp3']]);
  assert.match(statements.at(-1).sql, /DELETE FROM song_storage_cleanup_jobs/);
});

test('records a failed storage cleanup for retry', async () => {
  const { query, statements } = createDatabase([
    [{ id: 31, bucket: 'spotify', object_paths: ['songs/song.mp3'] }],
    [{ in_use: false }],
    [],
  ]);
  const repository = createMySongsRepository(query, {
    from() {
      return { async remove() { return { error: { message: 'storage unavailable' } }; } };
    },
  });

  const completed = await repository.processCleanupJob('31');

  assert.equal(completed, false);
  assert.match(statements[2].sql, /UPDATE song_storage_cleanup_jobs/);
});
