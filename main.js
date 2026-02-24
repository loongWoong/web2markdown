const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

app.commandLine.appendSwitch('--no-sandbox')

let mainWindow
let browserWindow

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.loadFile('index.html')

  mainWindow.on('closed', () => {
    mainWindow = null
    if (browserWindow) {
      browserWindow.close()
    }
  })
}

function createBrowserWindow(url) {
  console.log('Creating browser window for URL:', url)
  
  if (browserWindow) {
    console.log('Browser window already exists, focusing and loading new URL')
    browserWindow.focus()
    browserWindow.loadURL(url)
    return
  }

  console.log('Creating new browser window')
  browserWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: false
    }
  })

  console.log('Loading URL in browser window:', url)
  browserWindow.loadURL(url)

  browserWindow.on('closed', () => {
    console.log('Browser window closed')
    browserWindow = null
  })
  
  browserWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load URL:', validatedURL, 'Error:', errorDescription)
  })
  
  browserWindow.webContents.on('did-finish-load', () => {
    console.log('Successfully loaded URL:', url)
  })
}

ipcMain.handle('open-url', (event, url) => {
  console.log('Opening URL:', url)
  try {
    createBrowserWindow(url)
    return true
  } catch (error) {
    console.error('Error opening URL:', error)
    throw error
  }
})

ipcMain.handle('get-selected-content', async (event) => {
  if (!browserWindow) return null
  const content = await browserWindow.webContents.executeJavaScript(`
    (function() {
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const div = document.createElement('div')
        div.appendChild(range.cloneContents())
        return div.innerHTML
      }
      return null
    })()
  `)
  return content
})

ipcMain.handle('save-markdown', async (event, markdown, filename) => {
  const downloadsPath = path.join(os.homedir(), 'Downloads')
  const defaultPath = path.join(downloadsPath, filename || 'content.md')
  
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultPath,
    filters: [
      { name: 'Markdown Files', extensions: ['md'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  if (filePath) {
    try {
      await fs.promises.writeFile(filePath, markdown, 'utf-8')
      return filePath
    } catch (error) {
      console.error('Error saving file:', error)
      throw error
    }
  }
  return null
})

app.whenReady().then(() => {
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
