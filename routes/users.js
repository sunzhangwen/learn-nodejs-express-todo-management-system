const express = require('express')
const { User } = require('../models')

const router = express.Router()

router.get('/hello', (req, res) => {
  res.json({
    message: 'hello user'
  })
})

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 20)
  const offset = (page - 1) * limit

  try {
    const users = await User.findAll({
      offset,
      limit,
      attributes: ['id', 'username', 'createdAt', 'updatedAt']
    })

    res.json({
      code: 200,
      msg: '查询成功',
      data: users
    })
  } catch (error) {
    console.error('查询用户失败', error)
    res.status(500).json({ code: 500, msg: '查询用户失败' })
  }
})

router.post('/register', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ code: 400, msg: '用户名和密码不能为空' })
  }

  try {
    const existingUser = await User.findOne({ where: { username } })
    if (existingUser) {
      return res.status(409).json({ code: 409, msg: '用户名已存在' })
    }

    const newUser = await User.create({
      username,
      password: User.hashPassword(password)
    })

    res.status(201).json({
      code: 201,
      msg: '注册成功',
      data: newUser.toSafeObject()
    })
  } catch (error) {
    console.error('注册失败', error)
    res.status(500).json({ code: 500, msg: '注册失败' })
  }
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ code: 400, msg: '用户名和密码不能为空' })
  }

  try {
    const user = await User.findOne({ where: { username } })
    if (!user || user.password !== User.hashPassword(password)) {
      return res.status(401).json({ code: 401, msg: '用户名或密码错误' })
    }

    res.json({
      code: 200,
      msg: '登录成功',
      data: user.toSafeObject()
    })
  } catch (error) {
    console.error('登录失败', error)
    res.status(500).json({ code: 500, msg: '登录失败' })
  }
})

module.exports = router