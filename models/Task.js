const { DataTypes, Model } = require('sequelize')
const sequelize = require('../config/database.js')

class Task extends Model {}

Task.init(
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '任务标题'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '任务描述'
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '任务是否完成'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '任务所属用户 ID'
    }
  },
  {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks',
    timestamps: true
  }
)

module.exports = Task
