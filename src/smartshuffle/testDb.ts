import Database from 'better-sqlite3';
import { SCHEMA_SQL } from './schema';

export function makeDb() {
  const raw = new Database(':memory:');
  raw.pragma('foreign_keys = ON');
  raw.exec(SCHEMA_SQL);
  const db: any = {
    execAsync: async (sql: string) => { raw.exec(sql); },
    getAllAsync: async (sql: string, ...p: any[]) => raw.prepare(sql).all(...p),
    getFirstAsync: async (sql: string, ...p: any[]) => raw.prepare(sql).get(...p) ?? null,
    runAsync: async (sql: string, ...p: any[]) => raw.prepare(sql).run(...p),
    withTransactionAsync: async (fn: () => Promise<void>) => {
      raw.exec('BEGIN');
      try { await fn(); raw.exec('COMMIT'); } catch (e) { raw.exec('ROLLBACK'); throw e; }
    },
  };
  return { raw, db };
}
