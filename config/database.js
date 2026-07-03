require('dotenv').config()

const { Sequelize } = require('sequelize')

const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_NAME = process.env.DB_NAME
const DB_USER = process.env.DB_USER
const DB_PASS = process.env.DB_PASS
const DB_DIALECT = process.env.DB_DIALECT || 'mysql'

if (!DB_NAME || !DB_USER) {
  throw new Error('DB_NAME and DB_USER environment variables are required')
}

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS || '', {
  host: DB_HOST,
  dialect: DB_DIALECT,
  logging: false
})

module.exports = sequelize
