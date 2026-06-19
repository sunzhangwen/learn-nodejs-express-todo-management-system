# Node.js Express 日程 Todo 后端系统

基于 Node.js + Express + Sequelize + MySQL 的日程管理后端 API，支持用户认证和任务管理。

## 1. 项目简介

本项目是一个日程 Todo 管理系统的后端服务，提供完整的 RESTful API，支持：

- 用户注册、登录、登出（bcrypt 密码哈希 + JWT 认证）
- 任务 CRUD 操作（创建、查询、更新、删除）
- 按日期筛选任务
- 任务状态管理（pending/completed）
- 用户信息及统计数据
- 统一响应格式

## 2. 技术栈

| 依赖 | 版本 | 用途 |
|------|------|------|
| express | ^5.2.1 | Web 框架 |
| sequelize | ^6.37.8 | ORM |
| mysql2 | ^3.22.4 | MySQL 驱动 |
| cors | ^2.8.6 | 跨域配置 |
| jsonwebtoken | ^9.0.2 | JWT 认证 |
| bcrypt | ^6.0.0 | 密码哈希 |
| dotenv | ^16.x | 环境变量加载 |

开发依赖：

| 依赖 | 用途 |
|------|------|
| jest | 测试框架 |
| supertest | HTTP 接口测试 |

## 3. 项目目录结构

```
├── config/
│   ├── database.js          # Sequelize MySQL 连接配置（已 gitignore）
│   ├── database.example.js  # 数据库配置模板
│   └── config.js            # 环境变量集中管理
├── models/
│   ├── index.js             # 模型关联与同步入口
│   ├── Task.js              # 任务模型定义
│   └── User.js              # 用户模型定义（bcrypt 密码哈希）
├── routes/
│   ├── auth.js              # 认证路由（登录、注册、登出）
│   ├── tasks.js             # 任务管理路由（JWT 保护 + 权限校验）
│   └── users.js             # 用户信息路由
├── middleware/
│   └── auth.js              # JWT 鉴权中间件
├── utils/
│   └── response.js          # 统一响应格式工具
├── __tests__/
│   └── api.test.js          # API 接口测试
├── app.js                   # Express 应用实例（独立导出，供测试引用）
├── main_index.js            # 服务启动入口
├── TEST_GUIDE.md            # 接口测试指南（含 SQL 和 curl 示例）
├── .env.example             # 环境变量模板
├── .gitignore
├── package.json
└── README.md
```

## 4. 安装与启动

### 4.1 安装依赖

```bash
npm install
```

### 4.2 配置环境变量

复制配置模板并按实际情况修改：

```bash
# 数据库配置
cp config/database.example.js config/database.js

# 环境变量
cp .env.example .env
```

`.env` 文件说明：

| 变量 | 必填 | 说明 |
|------|------|------|
| JWT_SECRET | 生产环境必填 | JWT 签名密钥 |
| PORT | 否 | 服务端口，默认 3000 |
| CORS_ORIGIN | 否 | 允许的跨域源，逗号分隔，默认 `*` |
| NODE_ENV | 否 | 运行环境，默认 `development` |

### 4.3 准备数据库

确保 MySQL 已运行，并创建数据库：

```sql
CREATE DATABASE IF NOT EXISTS js_test DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> 详细的数据库初始化和测试数据请参考 [TEST_GUIDE.md](./TEST_GUIDE.md)

### 4.4 启动服务

```bash
# 生产模式
npm start

# 开发模式（自动重启）
npm run dev
```

服务默认监听：`http://localhost:3000`

## 5. 接口概览

**基础路径**: `/api`

**统一响应格式**:
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 认证接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 否 |
| POST | `/api/auth/login` | 用户登录 | 否 |
| POST | `/api/auth/logout` | 用户登出 | 是 |

### 用户接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/user/profile` | 获取用户信息（含统计） | 是 |

### 任务接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/tasks` | 获取所有任务 | 是 |
| GET | `/api/tasks?date=YYYY-MM-DD` | 按日期获取任务 | 是 |
| GET | `/api/tasks/:id` | 获取单个任务 | 是 |
| POST | `/api/tasks` | 创建任务 | 是 |
| PUT | `/api/tasks/:id` | 更新任务 | 是 |
| PATCH | `/api/tasks/:id/status` | 更新任务状态 | 是 |
| DELETE | `/api/tasks/:id` | 删除任务 | 是 |

> 详细的接口参数和测试示例请参考 [TEST_GUIDE.md](./TEST_GUIDE.md)

## 6. 数据模型

### User（用户）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 主键，自增 |
| name | string | 用户名 |
| email | string | 邮箱（唯一） |
| password | string | 密码（bcrypt 加密） |
| avatar | string/null | 头像 URL |

### Task（任务）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 主键，自增 |
| title | string | 任务标题 |
| category | enum | 分类：work/personal/activity |
| startTime | string | 开始时间 HH:mm |
| endTime | string | 结束时间 HH:mm |
| location | string | 地点 |
| note | string | 备注 |
| date | string | 日期 YYYY-MM-DD |
| status | enum | 状态：pending/completed |
| isFeatured | boolean | 是否重要 |
| userId | integer | 用户 ID（外键） |

## 7. 安全机制

| 机制 | 说明 |
|------|------|
| 密码存储 | 使用 bcrypt 加盐哈希（10 轮） |
| JWT 认证 | 登录签发 7 天有效期 token |
| JWT 密钥 | 从环境变量 `JWT_SECRET` 读取，生产环境强制要求设置 |
| CORS | 通过 `CORS_ORIGIN` 环境变量控制允许的源 |
| 任务权限 | 创建任务从 token 取 userId，更新/删除验证任务归属 |
| 敏感配置 | `database.js` 和 `.env` 已加入 `.gitignore` |

## 8. 测试

### 运行自动化测试

```bash
npm test
```

测试覆盖：

- 认证接口（注册、登录、登出）
- 用户信息接口
- 任务 CRUD（创建、列表、查询、更新、删除）
- 日期筛选
- 状态更新
- 权限校验

### 手动测试

详细的接口测试指南（含数据库初始化 SQL 和 curl 示例）请参考：

📄 **[TEST_GUIDE.md](./TEST_GUIDE.md)**

## 9. 备注

- 数据库配置文件 `config/database.js` 包含真实凭据，已加入 `.gitignore` 不会提交
- 首次使用请复制 `config/database.example.js` 为 `config/database.js` 并填入真实配置
- 生产环境务必设置 `JWT_SECRET` 环境变量
- 生产环境建议将 `CORS_ORIGIN` 设置为具体的前端域名
