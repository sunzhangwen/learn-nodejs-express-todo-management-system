const { DataTypes, Model } = require('sequelize')
const sequelize = require('../config/database.js')
const crypto = require('node:crypto')

class User extends Model {
  static hashPassword(plainPassword) {
    return crypto.createHash('sha256').update(plainPassword).digest('hex')
  }

//   // 将 Date 转换为中国标准时间（CST, UTC+8）的字符串：YYYY-MM-DD HH:mm:ss
//   static formatDateToCST(date) {
//     if (!date) return null
//     const d = date instanceof Date ? date : new Date(date)
//     // 将时间戳加 8 小时（中国时区为 UTC+8），然后格式化为字符串
//     const ms = d.getTime() + 8 * 3600 * 1000
//     const cst = new Date(ms).toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')
//     return cst
//   }

  // 返回不包含敏感字段的用户信息，并将 createdAt/updatedAt 转为北京时间字符串
  toSafeObject() {
    const { id, username, createdAt, updatedAt } = this
    // const { id, username } = this
    // const createdAt = User.formatDateToCST(this.createdAt)
    // const updatedAt = User.formatDateToCST(this.updatedAt)
    return { id, username, createdAt, updatedAt }
  }
}

User.init(
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: '用户名'
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '密码'
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true
  }
)

module.exports = User