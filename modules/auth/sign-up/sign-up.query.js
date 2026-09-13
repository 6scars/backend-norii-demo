import { sql } from '#db';
import AppError from '#error-handler';

export default async function insertNewUser(email, hashedPassword) {
  try {
    return await sql`
      INSERT INTO authors (email, password)
      VALUES (${email}, ${hashedPassword})
    `;
  } catch (error) {
    throw new AppError(error.message || 'signUp query error', 500);
  }
}
