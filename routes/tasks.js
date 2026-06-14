const express = require('express')
const { Task, User } = require('../models')

const router = express.Router()
const { authMiddleware } = require('../middleware/auth')

router.post('/create', authMiddleware, async (req, res) => {
  const { title, description, userId } = req.body

  if (!title) {
    return res.status(400).json({ code: 400, msg: '任务标题不能为空' })
  }

  if (!userId) {
    return res.status(400).json({ code: 400, msg: 'userId 不能为空' })
  }

  try {
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ code: 404, msg: '用户不存在' })
    }

    const task = await Task.create({ title, description, userId })
    res.status(201).json({ code: 201, msg: '任务创建成功', data: task })
  } catch (error) {
    console.error('创建任务失败', error)
    res.status(500).json({ code: 500, msg: '创建任务失败' })
  }
})

router.get('/list', authMiddleware, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 20)
  const offset = (page - 1) * limit
  const userId = req.query.userId ? parseInt(req.query.userId, 10) : undefined

  const where = {}
  if (userId) {
    where.userId = userId
  }

  try {
    const tasks = await Task.findAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username']
        }
      ]
    })

    res.json({ code: 200, msg: '查询成功', data: tasks })
  } catch (error) {
    console.error('查询任务失败', error)
    res.status(500).json({ code: 500, msg: '查询任务失败' })
  }
})

router.get('/:id', authMiddleware, async (req, res) => {
  const taskId = req.params.id

  try {
    const task = await Task.findByPk(taskId, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username']
        }
      ]
    })

    if (!task) {
      return res.status(404).json({ code: 404, msg: '任务未找到' })
    }

    res.json({ code: 200, msg: '查询成功', data: task })
  } catch (error) {
    console.error('查询任务失败', error)
    res.status(500).json({ code: 500, msg: '查询任务失败' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  const taskId = req.params.id
  const { title, description, completed } = req.body

  try {
    const task = await Task.findByPk(taskId)
    if (!task) {
      return res.status(404).json({ code: 404, msg: '任务未找到' })
    }

    const updates = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (completed !== undefined) updates.completed = Boolean(completed)

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ code: 400, msg: '没有提供可更新的字段' })
    }

    await task.update(updates)
    res.json({ code: 200, msg: '更新成功', data: task })
  } catch (error) {
    console.error('更新任务失败', error)
    res.status(500).json({ code: 500, msg: '更新任务失败' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  const taskId = req.params.id

  try {
    const task = await Task.findByPk(taskId)
    if (!task) {
      return res.status(404).json({ code: 404, msg: '任务未找到' })
    }

    await task.destroy()
    res.json({ code: 200, msg: '删除成功' })
  } catch (error) {
    console.error('删除任务失败', error)
    res.status(500).json({ code: 500, msg: '删除任务失败' })
  }
})

module.exports = router