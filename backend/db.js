const path = require('path');
const fs = require('fs');
require('dotenv').config();

let dbType = 'sqlite'; // Default db type
let sqliteDb = null;
let pgPool = null;

// Initialize Database connection
async function initDatabase() {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
    console.log('Connecting to PostgreSQL database...');
    try {
      const { Pool } = require('pg');
      pgPool = new Pool({
        connectionString: dbUrl,
        ssl: {
          rejectUnauthorized: false // Common setting for hosted DBs (Supabase, Neon, etc.)
        }
      });
      // Test the connection
      await pgPool.query('SELECT NOW()');
      dbType = 'postgres';
      console.log('Successfully connected to PostgreSQL!');
    } catch (err) {
      console.error('Failed to connect to PostgreSQL. Falling back to local SQLite...', err.message);
      setupSQLite();
    }
  } else {
    setupSQLite();
  }

  // Create tables if they do not exist
  await createTables();
}

function setupSQLite() {
  console.log('Initializing local SQLite database...');
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, 'tasks.db');
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
    } else {
      console.log('Connected to local SQLite database at:', dbPath);
    }
  });
  dbType = 'sqlite';
}

// Helper to execute SQL queries with parameters
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (dbType === 'postgres') {
      // Convert "?" placeholders to "$1", "$2", etc., for Postgres compatibility
      let index = 0;
      const pgSql = sql.replace(/\?/g, () => `$${++index}`);
      
      pgPool.query(pgSql, params, (err, res) => {
        if (err) {
          console.error('Postgres Query Error:', err, 'SQL:', pgSql);
          return reject(err);
        }
        resolve(res.rows);
      });
    } else {
      // SQLite
      // Note: SELECT queries run with `all`, mutate queries run with `run`
      const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
      if (isSelect) {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) {
            console.error('SQLite Query Error:', err, 'SQL:', sql);
            return reject(err);
          }
          resolve(rows);
        });
      } else {
        sqliteDb.run(sql, params, function (err) {
          if (err) {
            console.error('SQLite Execution Error:', err, 'SQL:', sql);
            return reject(err);
          }
          // Resolve with lastID and changes for compatibility
          resolve({ lastId: this.lastID, changes: this.changes });
        });
      }
    }
  });
}

// Table schemas initialization
async function createTables() {
  try {
    // List Table: Columns on the Kanban board
    await query(`
      CREATE TABLE IF NOT EXISTS lists (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        position INTEGER NOT NULL
      )
    `);

    // Tasks Table: Tasks inside the lists
    // Note: checklist will store a JSON string of subtasks: [{ id, text, completed }]
    await query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        list_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT DEFAULT 'Medium',
        due_date TEXT,
        position INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        checklist TEXT
      )
    `);

    // Insert default columns if they are empty
    const lists = await query('SELECT count(*) as count FROM lists');
    const count = lists[0]?.count || lists[0]?.['count(*)'] || 0;

    if (parseInt(count) === 0) {
      console.log('Inserting default board lists...');
      await query('INSERT INTO lists (id, title, position) VALUES (?, ?, ?)', ['todo', 'To Do', 1]);
      await query('INSERT INTO lists (id, title, position) VALUES (?, ?, ?)', ['inprogress', 'In Progress', 2]);
      await query('INSERT INTO lists (id, title, position) VALUES (?, ?, ?)', ['done', 'Completed', 3]);
      
      // Insert a sample task
      await query(`
        INSERT INTO tasks (id, list_id, title, description, priority, due_date, position, created_at, checklist)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'task-sample-1', 
        'todo', 
        'Welcome to TaskFlow! 🚀', 
        'This is a sample task card. Feel free to drag me to "In Progress" or "Completed"! Double click or click edit to see checklists and due dates.',
        'High', 
        new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days from now
        1,
        new Date().toISOString(),
        JSON.stringify([
          { id: 'sub-1', text: 'Create a new list', completed: false },
          { id: 'sub-2', text: 'Drag a card to In Progress', completed: false }
        ])
      ]);
    }
  } catch (err) {
    console.error('Error setting up tables:', err.message);
  }
}

module.exports = {
  initDatabase,
  query,
  getDbType: () => dbType
};
