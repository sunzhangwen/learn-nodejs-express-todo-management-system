const sequelize = require('../config/database.js')
const User = require('./User')
const Task = require('./Task')

User.hasMany(Task, { foreignKey: 'userId', as: 'tasks' })
Task.belongsTo(User, { foreignKey: 'userId', as: 'owner' })

const syncDB = async () => {
  try {
    await sequelize.sync({ force: false })
    console.log('数据表同步成功')
  } catch (error) {
    console.error('数据库同步失败', error)
    throw error
  }
}

module.exports = {
  sequelize,
  User,
  Task,
  syncDB
}
