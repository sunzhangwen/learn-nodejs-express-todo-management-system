const request = require('supertest')
const app = require('../app')
const { sequelize, User, Task } = require('../models')

// 测试前同步数据库（使用 force: true 清空数据）
beforeAll(async () => {
  await sequelize.sync({ force: true })
})

afterAll(async () => {
  await sequelize.close()
})

describe('用户接口', () => {
  let token

  test('POST /users/register - 注册成功', async () => {
    const res = await request(app)
      .post('/users/register')
      .send({ username: 'testuser', password: '123456' })

    expect(res.status).toBe(201)
    expect(res.body.code).toBe(201)
    expect(res.body.data.username).toBe('testuser')
    expect(res.body.data.password).toBeUndefined()
  })

  test('POST /users/register - 用户名重复', async () => {
    const res = await request(app)
      .post('/users/register')
      .send({ username: 'testuser', password: '123456' })

    expect(res.status).toBe(409)
  })

  test('POST /users/register - 缺少参数', async () => {
    const res = await request(app)
      .post('/users/register')
      .send({ username: 'testuser' })

    expect(res.status).toBe(400)
  })

  test('POST /users/login - 登录成功', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ username: 'testuser', password: '123456' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    token = res.body.token
  })

  test('POST /users/login - 密码错误', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ username: 'testuser', password: 'wrong' })

    expect(res.status).toBe(401)
  })

  test('GET /users - 无 token 被拒绝', async () => {
    const res = await request(app).get('/users')
    expect(res.status).toBe(401)
  })

  test('GET /users - 有 token 查询成功', async () => {
    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toBeInstanceOf(Array)
  })
})

describe('任务接口', () => {
  let token
  let taskId

  beforeAll(async () => {
    // 注册并登录获取 token
    await request(app)
      .post('/users/register')
      .send({ username: 'taskuser', password: '123456' })
    const loginRes = await request(app)
      .post('/users/login')
      .send({ username: 'taskuser', password: '123456' })
    token = loginRes.body.token
  })

  test('POST /tasks/create - 无 token 被拒绝', async () => {
    const res = await request(app)
      .post('/tasks/create')
      .send({ title: 'test task' })

    expect(res.status).toBe(401)
  })

  test('POST /tasks/create - 创建成功', async () => {
    const res = await request(app)
      .post('/tasks/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'test task', description: 'test desc' })

    expect(res.status).toBe(201)
    expect(res.body.data.title).toBe('test task')
    taskId = res.body.data.id
  })

  test('POST /tasks/create - 缺少标题', async () => {
    const res = await request(app)
      .post('/tasks/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'no title' })

    expect(res.status).toBe(400)
  })

  test('GET /tasks/list - 查询成功', async () => {
    const res = await request(app)
      .get('/tasks/list')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toBeInstanceOf(Array)
    expect(res.body.data.length).toBeGreaterThan(0)
  })

  test('GET /tasks/:id - 查询单个任务', async () => {
    const res = await request(app)
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(taskId)
  })

  test('PUT /tasks/:id - 更新任务', async () => {
    const res = await request(app)
      .put(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ completed: true })

    expect(res.status).toBe(200)
    expect(res.body.data.completed).toBe(true)
  })

  test('DELETE /tasks/:id - 删除任务', async () => {
    const res = await request(app)
      .delete(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
  })

  test('GET /tasks/:id - 删除后查询返回 404', async () => {
    const res = await request(app)
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })
})
