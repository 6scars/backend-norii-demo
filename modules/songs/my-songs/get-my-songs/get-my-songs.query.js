import { sql } from '#db';

export function createGetMySongsQuery(database = sql) {
  return async function getMySongs(authorId, cursor, pageSize) {
    return database`
      SELECT s.id, s."song_Name" AS song_name, s."song_Image" AS song_image,
             s.credit, s.created_at, s.views
      FROM songs s
      WHERE EXISTS (
        SELECT 1 FROM authors_songs association
        WHERE association.song_id = s.id AND association.author_id = ${authorId}
      )
      AND (${cursor}::bigint IS NULL OR s.id < ${cursor}::bigint)
      ORDER BY s.id DESC
      LIMIT ${pageSize + 1}
    `;
  };
}

export default createGetMySongsQuery();
