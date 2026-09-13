import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createDeleteMySongQueries } from '#songs/my-songs/delete-my-song/delete-my-song.query.js';

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

test('refuses to delete a song not owned by the authenticated author', async () => {
  const { query } = createDatabase([[]]);
  const queries = createDeleteMySongQueries(query);

  await assert.rejects(
    queries.deleteOwned(7, 12),
    (error) => error.status === 404 && error.message === 'Nie znaleziono Twojego utworu.'
  );
});

test('refuses self-service deletion when another author owns the same song', async () => {
  const { query } = createDatabase([[
    { id: 12, file: 'song.mp3', song_image: 'cover.png', publisher_id: 7, author_count: 2, is_author: true },
  ]]);
  const queries = createDeleteMySongQueries(query);

  await assert.rejects(queries.deleteOwned(7, 12), (error) => error.status === 409);
});

test('deletes dependent rows and durably queues both storage candidates', async () => {
  const { query, statements } = createDatabase([
    [{ id: 12, file: 'song.mp3', song_image: 'shared.png', publisher_id: 7, author_count: 1, is_author: true }],
    [],
    [],
    [],
    [{ id: 31 }],
  ]);
  const queries = createDeleteMySongQueries(query);

  const result = await queries.deleteOwned(7, 12);

  assert.deepEqual(result, { cleanupJobId: '31' });
  assert.match(statements[1].sql, /DELETE FROM views/);
  assert.match(statements[2].sql, /DELETE FROM monthly_song_stats/);
  assert.match(statements[3].sql, /DELETE FROM songs/);
  assert.deepEqual(statements[4].values[0], {
    type: 'json',
    value: ['songs/song.mp3', 'images/songPictures/shared.png'],
  });
});
