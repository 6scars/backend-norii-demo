import assert from 'node:assert/strict';
import { test } from 'node:test';

import AppError from '../config/errorHandler/errorHandler.js';
import {
  DEMO_MAX_PUBLICATIONS_PER_USER,
  DEMO_PUBLICATION_TTL_MINUTES,
  DEMO_STORAGE_LIMIT_BYTES,
  createDemoPublishingPolicy,
} from '../modules/postModules/saveSongInBaseModule/demoPublishingPolicy.js';

function createDatabase(responses) {
  const statements = [];
  const query = async (strings, ...values) => {
    statements.push({ sql: strings.join('?'), values });
    return responses.shift() || [];
  };
  return { query, statements };
}

test('reports demo publication and aggregate storage availability', async () => {
  const { query, statements } = createDatabase([[{ publication_count: 1, storage_bytes: 318_713_975 }]]);
  const policy = createDemoPublishingPolicy(query);

  const status = await policy.getStatus(7);

  assert.deepEqual(status, {
    isDemo: true,
    publicationTtlMinutes: DEMO_PUBLICATION_TTL_MINUTES,
    publications: { used: 1, limit: DEMO_MAX_PUBLICATIONS_PER_USER, remaining: 1 },
    storage: {
      usedBytes: 318_713_975,
      limitBytes: DEMO_STORAGE_LIMIT_BYTES,
      availableBytes: DEMO_STORAGE_LIMIT_BYTES - 318_713_975,
      full: false,
    },
    canPublish: true,
    message: null,
  });
  assert.match(statements[0].sql, /song_publication_consents/);
  assert.match(statements[0].sql, /storage\.objects/);
});

test('blocks a third active publication with a clear operational error', async () => {
  const { query } = createDatabase([[{ publication_count: 2, storage_bytes: 100 }]]);
  const policy = createDemoPublishingPolicy(query);

  await assert.rejects(
    policy.assertCanStartUpload(7),
    (error) => error instanceof AppError
      && error.status === 409
      && /maksymalnie 2 aktywne publikacje/.test(error.message)
  );
});

test('blocks uploads once aggregate demo storage reaches its cap', async () => {
  const { query } = createDatabase([[{ publication_count: 0, storage_bytes: DEMO_STORAGE_LIMIT_BYTES }]]);
  const policy = createDemoPublishingPolicy(query);

  await assert.rejects(
    policy.assertCanStartUpload(7),
    (error) => error instanceof AppError
      && error.status === 409
      && /Wersja demonstracyjna/.test(error.message)
  );
});
