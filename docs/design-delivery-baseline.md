# AiAgent UI 升级设计交付基线

> 任务来源：`docs/tasks.md` D01。本文档固化 UI 升级进入高保真设计前的交付基线，供产品、设计、开发和测试共同使用。

## 1. 基线结论

| 项目 | 决策 |
| --- | --- |
| 视觉方向 | graphite/zinc 中性色 + restrained cyan/teal 强调色 |
| 默认主题 | 跟随系统设置 |
| 手动主题 | 用户切换后持久化偏好 |
| UI 字体 | Geist Sans |
| Mono 字体 | IBM Plex Mono |
| 字体托管 | 本地托管优先；无法托管时使用系统 fallback |
| assistant-ui | 仅作为交互参考，不接入 runtime，不做局部 PoC |
| 研究工作台右侧 | Inspector Tabs |
| 管理页 | 新增仪表盘式总览 |
| 图片工作室 | 支持批量选择、收藏、对比视图、下载集合 |
| 回归验证 | 纳入 Playwright 截图回归或端到端检查 |

## 2. 第一轮高保真范围

第一轮设计稿覆盖核心五类页面，作为开发启动门槛：

| 页面 | 必须覆盖的状态 |
| --- | --- |
| 登录/注册组合页 | 默认、输入中、提交中、错误、成功/跳转提示、移动端 |
| 研究工作台 | 空态、运行中、暂停、完成、失败、SSE 中断、Inspector Tabs、移动端 |
| 知识库 | KB 列表、文档表格、索引中、索引失败、检索命中、检索无结果、移动端 |
| 图片工作室 | 最新输出、历史网格、批量选择、收藏、对比视图、下载集合、图片加载失败、移动端 |
| 管理总览 | 正常状态、风险状态、无风险空态、指标跳转、移动端 |

## 3. 第二轮高保真范围

第二轮设计稿覆盖其余业务页面：

| 页面 | 必须覆盖的状态 |
| --- | --- |
| 历史回放 | 列表、筛选、回放详情、产物复用、加载失败 |
| 账号中心 | 个人 API 配置、资料、安全、登录日志、保存成功、保存失败 |
| 模型配置 | 模型列表、默认模型、异常 provider、连接测试成功/失败 |
| MCP 服务器 | 服务列表、健康检查、工具发现、工具测试成功/失败 |
| 审计 | 用户/任务/工具/登录 tab、结构化表格、展开详情、空态 |
| RAG 评估 | 指标卡、用例列表、评估历史、metrics 解析成功/失败 |
| 404 | 已登录返回工作台、未登录返回登录 |

## 4. 组件设计范围

高保真组件规范必须覆盖以下组件：

| 组件 | 必须覆盖的状态 |
| --- | --- |
| Button | default、hover、focus、active、disabled、loading、danger |
| IconButton | default、hover、focus、active、disabled、danger、aria label 说明 |
| Badge | neutral、primary、success、warning、danger、info |
| StatusPill | idle、running、paused、completed、failed、cancelled、unknown |
| Panel | default、subtle、raised、empty、with action、with footer |
| Table | loading、empty、error、hover row、expanded row、numeric column |
| Tabs | default、active、hover、focus、overflow/mobile |
| Alert | info、success、warning、error |
| EmptyState | plain、with action、permission denied、no results |
| Skeleton | list、table、card、feed item |
| Dialog | default、danger confirm、loading action、mobile |
| DropdownMenu | default、selected、disabled、danger item |
| CommandPalette | default、searching、empty、keyboard focus、admin-only items |
| JsonBlock/Details | collapsed、expanded、long payload、parse error |

## 5. 截图和 E2E 基线

| 类型 | 基线 |
| --- | --- |
| Desktop | 1440x900 |
| Laptop | 1280x800 |
| Tablet | 768x1024 |
| Mobile | 390x844 |
| 主题 | light 和 dark 各一组 |
| 首轮截图页面 | 登录/注册、研究工作台、知识库、图片工作室、管理总览 |
| 稳定性要求 | 使用固定测试数据；避免动态时间、随机 ID 和不可控动画影响截图 |

## 6. 设计交付物

设计阶段应交付：

- 高保真页面稿。
- 设计 token 清单。
- 组件状态清单。
- 页面状态清单。
- 响应式规则。
- 截图回归页面清单。
- 对仍无法由现有接口支持的数据字段做显式标注。

## 7. 开发进入条件

进入前端实现前，必须满足：

- 第一轮高保真范围已完成并评审通过。
- 视觉方向未偏离 graphite/zinc + cyan/teal。
- 亮色和暗色主题均有明确设计。
- 字体、颜色、间距、圆角、阴影、状态色和 focus ring 均已定义。
- 研究工作台的 Agent feed 与 Inspector Tabs 已明确布局和状态。
- 图片工作室的批量选择、收藏、对比视图和下载集合已明确交互。
- 管理总览的指标卡和跳转行为已明确。

## 8. 当前状态

D01 已完成。后续任务从 D02 “产出视觉系统高保真” 开始。
