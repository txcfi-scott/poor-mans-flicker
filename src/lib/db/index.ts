import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema';

let _db: LibSQLDatabase<typeof schema> | null = null;

function getDb(): LibSQLDatabase<typeof schema> {
  if (!_db) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      throw new Error('TURSO_DATABASE_URL environment variable is not set');
    }
    const client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    _db = drizzle(client, { schema });
  }
  return _db;
}

export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
