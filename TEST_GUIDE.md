# 日程助手后端接口测试指南

本文档用于交付验收，覆盖后端环境准备、自动化测试、核心接口 curl 验证和 AI/RAG 配置说明。

## 1. 测试前准备

### 1.1 安装依赖

```bash
npm install
```

### 1.2 配置环境变量

复制模板：

```bash
cp .env.example .env
```

本地验收推荐配置：

```env
JWT_SECRET=dev_secret_change_me
PORT=3000
CORS_ORIGIN=*
NODE_ENV=development

DB_HOST=localhost
DB_NAME=js_test
DB_USER=root
DB_PASS=your_password
DB_DIALECT=mysql

MIMO_API_KEY=
MIMO_BASE_URL=https://api.xiaomimimo.com/v1
AI_MODEL=mimo-v2.5-pro
AI_RAG_ENABLED=false
AI_TIMEOUT_MS=30000
AI_MAX_TOKENS=1600
AI_CHAT_MAX_TOKENS=700
AI_CHAT_CONTEXT_LIMIT=5
```

说明：

- `DB_NAME` 和 `DB_USER` 必填。
- `MIMO_API_KEY` 为空时，AI 接口使用本地兜底逻辑。
- `AI_RAG_ENABLED=false` 时，不会请求 OpenAI embedding 或 Qdrant，聊天走关键词搜索。

### 1.3 创建数据库

```sql
CREATE DATABASE IF NOT EXISTS js_test DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

服务启动或测试执行时会通过 Sequelize 同步表结构。

## 2. 自动化测试

运行全部测试：

```bash
npm test
```

当前测试文件：

| 文件 | 覆盖内容 |
| --- | --- |
| `__tests__/api.test.js` | 注册、登录、用户信息、任务 CRUD、AI 接口 |
| `__tests__/database-config.test.js` | 数据库环境变量读取 |
| `__tests__/rag.test.js` | RAG 文本、payload、Qdrant ID、RAG 关闭回退 |

测试预期：

```text
Test Suites: 3 passed
Tests: 32 passed
```

## 3. 启动服务

```bash
npm start
```

基础地址：

```text
http://localhost:3000/api
```

统一响应格式：

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

错误响应：

```json
{
  "success": false,
  "data": null,
  "message": "错误描述"
}
```

## 4. 认证接口测试

### 4.1 注册

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"测试用户","email":"test@example.com","password":"123456"}'
```

预期：

- HTTP 201
- 返回 `token`
- 返回 `user.id`，格式为 `id_` + 10 位随机字符

### 4.2 登录

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

将响应中的 token 保存为后续请求的 `Authorization`：

```text
Authorization: Bearer YOUR_TOKEN_HERE
```

### 4.3 登出

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 5. 用户接口测试

### 5.1 获取用户信息与统计

```bash
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

响应包含：

- 用户基础信息：`id`、`name`、`email`、`avatar`
- `stats.todayPending`
- `stats.totalPublished`
- `stats.totalCompleted`
- `categories.work`
- `categories.personal`
- `categories.activity`

## 6. 任务接口测试

任务字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 任务标题 |
| `category` | 是 | `work`、`personal`、`activity` |
| `priority` | 否 | `low`、`medium`、`high`，默认 `medium` |
| `startTime` | 是 | `HH:mm` |
| `endTime` | 否 | `HH:mm` |
| `location` | 否 | 地点名称 |
| `address` | 否 | 地址 |
| `latitude` | 否 | 纬度 |
| `longitude` | 否 | 经度 |
| `attachments` | 否 | 附件 URI 数组 |
| `note` | 否 | 备注 |
| `date` | 是 | `YYYY-MM-DD` |
| `status` | 是 | `pending`、`completed` |
| `isFeatured` | 否 | 是否重点任务 |

### 6.1 创建任务

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"准备项目汇报","category":"work","priority":"high","startTime":"09:00","endTime":"10:00","location":"会议室A","address":"公司3楼","latitude":31.2304,"longitude":121.4737,"attachments":[],"note":"带上数据报表","date":"2026-07-08","status":"pending","isFeatured":true}'
```

保存返回的 `data.id` 作为 `TASK_ID`。

### 6.2 查询所有任务

```bash
curl http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6.3 按日期查询任务

```bash
curl "http://localhost:3000/api/tasks?date=2026-07-08" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6.4 查询任务详情

```bash
curl http://localhost:3000/api/tasks/TASK_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6.5 更新任务

```bash
curl -X PUT http://localhost:3000/api/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"更新后的项目汇报","category":"work","priority":"medium","startTime":"10:00","endTime":"11:00","location":"会议室B","address":"公司4楼","latitude":31.2304,"longitude":121.4737,"attachments":[],"note":"同步最新进度","date":"2026-07-08","status":"pending","isFeatured":false}'
```

### 6.6 更新任务状态

```bash
curl -X PATCH http://localhost:3000/api/tasks/TASK_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"status":"completed"}'
```

### 6.7 删除任务

```bash
curl -X DELETE http://localhost:3000/api/tasks/TASK_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 7. AI 接口测试

所有 AI 接口都需要登录 token。

### 7.1 分类建议

```bash
curl -X POST http://localhost:3000/api/ai/classify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"明天提交 React Native 作业","note":"比较重要"}'
```

预期返回：

```json
{
  "category": "work",
  "priority": "high",
  "isFeatured": true,
  "reason": "..."
}
```

### 7.2 自然语言解析任务

```bash
curl -X POST http://localhost:3000/api/ai/parse-task \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"text":"Tomorrow at 15:00 remind me to submit the React Native homework"}'
```

预期返回任务草稿字段，可直接用于 `POST /api/tasks`。

### 7.3 任务总结

按任务 ID 总结：

```bash
curl -X POST http://localhost:3000/api/ai/summarize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"taskId":"TASK_ID"}'
```

按日期总结：

```bash
curl -X POST http://localhost:3000/api/ai/summarize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"date":"2026-07-08"}'
```

### 7.4 日程问答

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"question":"这周有哪些任务还没完成？"}'
```

RAG 默认关闭时，接口会基于当前用户任务做关键词搜索。

## 8. RAG 向量检索测试

默认交付验收不要求开启 RAG。需要验证向量检索时，配置：

```env
OPENAI_API_KEY=sk-...
AI_RAG_ENABLED=true
QDRANT_URL=https://your-qdrant-endpoint
QDRANT_API_KEY=your_qdrant_key
QDRANT_COLLECTION=tasks
QDRANT_DISTANCE=Cosine
```

验证步骤：

1. 重启服务。
2. 创建或更新一条任务，后端会异步同步任务向量。
3. 调用 `POST /api/ai/chat` 提问。
4. 响应中的 `sources` 若包含 `score`，说明命中了向量检索结果。

如果网络无法访问 Mimo 或 Qdrant，后端会回退到关键词搜索；本地验收建议保持 `AI_RAG_ENABLED=false`。

## 9. 权限与异常用例

建议验收以下异常场景：

| 场景 | 预期 |
| --- | --- |
| 不带 token 访问 `/api/tasks` | HTTP 401 |
| 使用错误密码登录 | HTTP 401 |
| 重复注册同一邮箱 | HTTP 409 |
| 创建任务缺少 `title` | HTTP 400 |
| 创建任务传入非法 `category` | HTTP 400 |
| 更新非法 `status` | HTTP 400 |
| 访问其他用户任务 | HTTP 403 |
| 查询不存在任务 | HTTP 404 |

## 10. 完整手动验收流程

```bash
# 1. 注册
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"测试用户","email":"test@example.com","password":"123456"}'

# 2. 登录并保存 token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# 3. 获取用户信息
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 4. 创建任务并保存 TASK_ID
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"验收任务","category":"work","priority":"high","startTime":"09:00","date":"2026-07-08","status":"pending","isFeatured":true}'

# 5. 查询当天任务
curl "http://localhost:3000/api/tasks?date=2026-07-08" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 6. 调用 AI 问答
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"question":"验收任务是什么状态？"}'

# 7. 完成任务
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

## 11. 交付结论标准

满足以下条件可认为后端具备交付基础：

- `npm test` 全部通过。
- 服务可通过 `npm start` 启动。
- 注册、登录、任务 CRUD、用户统计可通过 curl 验证。
- 前端真实 API 模式可正常登录并完成任务主流程。
- 本地演示环境未配置 Mimo 时，AI 接口仍有可用兜底响应。
