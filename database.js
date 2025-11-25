// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function initializeDatabase() {
  const db = new sqlite3.Database(path.join(__dirname, 'app.db'), (err) => {
    if (err) {
      console.error('Error opening database', err);
      return;
    }

    const sql = `
      CREATE TABLE IF NOT EXISTS Login (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Username TEXT CHECK(length(Username) <= 16),
        Password TEXT CHECK(length(Password) <= 32)
      );
      CREATE TABLE IF NOT EXISTS Content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        creator TEXT,
        name TEXT,
        description TEXT,
        content TEXT
      );`;

    db.exec(sql, (e) => {
      if (e) console.error('Error creating tables', e);
    });
  });

  return db;
}


function handleDbError(err, event, message) {
  console.error(message, err);
  event.reply('save-complete', { success: false, error: message });
}

function insertUser(db, event, username, password) {
  db.run('INSERT INTO Login (Username, Password) VALUES (?, ?)', [username, password], function (runErr) {
    if (runErr) {
      handleDbError(runErr, event, 'Insert failed');
      return;
    }
    loadIndexAndSend(username); // Ensure this function is accessible
  });
}

function getUser(db, event, username, password) {
  db.get('SELECT Username, Password FROM Login WHERE Username = ?', [username], (err, row) => {
    if (err) {
      handleDbError(err, event, 'Database error');
      return;
    }

    // User not found -> insert
    if (!row) {
      insertUser(db, event, username, password);
    } 
    // User exists -> check password
    else {
      checkPassword(row, password, event);
    }
  });
}

function checkPassword(row, password, event) {
  if (row.Password === password) {
    return true;
  } else {
    event.reply('save-complete', { success: false, error: 'Invalid password' });
  }
}

module.exports = {
  initializeDatabase,
  handleDbError,
  insertUser,
  getUser,
};