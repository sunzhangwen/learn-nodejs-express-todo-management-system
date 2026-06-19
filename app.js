const express = require('express')
const cors = require('cors')
const userRouter = require('./routes/users.js')
const taskRouter = require('./routes/tasks.js')
const { CORS_ORIGIN } = require('./config/config')

const app = express()

app.use(express.json())

// CORS 配置：从环境变量读取允许的源
const corsOptions = CORS_ORIGIN === '*'
  ? { origin: '*' }
  : { origin: CORS_ORIGIN.split(',').map(s => s.trim()) }
app.use(cors(corsOptions))

app.use('/users', userRouter)
app.use('/tasks', taskRouter)

module.exports = app
