const { contextBridge, ipcRenderer } = require('electron')
const TurndownService = require('turndown')

contextBridge.exposeInMainWorld('electronAPI', {
  openUrl: (url) => ipcRenderer.invoke('open-url', url),
  getSelectedContent: () => ipcRenderer.invoke('get-selected-content'),
  saveMarkdown: (markdown, filename) => ipcRenderer.invoke('save-markdown', markdown, filename),
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
