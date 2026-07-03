const { DataTypes, Model } = require('sequelize')
const sequelize = require('../config/database.js')

class Task extends Model {}

Task.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      comment: 'Task id in id_xxxxxxxxxx format'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Task title'
    },
    category: {
      type: DataTypes.ENUM('work', 'personal', 'activity'),
      allowNull: false,
      comment: 'Task category'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
      comment: 'Task priority'
    },
    startTime: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Start time, HH:mm'
    },
    endTime: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'End time, HH:mm'
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Display location'
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Resolved address'
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Latitude'
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Longitude'
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Attachment URI list'
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Task note'
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Date, YYYY-MM-DD'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Task status'
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the task is important or pinned'
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Owner user id'
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
