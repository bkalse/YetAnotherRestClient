const { contextBridge, ipcRenderer } = require("electron")

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Menu events
  onMenuNewRequest: (callback) => ipcRenderer.on("menu-new-request", callback),
  onMenuNewCollection: (callback) => ipcRenderer.on("menu-new-collection", callback),
  onMenuToggleSidebar: (callback) => ipcRenderer.on("menu-toggle-sidebar", callback),
  onMenuImport: (callback) => ipcRenderer.on("menu-import", callback),
  onMenuExport: (callback) => ipcRenderer.on("menu-export", callback),

  // File system operations
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke("write-file", filePath, data),

  // Platform info
  platform: process.platform,

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
})
