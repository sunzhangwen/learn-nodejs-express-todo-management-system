const { DataTypes, Model } = require('sequelize')
const sequelize = require('../config/database.js')
const bcrypt = require('bcrypt')

const SALT_ROUNDS = 10

class User extends Model {
  static async hashPassword(plainPassword) {
    return bcrypt.hash(plainPassword, SALT_ROUNDS)
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword)
  }

  // 返回不包含敏感字段的用户信息
  toSafeObject() {
    const { id, name, email, avatar, createdAt, updatedAt } = this
    return { id, name, email, avatar, createdAt, updatedAt }
  }
}

User.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '用户名'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: '邮箱'
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '密码'
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '头像 URL'
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