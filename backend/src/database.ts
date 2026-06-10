import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

type SqlJsDatabase = any;

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'health.db');

let db: SqlJsDatabase;

export async function initDb(): Promise<SqlJsDatabase> {
  if (db) return db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  initTables(db);
  saveDb();
  return db;
}

export function getDb(): SqlJsDatabase {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

export function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function initTables(db: SqlJsDatabase) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      weight REAL DEFAULT NULL,
      height REAL DEFAULT NULL,
      bmi REAL DEFAULT NULL,
      cycleLength INTEGER DEFAULT NULL,
      painLevel INTEGER DEFAULT NULL,
      medicationWorks INTEGER DEFAULT NULL,
      goals TEXT DEFAULT '[]',
      onboardingDone INTEGER DEFAULT 0
    )
  `);
  try { db.run(`ALTER TABLE users ADD COLUMN age INTEGER DEFAULT NULL`); } catch (e) { /* already exists */ }
  try { db.run(`ALTER TABLE users ADD COLUMN cycleLengthFull INTEGER DEFAULT 28`); } catch (e) { /* already exists */ }
  try { db.run(`ALTER TABLE users ADD COLUMN contraception TEXT DEFAULT NULL`); } catch (e) { /* already exists */ }
  try { db.run(`ALTER TABLE users ADD COLUMN authProvider TEXT DEFAULT NULL`); } catch (e) { /* already exists */ }
  try { db.run(`ALTER TABLE users ADD COLUMN providerId TEXT DEFAULT NULL`); } catch (e) { /* already exists */ }
  try { db.run(`ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT NULL`); } catch (e) { /* already exists */ }
  db.run(`
    CREATE TABLE IF NOT EXISTS cycle_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      date TEXT NOT NULL,
      flow TEXT CHECK(flow IN ('light','medium','heavy','none')) NOT NULL DEFAULT 'none',
      symptoms TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      FOREIGN KEY (userId) REFERENCES users(id),
      UNIQUE(userId, date)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      startDate TEXT NOT NULL DEFAULT (date('now')),
      targetDate TEXT,
      notes TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      goalId INTEGER,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      frequency TEXT CHECK(frequency IN ('daily','weekly','custom')) NOT NULL DEFAULT 'daily',
      customDays INTEGER,
      completedDates TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS quiz_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      date TEXT NOT NULL,
      mood INTEGER CHECK(mood BETWEEN 1 AND 10),
      energy INTEGER CHECK(energy BETWEEN 1 AND 10),
      sleep INTEGER CHECK(sleep BETWEEN 1 AND 10),
      stress INTEGER CHECK(stress BETWEEN 1 AND 10),
      symptoms TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      FOREIGN KEY (userId) REFERENCES users(id),
      UNIQUE(userId, date)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS food_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      date TEXT NOT NULL,
      mealType TEXT CHECK(mealType IN ('breakfast','lunch','dinner','snack')) NOT NULL,
      food TEXT NOT NULL,
      calories INTEGER DEFAULT 0,
      protein REAL DEFAULT 0,
      carbs REAL DEFAULT 0,
      fat REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS workout_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      duration INTEGER NOT NULL,
      intensity TEXT CHECK(intensity IN ('light','medium','high')) DEFAULT 'medium',
      exercises TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS supplements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      dose TEXT DEFAULT '',
      time TEXT DEFAULT '',
      frequency TEXT CHECK(frequency IN ('daily','weekly','custom')) DEFAULT 'daily',
      customDays TEXT DEFAULT '',
      takenDates TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      date TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT DEFAULT '',
      mood INTEGER DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(id),
      UNIQUE(userId, date)
    )
  `);
  try { db.run(`ALTER TABLE journal_entries ADD COLUMN mood INTEGER DEFAULT 0`); } catch (e) { /* already exists */ }
  db.run(`
    CREATE TABLE IF NOT EXISTS goal_presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      icon TEXT DEFAULT '🎯'
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS daily_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      category TEXT DEFAULT 'general'
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);
}
