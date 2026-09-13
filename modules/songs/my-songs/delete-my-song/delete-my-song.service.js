import DeleteMySongRepository from './delete-my-song.repository.js';

export function createDeleteMySongService(repository = DeleteMySongRepository) {
  return async function deleteMySong(authorId, songId) {
    const { cleanupJobId } = await repository.deleteOwned(authorId, songId);
    if (!cleanupJobId) {
      return { status: 200, message: 'Utwór został usunięty.' };
    }

    const cleaned = await repository.processCleanupJob(cleanupJobId);
    return {
      status: cleaned ? 200 : 202,
      message: cleaned
        ? 'Utwór został usunięty.'
        : 'Utwór został usunięty. Pliki zostaną usunięte automatycznie.',
    };
  };
}

export default createDeleteMySongService();
