import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";

const isDev = process.env.NODE_ENV === "development";

export let db: any;
export let pool: any;

if (isDev) {
  const sqlite = new Database("dev.db");
  sqlite.pragma("journal_mode = WAL");
  
  db = drizzle(sqlite, { schema });
  
  // Create tables for development using better-sqlite3
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      created_at REAL NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at REAL NOT NULL
    );
  `);
  
  console.log("Database initialized with SQLite for development");
} else {
  // Production - requires DATABASE_URL
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  
  // Only import pg in production
  const { Pool } = require("pg");
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { drizzle: drizzlePg } = require("drizzle-orm/node-postgres");
  db = drizzlePg(pool, { schema });
  
  console.log("Database initialized with PostgreSQL for production");
}
