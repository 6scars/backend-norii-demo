import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);
const envModuleUrl = pathToFileURL(
  path.join(repositoryRoot, 'config', 'env.js')
).href;

function importEnvironment(cwd, additionalEnvironment = {}) {
  return spawnSync(
    process.execPath,
    ['--input-type=module', '--eval', `import ${JSON.stringify(envModuleUrl)}`],
    {
      cwd,
      encoding: 'utf8',
      env: {
        PATH: process.env.PATH,
        SYSTEMROOT: process.env.SYSTEMROOT,
        ...additionalEnvironment
      }
    }
  );
}

test('reports every required variable when development configuration is absent', () => {
  const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'spotify-env-'));

  try {
    const result = importEnvironment(temporaryDirectory, { DEVELOPMENT: 'YES' });

    assert.notEqual(result.status, 0);
    assert.match(
      result.stderr,
      /Missing required environment variables: DATABASE_KEY, SUPABASE_URL, SUPABASE_KEY, JWT_SECRET\./
    );
    assert.match(result.stderr, /Add them to \.env\.development/);
    assert.doesNotMatch(result.stderr, /supabaseUrl is required/);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test('uses .env as a fallback when .env.development is absent', () => {
  const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'spotify-env-'));

  try {
    writeFileSync(
      path.join(temporaryDirectory, '.env'),
      [
        'DATABASE_KEY=postgresql://postgres:password@localhost:5432/postgres',
        'SUPABASE_URL=https://example.supabase.co',
        'SUPABASE_KEY=test-server-key',
        'JWT_SECRET=test-jwt-secret'
      ].join('\n')
    );

    const result = importEnvironment(temporaryDirectory, { DEVELOPMENT: 'YES' });

    assert.equal(result.status, 0, result.stderr);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});
