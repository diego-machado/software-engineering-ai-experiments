import dotenv from 'dotenv';
import pgPromise from 'pg-promise';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pgp = pgPromise({
  capSQL: true,
});

export const db = pgp(connectionString);

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.one('SELECT 1 AS ok');
    return true;
  } catch {
    return false;
  }
}
