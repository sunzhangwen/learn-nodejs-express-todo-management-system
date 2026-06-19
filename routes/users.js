const express = require('express')
const { User, Task } = require('../models')
const { authMiddleware } = require('../middleware/auth')
const { success, error } = require('../utils/response')

const router = express.Router()

// GET /user/profile - 获取用户信息
router.get('/profile', authMiddleware, async (req, res) => {
  const userId = req.user.id

  try {
    const user = await User.findByPk(userId)
    if (!user) {
      return error(res, '用户不存在', 404)
    }

    // 获取用户统计数据
    const today = new Date().toISOString().split('T')[0]
    const [todayPending, totalPublished, totalCompleted] = await Promise.all([
      Task.count({ where: { userId, date: today, status: 'pending' } }),
      Task.count({ where: { userId } }),
      Task.count({ where: { userId, status: 'completed' } })
    ])

    // 获取分类统计
    const [workCount, personalCount, activityCount] = await Promise.all([
      Task.count({ where: { userId, category: 'work' } }),
      Task.count({ where: { userId, category: 'personal' } }),
      Task.count({ where: { userId, category: 'activity' } })
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

    return success(res, userData, '操作成功')
  } catch (err) {
    console.error('查询用户信息失败', err)
    return error(res, '网络异常，请稍后重试', 500)
  }
})

module.exports = router
