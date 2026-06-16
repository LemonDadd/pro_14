# 功能需求迭代提示词

> 复制下方 **「Agent 提示词」** 整段到 Cursor Agent 执行。
> 来源：第 1 轮 `/不满意原因` 审查（前端对接真实接口重构）。
> 每轮迭代后更新「变更记录」。

---

## 变更记录

| 轮次 | 日期 | 范围 | 状态 |
|------|------|------|------|
| 1 | 2026-06-17 | 前端真实接口接入、云端拉取、订阅模板、生产配置 | 待执行 |

---

## Agent 提示词（复制从这里开始）

**项目路径**：`/Users/ext.feixuan3/Desktop/solo/pro_14`  
**技术栈**：Taro 4 · React · Zustand · TypeScript · NestJS 后端（`backend/`，Base URL `http://localhost:3000/api/v1`）  
**产品定位**：新生儿喂养与作息记录小程序——登录后多设备同步、记录走云端、订阅喂奶提醒

### 核心需求（不变）

修改前端项目，使用真实后端接口进行重构：日常数据读写对接后端，登录后可云端同步，订阅提醒可走真实接口。

### 已完成（勿重复改，除非回归）

- `src/api/http.ts`：Taro.request 封装、Token、统一错误处理
- `src/api/auth.ts` + `src/services/auth.service.ts`：微信登录、Token 校验、登出
- `src/api/sync.ts` + `src/services/sync.service.ts`：批量 import/export、3 秒防抖上传
- `src/api/subscribe.ts`：保存模板 ID、获取订阅状态、手动触发提醒
- `src/services/network.service.ts`：网络监听、恢复在线后重试同步
- `src/store/babyStore.ts`：本地优先 + markDirty 触发同步；settings 页登录/订阅/同步 UI
- `src/app.tsx`：启动 initApp、前后台切换时重试/推送同步
- 今日/统计/生长/宝宝/记录页 Store 接口签名未变（可继续用 useBabyStore）

### P0 — 必须修复

#### 1. 日常增删改查须走后端真实接口（或文档约定的适配层）

**问题**：`babiesApi`、`eventsApi`、`growthRecordsApi`、`settingsApi` 已创建但全项目无引用；`babyStore` 的 addBaby/addEvent/updateSettings 等仍只写 `src/utils/storage.ts`，再靠 bulk sync 上传。用户以为已对接真实接口，核心读写实际仍是纯本地。

**要求**（二选一，优先方案 A，与 `API_DESIGN.md` §7.2 一致）：

- **方案 A（推荐）**：实现 `StorageAdapter` 抽象 + `LocalStorageAdapter` + `ApiStorageAdapter`；`babyStore` 写操作在已登录且在线时走 Api 适配层（调用已有 api 模块），离线/未登录降级本地；读操作启动时优先拉云端再合并本地
- **方案 B（最小改动）**：直接在 `babyStore` 各写方法内调用对应 api（create/update/delete），成功后更新本地缓存；失败时保留本地并 markDirty 重试

无论哪种方案，须消除「api 文件存在但从未 import」的状态。

**验收**：
- 登录后在首页新增一条喂奶记录 → 后端 `BabyEvent` 表有对应行（不依赖手动点「同步到云端」）
- 修改喂奶间隔设置 → 后端 `AppSettings` 已更新（走 settings 接口或等效路径）
- `grep -r "babiesApi\|eventsApi\|settingsApi" src/store src/pages` 有实际调用

#### 2. 换机/清本地后登录须能拿到云端数据

**问题**：`login()` 会 `pullFromCloud` 探测 `hasRemoteData`，但不写入 Store；settings 页 `handleLogin` 在「本地无 + 云端有」时只 Toast「欢迎回来」，页面仍空。已登录用户 `initApp` 也只 `initStore` 读本地，不拉云端。

**要求**：
- 登录后若 `!hasLocalData && hasRemoteData`：自动 `syncFromCloud('merge')` 或弹窗引导合并（与 `API_DESIGN.md` §7.1 一致）
- `initApp` 在 `authService.isAuthenticated()` 且在线时：启动后拉一次云端并 merge 到本地（可 debounce，避免与手动同步冲突）
- 合并完成后 today/stats 页应能看到云端宝宝与事件

**验收**：
- 设备 A 登录并同步数据 → 设备 B（或清空本地后）登录同一账号 → 无需手动点「从云端合并」即可看到宝宝和记录
- 后端 `GET /sync/export` 返回的数据与前端展示一致

#### 3. 订阅模板 ID 不得使用占位符

**问题**：`settings/index.tsx` 中 `DEFAULT_TEMPLATE_ID = 'TPL_DEFAULT_FEED_REMINDER'` 会在用户未保存模板时写入后端，微信侧无法识别，订阅开关形同虚设。

**要求**：
- 从环境变量或 `src/config/index.ts` 读取真实模板 ID（如 `WECHAT_FEED_REMINDER_TEMPLATE_ID`，与 backend `.env` 对齐）
- 未配置真实模板 ID 时：开关置灰或提示「请联系管理员配置模板」，**禁止**提交占位字符串
- 开启订阅前若本地无 templateId，使用配置中的正式 ID 调用 save-template-id

**验收**：登录 → 设置 → 开启订阅 → 后端 `UserSubscription.templateId` 为真实模板 ID，非 `TPL_DEFAULT_*`

### P1 — 体验与骨架补齐

#### 4. 生产环境 API 地址须可配置

**问题**：`src/config/index.ts` 生产环境仍为 `https://your-production-domain.com/api/v1` 占位。

**要求**：
- 改为可通过 Taro 环境变量 / `.env` / 构建注入的真实域名
- README 或 config 注释说明如何填写

**验收**：生产构建后 `API_BASE_URL` 不为占位字符串

#### 5. 统计页可选接后端汇总接口（有余力再做）

**问题**：`eventsApi.summaryToday` / `summaryWeek` 已封装未使用，统计页仍纯本地聚合。

**要求**：已登录且在线时，stats 页优先用 summary 接口展示今日/近 7 天数据；失败时 fallback 本地 Store。

**验收**：登录状态下 stats 页 Network 可见 summary 请求；离线时页面仍可用

### 验收清单

| 项 | 命令 / 动作 | 期望 |
|----|-------------|------|
| 类型检查 | `cd pro_14 && npx tsc --noEmit --skipLibCheck` | 无 error |
| 后端运行 | `cd pro_14/backend && npm run start:dev` | 3000 端口可用 |
| 登录 | 设置页 → 微信登录 | 拿到 Token，账号卡片显示用户信息 |
| 写接口 | 登录后首页新增喂奶记录 | 后端 events 表有新行，无需手动 bulk sync |
| 换机同步 | 清本地 storage → 再登录有数据的账号 | 自动出现云端宝宝与记录 |
| 订阅 | 配置真实 templateId 后开启订阅 | 后端 UserSubscription 记录正确 |
| 手动提醒 | 设置 → 立即发送 | 后端日志有提醒扫描/发送（开发环境可为模拟） |

### 工作方式

1. **先读再改**：`API_DESIGN.md` §6–§7、`src/store/babyStore.ts`、`src/services/sync.service.ts`、已有 `src/api/*` 模块
2. **最小 diff**：优先接已有 api 封装，不重复造 HTTP 层；不删 offline 降级能力
3. **规划一致**：选定 StorageAdapter 或直调 api 一种方案写到底，避免再留 dead code
4. **总结分**：已修复 / 未修复；未修复项说明阻塞原因

## Agent 提示词（复制到这里结束）
