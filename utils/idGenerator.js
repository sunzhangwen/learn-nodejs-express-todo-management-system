const crypto = require('crypto')

const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const ID_LENGTH = 10
const PREFIX = 'id_'
const MAX_RETRIES = 5

/**
 * 生成随机 ID，格式: id_ + 10位随机字母数字
 */
function generateId() {
  let id = PREFIX
  const bytes = crypto.randomBytes(ID_LENGTH)
  for (let i = 0; i < ID_LENGTH; i++) {
    id += CHARS[bytes[i] % CHARS.length]
  }
  return id
}

/**
 * 生成唯一 ID：先查询数据库确认不存在，再返回。
 * @param {object} Model - Sequelize 模型
 * @returns {Promise<string>} 唯一 ID
 */
async function generateUniqueId(Model) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    const id = generateId()
    const existing = await Model.findOne({ where: { id } })
    if (!existing) {
      return id
    }
  }
  throw new Error('无法生成唯一 ID，请重试')
}

module.exports = { generateId, generateUniqueId }
