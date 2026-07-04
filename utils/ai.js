const DEFAULT_MODEL = process.env.AI_MODEL || 'mimo-v2.5-pro'
const DEFAULT_AI_BASE_URL = 'https://api.xiaomimimo.com/v1'
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small'
const { deleteVector, isConfigured: isVectorDBConfigured, searchVectors, storeVector } = require('./vectorDB')

const CATEGORIES = ['work', 'personal', 'activity']
const PRIORITIES = ['low', 'medium', 'high']

function isRagEnabled() {
  return String(process.env.AI_RAG_ENABLED || '').trim().toLowerCase() === 'true'
}

function getAITimeoutMs() {
  const value = Number(process.env.MIMO_TIMEOUT_MS || process.env.AI_TIMEOUT_MS || process.env.OPENAI_TIMEOUT_MS)
  return Number.isFinite(value) && value > 0 ? value : 30000
}

function getAIMaxTokens() {
  const value = Number(process.env.MIMO_MAX_TOKENS || process.env.AI_MAX_TOKENS)
  return Number.isFinite(value) && value > 0 ? value : 1600
}

function getAIChatMaxTokens() {
  const value = Number(process.env.MIMO_CHAT_MAX_TOKENS || process.env.AI_CHAT_MAX_TOKENS)
  return Number.isFinite(value) && value > 0 ? value : 700
}

function getAIChatContextLimit() {
  const value = Number(process.env.AI_CHAT_CONTEXT_LIMIT)
  return Number.isFinite(value) && value > 0 ? value : 5
}

function getAIBaseUrl() {
  return (process.env.MIMO_BASE_URL || process.env.AI_BASE_URL || DEFAULT_AI_BASE_URL).replace(/\/+$/, '')
}

function getAIKey() {
  return process.env.MIMO_API_KEY
}

async function fetchOpenAI(path, body) {
  const timeoutMs = getAITimeoutMs()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(`https://api.openai.com/v1/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`OpenAI request timed out after ${timeoutMs}ms`)
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchAI(path, body) {
  const timeoutMs = getAITimeoutMs()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(`${getAIBaseUrl()}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAIKey()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`AI request timed out after ${timeoutMs}ms`)
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

function pickCategory(text) {
  const value = text.toLowerCase()
  if (/(home|family|buy|market|personal|birthday|call|house|生活|家|买)/.test(value)) {
    return 'personal'
  }
  if (/(run|gym|sport|meetup|party|activity|健康|运动|活动)/.test(value)) {
    return 'activity'
  }
  return 'work'
}

function pickPriority(text) {
  const value = text.toLowerCase()
  if (/(urgent|asap|important|due|deadline|tomorrow|high|紧急|重要|截止|明天)/.test(value)) {
    return 'high'
  }
  if (/(later|someday|low|有空|以后)/.test(value)) {
    return 'low'
  }
  return 'medium'
}

function extractTime(text) {
  const match = text.match(/(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
  if (!match) return '09:00'

  let hour = Number(match[1])
  const minute = match[2] || '00'
  const period = match[3]?.toLowerCase()
  if (period === 'pm' && hour < 12) hour += 12
  if (period === 'am' && hour === 12) hour = 0
  return `${String(hour).padStart(2, '0')}:${minute}`
}

function hasChinese(text) {
  return /[\u4e00-\u9fa5]/.test(String(text || ''))
}

function stripChineseTaskNoise(text) {
  return String(text || '')
    .replace(/创建任务|新增任务|添加任务|新建任务|新建行程|创建行程|新增行程|添加行程/g, '')
    .replace(/创建|新增|添加|新建|安排|提醒我|帮我|行程|日程|任务|待办/g, '')
    .replace(/今天|明天|后天|今晚|今夜|晚上|上午|下午|中午|凌晨|早上/g, '')
    .replace(/\d{1,2}[:：]\d{2}\s*[~\-到至]\s*\d{1,2}[:：]\d{2}/g, '')
    .replace(/\d{1,2}\s*点(?:\d{1,2}\s*分)?(?:\s*[~\-到至]\s*\d{1,2}\s*点(?:\d{1,2}\s*分)?)?/g, '')
    .replace(/[，。！？、；：,.!?;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^我(要去|要|需要|想|去)?/, '')
    .replace(/^要去/, '')
    .replace(/^去/, '')
    .trim()
}

function inferTitle(text) {
  if (!hasChinese(text)) {
    return text.replace(/\b(tomorrow|today|at|remind me to|add|create|new|task|todo)\b/gi, '').trim() || text
  }

  return stripChineseTaskNoise(text) || text
}

function todayString(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

function stripJsonFence(text) {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
}

async function callOpenAIJson(prompt) {
  if (!getAIKey() || typeof fetch !== 'function') {
    return null
  }

  const response = await fetchAI('chat/completions', {
    model: DEFAULT_MODEL,
    messages: [
      { role: 'system', content: 'Return compact JSON only. Do not include markdown.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    max_tokens: getAIMaxTokens()
  })

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`)
  }

  const payload = await response.json()
  const content = payload.choices?.[0]?.message?.content || '{}'
  return JSON.parse(stripJsonFence(content))
}

async function callAIText(prompt) {
  if (!getAIKey() || typeof fetch !== 'function') {
    return null
  }

  const response = await fetchAI('chat/completions', {
    model: DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: 'Answer from the provided task context. Be concise. If the context is insufficient, say so. This chat endpoint is read-only: never claim that you created, updated, or deleted a task.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    max_tokens: getAIChatMaxTokens()
  })

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`)
  }

  const payload = await response.json()
  return payload.choices?.[0]?.message?.content?.trim() || null
}

async function createEmbedding(text) {
  if (!process.env.OPENAI_API_KEY || typeof fetch !== 'function') {
    return null
  }

  const response = await fetchOpenAI('embeddings', {
    model: EMBEDDING_MODEL,
    input: text
  })

  if (!response.ok) {
    throw new Error(`OpenAI embedding request failed: ${response.status}`)
  }

  const payload = await response.json()
  return payload.data?.[0]?.embedding || null
}

async function classifyTask({ title = '', note = '' }) {
  const text = `${title} ${note}`.trim()
  const fallback = {
    category: pickCategory(text),
    priority: pickPriority(text),
    isFeatured: pickPriority(text) === 'high',
    reason: 'Suggested from task keywords and deadline hints.'
  }

  let result = null
  try {
    result = await callOpenAIJson(`Classify this todo task.
Allowed category values: ${CATEGORIES.join(', ')}.
Allowed priority values: ${PRIORITIES.join(', ')}.
Return JSON with category, priority, isFeatured, reason.
Task: ${text}`)
  } catch (err) {
    console.warn('AI classify unavailable, using local fallback', err.message)
  }

  return normalizeClassification(result || fallback, fallback)
}

function normalizeClassification(value, fallback) {
  return {
    category: CATEGORIES.includes(value.category) ? value.category : fallback.category,
    priority: PRIORITIES.includes(value.priority) ? value.priority : fallback.priority,
    isFeatured: typeof value.isFeatured === 'boolean' ? value.isFeatured : fallback.isFeatured,
    reason: typeof value.reason === 'string' && value.reason.trim()
      ? value.reason.trim()
      : fallback.reason
  }
}

async function parseTask(text) {
  const classification = {
    category: pickCategory(text),
    priority: pickPriority(text),
    isFeatured: pickPriority(text) === 'high'
  }
  const fallback = {
    title: inferTitle(text),
    category: classification.category,
    priority: classification.priority,
    startTime: extractTime(text),
    endTime: '',
    location: '',
    note: text,
    date: /tomorrow/i.test(text) ? todayString(1) : todayString(0),
    status: 'pending',
    isFeatured: classification.isFeatured
  }

  let result = null
  try {
    result = await callOpenAIJson(`Parse a natural language todo into JSON.
Today is ${todayString(0)}.
Allowed category values: ${CATEGORIES.join(', ')}.
Allowed priority values: ${PRIORITIES.join(', ')}.
Return title, category, priority, startTime, endTime, location, note, date, status, isFeatured.
Use YYYY-MM-DD for date and HH:mm for times. Convert relative dates like today and tomorrow using Today.
Keep user-facing fields (title, location, note) in the same language as the user's text. If the user writes Chinese, title, location, and note must be Chinese and must not be translated into English.
The title must be only the concrete task action/object. Do not include command or schedule framing words such as 创建, 新建, 新增, 添加, 任务, 待办, 行程, 日程, 我要, 我要去, 帮我, 提醒我, 今天, 明天, 今晚, or time expressions.
Text: ${text}`)
  } catch (err) {
    console.warn('AI parse unavailable, using local fallback', err.message)
  }

  if (!result) return fallback

  const merged = {
    ...fallback,
    ...result,
    category: CATEGORIES.includes(result.category) ? result.category : fallback.category,
    priority: PRIORITIES.includes(result.priority) ? result.priority : fallback.priority,
    status: result.status === 'completed' ? 'completed' : 'pending'
  }

  if (hasChinese(text) && !hasChinese(merged.title)) {
    merged.title = fallback.title
  }

  if (hasChinese(text) && hasChinese(merged.title)) {
    merged.title = stripChineseTaskNoise(merged.title) || fallback.title
  }

  return merged
}

function summarizeTasks(tasks) {
  if (!tasks.length) return 'No matching tasks found.'
  const lines = tasks.map((task) => {
    const parts = [task.title, task.date, task.startTime, task.status]
    if (task.priority) parts.push(task.priority)
    if (task.location) parts.push(task.location)
    return parts.filter(Boolean).join(' | ')
  })
  return `Summary: ${lines.join('; ')}`
}

function plainTask(task) {
  return typeof task?.get === 'function' ? task.get({ plain: true }) : task
}

function taskToEmbeddingText(task) {
  const value = plainTask(task)
  const time = [value.startTime, value.endTime].filter(Boolean).join('-')
  const fields = [
    ['Title', value.title],
    ['Category', value.category],
    ['Priority', value.priority],
    ['Date', value.date],
    ['Time', time],
    ['Location', value.location],
    ['Address', value.address],
    ['Status', value.status],
    ['Featured', value.isFeatured ? 'yes' : 'no'],
    ['Note', value.note]
  ]

  return fields
    .filter(([, fieldValue]) => fieldValue !== undefined && fieldValue !== null && fieldValue !== '')
    .map(([label, fieldValue]) => `${label}: ${fieldValue}`)
    .join('\n')
}

function taskToVectorPayload(task) {
  const value = plainTask(task)
  return {
    id: value.id,
    userId: value.userId,
    title: value.title,
    category: value.category,
    priority: value.priority,
    location: value.location || null,
    address: value.address || null,
    note: value.note || null,
    date: value.date,
    startTime: value.startTime,
    endTime: value.endTime || null,
    status: value.status,
    isFeatured: Boolean(value.isFeatured)
  }
}

function answerFromVectorHits(hits) {
  const tasks = hits
    .map((hit) => hit.payload)
    .filter(Boolean)

  if (!tasks.length) {
    return {
      answer: 'No matching tasks found.',
      sources: []
    }
  }

  return {
    answer: summarizeTasks(tasks),
    sources: hits
      .filter((hit) => hit.payload)
      .map((hit) => ({
        id: hit.payload.id,
        title: hit.payload.title,
        date: hit.payload.date,
        status: hit.payload.status,
        score: hit.score
      }))
  }
}

function sourcesFromTasks(tasks) {
  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    date: task.date,
    status: task.status
  }))
}

function tasksFromVectorHits(hits) {
  return hits
    .map((hit) => hit.payload && { ...hit.payload, score: hit.score })
    .filter(Boolean)
}

async function answerWithAIFromTasks(question, tasks) {
  if (!tasks.length) {
    return {
      answer: '没有在你的当前任务中找到相关内容。如果你想创建新任务，请输入“提醒我”“创建”“新增”这类指令。',
      sources: []
    }
  }

  const fallback = {
    answer: summarizeTasks(tasks),
    sources: sourcesFromTasks(tasks)
  }

  if (!getAIKey()) return fallback

  try {
    const contextTasks = tasks.slice(0, getAIChatContextLimit())
    const context = contextTasks.map((task, index) => `${index + 1}. ${taskToEmbeddingText(task)}`).join('\n\n')
    const answer = await callAIText(`Question: ${question}

Task context:
${context}

Return a helpful answer in Chinese when the question is Chinese, otherwise answer in the user's language. Mention task titles, dates, times, and locations when relevant.`)

    if (!answer) return fallback

    return {
      answer,
      sources: fallback.sources
    }
  } catch (err) {
    console.warn('AI chat unavailable, using RAG fallback', err.message)
    return fallback
  }
}

async function syncTaskVector(task) {
  if (!isRagEnabled()) return null
  if (!isVectorDBConfigured()) return null

  const vector = await createEmbedding(taskToEmbeddingText(task))
  if (!Array.isArray(vector)) return null

  return storeVector({
    id: plainTask(task).id,
    vector,
    payload: taskToVectorPayload(task)
  })
}

async function removeTaskVector(taskId) {
  if (!isRagEnabled()) return null
  if (!isVectorDBConfigured()) return null
  return deleteVector(taskId)
}

function taskToSearchText(task) {
  return [
    task.title,
    task.category,
    task.priority,
    task.location,
    task.address,
    task.note,
    task.date,
    task.status
  ].filter(Boolean).join(' ').toLowerCase()
}

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fa5]+/)
    .filter((word) => word.length > 2)
}

function searchTasks(tasks, question, limit = 5) {
  const terms = tokenize(question)
  if (!terms.length) return tasks.slice(0, limit)

  return tasks
    .map((task) => {
      const haystack = taskToSearchText(task)
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0)
      return { task, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.task)
}

function answerFromTasks(question, tasks) {
  const matches = searchTasks(tasks, question)
  if (!matches.length) {
    return {
      answer: '我没有在你的当前任务中找到相关内容。如果你想创建新任务，请输入“提醒我”“创建”“新增”这类指令。',
      sources: []
    }
  }

  return {
    answer: summarizeTasks(matches),
    sources: matches.map((task) => ({
      id: task.id,
      title: task.title,
      date: task.date,
      status: task.status
    }))
  }
}

async function answerFromTasksWithRag(question, tasks, userId) {
  if (!isRagEnabled()) {
    const matches = searchTasks(tasks, question)
    return answerWithAIFromTasks(question, matches.length ? matches : (getAIKey() ? tasks.slice(0, getAIChatContextLimit()) : matches))
  }

  if (!isVectorDBConfigured()) {
    const matches = searchTasks(tasks, question)
    return answerWithAIFromTasks(question, matches.length ? matches : (getAIKey() ? tasks.slice(0, getAIChatContextLimit()) : matches))
  }

  try {
    const vector = await createEmbedding(question)
    const hits = await searchVectors({ vector, userId, limit: 5 })
    if (hits.length) return answerWithAIFromTasks(question, tasksFromVectorHits(hits))
  } catch (err) {
    console.warn('RAG vector search failed, falling back to keyword search', err)
  }

  const matches = searchTasks(tasks, question)
  return answerWithAIFromTasks(question, matches.length ? matches : (getAIKey() ? tasks.slice(0, getAIChatContextLimit()) : matches))
}

module.exports = {
  answerFromTasksWithRag,
  answerFromVectorHits,
  classifyTask,
  createEmbedding,
  isRagEnabled,
  parseTask,
  removeTaskVector,
  summarizeTasks,
  syncTaskVector,
  answerFromTasks,
  taskToEmbeddingText,
  taskToVectorPayload,
  searchTasks
}
