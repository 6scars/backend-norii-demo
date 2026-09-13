import { createClient } from '@supabase/supabase-js';

import DeleteMySongQueries from './delete-my-song.query.js';

export function createDeleteMySongRepository(queries = DeleteMySongQueries, storage) {
  let storageClient = storage;
  const getStorage = () => {
    if (!storageClient) {
      storageClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY).storage;
    }
    return storageClient;
  };

  return {
    deleteOwned(authorId, songId) {
      return queries.deleteOwned(authorId, songId);
    },

    async processCleanupJob(jobId) {
      const job = await queries.getCleanupJob(jobId);
      if (!job) return true;

      const removablePaths = [];
      for (const objectPath of job.object_paths) {
        if (typeof objectPath !== 'string') continue;
        const audioMatch = /^songs\/([^/\\]+\.mp3)$/i.exec(objectPath);
        const imageMatch = /^images\/songPictures\/([^/\\]+\.(?:jpe?g|png))$/i.exec(objectPath);
        if (!audioMatch && !imageMatch) continue;
        const inUse = audioMatch
          ? await queries.isAudioInUse(audioMatch[1])
          : await queries.isImageInUse(imageMatch[1]);
        if (!inUse) removablePaths.push(objectPath);
      }

      if (removablePaths.length === 0) {
        await queries.completeCleanupJob(jobId);
        return true;
      }

      try {
        const { error } = await getStorage().from(job.bucket).remove(removablePaths);
        if (error) throw error;
      } catch (error) {
        const message = String(error?.message || 'Nieznany błąd Storage').slice(0, 500);
        await queries.failCleanupJob(jobId, message);
        return false;
      }

      await queries.completeCleanupJob(jobId);
      return true;
    },
  };
}

export default createDeleteMySongRepository();
