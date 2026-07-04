const express = require('express')
const { Task } = require('../models')
const { authMiddleware } = require('../middleware/auth')
const { success, error } = require('../utils/response')
const {
  answerFromTasksWithRag,
  classifyTask,
  parseTask,
  summarizeTasks
} = require('../utils/ai')

const router = express.Router()

router.post('/classify', authMiddleware, async (req, res) => {
  const { title, note, taskDescription } = req.body
  const inputTitle = title || taskDescription
  if (!inputTitle && !note) {
    return error(res, 'title or note is required', 400)
  }

  try {
    const result = await classifyTask({ title: inputTitle || '', note: note || '' })
    return success(res, result, 'AI classification completed')
  } catch (err) {
    console.error('AI classify failed', err)
    return error(res, 'AI service failed, please try again later', 500)
  }
})

router.post('/parse-task', authMiddleware, async (req, res) => {
  const { text } = req.body
  if (!text || !text.trim()) {
    return error(res, 'text is required', 400)
  }

  try {
    const result = await parseTask(text.trim())
    return success(res, result, 'Task draft generated')
  } catch (err) {
    console.error('AI parse task failed', err)
    return error(res, 'AI service failed, please try again later', 500)
  }
})

router.post('/summarize', authMiddleware, async (req, res) => {
  const { taskId, date } = req.body
  if (!taskId && !date) {
    return error(res, 'taskId or date is required', 400)
  }

  try {
    const where = { userId: req.user.id }
    if (taskId) where.id = taskId
    if (date) where.date = date

    const tasks = await Task.findAll({ where, order: [['startTime', 'ASC']] })
    if (taskId && tasks.length === 0) {
      return error(res, 'Task not found', 404)
    }

    return success(res, { summary: summarizeTasks(tasks) }, 'Task summary generated')
  } catch (err) {
    console.error('AI summarize failed', err)
    return error(res, 'AI service failed, please try again later', 500)
  }
})

router.post('/chat', authMiddleware, async (req, res) => {
  const { question } = req.body
  if (!question || !question.trim()) {
    return error(res, 'question is required', 400)
  }

  try {
    const tasks = await Task.findAll({
      where: { userId: req.user.id },
      order: [['date', 'ASC'], ['startTime', 'ASC']]
    })
    const result = await answerFromTasksWithRag(question.trim(), tasks, req.user.id)
    return success(res, result, 'AI chat completed')
  } catch (err) {
    console.error('AI chat failed', err)
    return error(res, 'AI service failed, please try again later', 500)
  }
})

module.exports = router
