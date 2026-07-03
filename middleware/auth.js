const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config/config')
const { User } = require('../models')

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const match = authHeader.match(/^Bearer\s+(.*)$/i)
  if (!match) {
    return res.status(401).json({ success: false, data: null, message: '未提供授权 token' })
  }

  try {
    const payload = jwt.verify(match[1], JWT_SECRET)
    const user = await User.findByPk(payload.id)
    if (!user) {
      return res.status(401).json({ success: false, data: null, message: '用户不存在，请重新登录' })
    }

    req.user = payload
    return next()
  } catch (err) {
    return res.status(401).json({ success: false, data: null, message: '无效或过期的 token' })
  }
}

module.exports = { authMiddleware }
