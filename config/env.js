import { existsSync } from 'node:fs';
import env from 'dotenv';

const DEVELOPMENT_ENV_FILE = '.env.development';
const DEFAULT_ENV_FILE = '.env';
const REQUIRED_ENV_VARIABLES = [
  'DATABASE_KEY',
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'JWT_SECRET'
];

const isDevelopment = process.env.DEVELOPMENT === 'YES';
const envFileCandidates = isDevelopment
  ? [DEVELOPMENT_ENV_FILE, DEFAULT_ENV_FILE]
  : [DEFAULT_ENV_FILE];
const envFile = envFileCandidates.find((candidate) => existsSync(candidate));

if (envFile) {
  const result = env.config({ path: envFile, quiet: true });

  if (result.error) {
    throw new Error(`Could not load environment variables from ${envFile}.`, {
      cause: result.error
    });
  }
}

const missingVariables = REQUIRED_ENV_VARIABLES.filter(
  (variableName) => !process.env[variableName]?.trim()
);

if (missingVariables.length > 0) {
  const expectedEnvFile = isDevelopment
    ? DEVELOPMENT_ENV_FILE
    : DEFAULT_ENV_FILE;

  throw new Error(
    `Missing required environment variables: ${missingVariables.join(', ')}. ` +
      `Add them to ${expectedEnvFile} or provide them in the process environment. ` +
      'Use .env.example as a template.'
  );
}

try {
  new URL(process.env.SUPABASE_URL);
} catch {
  throw new Error('SUPABASE_URL must be a valid URL.');
}
