const express = require('express')
const cors = require('cors')
const { syncDB } = require('./models/index.js')
const userRouter = require('./routes/users.js')
const taskRouter = require('./routes/tasks.js')

const app = express()

app.use(express.json())
app.use(cors({ origin: '*' }))

app.use('/users', userRouter)
app.use('/task', taskRouter)

const startServer = async () => {
  await syncDB()
  const port = 3000
  app.listen(port, () => {
    console.log(`服务器已启动，端口: ${port}`)
  })
}

startServer().catch((error) => {
  console.error('服务启动失败', error)
  process.exit(1)
})
