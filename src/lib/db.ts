import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import { randomUUID } from 'crypto';

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

const DB_FILE = 'local.db';

// Definición de la tabla de servicios adaptada para SQLite
const SERVICES_TABLE_SCHEMA = `
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  image_url TEXT,
  is_physical INTEGER NOT NULL DEFAULT 0, -- 0 for false, 1 for true
  is_online INTEGER NOT NULL DEFAULT 0,   -- 0 for false, 1 for true
  payment_type TEXT NOT NULL DEFAULT 'paid' CHECK (payment_type IN ('paid', 'barter')),
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
`;

// Función para inicializar la base de datos y crear las tablas
async function initializeDb() {
  try {
    const dbInstance = await open({
      filename: `./${DB_FILE}`,
      driver: sqlite3.Database
    });
    await dbInstance.exec(SERVICES_TABLE_SCHEMA);
    console.log('Database initialized successfully.');
    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Función para obtener la instancia de la base de datos (Singleton)
export async function getDb() {
  if (!db) {
    db = await initializeDb();
  }
  return db;
}

// Función para generar un nuevo ID (UUID)
export function generateId() {
    return randomUUID();
}