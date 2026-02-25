const urlInput = document.getElementById('url')
const openBtn = document.getElementById('openBtn')
const noteBtn = document.getElementById('noteBtn')
const appendNoteBtn = document.getElementById('appendNoteBtn')
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
const formatBtn = document.getElementById('formatBtn')
const highlightBtn = document.getElementById('highlightBtn')
const saveToMdBtn = document.getElementById('saveToMdBtn')

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

function formatMarkdown(text) {
  let formatted = text

  formatted = formatted.replace(/!\[\]\(\s*`([^`]+)`\)/g, '![]($1)')

  formatted = formatted.replace(/!\[\]\(@\/assets\/img\/answer\/yes\.png\)/g, '✅')

  formatted = formatted.replace(/\\?\[\s*单选题\s*\\?\]/g, '**[单选题]**')

  formatted = formatted.replace(/\\?\[\s*多选题\s*\\?\]/g, '**[多选题]**')

  formatted = formatted.replace(/\\?\[\s*判断题\s*\\?\]/g, '**[判断题]**')

  formatted = formatted.replace(/正确答案：([A-D])/g, '正确答案：**$1**')

  formatted = formatted.replace(/你的答案：([A-D])/g, '你的答案：**$1**')

  formatted = formatted.replace(/答案\s*\n\s*正确答案/g, '正确答案')

  formatted = formatted.replace(/答题\s*\n\s*问题\d+/g, '')

  formatted = formatted.replace(/!\[\]\([^)]*可拖拽显示更多[^)]*\)/g, '')

  formatted = formatted.replace(/可拖拽显示更多`/g, '')

  formatted = formatted.replace(/^.*可拖拽显示.*$/gm, '')

  formatted = formatted.replace(/答题\s*\n\s*\\\\[\s*\n\s*单选题\s*\n\s*\\\\]/g, '答题 [单选题]')

  formatted = formatted.replace(/答题\s*\n\s*\\\\[\s*\n\s*多选题\s*\n\s*\\\\]/g, '答题 [多选题]')

  formatted = formatted.replace(/答题\s*\n\s*\\\\[\s*\n\s*判断题\s*\n\s*\\\\]/g, '答题 [判断题]')

  formatted = formatted.replace(/\\\\[\s*\n\s*单选题\s*\n\s*\\\\]/g, '[单选题]')

  formatted = formatted.replace(/\\\\[\s*\n\s*多选题\s*\n\s*\\\\]/g, '[多选题]')

  formatted = formatted.replace(/\\\\[\s*\n\s*判断题\s*\n\s*\\\\]/g, '[判断题]')

  formatted = formatted.replace(/答题\s*\n\s*\\\\[\s*\n\s*单选题\s*\\\\]/g, '答题 [单选题]')

  formatted = formatted.replace(/答题\s*\n\s*\\\\[\s*\n\s*多选题\s*\\\\]/g, '答题 [多选题]')

  formatted = formatted.replace(/答题\s*\n\s*\\\\[\s*\n\s*判断题\s*\\\\]/g, '答题 [判断题]')

  formatted = formatted.replace(/\\\\[\s*\n\s*单选题\s*\\\\]/g, '[单选题]')

  formatted = formatted.replace(/\\\\[\s*\n\s*多选题\s*\\\\]/g, '[多选题]')

  formatted = formatted.replace(/\\\\[\s*\n\s*判断题\s*\\\\]/g, '[判断题]')

  formatted = formatted.replace(/正确答案\s*\n\s*：\s*\n\s*([A-D])/g, '正确答案：$1')

  formatted = formatted.replace(/你的答案\s*\n\s*：\s*\n\s*([A-D])/g, '你的答案：$1')

  formatted = formatted.replace(/^([A-D])\s*\n\s*([^\n]+)$/gm, '$1. $2')

  formatted = formatted.replace(/解析\s*\n/g, '### 解析\n\n')

  formatted = formatted.replace(/第[一二三四五六七八九十]+章.*?\/.*?第[一二三四五六七八九十]+节.*/g, (match) => `**${match}**`)

  formatted = formatted.replace(/\n{3,}/g, '\n\n')

  formatted = formatted.replace(/^([A-D])\s*\n\s*([0-9]+)/gm, '$1. $2')

  formatted = formatted.replace(/([A-D])\s*\n\s*([0-9]+)/g, '$1. $2')

  return formatted.trim()
}

function highlightMarkdown(text) {
  const selectionStart = markdownEditor.selectionStart
  const selectionEnd = markdownEditor.selectionEnd

  if (selectionStart === selectionEnd) {
    return text
  }

  const before = text.substring(0, selectionStart)
  const selected = text.substring(selectionStart, selectionEnd)
  const after = text.substring(selectionEnd)

  return `${before}**${selected}**${after}`
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
  appendNoteBtn.disabled = true
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
      showStatus('未选中任何内容，请在左侧网页中选中后再点击"笔记"', 'error')
      return
    }

    markdownEditor.value = window.electronAPI.turndown(htmlContent)
    markdownEditor.focus()
    currentSummary = generateSummary(markdownEditor.value)
    summaryCard.textContent = currentSummary
    persistDraft()
    showStatus('已载入选中内容，请在右侧编辑后点击"保存选中内容"', 'success')
  } catch (error) {
    showStatus(`获取选中内容失败: ${error.message}`, 'error')
  }
})

appendNoteBtn.addEventListener('click', async () => {
  if (!pageLoaded) {
    showStatus('请先打开网页', 'error')
    return
  }

  try {
    const htmlContent = await getSelectedHtml()

    if (!htmlContent) {
      showStatus('未选中任何内容，请在左侧网页中选中后再点击"续写"', 'error')
      return
    }

    const newContent = window.electronAPI.turndown(htmlContent)
    const currentContent = markdownEditor.value.trim()
    const separator = currentContent ? '\n\n---\n\n' : ''
    markdownEditor.value = currentContent + separator + newContent
    markdownEditor.focus()
    currentSummary = generateSummary(markdownEditor.value)
    summaryCard.textContent = currentSummary
    persistDraft()
    showStatus('已追加选中内容到编辑器', 'success')
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

formatBtn.addEventListener('click', () => {
  const currentText = markdownEditor.value
  if (!currentText.trim()) {
    showStatus('Markdown 编辑区为空，无法格式化', 'error')
    return
  }
  const formattedText = formatMarkdown(currentText)
  markdownEditor.value = formattedText
  persistDraft()
  showStatus('已格式化 Markdown 内容', 'success')
})

highlightBtn.addEventListener('click', () => {
  const currentText = markdownEditor.value
  if (!currentText.trim()) {
    showStatus('Markdown 编辑区为空，无法高亮', 'error')
    return
  }
  const highlightedText = highlightMarkdown(currentText)
  markdownEditor.value = highlightedText
  persistDraft()
  showStatus('已添加高亮标注', 'success')
})

saveToMdBtn.addEventListener('click', async () => {
  const markdown = markdownEditor.value.trim()
  if (!markdown) {
    showStatus('Markdown 编辑区为空，无法保存', 'error')
    return
  }

  const title = noteTitleInput.value.trim() || '未命名笔记'
  const category = noteCategoryInput.value || '待分类'
  const filename = `${title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.md`

  try {
    const savedPath = await window.electronAPI.saveToMdFolder(markdown, filename, category)
    if (savedPath) {
      showStatus(`已保存到 md 文件夹: ${savedPath}`, 'success')
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
  appendNoteBtn.disabled = false
  saveBtn.disabled = false
  showStatus('网页已加载，请先点击"笔记"将选中内容载入右侧编辑区', 'success')
})

browserView.addEventListener('did-fail-load', () => {
  pageLoaded = false
  noteBtn.disabled = true
  appendNoteBtn.disabled = true
  saveBtn.disabled = true
  showStatus('网页加载失败，请检查 URL 是否可访问', 'error')
})

restoreDraft()
