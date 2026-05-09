import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: any = null;

async function ensureColumn(table: string, column: string, definition: string) {
  const columns = await db.all(`PRAGMA table_info(${table})`);
  if (!columns.some((item: any) => item.name === column)) {
    await db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export async function getDb() {
  if (db) return db;

  const dbDir = path.join(process.cwd(), 'shared');
  await fs.mkdir(dbDir, { recursive: true });
  const dbPath = path.join(dbDir, 'database.sqlite');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      telegram_id TEXT UNIQUE,
      plan TEXT DEFAULT 'FREE',
      balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      userId TEXT,
      service TEXT,
      category TEXT,
      keyword TEXT,
      progress INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      resultUrl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS telegram_auth_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      code TEXT UNIQUE,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      category TEXT,
      service TEXT,
      link TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS auth_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      subject TEXT,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS promo_codes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE,
      discount_percent INTEGER DEFAULT 0,
      max_usages INTEGER DEFAULT 1,
      current_usages INTEGER DEFAULT 0,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      amount REAL DEFAULT 0,
      type TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await ensureColumn('users', 'telegram_id', 'TEXT UNIQUE');
  await ensureColumn('users', 'balance', 'REAL DEFAULT 0');
  await ensureColumn('users', 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

  return db;
}
