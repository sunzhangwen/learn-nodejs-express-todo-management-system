require('dotenv').config()

const JWT_SECRET = process.env.JWT_SECRET
const PORT = process.env.PORT || 3000
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'
const NODE_ENV = process.env.NODE_ENV || 'development'

if (NODE_ENV === 'production' && !JWT_SECRET) {
  throw new Error('JWT_SECRET 环境变量在生产环境中必须设置')
}

module.exports = {
  JWT_SECRET: JWT_SECRET || 'dev_secret_change_me',
  PORT,
  CORS_ORIGIN,
  NODE_ENV
}
