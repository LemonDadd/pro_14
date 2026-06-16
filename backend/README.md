# 新生儿喂养与作息记录 - 后端服务

## 项目简介

本项目是「新生儿喂养与作息记录」微信小程序的后端服务，使用 NestJS + TypeScript + Prisma + SQLite 开发，提供完整的 RESTful API 支持宝宝档案、喂养/睡眠/尿布事件记录、生长曲线数据、用户偏好设置以及本地数据云同步等功能。

## 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 框架 | NestJS 10.x | 企业级 Node.js 框架 |
| 语言 | TypeScript 5.x | 类型安全 |
| ORM | Prisma 5.x | 类型安全的数据库访问 |
| 数据库 | SQLite（开发）| 可切换 PostgreSQL/MySQL |
| 认证 | JWT + 微信登录 | Bearer Token |
| 文档 | Swagger / OpenAPI | 自动生成接口文档 |
| 校验 | class-validator | 参数校验 |

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env` 文件并根据需要修改：

```bash
cp .env .env.local
```

主要配置项：
- `PORT`: 服务端口，默认 3000
- `JWT_SECRET`: JWT 签名密钥（生产环境请修改）
- `JWT_EXPIRES_IN`: Token 过期时间，默认 7d
- `DATABASE_URL`: SQLite 数据库文件路径
- `WECHAT_APP_ID / WECHAT_APP_SECRET`: 微信小程序 AppID 和 Secret（生产环境必填）

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 执行数据库迁移
npm run prisma:migrate -- --name init
```

### 4. 启动服务

```bash
# 开发模式（热重载）
npm run start:dev

# 构建生产版本
npm run build
npm run start:prod
```

### 5. 查看接口文档

启动服务后，在浏览器打开：

```
http://localhost:3000/api/docs
```

## API 概览

所有接口 Base URL: `http://localhost:3000/api/v1`

### 统一响应格式

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "timestamp": 1718438400000
}
```

### 错误码说明

| code | 含义 |
|------|------|
| 0 | 成功 |
| 4001 | 未登录 / Token 过期 |
| 4003 | 无权限 |
| 4004 | 资源不存在 |
| 4220 | 参数校验失败 |
| 5000 | 服务器内部错误 |

### 认证方式

除 `/auth/wechat-login` 外，所有接口需要在请求头携带：

```
Authorization: Bearer <your-jwt-token>
```

开发环境可使用任意 `code` 值调用微信登录接口获取 Token（会自动创建用户）。

## 接口模块

### 1. 认证模块 `auth`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/auth/wechat-login` | 微信登录获取 Token | ❌ |
| GET | `/auth/me` | 获取当前用户信息 | ✅ |

### 2. 宝宝档案模块 `babies`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/babies` | 获取宝宝列表 | ✅ |
| POST | `/babies` | 创建宝宝档案 | ✅ |
| GET | `/babies/:id` | 获取单个宝宝详情 | ✅ |
| PUT | `/babies/:id` | 更新宝宝档案 | ✅ |
| DELETE | `/babies/:id` | 删除宝宝（级联删除） | ✅ |
| POST | `/babies/:id/set-current` | 切换当前宝宝 | ✅ |

### 3. 事件记录模块 `events`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/events` | 获取事件列表（支持分页/筛选） | ✅ |
| POST | `/events` | 创建事件 | ✅ |
| GET | `/events/:id` | 获取事件详情 | ✅ |
| PUT | `/events/:id` | 更新事件 | ✅ |
| DELETE | `/events/:id` | 删除事件 | ✅ |
| GET | `/events/summary/today` | 今日汇总数据 | ✅ |
| GET | `/events/summary/week` | 近 7 天趋势数据 | ✅ |

### 4. 生长记录模块 `growth-records`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/growth-records` | 获取生长记录列表 | ✅ |
| POST | `/growth-records` | 创建生长记录 | ✅ |
| GET | `/growth-records/:id` | 获取单条记录 | ✅ |
| PUT | `/growth-records/:id` | 更新生长记录 | ✅ |
| DELETE | `/growth-records/:id` | 删除生长记录 | ✅ |

### 5. 用户设置模块 `settings`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/settings` | 获取用户设置 | ✅ |
| PUT | `/settings` | 更新用户设置 | ✅ |

### 6. 数据同步模块 `sync`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/sync/import` | 批量导入本地数据 | ✅ |
| GET | `/sync/export` | 拉取全量数据导出 | ✅ |

## 目录结构

```
backend/
├── prisma/
│   ├── schema.prisma          # 数据库模型定义
│   └── dev.db                 # SQLite 数据库文件（生成后）
├── src/
│   ├── main.ts                # 应用入口
│   ├── app.module.ts          # 根模块
│   ├── prisma/                # Prisma 服务模块
│   ├── common/                # 通用组件
│   │   ├── decorators/        # 自定义装饰器
│   │   ├── filters/           # 异常过滤器
│   │   └── interceptors/      # 响应拦截器
│   ├── auth/                  # 认证模块
│   ├── babies/                # 宝宝档案模块
│   ├── events/                # 事件记录模块
│   ├── growth-records/        # 生长记录模块
│   ├── settings/              # 用户设置模块
│   └── sync/                  # 数据同步模块
├── .env                       # 环境变量
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## 数据模型

### User - 用户表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| openid | String | 微信 openid（唯一） |
| nickname | String | 昵称 |
| avatarUrl | String | 头像 |
| phone | String | 手机号 |
| createdAt / updatedAt | DateTime | 时间戳 |

### Baby - 宝宝档案表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| userId | UUID | 关联用户 |
| nickname / birthday / gender | - | 基础信息 |
| birthWeight / birthHeight | Float | 出生体重/身长 |
| feedPreference | Enum | 喂养偏好 |
| avatarColor | String | 头像背景色 |

### BabyEvent - 事件记录表
支持 4 种事件类型：feed（喂奶）/ diaper（尿布）/ sleep（睡眠）/ other（其他）
各类事件的扩展数据以 JSON 字符串存储在对应字段中。

### GrowthRecord - 生长记录表
记录每次测量的体重、身长、日期。

### AppSettings - 用户设置表
存储喂奶间隔阈值和当前选中的宝宝 ID。

## 生产环境部署建议

1. **切换数据库**：修改 `prisma/schema.prisma` 的 `datasource` 为 PostgreSQL 或 MySQL
2. **修改 JWT 密钥**：在 `.env` 中设置强随机密钥
3. **配置微信**：填入正确的 AppID 和 AppSecret
4. **启用 HTTPS**：使用 Nginx 反向代理并配置 SSL
5. **进程管理**：使用 PM2 或 Docker 部署

## License

MIT
