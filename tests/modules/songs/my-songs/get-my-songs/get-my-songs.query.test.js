import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createGetMySongsQuery } from '#songs/my-songs/get-my-songs/get-my-songs.query.js';

test('queries songs through an ownership predicate and cursor pagination', async () => {
  const statements = [];
  const rows = [{ id: 8 }, { id: 7 }];
  const database = async (strings, ...values) => {
    statements.push({ sql: strings.join('?'), values });
    return rows;
  };
  const query = createGetMySongsQuery(database);

  const result = await query(5, null, 21);

  assert.equal(result, rows);
  assert.match(statements[0].sql, /association\.author_id/);
  assert.deepEqual(statements[0].values, [5, null, null, 22]);
});
