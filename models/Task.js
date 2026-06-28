const { DataTypes, Model } = require('sequelize')
const sequelize = require('../config/database.js')

class Task extends Model {}

Task.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      comment: '任务唯一标识，格式 id_xxxxxxxxxx'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '任务标题'
    },
    category: {
      type: DataTypes.ENUM('work', 'personal', 'activity'),
      allowNull: false,
      comment: '分类：work/personal/activity'
    },
    startTime: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '开始时间 HH:mm'
    },
    endTime: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '结束时间 HH:mm'
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '地点'
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注'
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '日期 YYYY-MM-DD'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '状态：pending/completed'
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否重要/置顶'
    },
    userId: {
      type: DataTypes.STRING,
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
