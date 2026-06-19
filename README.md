# Node.js Express Todos Management System

简洁专业的 Node.js + Express + Sequelize MySQL 后端项目，支持用户管理和任务管理 RESTful API。

## 1. 项目简介

该项目使用 Express 提供 RESTful API，使用 Sequelize 连接 MySQL 数据库并自动同步表结构。

功能模块：

- 用户注册、登录（bcrypt 密码哈希 + JWT 认证）
- 用户列表查询（需认证）
- 任务 CRUD 操作（需认证，含权限校验）
- 环境变量集中管理，敏感配置隔离

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
│   ├── tasks.js             # 任务管理路由（JWT 保护 + 权限校验）
│   └── users.js             # 用户管理路由
├── middleware/
│   └── auth.js              # JWT 鉴权中间件
├── __tests__/
│   └── api.test.js          # API 接口测试
├── app.js                   # Express 应用实例（独立导出，供测试引用）
├── main_index.js            # 服务启动入口
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
CREATE DATABASE IF NOT EXISTS js_test_db;
```

### 4.4 启动服务

```bash
# 生产模式
npm start

# 开发模式（自动重启）
npm run dev
```

服务默认监听：`http://localhost:3000`

## 5. 接口文档

### 5.1 用户模块

#### 注册用户

- **POST** `/users/register`
- 无需 token

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

成功响应（201）：

```json
{
  "code": 201,
  "msg": "注册成功",
  "data": { "id": 1, "username": "alice", "createdAt": "...", "updatedAt": "..." }
}
```

失败响应：400（参数缺失）、409（用户名已存在）

#### 用户登录

- **POST** `/users/login`
- 无需 token

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

成功响应（200）：

```json
{
  "code": 200,
  "msg": "登录成功",
  "data": { "id": 1, "username": "alice", "createdAt": "...", "updatedAt": "..." },
  "token": "<JWT_TOKEN>"
}
```

失败响应：400（参数缺失）、401（用户名或密码错误）

#### 查询用户列表

- **GET** `/users?page=1&limit=20`
- 需要 token：`Authorization: Bearer <token>`

成功响应（200）：

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": [{ "id": 1, "username": "alice", "createdAt": "...", "updatedAt": "..." }]
}
```

### 5.2 任务模块

所有任务接口均需要 token：`Authorization: Bearer <token>`

任务操作（查询、更新、删除）会验证任务归属，只能操作自己的任务。

#### 创建任务

- **POST** `/tasks/create`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 任务标题 |
| description | string | 否 | 任务描述 |

> userId 自动从 JWT token 中获取，无需客户端传入。

成功响应（201）：

```json
{
  "code": 201,
  "msg": "任务创建成功",
  "data": { "id": 1, "title": "编写文档", "description": "...", "completed": false, "userId": 1, "createdAt": "...", "updatedAt": "..." }
}
```

#### 查询任务列表

- **GET** `/tasks/list?page=1&limit=20`
- 只返回当前登录用户的任务

成功响应（200）：

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": [
    {
      "id": 1,
      "title": "编写文档",
      "description": "...",
      "completed": false,
      "userId": 1,
      "createdAt": "...",
      "updatedAt": "...",
      "owner": { "id": 1, "username": "alice" }
    }
  ]
}
```

#### 查询单个任务

- **GET** `/tasks/:id`
- 非本人任务返回 403

#### 更新任务

- **PUT** `/tasks/:id`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 否 | 任务标题 |
| description | string | 否 | 任务描述 |
| completed | boolean | 否 | 是否完成 |

非本人任务返回 403。

#### 删除任务

- **DELETE** `/tasks/:id`
- 非本人任务返回 403

### 5.3 响应状态码汇总

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 参数错误 |
| 401 | 未认证或 token 无效 |
| 403 | 无权操作 |
| 404 | 资源不存在 |
| 409 | 冲突（用户名已存在） |
| 500 | 服务器内部错误 |

## 6. 安全机制

| 机制 | 说明 |
|------|------|
| 密码存储 | 使用 bcrypt 加盐哈希（10 轮） |
| JWT 认证 | 登录签发 7 天有效期 token |
| JWT 密钥 | 从环境变量 `JWT_SECRET` 读取，生产环境强制要求设置 |
| CORS | 通过 `CORS_ORIGIN` 环境变量控制允许的源 |
| 任务权限 | 创建任务从 token 取 userId，更新/删除验证任务归属 |
| 敏感配置 | `database.js` 和 `.env` 已加入 `.gitignore` |

## 7. 测试

```bash
npm test
```

测试覆盖：

- 用户注册（成功、重复、缺参）
- 用户登录（成功、密码错误）
- 用户列表认证
- 任务 CRUD（创建、列表、查询、更新、删除）
- 任务权限校验

## 8. 备注

- 数据库配置文件 `config/database.js` 包含真实凭据，已加入 `.gitignore` 不会提交
- 首次使用请复制 `config/database.example.js` 为 `config/database.js` 并填入真实配置
- 生产环境务必设置 `JWT_SECRET` 环境变量
- 生产环境建议将 `CORS_ORIGIN` 设置为具体的前端域名
