const urlInput = document.getElementById('url')
const openBtn = document.getElementById('openBtn')
const noteBtn = document.getElementById('noteBtn')
const saveBtn = document.getElementById('saveBtn')
const statusDiv = document.getElementById('status')
const browserView = document.getElementById('browserView')
const markdownEditor = document.getElementById('markdownEditor')
const noteTitleInput = document.getElementById('noteTitle')
const noteCategoryInput = document.getElementById('noteCategory')
const noteTagsInput = document.getElementById('noteTags')
const summaryCard = document.getElementById('summaryCard')
const appendInsightBtn = document.getElementById('appendInsightBtn')
const appendTodoBtn = document.getElementById('appendTodoBtn')
const insertSummaryBtn = document.getElementById('insertSummaryBtn')

const DRAFT_KEY = 'web2markdown.draft'

let pageLoaded = false
let currentSummary = ''

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

function parseTags(tagValue) {
  return tagValue
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function generateSummary(markdown) {
  const line = markdown
    .split('\n')
    .map((item) => item.trim())
    .find((item) => item && !item.startsWith('#'))

  if (!line) {
    return '请补充你的判断摘要（为什么有价值、可用于什么场景）。'
  }

  return line.length > 140 ? `${line.slice(0, 140)}...` : line
}

function buildInfoCard() {
  const title = noteTitleInput.value.trim() || '未命名笔记'
  const category = noteCategoryInput.value
  const tags = parseTags(noteTagsInput.value)
  const source = urlInput.value.trim() || '未记录来源'
  const generatedAt = new Date().toLocaleString()
  const tagText = tags.length ? tags.map((tag) => `#${tag}`).join(' ') : '无标签'

  return [
    '---',
    `title: ${title}`,
    `category: ${category}`,
    `tags: [${tags.join(', ')}]`,
    `source: ${source}`,
    `capturedAt: ${generatedAt}`,
    '---',
    '',
    '## 信息卡片',
    `- **来源**: ${source}`,
    `- **分类**: ${category}`,
    `- **标签**: ${tagText}`,
    `- **摘要**: ${currentSummary}`,
    ''
  ].join('\n')
}

function persistDraft() {
  const payload = {
    url: urlInput.value,
    title: noteTitleInput.value,
    category: noteCategoryInput.value,
    tags: noteTagsInput.value,
    markdown: markdownEditor.value,
    summary: currentSummary,
    updatedAt: Date.now()
  }

  localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
}

function restoreDraft() {
  const raw = localStorage.getItem(DRAFT_KEY)
  if (!raw) {
    return
  }

  try {
    const draft = JSON.parse(raw)
    urlInput.value = draft.url || ''
    noteTitleInput.value = draft.title || ''
    noteCategoryInput.value = draft.category || '待分类'
    noteTagsInput.value = draft.tags || ''
    markdownEditor.value = draft.markdown || ''
    currentSummary = draft.summary || ''
    summaryCard.textContent = currentSummary || '尚未生成，点击“笔记”后将自动生成来源信息与摘要。'

    if (draft.markdown) {
      saveBtn.disabled = false
    }

    showStatus('已恢复上次草稿，可继续整理信息。', 'info')
  } catch (error) {
    localStorage.removeItem(DRAFT_KEY)
  }
}

function appendTemplate(text) {
  const prefix = markdownEditor.value.trim() ? '\n\n' : ''
  markdownEditor.value += `${prefix}${text}`
  markdownEditor.focus()
  persistDraft()
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
  currentSummary = ''
  summaryCard.textContent = '尚未生成，点击“笔记”后将自动生成来源信息与摘要。'
  browserView.src = normalizedUrl
  showStatus('正在打开网页...', 'info')
  persistDraft()
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
    currentSummary = generateSummary(markdownEditor.value)
    summaryCard.textContent = currentSummary
    persistDraft()
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
    const content = `${buildInfoCard()}\n${markdown}`
    const savedPath = await window.electronAPI.saveMarkdown(content, filename)

    if (savedPath) {
      showStatus(`Markdown 文件已保存: ${savedPath}`, 'success')
      persistDraft()
    } else {
      showStatus('保存已取消', 'info')
    }
  } catch (error) {
    showStatus(`保存失败: ${error.message}`, 'error')
  }
})

appendInsightBtn.addEventListener('click', () => {
  appendTemplate('## 关键洞察\n- 价值判断：\n- 与既有认知的差异：\n- 可落地行动：')
  showStatus('已插入关键洞察模板。', 'info')
})

appendTodoBtn.addEventListener('click', () => {
  appendTemplate('## 后续待办\n- [ ] 验证信息来源\n- [ ] 补充对比资料\n- [ ] 归档到对应知识库')
  showStatus('已插入待办清单模板。', 'info')
})

insertSummaryBtn.addEventListener('click', () => {
  currentSummary = generateSummary(markdownEditor.value)
  summaryCard.textContent = currentSummary
  appendTemplate(`## 信息摘要\n${currentSummary}`)
  showStatus('已将信息卡片摘要插入 Markdown。', 'success')
})

urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    openBtn.click()
  }
})

;[markdownEditor, noteTitleInput, noteCategoryInput, noteTagsInput, urlInput].forEach((element) => {
  element.addEventListener('input', () => {
    if (element === markdownEditor) {
      currentSummary = generateSummary(markdownEditor.value)
      summaryCard.textContent = currentSummary
    }
    persistDraft()
  })
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

restoreDraft()
