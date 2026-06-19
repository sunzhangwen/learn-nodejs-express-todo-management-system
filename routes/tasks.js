const express = require('express')
const { Task } = require('../models')
const { authMiddleware } = require('../middleware/auth')
const { success, error } = require('../utils/response')

const router = express.Router()

// GET /tasks - 获取所有任务
// GET /tasks?date={date} - 按日期获取任务
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.id
  const { date } = req.query

  try {
    const where = { userId }
    if (date) {
      where.date = date
    }

    const tasks = await Task.findAll({
      where,
      order: [['startTime', 'ASC']]
    })

    return success(res, tasks, '操作成功')
  } catch (err) {
    console.error('查询任务失败', err)
    return error(res, '网络异常，请稍后重试', 500)
  }
})

// GET /tasks/:id - 获取单个任务详情
router.get('/:id', authMiddleware, async (req, res) => {
  const taskId = req.params.id
  const userId = req.user.id

  try {
    const task = await Task.findByPk(taskId)

    if (!task) {
      return success(res, null, '操作成功')
    }

    // 验证任务归属
    if (task.userId !== userId) {
      return error(res, '无权访问该任务', 403)
    }

    return success(res, task, '操作成功')
  } catch (err) {
    console.error('查询任务失败', err)
    return error(res, '网络异常，请稍后重试', 500)
  }
})

// POST /tasks - 创建任务
router.post('/', authMiddleware, async (req, res) => {
  const userId = req.user.id
  const { title, category, startTime, endTime, location, note, date, status, isFeatured } = req.body

  // 验证必填字段
  if (!title) {
    return error(res, '任务标题不能为空', 400)
  }
  if (!category || !['work', 'personal', 'activity'].includes(category)) {
    return error(res, '分类无效，必须为 work/personal/activity', 400)
  }
  if (!startTime) {
    return error(res, '开始时间不能为空', 400)
  }
  if (!date) {
    return error(res, '日期不能为空', 400)
  }
  if (!status || !['pending', 'completed'].includes(status)) {
    return error(res, '状态无效，必须为 pending/completed', 400)
  }

  try {
    const task = await Task.create({
      title,
      category,
      startTime,
      endTime: endTime || null,
      location: location || null,
      note: note || null,
      date,
      status,
      isFeatured: isFeatured || false,
      userId
    })

    return success(res, task, '创建成功', 201)
  } catch (err) {
    console.error('创建任务失败', err)
    return error(res, '网络异常，请稍后重试', 500)
  }
})

// PUT /tasks/:id - 更新任务
router.put('/:id', authMiddleware, async (req, res) => {
  const taskId = req.params.id
  const userId = req.user.id
  const { title, category, startTime, endTime, location, note, date, status, isFeatured } = req.body

  try {
    const task = await Task.findByPk(taskId)
    if (!task) {
      return error(res, '任务不存在', 404)
    }

    // 验证任务归属
    if (task.userId !== userId) {
      return error(res, '无权修改该任务', 403)
    }

    // 验证必填字段
    if (!title) {
      return error(res, '任务标题不能为空', 400)
    }
    if (!category || !['work', 'personal', 'activity'].includes(category)) {
      return error(res, '分类无效，必须为 work/personal/activity', 400)
    }
    if (!startTime) {
      return error(res, '开始时间不能为空', 400)
    }
    if (!date) {
      return error(res, '日期不能为空', 400)
    }
    if (!status || !['pending', 'completed'].includes(status)) {
      return error(res, '状态无效，必须为 pending/completed', 400)
    }

    await task.update({
      title,
      category,
      startTime,
      endTime: endTime || null,
      location: location || null,
      note: note || null,
      date,
      status,
      isFeatured: isFeatured || false
    })

    return success(res, task, '更新成功')
  } catch (err) {
    console.error('更新任务失败', err)
    return error(res, '网络异常，请稍后重试', 500)
  }
})

// PATCH /tasks/:id/status - 更新任务状态
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const taskId = req.params.id
  const userId = req.user.id
  const { status } = req.body

  // 验证状态值
  if (!status || !['pending', 'completed'].includes(status)) {
    return error(res, '状态无效，必须为 pending/completed', 400)
  }

  try {
    const task = await Task.findByPk(taskId)
    if (!task) {
      return error(res, '任务不存在', 404)
    }

    // 验证任务归属
    if (task.userId !== userId) {
      return error(res, '无权修改该任务', 403)
    }

    await task.update({ status })

    return success(res, task, '更新成功')
  } catch (err) {
    console.error('更新任务状态失败', err)
    return error(res, '网络异常，请稍后重试', 500)
  }
})

// DELETE /tasks/:id - 删除任务
router.delete('/:id', authMiddleware, async (req, res) => {
  const taskId = req.params.id
  const userId = req.user.id

  try {
    const task = await Task.findByPk(taskId)
    if (!task) {
      return error(res, '任务不存在', 404)
    }

    // 验证任务归属
    if (task.userId !== userId) {
      return error(res, '无权删除该任务', 403)
    }

    await task.destroy()

    return success(res, { id: parseInt(taskId) }, '删除成功')
  } catch (err) {
    console.error('删除任务失败', err)
    return error(res, '网络异常，请稍后重试', 500)
  }
})

module.exports = router
