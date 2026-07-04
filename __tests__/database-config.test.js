describe('database configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      DB_HOST: 'db.example.test',
      DB_NAME: 'todo_env_db',
      DB_USER: 'todo_env_user',
      DB_PASS: 'todo_env_pass'
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  test('config/database.js reads MySQL connection values from environment variables', () => {
    const sequelize = require('../config/database')

    expect(sequelize.config.database).toBe('todo_env_db')
    expect(sequelize.config.username).toBe('todo_env_user')
    expect(sequelize.config.password).toBe('todo_env_pass')
    expect(sequelize.config.host).toBe('db.example.test')
    expect(sequelize.getDialect()).toBe('mysql')
  })
})
