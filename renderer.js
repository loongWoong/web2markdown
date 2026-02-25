const urlInput = document.getElementById('url')
const openBtn = document.getElementById('openBtn')
const noteBtn = document.getElementById('noteBtn')
const saveBtn = document.getElementById('saveBtn')
const statusDiv = document.getElementById('status')
const browserView = document.getElementById('browserView')
const markdownEditor = document.getElementById('markdownEditor')

let pageLoaded = false

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
    return `https://${url}`
  }
  return url
}

function buildFilename(url) {
  return `${url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}.md`
}

async function getSelectedHtml() {
  return browserView.executeJavaScript(`
    (function() {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const div = document.createElement('div');
        div.appendChild(range.cloneContents());
        return div.innerHTML;
      }
      return null;
    })()
  `)
}

openBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim()

  if (!url) {
    showStatus('请输入网页 URL', 'error')
    return
  }

  const normalizedUrl = normalizeUrl(url)

  if (!isValidUrl(normalizedUrl)) {
    showStatus('请输入有效的 URL', 'error')
    return
  }

  pageLoaded = false
  noteBtn.disabled = true
  saveBtn.disabled = true
  markdownEditor.value = ''
  browserView.src = normalizedUrl
  showStatus('正在打开网页...', 'info')
})

noteBtn.addEventListener('click', async () => {
  if (!pageLoaded) {
    showStatus('请先打开网页', 'error')
    return
  }

  try {
    const htmlContent = await getSelectedHtml()

    if (!htmlContent) {
      showStatus('未选中任何内容，请在左侧网页中选中后再点击“笔记”', 'error')
      return
    }

    markdownEditor.value = window.electronAPI.turndown(htmlContent)
    markdownEditor.focus()
    showStatus('已载入选中内容，请在右侧编辑后点击“保存选中内容”', 'success')
  } catch (error) {
    showStatus(`获取选中内容失败: ${error.message}`, 'error')
  }
})

saveBtn.addEventListener('click', async () => {
  if (!pageLoaded) {
    showStatus('请先打开网页', 'error')
    return
  }

  const markdown = markdownEditor.value.trim()

  if (!markdown) {
    showStatus('右侧暂无可保存内容，请先点击“笔记”并编辑', 'error')
    return
  }

  try {
    const url = urlInput.value.trim()
    const filename = buildFilename(url)
    const savedPath = await window.electronAPI.saveMarkdown(markdown, filename)

    if (savedPath) {
      showStatus(`Markdown 文件已保存: ${savedPath}`, 'success')
    } else {
      showStatus('保存已取消', 'info')
    }
  } catch (error) {
    showStatus(`保存失败: ${error.message}`, 'error')
  }
})

urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    openBtn.click()
  }
})

browserView.addEventListener('did-start-loading', () => {
  pageLoaded = false
  noteBtn.disabled = true
  saveBtn.disabled = true
})

browserView.addEventListener('did-stop-loading', () => {
  pageLoaded = true
  noteBtn.disabled = false
  saveBtn.disabled = false
  showStatus('网页已加载，请先点击“笔记”将选中内容载入右侧编辑区', 'success')
})

browserView.addEventListener('did-fail-load', () => {
  pageLoaded = false
  noteBtn.disabled = true
  saveBtn.disabled = true
  showStatus('网页加载失败，请检查 URL 是否可访问', 'error')
})
