const { app, BrowserWindow, ipcMain, screen } = require('electron')
const { initializeDatabase, getUser } = require('./database');



let mainWindow;
let currentUser = null;
const db = initializeDatabase();

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
  getUser(db, event, data.username, data.password)
  loadIndexAndSend(data.username)
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