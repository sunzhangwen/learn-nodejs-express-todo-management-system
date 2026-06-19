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

describe('认证接口', () => {
  let token

  test('POST /api/auth/register - 注册成功', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'testuser', email: 'test@example.com', password: '123456' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.user.name).toBe('testuser')
    expect(res.body.data.user.email).toBe('test@example.com')
    expect(res.body.data.user.password).toBeUndefined()
    expect(res.body.data.token).toBeDefined()
  })

  test('POST /api/auth/register - 邮箱重复', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'testuser2', email: 'test@example.com', password: '123456' })

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
  })

  test('POST /api/auth/register - 缺少参数', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'testuser' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  test('POST /api/auth/login - 登录成功', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: '123456' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBeDefined()
    expect(res.body.data.user.name).toBe('testuser')
    expect(res.body.data.user.stats).toBeDefined()
    expect(res.body.data.user.categories).toBeDefined()
    token = res.body.data.token
  })

  test('POST /api/auth/login - 密码错误', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  test('POST /api/auth/logout - 登出成功', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('已退出登录')
  })
})

describe('用户接口', () => {
  let token

  beforeAll(async () => {
    // 登录获取 token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: '123456' })
    token = loginRes.body.data.token
  })

  test('GET /api/user/profile - 无 token 被拒绝', async () => {
    const res = await request(app).get('/api/user/profile')
    expect(res.status).toBe(401)
  })

  test('GET /api/user/profile - 获取用户信息', async () => {
    const res = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe('testuser')
    expect(res.body.data.email).toBe('test@example.com')
    expect(res.body.data.stats).toBeDefined()
    expect(res.body.data.stats.todayPending).toBeDefined()
    expect(res.body.data.stats.totalPublished).toBeDefined()
    expect(res.body.data.stats.totalCompleted).toBeDefined()
    expect(res.body.data.categories).toBeDefined()
    expect(res.body.data.categories.work).toBeDefined()
    expect(res.body.data.categories.personal).toBeDefined()
    expect(res.body.data.categories.activity).toBeDefined()
  })
})

describe('任务接口', () => {
  let token
  let taskId

  beforeAll(async () => {
    // 登录获取 token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: '123456' })
    token = loginRes.body.data.token
  })

  test('POST /api/tasks - 无 token 被拒绝', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'test task' })

    expect(res.status).toBe(401)
  })

  test('POST /api/tasks - 创建任务成功', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '测试任务',
        category: 'work',
        startTime: '09:00',
        endTime: '10:00',
        location: '会议室A',
        note: '准备PPT',
        date: '2026-06-18',
        status: 'pending',
        isFeatured: false
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('测试任务')
    expect(res.body.data.category).toBe('work')
    expect(res.body.data.startTime).toBe('09:00')
    expect(res.body.data.date).toBe('2026-06-18')
    expect(res.body.data.status).toBe('pending')
    taskId = res.body.data.id
  })

  test('POST /api/tasks - 缺少必填字段', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'test task' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  test('GET /api/tasks - 获取所有任务', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toBeInstanceOf(Array)
    expect(res.body.data.length).toBeGreaterThan(0)
  })

  test('GET /api/tasks?date=2026-06-18 - 按日期筛选', async () => {
    const res = await request(app)
      .get('/api/tasks?date=2026-06-18')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toBeInstanceOf(Array)
    expect(res.body.data.length).toBeGreaterThan(0)
    expect(res.body.data[0].date).toBe('2026-06-18')
  })

  test('GET /api/tasks/:id - 获取单个任务', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.id).toBe(taskId)
  })

  test('PUT /api/tasks/:id - 更新任务', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '更新后的任务',
        category: 'personal',
        startTime: '14:00',
        endTime: '15:00',
        location: '家里',
        note: '更新备注',
        date: '2026-06-19',
        status: 'completed',
        isFeatured: true
      })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('更新后的任务')
    expect(res.body.data.status).toBe('completed')
  })

  test('PATCH /api/tasks/:id/status - 更新任务状态', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'pending' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe('pending')
  })

  test('DELETE /api/tasks/:id - 删除任务', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.id).toBe(taskId)
  })

  test('GET /api/tasks/:id - 删除后查询返回 null', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toBeNull()
  })
})
