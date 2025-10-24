const { contextBridge, ipcRenderer } = require('electron')

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  getAppPath: () => ipcRenderer.invoke('app-path'),
  
  // 对话框
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // 菜单事件监听
  onMenuNewConversation: (callback) => ipcRenderer.on('menu-new-conversation', callback),
  onMenuImportSettings: (callback) => ipcRenderer.on('menu-import-settings', callback),
  onMenuExportSettings: (callback) => ipcRenderer.on('menu-export-settings', callback),
  onMenuCheckUpdate: (callback) => ipcRenderer.on('menu-check-update', callback),
  
  // 移除监听器
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
})
