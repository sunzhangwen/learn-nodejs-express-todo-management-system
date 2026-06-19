const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config/config')

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const match = authHeader.match(/^Bearer\s+(.*)$/i)
  if (!match) {
    return res.status(401).json({ success: false, data: null, message: '未提供授权 token' })
  }

  const token = match[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    return next()
  } catch (err) {
    return res.status(401).json({ success: false, data: null, message: '无效或过期的 token' })
  }
}

module.exports = { authMiddleware }
