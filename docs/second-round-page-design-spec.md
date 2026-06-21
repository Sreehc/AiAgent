# AiAgent 第二轮页面高保真规格

> 任务来源：`docs/tasks.md` D05。本文档基于 `docs/requirements.md`、`docs/spec.md`、`docs/visual-system-spec.md`、`docs/component-system-spec.md` 和 `docs/first-round-page-design-spec.md`，补齐第二轮页面高保真设计规格。本文档覆盖历史、账号、模型、MCP、审计、RAG 和 404，不包含后端重写、assistant-ui runtime 接入或超出 UI 升级范围的新业务能力。

## 1. 范围与约束

| 页面 | 路由 | 当前实现 | 后续任务 |
| --- | --- | --- | --- |
| 历史回放 | `/workspace/history` | `HistoryPage.tsx`、`features/history/*` | H01 |
| 账号中心 | `/account` | `AccountPage.tsx`、`features/account/*` | A06 |
| 模型配置 | `/admin/settings` | `AdminSettingsPage.tsx`、`ModelRegistry.tsx`、`ModelForm.tsx`、`InviteCodePanel.tsx` | A02 |
| MCP 服务器 | `/admin/mcp-servers` | `McpServersPage.tsx`、`features/system/Mcp*` | A03 |
| 审计 | `/admin/audit` | `AdminAuditPage.tsx` | A04 |
| RAG 评估 | `/admin/rag-evaluations` | `RagEvaluationPage.tsx` | A05 |
| 404 | `*` | `NotFoundPage.tsx` | S03 |

约束：

- 视觉系统沿用 graphite/zinc + restrained cyan/teal。
- 页面必须同时有 light/dark 标注。
- 每页必须覆盖正常、空态、加载、错误状态。
- 审计和 RAG 默认展示结构化字段，原始 JSON/metrics 只放入展开详情。
- 管理页仅管理员可访问；普通用户进入管理路由时显示无权限空态。
- 表格列多时小屏使用横向滚动或卡片化，不压缩到不可读。
- 不引入第二套组件风格；所有页面复用 D03 组件状态。

## 2. 共用页面模式

### 2.1 桌面模式

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Page header: title + subtitle + compact metrics / status                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ Optional filter / action row                                                  │
├──────────────────────────────┬───────────────────────────────────────────────┤
│ Side panel / list / form      │ Main content                                  │
│ or tabs depending page        │ table / detail / report / metrics             │
└──────────────────────────────┴───────────────────────────────────────────────┘
```

### 2.2 移动模式

```text
┌──────────────────────────────┐
│ Page header + primary meta   │
├──────────────────────────────┤
│ Primary filters/actions      │
├──────────────────────────────┤
│ Single-column content        │
│ cards, tabs, details         │
└──────────────────────────────┘
```

移动规则：

- 表单双列全部变单列。
- 表格优先卡片化；必须横向滚动时只在表格容器内部滚动。
- 顶部 action 不超过 2 个可见按钮，其余进入 DropdownMenu。
- 详情区域使用 `details` / Tabs / Dialog，不让原始 payload 占据首屏。

## 3. 历史回放

### 3.1 目标

强化回放摘要、trace、报告和产物复用入口，让用户可以从历史会话快速理解任务过程并把产物带回研究工作台。

### 3.2 桌面布局

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header: 历史回放 | sessions count | selected steps | tool calls              │
├──────────────────────┬───────────────────────────────────────────────────────┤
│ History rail         │ Replay detail                                          │
│ - filter panel       │ - replay summary                                       │
│ - session list       │ - report / summary                                     │
│ - status chips       │ - trace timeline                                       │
│                      │ - artifacts reuse                                      │
└──────────────────────┴───────────────────────────────────────────────────────┘
```

组件与数据：

| 区域 | 组件 | 字段 |
| --- | --- | --- |
| 筛选 | `HistoryFilters` | keyword、status、refresh |
| 会话列表 | `HistoryList` | title、sessionId、agentMode、status、createdAt |
| 摘要 | `ReplayDetail` summary panel | title、session status、latest run、executionMode、artifact count |
| Trace | `ExecutionTimeline` | run、plan step、tool、artifact、summary |
| 产物 | artifact list | title、artifactType、mimeType、resultUrl、reusable |

### 3.3 移动布局

- 筛选区置顶，历史会话列表改为可折叠列表。
- Replay detail 在列表下方；切换会话后自动滚动到详情标题。
- Trace item 使用单列 feed，不展示宽表格。
- 产物复用按钮不小于 `44px`，避免误触。

### 3.4 状态稿

| 状态 | 触发 | 外观与交互 |
| --- | --- | --- |
| 正常 | 有 sessions 且选中会话 | 左侧 list active item 清晰；右侧 summary、trace、artifacts 分层展示。 |
| 空态 | sessions 为空或筛选无结果 | EmptyState 提示调整筛选或去研究工作台运行任务。 |
| 加载 | 初始 loadSessions 或 loadReplay | 会话列表 skeleton；详情区保留上一次数据时显示局部 loading。 |
| 错误 | replay API 失败 | Error Alert + ReplayDetail error state；提供重新加载，不清空筛选条件。 |
| 产物复用 | 点击“作为上下文使用” | 写入 `aiagent.reuseArtifacts` 后跳转 `/workspace/chat`，按钮 active/loading 反馈。 |

### 3.5 验收点

- 筛选、回放、产物复用不回归。
- Trace 和报告层级清楚，原始 tool payload 仍默认折叠。
- 长 sessionId、runId 使用 mono 并截断，详情中可完整查看。

## 4. 账号中心

### 4.1 目标

将个人 API 配置、资料、安全、登录日志做清晰分组，降低配置密钥和安全操作的误操作风险。

### 4.2 桌面布局

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header: 账号中心 | role badges | login protected                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ API configuration panel                                                       │
├──────────────────────────────┬───────────────────────────────────────────────┤
│ Profile form                  │ Security form                                 │
├──────────────────────────────┴───────────────────────────────────────────────┤
│ Login log table                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

布局规格：

- 个人 API 配置优先级最高，占满一行；用于研究任务模型连接。
- Profile 与 Security 并列；移动端变单列。
- 登录日志使用结构化 Table，IP 使用 mono，结果用 StatusPill。
- 成功/错误消息在对应 Panel 内展示，不使用全局 toast 替代表单反馈。

### 4.3 状态稿

| 状态 | 触发 | 外观与交互 |
| --- | --- | --- |
| 正常 | profile/api/logs 加载成功 | API configured 状态、masked key、测试按钮和保存按钮清晰分组。 |
| 空态 | logs 为空、API 未配置 | 登录日志 EmptyState；API 面板显示未配置说明，测试按钮 disabled。 |
| 加载 | 初始 `Promise.all` | 页面 header 保留；各 panel 使用 form/table skeleton，不用单个 EmptyState 代替 loading。 |
| 错误 | 任一 account API 失败 | 对应 panel 内 Alert；全局 profileError 可出现在 header 下方；保留已加载数据。 |
| 保存成功 | profile/password/API 保存成功 | Panel 内 success Alert，3-5 秒后可淡出；按钮 loading 结束。 |
| 保存失败 | 表单 API 失败 | Panel 内 error Alert；字段值保留。 |

### 4.4 交互规则

- API Key 已配置时 placeholder 显示“留空以保留原密钥”，不回显真实 key。
- 测试 Chat/Embedding/Image 在未配置时 disabled，并说明原因。
- 修改密码成功后清空旧密码和新密码字段。
- 登录日志小屏可卡片化，字段顺序为时间、结果、IP、User Agent。

## 5. 模型配置

### 5.1 目标

突出默认模型、测试状态和风险 provider，让管理员能快速判断模型是否可用于运行时。

涉及页面：`/admin/settings`

### 5.2 桌面布局

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header: 模型配置 | enabled count | invite count | risk badge                 │
├──────────────────────┬───────────────────────────────────────────────────────┤
│ Model form           │ Model registry                                        │
│ Invite generator     │ - Chat group                                          │
│                      │ - Embedding group                                     │
│                      │ - Image group                                         │
│                      │ Invite code table                                     │
└──────────────────────┴───────────────────────────────────────────────────────┘
```

视觉规格：

- 默认模型使用 primary outline 或 “默认” compact badge，而不是只在 meta 文本中出现。
- local-mock enabled、lastTestStatus failed、缺 API key 使用 warning/danger 行内提示。
- 模型列表按 `CHAT`、`EMBEDDING`、`IMAGE` 分组；每组空态就地展示。
- Invite code table 与模型注册表分层，不抢主视觉。

### 5.3 状态稿

| 状态 | 触发 | 外观与交互 |
| --- | --- | --- |
| 正常 | models/invites 加载成功 | 默认模型、启用数、最近测试状态可见；操作按钮右对齐。 |
| 空态 | 无 models 或某类型无模型 | EmptyState：引导新增模型；某类型无模型用轻量空行，不撑大页面。 |
| 加载 | `loading=true` | Registry table skeleton；表单保持可见但提交 disabled 或显示 loading。 |
| 错误 | list/create/update/test 失败 | Error Alert 显示失败原因；编辑表单内容保留。 |
| 编辑中 | 点击编辑模型 | 左侧 form 标题为“编辑模型”；modelCode disabled；取消编辑清晰可见。 |
| 测试中 | 点击测试模型 | 行内测试按钮 loading；结果写入 lastTestStatus，并用 StatusPill 显示。 |
| 风险 provider | local-mock enabled 或 test failed | 页面 header 下方 Alert + 行内 danger/warning。 |

### 5.4 移动规则

- 左侧 form 与 registry 变单列；registry 在 form 前或后由页面任务确定，但主操作“新增/保存模型”必须可达。
- 模型表格可卡片化：模型名、code/provider、type、enabled/default、lastTest、actions。
- 操作超过 3 个时进入 DropdownMenu。

## 6. MCP 服务器

### 6.1 目标

突出连接状态、工具发现、健康检查和工具测试，让管理员能理解服务是否可用、有哪些工具、测试结果如何。

### 6.2 桌面布局

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header: MCP 服务器 | active count | selected transport | total servers       │
├──────────────────────┬───────────────────────────────────────────────────────┤
│ Server form          │ Tool discovery                                        │
│ Server registry      │ Health check                                          │
└──────────────────────┴───────────────────────────────────────────────────────┘
```

视觉规格：

- Server registry item 展示 name、serverCode、transportType、endpoint/command、health/status。
- 选中 server 使用 primary subtle + left indicator，不改变行高。
- STDIO 配置警告使用 warning/danger Alert，明确命令执行风险。
- Tool discovery 与 Health check 并列；没有选中 server 时都显示 EmptyState。

### 6.3 状态稿

| 状态 | 触发 | 外观与交互 |
| --- | --- | --- |
| 正常 | 有 servers 且选中 server | form 显示服务配置；工具发现和健康检查显示最近结果或操作入口。 |
| 空态 | servers 为空 | Registry EmptyState：注册 HTTP/STDIO 服务；工具和健康区显示“先选择服务”。 |
| 加载 | `loading=true` | Registry skeleton；form 禁用提交；main panels 保留空态。 |
| 错误 | API 失败 | 页面 Alert + 对应 panel error；不清空当前 form。 |
| 发现中 | discover action | “发现工具”按钮 loading；tools list skeleton。 |
| 健康检查中 | health action | “检查健康”按钮 loading；latency/toolCount 保留上次值或 skeleton。 |
| 工具测试 | test tool action | 单个工具按钮 loading；成功 toast，失败 Alert，不把测试成功作为 error 样式。 |
| 删除配置 | delete server | Danger Confirm Dialog；删除后清空 selection/discovery/health。 |

### 6.4 工具与健康字段

| 模块 | 字段 |
| --- | --- |
| Tool discovery | toolName、toolType、description、cached、test action |
| Health check | serverCode、status、message、latencyMs、toolCount、transportType、errorCode、checkedAt |

### 6.5 移动规则

- Server form、Registry、Tool discovery、Health check 变为纵向。
- Tool cards 不使用 timeline 样式堆叠过深；每张卡最多 2 行描述，详情折叠。
- endpoint/commandLine 长文本截断，点击复制或展开。

## 7. 审计

### 7.1 目标

从原始 JSON 列表升级为结构化表格 + 展开详情。用户、任务、工具、登录四个 tab 按 `docs/requirements.md` 5.6 字段优先展示。

### 7.2 桌面布局

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header: 审计 | row count | active tab | filter summary                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ Tabs: 用户 / 任务 / 工具 / 登录                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ Filter row: keyword, status/result, date optional, refresh                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ Structured table                                                             │
│ Expanded row: summary fields + raw payload JsonBlock                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 字段映射

| Tab | 默认列 | 展开详情 |
| --- | --- | --- |
| 用户 | 时间、用户、动作、目标对象、角色/权限变化、结果、IP | requestId、userAgent、raw payload |
| 任务 | 时间、用户、会话/Run、任务标题、执行模式、状态、耗时、错误摘要、工具调用数、产物数 | knowledgeBaseIds、strategy、raw payload |
| 工具 | 时间、服务、工具名、关联 Run、状态、耗时、错误类型、输入摘要、输出摘要 | requestPayload、responsePayload、raw payload |
| 登录 | 时间、用户、IP、User Agent、结果、失败原因 | requestId、tenant、raw payload |

降级规则：

- 后端字段缺失时显示 `-`，不阻塞表格渲染。
- 不识别字段仍保留在展开 raw payload。
- 时间、耗时、数量列使用 mono/tabular。

### 7.4 状态稿

| 状态 | 触发 | 外观与交互 |
| --- | --- | --- |
| 正常 | rows 有数据 | 结构化表格，行可展开；当前筛选条件可见。 |
| 空态 | rows 为空 | EmptyState：当前条件无审计记录，提供清除筛选。 |
| 加载 | `loading=true` | Table skeleton，Tabs 和 Filter row 保持可操作或局部 disabled。 |
| 错误 | listAudit* 失败 | Error Alert + retry；保留 tab/filter/pageNo。 |
| 展开详情 | 点击行或 expand button | Expanded row 使用 surface inset；JsonBlock 默认折叠，长 payload 可滚动。 |
| 无权限 | 非 admin | Permission denied EmptyState，不发起 audit API。 |

### 7.5 移动规则

- Tabs 横向滚动。
- Filter row 变单列；筛选按钮 `44px` 高。
- 表格可横向滚动；若卡片化，每张卡展示默认列前 4 个字段 + 展开详情。

## 8. RAG 评估

### 8.1 目标

把 RAG 评估从表单 + 原始 metrics 文本升级为指标卡、用例列表、评估历史和失败详情分层展示。

### 8.2 桌面布局

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header: RAG 评估 | eval count | enabled cases | latest status               │
├──────────────────────────────┬───────────────────────────────────────────────┤
│ Case management              │ Metrics overview                              │
│ New evaluation form          │ Evaluation history table/list                  │
│                              │ Expanded metrics details                       │
└──────────────────────────────┴───────────────────────────────────────────────┘
```

### 8.3 结构化字段

| 模块 | 默认展示 |
| --- | --- |
| 指标卡 | Hit Rate、Recall、Precision、MRR/NDCG、通过/失败用例数 |
| 评估历史 | Eval ID、状态、Top K、知识库数量、用例数量、主要指标、创建时间、完成时间 |
| 评估用例 | Query、启用状态、期望 citation、期望文本、最近结果、失败原因 |
| 指标详情 | 失败用例列表、metrics parse warning、raw metrics JsonBlock |

解析规则：

- `metrics` 为 JSON 字符串时先解析出可展示字段。
- 解析失败时显示 warning Alert，并把原始 metrics 放入展开详情。
- `knowledgeBaseIds`、`cases` 为字符串时可尝试 JSON parse；失败则显示原始摘要。

### 8.4 状态稿

| 状态 | 触发 | 外观与交互 |
| --- | --- | --- |
| 正常 | items/cases 加载成功 | 顶部指标卡 + 用例管理 + 历史列表；最近失败突出。 |
| 空态 | 无 cases 或无 evaluations | 用例区 EmptyState：新增用例；历史区 EmptyState：运行第一次评估。 |
| 加载 | `loading=true` 或初始 loadItems | 表单按钮 loading；指标卡和列表 skeleton。 |
| 错误 | list/create/update/delete/evaluate 失败 | Error Alert；当前表单输入保留。 |
| 编辑用例 | 点击编辑 | Case form 进入编辑态，显示取消编辑。 |
| 运行评估 | submit evaluation | 主按钮 loading；历史保留旧数据；完成后刷新 metrics。 |
| metrics 解析失败 | JSON parse 失败 | Warning Alert + raw metrics 展开详情。 |
| 展开详情 | 点击 eval row | 显示结构化 metrics、失败用例、raw payload。 |
| 无权限 | 非 admin | Permission denied EmptyState，不发起 RAG admin API。 |

### 8.5 移动规则

- 指标卡使用 2 列小卡；超长指标名换行但不溢出。
- Case form 和 history 分段堆叠；历史记录优先卡片化。
- Raw metrics 展开区最大高度 `320px`，横向滚动局限在代码块内。

## 9. 404

### 9.1 目标

提供清晰返回路径：已登录用户返回工作台，未登录用户返回登录；未知地址不应被静默重定向。

涉及当前文件：`frontend/src/pages/NotFoundPage.tsx`

### 9.2 布局

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Brand / product context                                                       │
│ 404 title                                                                     │
│ Reason: current route is not available                                        │
│ Primary action: 返回研究工作台 / 返回登录                                      │
│ Secondary action: 返回上一页                                                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

视觉规格：

- 复用 AuthLayout 的品牌背景，但 404 文案更直接。
- 如果可读取登录态：已登录 primary action 指向 `/workspace/chat`，未登录 primary action 指向 `/login`。
- Secondary action 可使用 `history.back()` 或链接到登录，不能只提供一个无效入口。

### 9.3 状态稿

| 状态 | 触发 | 外观与交互 |
| --- | --- | --- |
| 正常 | 未知路由 | 显示 404 标识、说明、返回工作台/登录入口。 |
| 空态 | 不适用 | 404 本身即空状态，不另设空白页面。 |
| 加载 | 读取 auth session | 若 session 初始化有延迟，按钮先显示安全默认“返回登录”。 |
| 错误 | session 读取异常 | 不阻塞页面，提供返回登录。 |
| 已登录 | session 存在 | Primary CTA：返回研究工作台。 |
| 未登录 | 无 session | Primary CTA：返回登录。 |

### 9.4 移动规则

- 单列，CTA 宽度 100%，高度不小于 `44px`。
- 文案不超过 2 行，避免 404 页面在手机首屏过长。

## 10. 第二轮截图回归清单

| 页面 | Light | Dark | Desktop 1440x900 | Mobile 390x844 | 必须状态 |
| --- | --- | --- | --- | --- | --- |
| 历史回放 | 必须 | 必须 | 必须 | 必须 | 正常、空态、加载、错误、产物复用 |
| 账号中心 | 必须 | 必须 | 必须 | 必须 | 正常、API 未配置、保存成功、保存失败 |
| 模型配置 | 必须 | 必须 | 必须 | 必须 | 正常、空态、加载、错误、风险 provider |
| MCP 服务器 | 必须 | 必须 | 必须 | 必须 | 正常、空态、加载、错误、健康异常 |
| 审计 | 必须 | 必须 | 必须 | 必须 | 正常、空态、加载、错误、展开详情 |
| RAG 评估 | 必须 | 必须 | 必须 | 必须 | 正常、空态、加载、错误、metrics 展开详情 |
| 404 | 必须 | 必须 | 必须 | 必须 | 已登录、未登录 |

后续 T03-T07 补齐 1280x800 和 768x1024，并使用固定 mock 数据稳定截图。

## 11. 实现边界

| 后续任务 | 页面设计输入 |
| --- | --- |
| H01 | 使用历史回放规格；复用 `ExecutionTimeline` 和 artifact reuse 逻辑。 |
| A06 | 使用账号中心规格；表单错误和成功反馈必须留在对应 Panel。 |
| A02 | 使用模型配置规格；突出 default model、测试状态和 provider 风险。 |
| A03 | 使用 MCP 规格；测试成功不使用 error 样式，STDIO 风险必须明显。 |
| A04 | 使用审计结构化表格规格；raw JSON 只在展开详情中显示。 |
| A05 | 使用 RAG 指标分层规格；metrics 解析失败时 raw metrics 兜底。 |
| S03 | 使用 404 规格；已登录/未登录返回路径不同。 |
| T03-T07 | 使用第二轮截图回归清单补齐页面状态。 |

## 12. 当前状态

D05 已完成。下一项任务是 E01 “建立当前 UI 回归基线”。
