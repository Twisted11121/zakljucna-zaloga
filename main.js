const { app, BrowserWindow, ipcMain, screen } = require('electron')

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// sqlite database
const db = new sqlite3.Database(path.join(__dirname, 'app.db'), (err) => {
  if (err) {
    console.error('Error opening database', err)
    return
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
    );`

  db.exec(sql, (e) => {
    if (e) console.error('Error creating tables', e)
  })
})



let mainWindow;
let currentUser = null;

// Create main window
app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      width: 800,
      height: 600,
      nodeIntegration: false,
      contextIsolation: true,
      preload: __dirname + '/preload.js'
    }
  });
  mainWindow.loadFile('login.html');
  mainWindow.webContents.openDevTools({ mode: 'detach' }); // shows debug console
  
});

// Handle login data from preload
ipcMain.on('login-data', (event, data) => {
  db.get('SELECT Username, Password FROM Login WHERE Username = ?', [data.username], (err, row) => {
    if (err) {
      console.error('DB error', err)
      event.reply('save-complete', { success: false, error: 'Database error' })
      return
    }

    // user not found -> insert
    if (!row) {
      db.run('INSERT INTO Login (Username, Password) VALUES (?, ?)', [data.username, data.password], function(runErr) {
        if (runErr) {
          console.error('Insert error', runErr)
          event.reply('save-complete', { success: false, error: 'Insert failed' })
          return
        }
        loadIndexAndSend(data.username)
      })
    } 
    // user exists -> check password
    else {
      if (row.Password === data.password) {
        loadIndexAndSend(data.username)
      } else {
        event.reply('save-complete', { success: false, error: 'Invalid password' })
      }
    }
  })
});

// Load index and send success message
function loadIndexAndSend(username) {
  currentUser = username;
  mainWindow.loadFile('index.html')
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.webContents.send('save-complete', { success: true, username })
  })
}

// Handle page navigation from index page
function safeLoad(file) {
if (!mainWindow) return Promise.resolve();
return mainWindow.loadFile(file).catch(err => {
console.error('Failed to load', file, err);
});
}

//Load index
ipcMain.on('home-clicked', () => safeLoad('index.html'));

// Load index and send username
ipcMain.on('profile-clicked', () => {
  safeLoad('profile.html').then(() => {
    // send username
    mainWindow.webContents.send('profile-name', currentUser);
  });
});

// Load create page
ipcMain.on('create-clicked', () => safeLoad('create.html'));

//Recive create page data
ipcMain.on("create-data", (event, data) => {
  // Logic
})