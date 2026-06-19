const app = require('./app')
const { syncDB } = require('./models/index.js')
const { PORT } = require('./config/config')

const startServer = async () => {
  await syncDB()
  app.listen(PORT, () => {
    console.log(`服务器已启动，端口: ${PORT}`)
  })
}

startServer().catch((error) => {
  console.error('服务启动失败', error)
  process.exit(1)
})
