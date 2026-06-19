const express = require('express')
const { User, Task } = require('../models')
const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config/config')
const { authMiddleware } = require('../middleware/auth')
const { success, error } = require('../utils/response')

const router = express.Router()

// POST /auth/login - 用户登录
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return error(res, '邮箱和密码不能为空', 400)
  }

  try {
    const user = await User.findOne({ where: { email } })
    if (!user || !(await User.comparePassword(password, user.password))) {
      return error(res, '邮箱或密码错误', 401)
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })

    // 获取用户统计数据
    const today = new Date().toISOString().split('T')[0]
    const [todayPending, totalPublished, totalCompleted] = await Promise.all([
      Task.count({ where: { userId: user.id, date: today, status: 'pending' } }),
      Task.count({ where: { userId: user.id } }),
      Task.count({ where: { userId: user.id, status: 'completed' } })
    ])

    // 获取分类统计
    const [workCount, personalCount, activityCount] = await Promise.all([
      Task.count({ where: { userId: user.id, category: 'work' } }),
      Task.count({ where: { userId: user.id, category: 'personal' } }),
      Task.count({ where: { userId: user.id, category: 'activity' } })
    ])

    const userData = {
      ...user.toSafeObject(),
      stats: {
        todayPending,
        totalPublished,
        totalCompleted
      },
      categories: {
        work: workCount,
        personal: personalCount,
        activity: activityCount
      }
    }

    return success(res, { token, user: userData }, '登录成功')
  } catch (err) {
    console.error('登录失败', err)
    return error(res, '网络异常，请稍后重试', 500)
  }
})

// POST /auth/logout - 用户登出
router.post('/logout', authMiddleware, async (req, res) => {
  // JWT 是无状态的，前端清除 token 即可
  // 这里返回成功响应，前端收到后清除本地 token
  return success(res, null, '已退出登录')
})

// POST /auth/register - 用户注册
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return error(res, '用户名、邮箱和密码不能为空', 400)
  }

  try {
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      return error(res, '邮箱已被注册', 409)
    }

    const newUser = await User.create({
      name,
      email,
      password: await User.hashPassword(password)
    })

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' })

    const userData = {
      ...newUser.toSafeObject(),
      stats: {
        todayPending: 0,
        totalPublished: 0,
        totalCompleted: 0
      },
      categories: {
        work: 0,
        personal: 0,
        activity: 0
      }
    }

    return success(res, { token, user: userData }, '注册成功', 201)
  } catch (err) {
    console.error('注册失败', err)
    return error(res, '网络异常，请稍后重试', 500)
  }
})

module.exports = router
