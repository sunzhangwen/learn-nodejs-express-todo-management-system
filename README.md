# Nodejs Express Todos Management System

简洁专业的 Node.js + Express + Sequelize MySQL 示例项目，支持用户管理和任务管理接口。

## 1. 项目简介

该项目使用 `Express` 提供 RESTful API，使用 `Sequelize` 连接 MySQL 数据库并自动同步表结构。当前实现：

- 用户注册、登录、用户列表查询
- 任务创建、查询、更新、删除
- MySQL 数据库连接与模型关联

## 2. 运行环境

- Node.js
- MySQL
- 通过npm安装依赖：`express`、`sequelize`、`mysql2`、`cors`

## 3. 项目目录结构

```
├── config/
│   └── datatable.js      # Sequelize MySQL 连接配置
├── models/
│   ├── index.js         # 模型关联与同步入口
│   ├── Task.js          # 任务模型定义
│   └── User.js          # 用户模型定义
├── routes/
│   ├── tasks.js         # 任务管理路由
│   └── users.js         # 用户管理路由
├── main_index.js        # 应用主入口文件
├── package.json         # 项目依赖及脚本
└── README.md            # 项目说明文档
```

## 4. 安装与启动

在项目根目录执行：

```bash
npm install
```

确保 MySQL 已运行，并且已创建数据库：

```sql
CREATE DATABASE IF NOT EXISTS js_test_db;
```

修改数据库配置，请编辑：`config/datatable.js`

启动服务：

```bash
npm start
```

开发模式：

```bash
npm run dev
```

如果需要直接运行入口文件：

```bash
node main_index.js
nodemon main_index.js
```

服务默认监听：

```
http://localhost:3000
```

## 5. 接口文档

### 5.1 用户模块

#### 1) 注册用户

- 方法：`POST`
- 路径：`/users/register`
- 描述：创建新用户账号
- 是否鉴权：否

请求参数：

| 参数名   | 类型   | 是否必填 | 说明     |
|---------|--------|----------|----------|
| username | string | 是       | 用户名   |
| password | string | 是       | 密码     |

请求示例：

```json
{
  "username": "alice",
  "password": "123456"
}
```

成功响应：

```json
{
  "code": 201,
  "msg": "注册成功",
  "data": {
    "id": 1,
    "username": "alice",
    "createdAt": "2026-06-06T00:00:00.000Z",
    "updatedAt": "2026-06-06T00:00:00.000Z"
  }
}
```

失败响应：

- 参数缺失：
```json
{ "code": 400, "msg": "用户名和密码不能为空" }
```
- 用户已存在：
```json
{ "code": 409, "msg": "用户名已存在" }
```

#### 2) 用户登录

- 方法：`POST`
- 路径：`/users/login`
- 描述：校验用户名与密码
- 是否鉴权：否

请求参数：

| 参数名   | 类型   | 是否必填 | 说明   |
|---------|--------|----------|--------|
| username | string | 是       | 用户名 |
| password | string | 是       | 密码   |

请求示例：

```json
{
  "username": "alice",
  "password": "123456"
}
```

成功响应：

```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "id": 1,
    "username": "alice",
    "createdAt": "2026-06-06T00:00:00.000Z",
    "updatedAt": "2026-06-06T00:00:00.000Z"
  }
}
```

失败响应：

- 参数缺失：
```json
{ "code": 400, "msg": "用户名和密码不能为空" }
```
- 登录失败：
```json
{ "code": 401, "msg": "用户名或密码错误" }
```

#### 3) 查询用户列表

- 方法：`GET`
- 路径：`/users`
- 描述：分页获取用户列表
- 是否鉴权：否

请求参数：

| 参数名 | 类型   | 是否必填 | 说明           |
|--------|--------|----------|----------------|
| page   | number | 否       | 页码，默认 1   |
| limit  | number | 否       | 每页数量，默认 20 |

请求示例：

```
GET /users?page=1&limit=10
```

成功响应：

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": [
    {
      "id": 1,
      "username": "alice",
      "createdAt": "2026-06-06T00:00:00.000Z",
      "updatedAt": "2026-06-06T00:00:00.000Z"
    }
  ]
}
```

失败响应：

```json
{ "code": 500, "msg": "查询用户失败" }
```

### 5.2 任务模块

#### 1) 创建任务

- 方法：`POST`
- 路径：`/task/create`
- 描述：新增任务记录
- 是否鉴权：否

请求参数：

| 参数名      | 类型   | 是否必填 | 说明         |
|-------------|--------|----------|--------------|
| title       | string | 是       | 任务标题     |
| description | string | 否       | 任务描述     |
| userId      | number | 是       | 任务所属用户 ID |

请求示例：

```json
{
  "title": "编写文档",
  "description": "完成 README 文档编写",
  "userId": 1
}
```

成功响应：

```json
{
  "code": 201,
  "msg": "任务创建成功",
  "data": {
    "id": 1,
    "title": "编写文档",
    "description": "完成 README 文档编写",
    "completed": false,
    "userId": 1,
    "createdAt": "2026-06-06T00:00:00.000Z",
    "updatedAt": "2026-06-06T00:00:00.000Z"
  }
}
```

失败响应：

- title 缺失：
```json
{ "code": 400, "msg": "任务标题不能为空" }
```
- userId 缺失：
```json
{ "code": 400, "msg": "userId 不能为空" }
```
- 用户不存在：
```json
{ "code": 404, "msg": "用户不存在" }
```

#### 2) 查询任务列表

- 方法：`GET`
- 路径：`/task/list`
- 描述：分页查询任务，支持按用户过滤
- 是否鉴权：否

请求参数：

| 参数名   | 类型   | 是否必填 | 说明                |
|----------|--------|----------|---------------------|
| page     | number | 否       | 页码，默认 1        |
| limit    | number | 否       | 每页数量，默认 20   |
| userId   | number | 否       | 按用户 ID 过滤任务  |

请求示例：

```
GET /task/list?userId=1&page=1&limit=10
```

成功响应：

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": [
    {
      "id": 1,
      "title": "编写文档",
      "description": "完成 README 文档编写",
      "completed": false,
      "userId": 1,
      "createdAt": "2026-06-06T00:00:00.000Z",
      "updatedAt": "2026-06-06T00:00:00.000Z",
      "owner": {
        "id": 1,
        "username": "alice"
      }
    }
  ]
}
```

失败响应：

```json
{ "code": 500, "msg": "查询任务失败" }
```

#### 3) 查询单个任务

- 方法：`GET`
- 路径：`/task/:id`
- 描述：根据任务 ID 查询任务详情
- 是否鉴权：否

请求示例：

```
GET /task/1
```

成功响应：

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "id": 1,
    "title": "编写文档",
    "description": "完成 README 文档编写",
    "completed": false,
    "userId": 1,
    "createdAt": "2026-06-06T00:00:00.000Z",
    "updatedAt": "2026-06-06T00:00:00.000Z",
    "owner": {
      "id": 1,
      "username": "alice"
    }
  }
}
```

失败响应：

```json
{ "code": 404, "msg": "任务未找到" }
```

#### 4) 更新任务

- 方法：`PUT`
- 路径：`/task/:id`
- 描述：更新任务内容或完成状态
- 是否鉴权：否

请求参数：

| 参数名      | 类型    | 是否必填 | 说明           |
|-------------|---------|----------|----------------|
| title       | string  | 否       | 任务标题       |
| description | string  | 否       | 任务描述       |
| completed   | boolean | 否       | 是否完成       |

请求示例：

```json
{
  "title": "更新 README",
  "completed": true
}
```

成功响应：

```json
{
  "code": 200,
  "msg": "更新成功",
  "data": {
    "id": 1,
    "title": "更新 README",
    "description": "完成 README 文档编写",
    "completed": true,
    "userId": 1,
    "createdAt": "2026-06-06T00:00:00.000Z",
    "updatedAt": "2026-06-06T00:00:00.000Z"
  }
}
```

失败响应：

- 任务不存在：
```json
{ "code": 404, "msg": "任务未找到" }
```
- 无更新字段：
```json
{ "code": 400, "msg": "没有提供可更新的字段" }
```

#### 5) 删除任务

- 方法：`DELETE`
- 路径：`/task/:id`
- 描述：删除指定任务
- 是否鉴权：否

请求示例：

```
DELETE /task/1
```

成功响应：

```json
{ "code": 200, "msg": "删除成功" }
```

失败响应：

```json
{ "code": 404, "msg": "任务未找到" }
```

## 6. 备注

- 当前接口均未实现 JWT 鉴权；如需生产环境使用，请补充登录令牌和中间件验证。
- 数据库配置文件：`config/datatable.js`
- 若数据库名称或账号密码不同，请根据实际环境调整配置。
