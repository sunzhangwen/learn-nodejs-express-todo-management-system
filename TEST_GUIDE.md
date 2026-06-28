# 接口测试指南

本文档提供完整的后端接口测试流程，包括数据库初始化和接口测试用例。

---

## 1. 数据库初始化

### 1.1 创建数据库

```sql
CREATE DATABASE IF NOT EXISTS js_test DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 1.2 创建用户并授权（如需要）

```sql
-- 创建用户（如尚未创建）
CREATE USER IF NOT EXISTS 'admin'@'localhost' IDENTIFIED BY 'your_password';

-- 授权
GRANT ALL PRIVILEGES ON js_test.* TO 'admin'@'localhost';
FLUSH PRIVILEGES;
```

### 1.3 创建表

项目使用 Sequelize ORM，启动服务时会自动创建表。也可以手动执行以下 SQL：

> 注意：id 字段为字符串类型，格式为 `id_` + 10 位随机字母数字（如 `id_aB3kL9xR2m`），由应用层自动生成。

```sql
USE js_test;

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(255) NOT NULL COMMENT '用户唯一标识，格式 id_xxxxxxxxxx',
  `name` VARCHAR(255) NOT NULL COMMENT '用户名',
  `email` VARCHAR(255) NOT NULL UNIQUE COMMENT '邮箱',
  `password` VARCHAR(255) NOT NULL COMMENT '密码',
  `avatar` VARCHAR(255) COMMENT '头像 URL',
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- 任务表
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` VARCHAR(255) NOT NULL COMMENT '任务唯一标识，格式 id_xxxxxxxxxx',
  `title` VARCHAR(255) NOT NULL COMMENT '任务标题',
  `category` ENUM('work', 'personal', 'activity') NOT NULL COMMENT '分类',
  `startTime` VARCHAR(255) NOT NULL COMMENT '开始时间 HH:mm',
  `endTime` VARCHAR(255) COMMENT '结束时间 HH:mm',
  `location` VARCHAR(255) COMMENT '地点',
  `note` TEXT COMMENT '备注',
  `date` VARCHAR(255) NOT NULL COMMENT '日期 YYYY-MM-DD',
  `status` ENUM('pending', 'completed') NOT NULL DEFAULT 'pending' COMMENT '状态',
  `isFeatured` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否重要',
  `userId` VARCHAR(255) NOT NULL COMMENT '用户ID',
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
```

### 1.4 插入测试数据

> 注意：id 字段需使用 `id_` 格式的字符串，密码为 `123456` 经 bcrypt 加密后的值。

```sql
USE js_test;

-- 插入测试用户
INSERT INTO `users` (`id`, `name`, `email`, `password`, `createdAt`, `updatedAt`) VALUES
('id_testuser01', '张三', 'zhangsan@example.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01', NOW(), NOW()),
('id_testuser02', '李四', 'lisi@example.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01', NOW(), NOW());

-- 插入测试任务
INSERT INTO `tasks` (`id`, `title`, `category`, `startTime`, `endTime`, `location`, `note`, `date`, `status`, `isFeatured`, `userId`, `createdAt`, `updatedAt`) VALUES
('id_testtask01', '公司年终复盘会议', 'work', '08:00', '10:00', '会议室A', '准备PPT', '2026-06-18', 'pending', 1, 'id_testuser01', NOW(), NOW()),
('id_testtask02', '项目进度汇报', 'work', '14:00', '15:00', '会议室B', '整理本周工作', '2026-06-18', 'pending', 0, 'id_testuser01', NOW(), NOW()),
('id_testtask03', '健身锻炼', 'personal', '18:00', '19:00', '健身房', '跑步30分钟', '2026-06-18', 'completed', 0, 'id_testuser01', NOW(), NOW()),
('id_testtask04', '团队聚餐', 'activity', '19:00', '21:00', '火锅店', '庆祝项目上线', '2026-06-19', 'pending', 1, 'id_testuser01', NOW(), NOW()),
('id_testtask05', '代码审查', 'work', '10:00', '11:00', NULL, '审查PR #42', '2026-06-18', 'pending', 0, 'id_testuser02', NOW(), NOW());
```

---

## 2. 环境配置

### 2.1 复制配置文件

```bash
cp .env.example .env
cp config/database.example.js config/database.js
```

### 2.2 修改配置

编辑 `.env` 文件：
```env
JWT_SECRET=your_secret_key_here
PORT=3000
CORS_ORIGIN=*
NODE_ENV=development
```

编辑 `config/database.js` 文件，修改数据库连接信息。

### 2.3 安装依赖并启动

```bash
npm install
npm start
```

---

## 3. 接口测试

**基础地址**: `http://localhost:3000/api`

### 3.1 认证接口

#### POST /api/auth/register — 用户注册

**请求参数**:
```json
{
  "name": "string（必填）",
  "email": "string（必填）",
  "password": "string（必填）"
}
```

**curl 测试**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"测试用户","email":"test@example.com","password":"123456"}'
```

---

#### POST /api/auth/login — 用户登录

**请求参数**:
```json
{
  "email": "string（必填）",
  "password": "string（必填）"
}
```

**curl 测试**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "id_aB3kL9xR2m",
      "name": "测试用户",
      "email": "test@example.com",
      "avatar": null,
      "stats": {
        "todayPending": 0,
        "totalPublished": 0,
        "totalCompleted": 0
      },
      "categories": {
        "work": 0,
        "personal": 0,
        "activity": 0
      }
    }
  },
  "message": "登录成功"
}
```

> 注意：id 字段为字符串格式 `id_` + 10 位随机字母数字，每次注册自动生成。

---

#### POST /api/auth/logout — 用户登出

**请求头**: `Authorization: Bearer <token>`

**curl 测试**:
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 3.2 用户接口

#### GET /api/user/profile — 获取用户信息

**请求头**: `Authorization: Bearer <token>`

**curl 测试**:
```bash
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "id_aB3kL9xR2m",
    "name": "测试用户",
    "email": "test@example.com",
    "avatar": null,
    "stats": {
      "todayPending": 3,
      "totalPublished": 10,
      "totalCompleted": 7
    },
    "categories": {
      "work": 5,
      "personal": 3,
      "activity": 2
    }
  },
  "message": "操作成功"
}
```

---

### 3.3 任务接口

> 以下所有任务接口都需要在请求头中携带 Token

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

#### GET /api/tasks — 获取所有任务

**curl 测试**:
```bash
curl http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

#### GET /api/tasks?date={date} — 按日期获取任务

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | string | 是 | 日期，格式 YYYY-MM-DD |

**curl 测试**:
```bash
curl "http://localhost:3000/api/tasks?date=2026-06-18" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

#### GET /api/tasks/{id} — 获取单个任务

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 任务 ID，格式 `id_xxxxxxxxxx` |

**curl 测试**:
```bash
curl http://localhost:3000/api/tasks/id_aB3kL9xR2m \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

#### POST /api/tasks — 创建任务

**请求参数**:
```json
{
  "title": "string（必填）",
  "category": "work | personal | activity（必填）",
  "startTime": "HH:mm（必填）",
  "endTime": "HH:mm（可选）",
  "location": "string（可选）",
  "note": "string（可选）",
  "date": "YYYY-MM-DD（必填）",
  "status": "pending | completed（必填）",
  "isFeatured": false
}
```

**curl 测试**:
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"测试任务","category":"work","startTime":"09:00","endTime":"10:00","location":"会议室","note":"备注内容","date":"2026-06-18","status":"pending","isFeatured":false}'
```

---

#### PUT /api/tasks/{id} — 更新任务

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 任务 ID，格式 `id_xxxxxxxxxx` |

**请求参数**: 同创建任务（全量更新）

**curl 测试**:
```bash
curl -X PUT http://localhost:3000/api/tasks/id_aB3kL9xR2m \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"更新后的任务","category":"personal","startTime":"14:00","endTime":"15:00","location":"家里","note":"更新备注","date":"2026-06-19","status":"completed","isFeatured":true}'
```

---

#### PATCH /api/tasks/{id}/status — 更新任务状态

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 任务 ID，格式 `id_xxxxxxxxxx` |

**请求参数**:
```json
{
  "status": "pending | completed"
}
```

**curl 测试**:
```bash
curl -X PATCH http://localhost:3000/api/tasks/id_aB3kL9xR2m/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"status":"completed"}'
```

---

#### DELETE /api/tasks/{id} — 删除任务

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 任务 ID，格式 `id_xxxxxxxxxx` |

**curl 测试**:
```bash
curl -X DELETE http://localhost:3000/api/tasks/id_aB3kL9xR2m \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "id_aB3kL9xR2m"
  },
  "message": "删除成功"
}
```

---

## 4. 完整测试流程

```bash
# 1. 注册用户
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"测试用户","email":"test@example.com","password":"123456"}'

# 2. 登录获取 token（从响应中提取 token 和 user.id）
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# 3. 使用返回的 token 替换下面的 YOUR_TOKEN_HERE

# 4. 获取用户信息
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 5. 创建任务
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"测试任务","category":"work","startTime":"09:00","date":"2026-06-18","status":"pending","isFeatured":false}'

# 6. 获取今日任务
curl "http://localhost:3000/api/tasks?date=2026-06-18" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 7. 更新任务状态（替换 TASK_ID 为实际返回的 id）
curl -X PATCH http://localhost:3000/api/tasks/TASK_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"status":"completed"}'

# 8. 删除任务
curl -X DELETE http://localhost:3000/api/tasks/TASK_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 9. 登出
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 5. 响应格式说明

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "data": null,
  "message": "错误描述信息"
}
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 参数错误 |
| 401 | 未认证/Token 失效 |
| 403 | 无权访问 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如邮箱已注册） |
| 500 | 服务器内部错误 |

---

## 6. ID 格式说明

所有实体 ID 采用统一的字符串格式：

```
id_ + 10位随机字母数字
```

示例：`id_aB3kL9xR2m`、`id_Tm4nQ7wZ3p`

- 由应用层自动生成，无需手动传入
- 注册用户时自动生成用户 ID
- 创建任务时自动生成任务 ID
- 格式正则：`/^id_[a-zA-Z0-9]{10}$/`

---

## 7. 时区说明

统计接口（`GET /user/profile`、`POST /auth/login`）中的 `todayPending` 字段基于**服务器本地时区**计算当日日期，确保与前端 `getToday()` 返回值一致。

---

## 8. 运行自动化测试

```bash
npm test
```

测试文件位于 `__tests__/api.test.js`，包含所有接口的自动化测试用例。测试会自动同步数据库结构（`force: true`），无需手动建表。
