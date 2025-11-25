const { contextBridge, ipcRenderer } = require('electron');

// Login preload script
contextBridge.exposeInMainWorld('api', {
  sendLoginData: (data) => ipcRenderer.send('login-data', data),
  onSaveComplete: (callback) => ipcRenderer.on('save-complete', (event, result) => callback(result)),
  sendNav: (page) => ipcRenderer.send(`${page}-clicked`, true),

  onProfileName: (callback) =>
  ipcRenderer.on('profile-name', (event, username) => {
    callback(username);
  }),

  sendCreateData: (data) => ipcRenderer.send('create-data', data)

});
