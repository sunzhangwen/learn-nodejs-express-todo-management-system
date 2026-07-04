const express = require('express')
const { Task } = require('../models')
const { authMiddleware } = require('../middleware/auth')
const { success, error } = require('../utils/response')
const { generateUniqueId } = require('../utils/idGenerator')
const { removeTaskVector, syncTaskVector } = require('../utils/ai')

const router = express.Router()

const CATEGORIES = ['work', 'personal', 'activity']
const PRIORITIES = ['low', 'medium', 'high']
const STATUSES = ['pending', 'completed']

function validateTaskPayload(body) {
  if (!body.title) return 'Task title is required'
  if (!body.category || !CATEGORIES.includes(body.category)) {
    return 'Category must be work, personal, or activity'
  }
  if (body.priority && !PRIORITIES.includes(body.priority)) {
    return 'Priority must be low, medium, or high'
  }
  if (!body.startTime) return 'Start time is required'
  if (!body.date) return 'Date is required'
  if (!body.status || !STATUSES.includes(body.status)) {
    return 'Status must be pending or completed'
  }
  if (body.attachments && !Array.isArray(body.attachments)) {
    return 'Attachments must be an array'
  }
  return null
}

function toTaskFields(body) {
  return {
    title: body.title,
    category: body.category,
    priority: body.priority || 'medium',
    startTime: body.startTime,
    endTime: body.endTime || null,
    location: body.location || null,
    address: body.address || null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    attachments: Array.isArray(body.attachments) ? body.attachments : [],
    note: body.note || null,
    date: body.date,
    status: body.status,
    isFeatured: Boolean(body.isFeatured)
  }
}

async function findOwnedTask(taskId, userId) {
  const task = await Task.findByPk(taskId)
  if (!task) return null
  if (task.userId !== userId) return false
  return task
}

router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.id
  const { date } = req.query

  try {
    const where = { userId }
    if (date) where.date = date

    const tasks = await Task.findAll({
      where,
      order: [['startTime', 'ASC']]
    })

    return success(res, tasks, 'Success')
  } catch (err) {
    console.error('Failed to query tasks', err)
    return error(res, 'Network error, please try again later', 500)
  }
})

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await findOwnedTask(req.params.id, req.user.id)
    if (task === false) return error(res, 'Forbidden', 403)
    return success(res, task, 'Success')
  } catch (err) {
    console.error('Failed to query task', err)
    return error(res, 'Network error, please try again later', 500)
  }
})

router.post('/', authMiddleware, async (req, res) => {
  const validationError = validateTaskPayload(req.body)
  if (validationError) return error(res, validationError, 400)

  try {
    const task = await Task.create({
      id: await generateUniqueId(Task),
      ...toTaskFields(req.body),
      userId: req.user.id
    })

    syncTaskVector(task).catch((err) => {
      console.warn('Failed to sync task vector after create', err)
    })

    return success(res, task, 'Created', 201)
  } catch (err) {
    console.error('Failed to create task', err)
    return error(res, 'Network error, please try again later', 500)
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  const validationError = validateTaskPayload(req.body)
  if (validationError) return error(res, validationError, 400)

  try {
    const task = await findOwnedTask(req.params.id, req.user.id)
    if (!task) return error(res, 'Task not found', task === false ? 403 : 404)

    await task.update(toTaskFields(req.body))
    syncTaskVector(task).catch((err) => {
      console.warn('Failed to sync task vector after update', err)
    })
    return success(res, task, 'Updated')
  } catch (err) {
    console.error('Failed to update task', err)
    return error(res, 'Network error, please try again later', 500)
  }
})

router.patch('/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body
  if (!status || !STATUSES.includes(status)) {
    return error(res, 'Status must be pending or completed', 400)
  }

  try {
    const task = await findOwnedTask(req.params.id, req.user.id)
    if (!task) return error(res, 'Task not found', task === false ? 403 : 404)

    await task.update({ status })
    syncTaskVector(task).catch((err) => {
      console.warn('Failed to sync task vector after status update', err)
    })
    return success(res, task, 'Updated')
  } catch (err) {
    console.error('Failed to update task status', err)
    return error(res, 'Network error, please try again later', 500)
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await findOwnedTask(req.params.id, req.user.id)
    if (!task) return error(res, 'Task not found', task === false ? 403 : 404)

    await task.destroy()
    removeTaskVector(req.params.id).catch((err) => {
      console.warn('Failed to delete task vector', err)
    })
    return success(res, { id: req.params.id }, 'Deleted')
  } catch (err) {
    console.error('Failed to delete task', err)
    return error(res, 'Network error, please try again later', 500)
  }
})

module.exports = router
