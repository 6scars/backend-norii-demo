import postgres from 'postgres';

const DATABASE_KEY = process.env.DATABASE_KEY;

export const sql = postgres(DATABASE_KEY, { ssl: { rejectUnauthorized: false } });