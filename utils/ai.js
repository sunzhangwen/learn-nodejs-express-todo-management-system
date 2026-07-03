const DEFAULT_MODEL = process.env.AI_MODEL || 'gpt-4o-mini'

const CATEGORIES = ['work', 'personal', 'activity']
const PRIORITIES = ['low', 'medium', 'high']

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
  if (!process.env.OPENAI_API_KEY || typeof fetch !== 'function') {
    return null
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'Return compact JSON only. Do not include markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 600
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`)
  }

  const payload = await response.json()
  const content = payload.choices?.[0]?.message?.content || '{}'
  return JSON.parse(stripJsonFence(content))
}

async function classifyTask({ title = '', note = '' }) {
  const text = `${title} ${note}`.trim()
  const fallback = {
    category: pickCategory(text),
    priority: pickPriority(text),
    isFeatured: pickPriority(text) === 'high',
    reason: 'Suggested from task keywords and deadline hints.'
  }

  const result = await callOpenAIJson(`Classify this todo task.
Allowed category values: ${CATEGORIES.join(', ')}.
Allowed priority values: ${PRIORITIES.join(', ')}.
Return JSON with category, priority, isFeatured, reason.
Task: ${text}`)

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
  const classification = await classifyTask({ title: text })
  const fallback = {
    title: text.replace(/\b(tomorrow|today|at|remind me to)\b/gi, '').trim() || text,
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

  const result = await callOpenAIJson(`Parse a natural language todo into JSON.
Allowed category values: ${CATEGORIES.join(', ')}.
Allowed priority values: ${PRIORITIES.join(', ')}.
Return title, category, priority, startTime, endTime, location, note, date, status, isFeatured.
Use YYYY-MM-DD for date and HH:mm for times.
Text: ${text}`)

  if (!result) return fallback

  return {
    ...fallback,
    ...result,
    category: CATEGORIES.includes(result.category) ? result.category : fallback.category,
    priority: PRIORITIES.includes(result.priority) ? result.priority : fallback.priority,
    status: result.status === 'completed' ? 'completed' : 'pending'
  }
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

module.exports = {
  classifyTask,
  parseTask,
  summarizeTasks,
  answerFromTasks,
  searchTasks
}
