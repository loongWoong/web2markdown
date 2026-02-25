const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

app.commandLine.appendSwitch('--no-sandbox')
app.commandLine.appendSwitch('--disable-gpu')
app.commandLine.appendSwitch('--disable-software-rasterizer')
app.commandLine.appendSwitch('--disable-dev-shm-usage')
app.commandLine.appendSwitch('--ignore-certificate-errors')
app.commandLine.appendSwitch('--allow-running-insecure-content')
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor')
app.commandLine.appendSwitch('--disable-ipc-flooding-protection')

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
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: true
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

ipcMain.handle('save-to-md-folder', async (event, markdown, filename, category) => {
  const projectRoot = path.join(os.homedir(), 'Downloads', 'web2markdown')
  const mdFolder = path.join(projectRoot, 'md')
  const categoryFolder = path.join(mdFolder, category || '待分类')
  const filePath = path.join(categoryFolder, filename || 'content.md')

  try {
    await fs.promises.mkdir(categoryFolder, { recursive: true })
    await fs.promises.writeFile(filePath, markdown, 'utf-8')
    return filePath
  } catch (error) {
    console.error('Error saving file to md folder:', error)
    throw error
  }
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
