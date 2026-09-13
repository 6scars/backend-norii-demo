import AppError from '../../../config/errorHandler/errorHandler.js';
import { sql } from '../../../config/db.js';

const DEFAULT_MAX_PUBLICATIONS = 2;
const DEFAULT_STORAGE_LIMIT_BYTES = 500 * 1024 * 1024;
const DEFAULT_PUBLICATION_TTL_MINUTES = 15;

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const DEMO_MAX_PUBLICATIONS_PER_USER = positiveInteger(
  process.env.DEMO_MAX_PUBLICATIONS_PER_USER,
  DEFAULT_MAX_PUBLICATIONS
);
export const DEMO_STORAGE_LIMIT_BYTES = positiveInteger(
  process.env.DEMO_STORAGE_LIMIT_BYTES,
  DEFAULT_STORAGE_LIMIT_BYTES
);
export const DEMO_PUBLICATION_TTL_MINUTES = positiveInteger(
  process.env.DEMO_PUBLICATION_TTL_MINUTES,
  DEFAULT_PUBLICATION_TTL_MINUTES
);

export const DEMO_USER_LIMIT_MESSAGE =
  `W wersji demonstracyjnej możesz mieć maksymalnie ${DEMO_MAX_PUBLICATIONS_PER_USER} aktywne publikacje. `
  + `Utwory są usuwane automatycznie po ${DEMO_PUBLICATION_TTL_MINUTES} minutach.`;
export const DEMO_STORAGE_LIMIT_MESSAGE =
  'Wersja demonstracyjna wykorzystała dostępne miejsce na pliki. '
  + 'Poczekaj, aż starsze publikacje zostaną automatycznie usunięte.';

async function readUsage(database, authorId) {
  const [usage = {}] = await database`
    SELECT
      (
        SELECT count(*)::integer
        FROM public.song_publication_consents consent
        WHERE consent.author_id = ${authorId}
          AND consent.expires_at > now()
      ) AS publication_count,
      (
        SELECT coalesce(sum(coalesce((object.metadata ->> 'size')::bigint, 0)), 0)::bigint
        FROM storage.objects object
        WHERE object.bucket_id IN ('spotify', 'images')
      ) AS storage_bytes
  `;
  return {
    publicationCount: Number(usage.publication_count || 0),
    storageBytes: Number(usage.storage_bytes || 0),
  };
}

function createStatus({ publicationCount, storageBytes }) {
  const userLimitReached = publicationCount >= DEMO_MAX_PUBLICATIONS_PER_USER;
  const storageFull = storageBytes >= DEMO_STORAGE_LIMIT_BYTES;
  const message = userLimitReached
    ? DEMO_USER_LIMIT_MESSAGE
    : storageFull ? DEMO_STORAGE_LIMIT_MESSAGE : null;

  return {
    isDemo: true,
    publicationTtlMinutes: DEMO_PUBLICATION_TTL_MINUTES,
    publications: {
      used: publicationCount,
      limit: DEMO_MAX_PUBLICATIONS_PER_USER,
      remaining: Math.max(0, DEMO_MAX_PUBLICATIONS_PER_USER - publicationCount),
    },
    storage: {
      usedBytes: storageBytes,
      limitBytes: DEMO_STORAGE_LIMIT_BYTES,
      availableBytes: Math.max(0, DEMO_STORAGE_LIMIT_BYTES - storageBytes),
      full: storageFull,
    },
    canPublish: !userLimitReached && !storageFull,
    message,
  };
}

function throwWhenBlocked(status) {
  if (status.publications.remaining === 0) {
    throw new AppError(DEMO_USER_LIMIT_MESSAGE, 409);
  }
  if (status.storage.full) {
    throw new AppError(DEMO_STORAGE_LIMIT_MESSAGE, 409);
  }
}

export function createDemoPublishingPolicy(database = sql) {
  return {
    async getStatus(authorId) {
      return createStatus(await readUsage(database, authorId));
    },

    async assertCanStartUpload(authorId) {
      const status = await this.getStatus(authorId);
      throwWhenBlocked(status);
      return status;
    },

    async assertCanCommit(transaction, authorId) {
      await transaction`
        SELECT pg_advisory_xact_lock(hashtextextended('demo-publication-global', 0))
      `;
      await transaction`
        SELECT pg_advisory_xact_lock(hashtextextended(${`demo-publication-author:${authorId}`}, 0))
      `;
      const status = createStatus(await readUsage(transaction, authorId));
      throwWhenBlocked(status);
      return status;
    },
  };
}

export default createDemoPublishingPolicy();
