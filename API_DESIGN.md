# 新生儿喂养与作息记录 — 技术文档

## 1. 项目概述

本项目是一款面向新手父母、月嫂及家人的新生儿日常记录微信小程序，对标 Huckleberry 简版。当前版本为**纯本地版本**（无后端、无登录），使用 Taro 4.x + React + TypeScript 开发，所有数据存储在本地 `wx.setStorageSync` 中。

本文档用于指导**后期后端服务开发**，明确前端功能清单、数据模型、API 接口规范及迁移策略。

---

## 2. 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端框架 | Taro 4.x + React 18 | 支持多端（微信小程序 / H5） |
| 语言 | TypeScript 5.x | 类型安全 |
| 状态管理 | Zustand 4.x | 轻量级状态管理 |
| 图表 | ECharts 5.x | 折线图、散点图 |
| 样式 | SCSS CSS Modules | 组件级样式隔离 |
| 本地存储 | Taro.setStorageSync | 当前数据持久化方式 |
| 日期处理 | dayjs | 时间格式化与年龄计算 |

---

## 3. 前端功能清单

### 3.1 页面路由

| 路由 | 页面名 | TabBar | 功能 |
|------|--------|--------|------|
| `/pages/today/index` | 今日 | ✅ | 24h 环形时间轴、喂奶间隔提醒、事件列表、快速记录 FAB |
| `/pages/stats/index` | 统计 | ✅ | 今日数据卡片、近 7 天奶量折线图、喂奶分布详情 |
| `/pages/growth/index` | 生长 | ✅ | 体重/身长 Tab 切换、WHO P3/P50/P97 参考曲线、生长记录录入 |
| `/pages/babies/index` | 宝宝 | ✅ | 多宝宝档案管理（增删改查）、宝宝切换 |
| `/pages/settings/index` | 设置 | ✅ | 喂奶间隔阈值配置、数据导出（JSON）、清空数据 |
| `/pages/log-new/index` | 新建记录 | ❌ | 事件类型选择、喂奶/睡眠计时、表单录入、编辑模式 |

### 3.2 核心业务功能

#### 3.2.1 宝宝档案管理
- 字段：昵称、生日、性别、出生体重、出生身长、喂养偏好（母乳/配方/混合）
- 支持多宝宝本地切换
- 头像：自动分配首字母 + 圆形背景色

#### 3.2.2 事件快速记录
| 事件类型 | 子字段 |
|---------|--------|
| **喂奶 (feed)** | 奶量 (ml)、侧别 (L/R/bottle)、时长 (秒) |
| **尿布 (diaper)** | 类型 (wet/dirty/both)、颜色备注 |
| **睡眠 (sleep)** | 时长 (秒) |
| **其他 (other)** | 体温 (°C)、用药、备注 |
| 通用 | 时间戳、自由备注 |

支持 start/stop 计时功能（喂奶、睡眠）。

#### 3.2.3 24 小时环形时间轴
- 0-24 小时圆环可视化，色块区分事件类型
- 睡眠按实际时长绘制弧段，其他事件为短弧
- 当前时刻指针高亮
- 中心显示当前时间

#### 3.2.4 喂奶间隔提醒
- 双状态并存：
  - 间隔 < 2h → 黄标「间隔短」
  - 间隔 ≥ 设定阈值 → 粉标「该喂奶了」
- 阈值可配置：2 / 2.5 / 3 / 3.5 / 4 小时

#### 3.2.5 数据统计
- **日汇总**：总奶量、尿布次数、喂奶次数、总睡眠时长
- **周趋势**：近 7 天每日总奶量折线图（支持 Tooltip）
- **喂奶分布**：左/右/瓶喂 次数统计、平均每次奶量、平均间隔

#### 3.2.6 生长曲线
- **体重 / 身长 Tab 切换**
- 与 WHO 百分位参考线（P3 / P50 / P97）同图展示
- 支持手动录入数据点 + 自由备注
- 数据点按月龄映射 X 轴

#### 3.2.7 数据管理
- 导出 JSON 到剪贴板
- 一键清空所有本地数据

---

## 4. 数据模型

### 4.1 User（用户，后端新增）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 用户唯一 ID |
| `openid` | string | ✅ | 微信 openid |
| `nickname` | string | | 微信昵称 |
| `avatarUrl` | string | | 微信头像 |
| `phone` | string | | 手机号 |
| `createdAt` | number | ✅ | 创建时间戳 |
| `updatedAt` | number | ✅ | 更新时间戳 |

### 4.2 Baby（宝宝档案）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 宝宝唯一 ID |
| `userId` | string | ✅ | 所属用户 ID |
| `nickname` | string | ✅ | 昵称 |
| `birthday` | string | ✅ | 生日，格式 YYYY-MM-DD |
| `gender` | enum | ✅ | `boy` / `girl` |
| `birthWeight` | number | ✅ | 出生体重 (kg) |
| `birthHeight` | number | ✅ | 出生身长 (cm) |
| `feedPreference` | enum | ✅ | `breast`（母乳为主）/ `formula`（配方奶）/ `mixed`（混合） |
| `avatarColor` | string | ✅ | 头像背景色（HEX） |
| `createdAt` | number | ✅ | 创建时间戳 |
| `updatedAt` | number | ✅ | 更新时间戳 |

### 4.3 BabyEvent（喂养/作息事件）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 事件唯一 ID |
| `userId` | string | ✅ | 所属用户 ID |
| `babyId` | string | ✅ | 所属宝宝 ID |
| `type` | enum | ✅ | `feed` / `diaper` / `sleep` / `other` |
| `timestamp` | number | ✅ | 事件发生时间戳（毫秒） |
| `feedData` | object | 条件 | 喂奶数据，type=feed 时必填，见下表 |
| `diaperData` | object | 条件 | 尿布数据，type=diaper 时必填，见下表 |
| `sleepData` | object | 条件 | 睡眠数据，type=sleep 时必填，见下表 |
| `otherData` | object | 条件 | 其他数据，type=other 时，见下表 |
| `note` | string | | 自由备注 |
| `createdAt` | number | ✅ | 创建时间戳 |
| `updatedAt` | number | ✅ | 更新时间戳 |

**FeedData 喂奶数据：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `amountMl` | number | | 奶量 (ml) |
| `side` | enum | | `L`（左侧）/ `R`（右侧）/ `bottle`（瓶喂） |
| `durationSec` | number | | 时长 (秒) |

**DiaperData 尿布数据：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | enum | ✅ | `wet`（嘘嘘）/ `dirty`（便便）/ `both`（两者） |
| `colorNote` | string | | 颜色备注 |

**SleepData 睡眠数据：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `durationSec` | number | ✅ | 时长 (秒) |

**OtherData 其他数据：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `temperature` | number | | 体温 (°C) |
| `medication` | string | | 用药 |
| `note` | string | | 备注 |

### 4.4 GrowthRecord（生长记录）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 记录唯一 ID |
| `userId` | string | ✅ | 所属用户 ID |
| `babyId` | string | ✅ | 所属宝宝 ID |
| `date` | string | ✅ | 测量日期，格式 YYYY-MM-DD |
| `weight` | number | ✅ | 体重 (kg) |
| `height` | number | | 身长 (cm) |
| `note` | string | | 备注 |
| `createdAt` | number | ✅ | 创建时间戳 |
| `updatedAt` | number | ✅ | 更新时间戳 |

### 4.5 AppSettings（用户偏好设置）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | ✅ | 所属用户 ID |
| `feedReminderInterval` | number | ✅ | 喂奶间隔阈值 (小时)，取值 2 / 2.5 / 3 / 3.5 / 4，默认 3 |
| `currentBabyId` | string | | 当前选中的宝宝 ID |
| `updatedAt` | number | ✅ | 更新时间戳 |

---

## 5. 后端接口规范

所有接口使用 **RESTful** 风格，Base URL 建议：`https://api.example.com/v1`

### 5.1 通用约定

- **认证**：请求头 `Authorization: Bearer <token>`，基于微信登录换取的 JWT
- **请求/响应格式**：`application/json; charset=utf-8`
- **统一响应结构**：
```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "timestamp": 1718438400000
}
```
- **分页**：`GET` 列表接口支持 `page`、`pageSize` 查询参数，响应含 `total` 字段
- **错误码**：
  | code | 含义 |
  |------|------|
  | 0 | 成功 |
  | 4001 | 未登录/Token 过期 |
  | 4003 | 无权限 |
  | 4004 | 资源不存在 |
  | 4220 | 参数校验失败 |
  | 5000 | 服务器内部错误 |

### 5.2 认证接口

#### 5.2.1 微信登录
```
POST /auth/wechat-login
```

**请求 Body：**
```json
{
  "code": "string",
  "nickname": "string",
  "avatarUrl": "string"
}
```

**响应 data：**
```json
{
  "token": "jwt-token-string",
  "user": {
    "id": "u_xxx",
    "openid": "xxx",
    "nickname": "string",
    "avatarUrl": "string",
    "createdAt": 1718438400000
  }
}
```

#### 5.2.2 获取当前用户信息
```
GET /auth/me
```

### 5.3 宝宝档案接口

#### 5.3.1 获取宝宝列表
```
GET /babies
```

**响应 data：** `Baby[]`

#### 5.3.2 创建宝宝
```
POST /babies
```

**请求 Body：**
```json
{
  "nickname": "string",
  "birthday": "YYYY-MM-DD",
  "gender": "boy | girl",
  "birthWeight": 3.2,
  "birthHeight": 50,
  "feedPreference": "breast | formula | mixed"
}
```

**响应 data：** 完整 `Baby` 对象

#### 5.3.3 更新宝宝
```
PUT /babies/:id
```

**请求 Body：** `Baby` 字段子集

**响应 data：** 完整 `Baby` 对象

#### 5.3.4 删除宝宝
```
DELETE /babies/:id
```

**说明**：级联删除关联的 events 和 growth records

#### 5.3.5 切换当前宝宝
```
POST /babies/:id/set-current
```

**说明**：更新 settings 中的 `currentBabyId`

### 5.4 事件接口

#### 5.4.1 获取事件列表
```
GET /events
```

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `babyId` | string | ✅ | 宝宝 ID |
| `type` | string | | 事件类型过滤 feed/diaper/sleep/other |
| `startTime` | number | | 起始时间戳 |
| `endTime` | number | | 结束时间戳 |
| `page` | number | | 页码，默认 1 |
| `pageSize` | number | | 每页条数，默认 50 |

**响应 data：**
```json
{
  "items": "BabyEvent[]",
  "total": 100,
  "page": 1,
  "pageSize": 50
}
```

#### 5.4.2 创建事件
```
POST /events
```

**请求 Body：**
```json
{
  "babyId": "b_xxx",
  "type": "feed | diaper | sleep | other",
  "timestamp": 1718438400000,
  "feedData": { "amountMl": 120, "side": "L", "durationSec": 900 },
  "diaperData": { "type": "wet", "colorNote": "string" },
  "sleepData": { "durationSec": 3600 },
  "otherData": { "temperature": 36.5, "medication": "维生素D", "note": "string" },
  "note": "string"
}
```

**说明**：根据 type 字段，只传对应的数据对象

#### 5.4.3 更新事件
```
PUT /events/:id
```

**请求 Body：** `BabyEvent` 字段子集

#### 5.4.4 删除事件
```
DELETE /events/:id
```

#### 5.4.5 批量获取今日汇总（优化接口）
```
GET /events/summary/today
```

**查询参数：** `babyId`

**响应 data：**
```json
{
  "totalMl": 540,
  "feedCount": 6,
  "diaperCount": 8,
  "sleepTotalSec": 32400,
  "sideCounts": { "L": 2, "R": 3, "bottle": 1 },
  "lastFeedAt": 1718438400000
}
```

#### 5.4.6 批量获取周汇总（优化接口）
```
GET /events/summary/week
```

**查询参数：** `babyId`

**响应 data：**
```json
{
  "dailyStats": [
    {
      "date": "2024-06-09",
      "label": "7天前",
      "totalMl": 520,
      "feedCount": 6,
      "diaperCount": 7,
      "sleepSec": 31200
    }
  ]
}
```

### 5.5 生长记录接口

#### 5.5.1 获取生长记录列表
```
GET /growth-records
```

**查询参数：** `babyId`、`type`（weight/height，可选）

**响应 data：** `GrowthRecord[]`

#### 5.5.2 创建生长记录
```
POST /growth-records
```

**请求 Body：**
```json
{
  "babyId": "b_xxx",
  "date": "YYYY-MM-DD",
  "weight": 6.5,
  "height": 65,
  "note": "string"
}
```

#### 5.5.3 更新生长记录
```
PUT /growth-records/:id
```

#### 5.5.4 删除生长记录
```
DELETE /growth-records/:id
```

### 5.6 设置接口

#### 5.6.1 获取用户设置
```
GET /settings
```

**响应 data：** `AppSettings`

#### 5.6.2 更新用户设置
```
PUT /settings
```

**请求 Body：**
```json
{
  "feedReminderInterval": 3,
  "currentBabyId": "b_xxx"
}
```

### 5.7 数据同步接口（本地迁移）

#### 5.7.1 批量导入本地数据
```
POST /sync/import
```

**请求 Body：** 本地导出的 JSON 全量数据
```json
{
  "babies": [],
  "events": [],
  "growthRecords": [],
  "settings": { "feedReminderInterval": 3, "currentBabyId": null }
}
```

**响应 data：**
```json
{
  "importedBabies": 1,
  "importedEvents": 50,
  "importedGrowthRecords": 3
}
```

**说明**：首次接入后端时用于将本地数据迁移到云端

#### 5.7.2 拉取全量数据
```
GET /sync/export
```

**响应 data：** 同上 JSON 结构，用于数据备份/导出

---

## 6. 订阅消息（喂养提醒推送）

### 6.1 微信订阅消息模板建议

| 字段 | 说明 |
|------|------|
| 模板标题 | 喂奶提醒 |
| 模板字段 | 宝宝昵称、距上次喂奶时长、建议喂奶 |
| 触发条件 | 距上次喂奶超过用户设置阈值（2-4h） |

### 6.2 后端相关接口

```
POST /subscribe/save-template-id   // 保存用户订阅的 templateId
POST /subscribe/send-reminder      // 定时任务触发：扫描需提醒用户
```

---

## 7. 前端迁移策略（本地 → 云同步）

### 7.1 迁移步骤
1. 用户首次打开更新后的小程序
2. 检测本地有数据但未登录 → 弹出提示「是否将本地数据同步到云端」
3. 引导微信授权登录 → 获取 token
4. 调用 `/sync/import` 批量上传本地数据
5. 上传成功后清除本地 `currentBabyId` 之外的冗余副本（保留双写一段时间）

### 7.2 前端状态改造点
- `babyStore.ts` 中本地存储层抽象为 `StorageAdapter`
- 新增 `ApiStorageAdapter` 实现上述接口调用
- 本地缓存作为 fallback + 离线模式
- 增加离线 / 在线状态检测和自动重连

### 7.3 数据一致性
- 所有实体增加 `updatedAt`、`deletedAt` 字段支持增量同步
- 客户端维护 `lastSyncAt`，每次启动拉取增量更新

---

## 8. 目录结构速查

```
src/
├── app.config.ts          // 全局路由 & TabBar 配置
├── app.tsx                // 应用入口
├── app.scss               // 全局样式
├── types/index.ts         // 数据模型类型定义
├── store/babyStore.ts     // Zustand 状态管理（含查询方法）
├── utils/
│   ├── storage.ts         // 本地存储 CRUD（迁移时替换为 API 适配器）
│   ├── time.ts            // 时间格式化工具
│   └── whoPercentiles.ts  // WHO 百分位参考数据（前端写死）
├── components/
│   ├── BabyAvatar/        // 宝宝头像
│   ├── EventCard/         // 事件卡片（支持编辑/删除）
│   ├── CircularTimeline/  // 24h 环形时间轴
│   ├── QuickRecordFab/    // 浮动快速记录按钮
│   ├── StatCard/          // 统计卡片
│   ├── EcCanvas/          // ECharts 封装
│   └── EmptyState/        // 空状态占位
└── pages/
    ├── today/             // 今日时间轴
    ├── stats/             // 统计
    ├── growth/            // 生长曲线
    ├── babies/            // 宝宝管理
    ├── settings/          // 设置
    └── log-new/           // 新建/编辑记录
```

---

## 9. 关键业务规则

| 规则 | 说明 |
|------|------|
| 喂奶间隔双状态 | `totalHours < 2` → 黄标「间隔短」；`totalHours >= settings.feedReminderInterval` → 粉标「该喂奶了」；二者独立判断，可同时显示 |
| 删除宝宝级联 | 删除宝宝时，级联删除其所有事件 & 生长记录 |
| 生长曲线 X 轴 | 月龄 = `(测量年-出生年)*12 + (测量月-出生月) + (日差)/30` |
| WHO 百分位 | 前端写死静态数据，按宝宝性别和类型（体重/身长）取对应参考数组 |
| 睡眠事件可视 | 按 `durationSec` 绘制环形弧段；其他事件固定 7° 弧宽 |
| 事件编辑 | 编辑事件时保留原 `timestamp`，不刷新为当前时间 |
