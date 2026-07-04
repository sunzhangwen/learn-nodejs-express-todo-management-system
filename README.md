# 日程助手后端系统

基于 Node.js + Express + Sequelize + MySQL 的日程 Todo 后端服务，提供用户认证、任务管理、用户统计、AI 辅助和可选 RAG 向量检索能力。

## 交付状态

当前后端已覆盖前端联调与接口验收所需能力：

- 用户注册、登录、登出
- JWT 鉴权与任务归属校验
- 任务 CRUD、日期筛选、状态切换
- 任务优先级、重点任务、地点、地址、经纬度、附件字段
- 用户统计：今日待办、发布总数、已完成总数、分类统计
- AI 接口：分类建议、自然语言解析任务、任务总结、日程问答
- OpenAI 不可用时使用本地规则兜底，避免核心流程直接失败
- RAG 向量检索默认关闭，显式开启后可对接 Qdrant
- Jest + Supertest 自动化测试

## 技术栈

| 依赖 | 版本 | 用途 |
| --- | --- | --- |
| express | ^5.2.1 | Web 框架 |
| sequelize | ^6.37.8 | ORM |
| mysql2 | ^3.22.4 | MySQL 驱动 |
| jsonwebtoken | ^9.0.2 | JWT 认证 |
| bcrypt | ^6.0.0 | 密码哈希 |
| cors | ^2.8.6 | 跨域 |
| dotenv | ^17.4.2 | 环境变量 |
| jest | ^30.4.2 | 自动化测试 |
| supertest | ^7.2.2 | HTTP 接口测试 |

## 目录结构

```text
config/
├── config.js               # JWT、端口、CORS、运行环境
└── database.js             # Sequelize 数据库连接配置

models/
├── index.js                # 模型关联与同步入口
├── User.js                 # 用户模型
└── Task.js                 # 任务模型

routes/
├── auth.js                 # 注册、登录、登出
├── tasks.js                # 任务 CRUD
├── users.js                # 用户信息与统计
└── ai.js                   # AI 分类、解析、总结、问答

utils/
├── ai.js                   # AI 兜底、RAG、embedding、关键词搜索
├── vectorDB.js             # Qdrant 向量库封装
├── response.js             # 统一响应格式
└── idGenerator.js          # id_xxxxxxxxxx 字符串 ID 生成

__tests__/
├── api.test.js             # API 主流程测试
├── database-config.test.js # 数据库环境变量测试
└── rag.test.js             # RAG 与关键词搜索测试
```

## 环境配置

复制环境变量模板：

```bash
cp .env.example .env
```

`.env` 核心配置：

| 变量 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `DB_HOST` | 否 | `localhost` | MySQL 地址 |
| `DB_NAME` | 是 | 无 | 数据库名称 |
| `DB_USER` | 是 | 无 | 数据库用户 |
| `DB_PASS` | 否 | 空字符串 | 数据库密码 |
| `DB_DIALECT` | 否 | `mysql` | Sequelize 方言 |
| `JWT_SECRET` | 生产必填 | `dev_secret_change_me` | JWT 签名密钥 |
| `PORT` | 否 | `3000` | 服务端口 |
| `CORS_ORIGIN` | 否 | `*` | 跨域来源，多个来源用英文逗号分隔 |
| `NODE_ENV` | 否 | `development` | 运行环境 |
| `OPENAI_API_KEY` | 否 | 空 | OpenAI API Key；为空时使用本地兜底 |
| `AI_MODEL` | 否 | `gpt-4o-mini` | Chat Completions 模型 |
| `OPENAI_TIMEOUT_MS` | 否 | `10000` | OpenAI 请求超时时间 |
| `EMBEDDING_MODEL` | 否 | `text-embedding-3-small` | embedding 模型 |
| `AI_RAG_ENABLED` | 否 | 关闭 | 只有设为 `true` 才启用 RAG 向量检索 |
| `QDRANT_URL` | RAG 开启时需要 | 空 | Qdrant 服务地址 |
| `QDRANT_API_KEY` | 否 | 空 | Qdrant API Key |
| `QDRANT_COLLECTION` | 否 | `tasks` | Qdrant collection 名称 |
| `QDRANT_DISTANCE` | 否 | `Cosine` | 向量距离算法 |

建议本地开发默认保持：

```env
AI_RAG_ENABLED=false
OPENAI_API_KEY=
```

这样 AI 与聊天接口会走本地规则和关键词搜索，不依赖外网。

## 安装与启动

```bash
npm install
npm start
```

开发模式：

```bash
npm run dev
```

> `dev` 脚本依赖 `nodemon`，如果本地未安装可使用 `npm start`。

服务默认地址：

```text
http://localhost:3000
```

API 基础路径：

```text
http://localhost:3000/api
```

## 数据库

创建数据库：

```sql
CREATE DATABASE IF NOT EXISTS js_test DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

服务启动时会通过 Sequelize 同步模型。当前任务表字段包括：

| 字段 | 说明 |
| --- | --- |
| `id` | 字符串主键，格式 `id_xxxxxxxxxx` |
| `title` | 任务标题 |
| `category` | `work`、`personal`、`activity` |
| `priority` | `low`、`medium`、`high`，默认 `medium` |
| `startTime` / `endTime` | 任务时间 |
| `location` / `address` | 地点与地址 |
| `latitude` / `longitude` | 经纬度 |
| `attachments` | JSON 附件 URI 数组 |
| `note` | 备注 |
| `date` | 日期，格式 `YYYY-MM-DD` |
| `status` | `pending`、`completed` |
| `isFeatured` | 是否重点任务 |
| `userId` | 所属用户 ID |

## 接口概览

统一响应格式：

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

认证接口：

| 方法 | 路径 | 说明 | 认证 |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | 用户注册 | 否 |
| POST | `/api/auth/login` | 用户登录 | 否 |
| POST | `/api/auth/logout` | 用户登出 | 是 |

用户接口：

| 方法 | 路径 | 说明 | 认证 |
| --- | --- | --- | --- |
| GET | `/api/user/profile` | 用户信息、统计、分类计数 | 是 |

任务接口：

| 方法 | 路径 | 说明 | 认证 |
| --- | --- | --- | --- |
| GET | `/api/tasks` | 查询当前用户所有任务 | 是 |
| GET | `/api/tasks?date=YYYY-MM-DD` | 按日期查询任务 | 是 |
| GET | `/api/tasks/:id` | 查询任务详情 | 是 |
| POST | `/api/tasks` | 创建任务 | 是 |
| PUT | `/api/tasks/:id` | 更新任务 | 是 |
| PATCH | `/api/tasks/:id/status` | 更新任务状态 | 是 |
| DELETE | `/api/tasks/:id` | 删除任务 | 是 |

AI 接口：

| 方法 | 路径 | 说明 | 认证 |
| --- | --- | --- | --- |
| POST | `/api/ai/classify` | 根据标题/备注推荐分类、优先级、重点状态 | 是 |
| POST | `/api/ai/parse-task` | 将自然语言解析为任务草稿 | 是 |
| POST | `/api/ai/summarize` | 按任务 ID 或日期生成摘要 | 是 |
| POST | `/api/ai/chat` | 对当前用户任务做问答 | 是 |

详细 curl 示例见 [TEST_GUIDE.md](./TEST_GUIDE.md)。

## AI 与 RAG 说明

AI 能力分两层：

- 基础 AI：分类、自然语言解析、总结、聊天。未配置 `OPENAI_API_KEY` 或 OpenAI 网络不可达时，会使用本地规则兜底。
- RAG 向量检索：默认关闭。只有 `AI_RAG_ENABLED=true` 且 Qdrant 配置有效时，任务创建/更新/删除才会同步向量，聊天才会优先走向量检索。

推荐交付演示配置：

```env
AI_RAG_ENABLED=false
OPENAI_API_KEY=
```

需要验证 RAG 时再配置：

```env
OPENAI_API_KEY=sk-...
AI_RAG_ENABLED=true
QDRANT_URL=https://your-qdrant-endpoint
QDRANT_API_KEY=your_qdrant_key
```

## 安全与规范

- 密码使用 bcrypt 加盐哈希存储。
- 认证使用 JWT，token 有效期 7 天。
- 任务接口均校验当前用户归属，避免越权访问。
- 生产环境必须设置强 `JWT_SECRET`。
- 生产环境建议将 `CORS_ORIGIN` 设置为明确前端域名。
- `.env`、真实数据库凭据、OpenAI Key、Qdrant Key 不应提交。

## 测试

运行自动化测试：

```bash
npm test
```

当前测试覆盖：

- 注册、登录、登出
- 用户信息与统计
- 任务 CRUD、日期筛选、状态更新、权限校验
- AI 分类、解析、总结、聊天接口
- 数据库环境变量读取
- RAG embedding 文本、payload、Qdrant point ID、RAG 关闭回退

手动接口测试流程见 [TEST_GUIDE.md](./TEST_GUIDE.md)。

## 交付检查清单

- `.env.example` 与 README 中的环境变量说明一致。
- `npm test` 通过。
- 本地数据库可连接，`DB_NAME` 与 `DB_USER` 已配置。
- 前端真实 API 模式下 `EXPO_PUBLIC_API_BASE_URL` 指向 `http://<电脑局域网IP>:3000/api`。
- 本地交付演示建议关闭 RAG，避免网络不可达导致响应变慢。
- 生产部署前替换 `JWT_SECRET`，收紧 `CORS_ORIGIN`。
