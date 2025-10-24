const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

// 在开发环境中禁用Electron安全警告
if (isDev) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
  // 禁用所有安全警告
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
}

let mainWindow

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: isDev ? false : true, // 开发环境禁用web安全
      allowRunningInsecureContent: isDev ? true : false,
      experimentalFeatures: false,
      enableBlinkFeatures: '',
      disableBlinkFeatures: 'Auxclick'
    },
    icon: path.join(__dirname, '../public/icon.png'),
    titleBarStyle: 'default',
    show: false
  })

  // 设置CSP头部
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const csp = isDev 
      ? [
          // 开发环境：允许更多权限用于调试
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http: https: ws: wss:; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https:; " +
          "worker-src 'self' blob: data:; " +
          "style-src 'self' 'unsafe-inline' http: https:; " +
          "img-src 'self' data: blob: http: https:; " +
          "font-src 'self' data: http: https:; " +
          "connect-src 'self' http: https: ws: wss:; " +
          "frame-src 'self' http: https:;"
        ]
      : [
          // 生产环境：更严格的安全策略
          "default-src 'self'; " +
          "script-src 'self'; " +
          "worker-src 'self' blob: data:; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: blob:; " +
          "font-src 'self' data:; " +
          "connect-src 'self' http: https:; " +
          "frame-src 'self';"
        ]
    
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': csp
      }
    })
  })

  // 设置session的默认CSP
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['clipboard-read', 'clipboard-write']
    if (allowedPermissions.includes(permission)) {
      callback(true)
    } else {
      callback(false)
    }
  })

  // 在开发环境中禁用CSP警告
  if (isDev) {
    // 禁用CSP警告（仅开发环境）
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      if (message.includes('Electron Security Warning') && message.includes('Content-Security-Policy')) {
        event.preventDefault()
      }
    })
  }

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // 当窗口被关闭时
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 创建菜单
  createMenu()
}

function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建对话',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-conversation')
          }
        },
        {
          label: '导入设置',
          click: () => {
            dialog.showOpenDialog(mainWindow, {
              title: '导入设置',
              filters: [
                { name: 'JSON文件', extensions: ['json'] }
              ]
            }).then(result => {
              if (!result.canceled) {
                mainWindow.webContents.send('menu-import-settings', result.filePaths[0])
              }
            })
          }
        },
        {
          label: '导出设置',
          click: () => {
            mainWindow.webContents.send('menu-export-settings')
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: '重新加载',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload()
          }
        },
        {
          label: '强制重新加载',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            mainWindow.webContents.reloadIgnoringCache()
          }
        },
        {
          label: '切换开发者工具',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools()
          }
        },
        { type: 'separator' },
        {
          label: '实际大小',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0)
          }
        },
        {
          label: '放大',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel()
            mainWindow.webContents.setZoomLevel(currentZoom + 1)
          }
        },
        {
          label: '缩小',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel()
            mainWindow.webContents.setZoomLevel(currentZoom - 1)
          }
        },
        { type: 'separator' },
        {
          label: '切换全屏',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen())
          }
        }
      ]
    },
    {
      label: '窗口',
      submenu: [
        {
          label: '最小化',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: '关闭',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于',
              message: '大模型集成对话系统',
              detail: '版本 1.0.0\n基于 Vue 3 + Electron 构建'
            })
          }
        },
        {
          label: '检查更新',
          click: () => {
            mainWindow.webContents.send('menu-check-update')
          }
        }
      ]
    }
  ]

  // macOS 特殊处理
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          label: '关于 ' + app.getName(),
          role: 'about'
        },
        { type: 'separator' },
        {
          label: '服务',
          role: 'services',
          submenu: []
        },
        { type: 'separator' },
        {
          label: '隐藏 ' + app.getName(),
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: '隐藏其他',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        },
        {
          label: '显示全部',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'Command+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    })
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

  // 在开发环境中禁用安全警告
  if (isDev) {
    app.commandLine.appendSwitch('disable-web-security')
    app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor')
    app.commandLine.appendSwitch('disable-site-isolation-trials')
    // 允许 Web Worker
    app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor')
    app.commandLine.appendSwitch('allow-running-insecure-content')
  }

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow)

// 当所有窗口都被关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC 通信处理
ipcMain.handle('app-version', () => {
  return app.getVersion()
})

ipcMain.handle('app-path', () => {
  return app.getAppPath()
})

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options)
  return result
})

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options)
  return result
})

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options)
  return result
})

// 安全设置
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault()
    require('electron').shell.openExternal(navigationUrl)
  })
})
