import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "..", "data", "fiscalio.db");

let db: Database.Database | null = null;

/** Conexión con escritura, solo para rutas API (suscripciones). */
export function getWriteDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { fileMustExist: true, timeout: 15000 });
    db.pragma("journal_mode = WAL");
    db.pragma("busy_timeout = 15000");
    db.exec(`CREATE TABLE IF NOT EXISTS suscriptores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      creado_en TEXT NOT NULL,
      confirmado INTEGER NOT NULL DEFAULT 0,
      activo INTEGER NOT NULL DEFAULT 1
    )`);
  }
  return db;
}
