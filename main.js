const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

app.commandLine.appendSwitch('--no-sandbox')

let mainWindow

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: false
    }
  })

  mainWindow.loadFile('index.html')

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

ipcMain.handle('save-markdown', async (event, markdown, filename) => {
  const downloadsPath = path.join(os.homedir(), 'Downloads')
  const defaultPath = path.join(downloadsPath, filename || 'content.md')

  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
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
