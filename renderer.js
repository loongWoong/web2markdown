const urlInput = document.getElementById('url')
const openBtn = document.getElementById('openBtn')
const saveBtn = document.getElementById('saveBtn')
const statusDiv = document.getElementById('status')

let browserOpened = false

function showStatus(message, type) {
  statusDiv.textContent = message
  statusDiv.className = `status ${type}`
  
  setTimeout(() => {
    statusDiv.className = 'status'
  }, 3000)
}

function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

function normalizeUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url
  }
  return url
}

openBtn.addEventListener('click', async () => {
  console.log('Open button clicked')
  const url = urlInput.value.trim()
  console.log('Input URL:', url)
  
  if (!url) {
    showStatus('请输入网页 URL', 'error')
    return
  }
  
  const normalizedUrl = normalizeUrl(url)
  console.log('Normalized URL:', normalizedUrl)
  
  if (!isValidUrl(normalizedUrl)) {
    showStatus('请输入有效的 URL', 'error')
    return
  }
  
  try {
    console.log('Calling electronAPI.openUrl with:', normalizedUrl)
    const result = await window.electronAPI.openUrl(normalizedUrl)
    console.log('openUrl result:', result)
    browserOpened = true
    saveBtn.disabled = false
    showStatus('网页已打开，请在浏览器窗口中选中内容', 'info')
  } catch (error) {
    console.error('Error opening URL:', error)
    showStatus('打开网页失败: ' + error.message, 'error')
  }
})

saveBtn.addEventListener('click', async () => {
  if (!browserOpened) {
    showStatus('请先打开网页', 'error')
    return
  }
  
  try {
    const htmlContent = await window.electronAPI.getSelectedContent()
    
    if (!htmlContent) {
      showStatus('未选中任何内容，请在浏览器窗口中选中要保存的内容', 'error')
      return
    }
    
    const markdown = window.electronAPI.turndown(htmlContent)
    
    const url = urlInput.value.trim()
    const filename = url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50) + '.md'
    
    const savedPath = await window.electronAPI.saveMarkdown(markdown, filename)
    
    if (savedPath) {
      showStatus('Markdown 文件已保存: ' + savedPath, 'success')
    } else {
      showStatus('保存已取消', 'info')
    }
  } catch (error) {
    showStatus('保存失败: ' + error.message, 'error')
  }
})

urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    openBtn.click()
  }
})
