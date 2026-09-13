import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createSaveSongQueries } from '../modules/postModules/saveSongInBaseModule/saveSongInBase-helper-functions/saveSongInBase.query.js';

const publicationConsent = {
  audioRightsConfirmed: true,
  coverRightsConfirmed: true,
  publishingTermsAccepted: true,
  policyVersion: '2026-09-12-v1',
};

test('writes the song, author relation and consent through one database transaction', async () => {
  const statements = [];
  let transactionCount = 0;
  const database = {
    async begin(callback) {
      transactionCount += 1;
      const transaction = async (strings, ...values) => {
        statements.push({ sql: strings.join('?'), values });
        return statements.length === 1 ? [{ id: 44 }] : [];
      };
      return callback(transaction);
    },
  };
  let assertedAuthorId;
  const queries = createSaveSongQueries(database, {
    publishingPolicy: {
      async assertCanCommit(_transaction, authorId) { assertedAuthorId = authorId; },
    },
  });

  const songId = await queries.insertSongWithAuthorQuery(
    'Test song',
    'song.mp3',
    'cover.png',
    'Tester',
    null,
    7,
    publicationConsent
  );

  assert.equal(transactionCount, 1);
  assert.equal(assertedAuthorId, 7);
  assert.equal(songId, 44);
  assert.equal(statements.length, 3);
  assert.deepEqual(statements[1].values, [7, 44]);
  assert.deepEqual(statements[2].values, [7, 44, true, true, true, '2026-09-12-v1', 15]);
});
