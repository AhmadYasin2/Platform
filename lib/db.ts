// lib/db.ts
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL in .env');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
