/**
 * 统一响应格式工具函数
 */

/**
 * 成功响应
 * @param {object} res - Express response 对象
 * @param {any} data - 业务数据
 * @param {string} message - 提示信息
 * @param {number} statusCode - HTTP 状态码
 */
function success(res, data = null, message = '操作成功', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  })
}

/**
 * 错误响应
 * @param {object} res - Express response 对象
 * @param {string} message - 错误描述信息
 * @param {number} statusCode - HTTP 状态码
 */
function error(res, message = '操作失败', statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    message
  })
}

module.exports = {
  success,
  error
}
