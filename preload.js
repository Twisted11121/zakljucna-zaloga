const { contextBridge, ipcRenderer } = require('electron');

// Login preload script
contextBridge.exposeInMainWorld('api', {
  sendLoginData: (data) => ipcRenderer.send('login-data', data),
  onSaveComplete: (callback) => ipcRenderer.on('save-complete', (event, result) => callback(result)),
  sendNav: (page) => ipcRenderer.send(`${page}-clicked`, true),

  onProfileData: (callback) =>
    ipcRenderer.on('profile-data', (event, username, data) => {
      callback(username, data);
    }),
  sendCreateData: (data) => ipcRenderer.send('create-data', data)

});
