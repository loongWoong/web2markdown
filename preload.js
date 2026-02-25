const { contextBridge, ipcRenderer } = require('electron')
const TurndownService = require('turndown')

contextBridge.exposeInMainWorld('electronAPI', {
  saveMarkdown: (markdown, filename) => ipcRenderer.invoke('save-markdown', markdown, filename),
  saveToMdFolder: (markdown, filename, category) => ipcRenderer.invoke('save-to-md-folder', markdown, filename, category),
  turndown: (html) => {
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
      strongDelimiter: '**'
    })
    return turndownService.turndown(html)
  }
})
