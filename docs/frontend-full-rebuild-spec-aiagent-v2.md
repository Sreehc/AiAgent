# AiAgent V2 前端完全重构规格

> 实施状态：前端完全重构已完成。本文档保留为产品与 UX 规格；涉及后端能力时，以当前接口为准。

## 1. Overview

本文档定义 AiAgent 前端完全重构的产品、UX 和工程交付规格。重构目标不是在现有界面上修补样式，而是以 Dify 类 AI 应用平台的信息架构作为主要参考，重新设计并实现一个适合研究任务、RAG 知识库、MCP 工具管理、模型配置、图片生成和历史回放的 AI Agent 工作台。

本次重构的核心判断：

- AiAgent 与 Dify 最相似的是“Agent/RAG/模型配置/工具管理/运行观测”的平台化结构。
- AiAgent 不应完全复制 Dify。Dify 更偏 AI 应用构建与发布平台，AiAgent 更偏研究执行、知识增强、多工具调用和运维控制台。
- 新前端必须从信息架构、页面布局、组件系统、交互状态和数据流呈现上整体重建，而不是对旧 JSX 和 CSS 做局部美化。

## 2. Problem Statement

当前前端已经覆盖登录、工作台、知识库、图片生成、历史回放、模型配置、MCP 服务器和账号中心，但页面结构仍偏功能堆叠，缺少一个清晰的产品级控制台框架。

主要问题：

- 信息架构不够平台化，工作台、知识库、模型、MCP、历史之间的关系不够清楚。
- 研究任务执行过程缺少足够强的“执行流”表达，计划、工具调用、结果和产物之间的层级需要重塑。
- 知识库页面需要升级为资源管理工作区，而不是简单上传和列表页。
- 管理页需要形成统一的配置管理体验，包括 provider 状态、密钥脱敏、测试连接、健康检查和错误恢复。
- 当前 UI 组件粒度不足，页面之间的按钮、表单、面板、状态、空态、加载和错误反馈容易不一致。
- 前端缺少明确的视觉系统和页面级布局规则，后续迭代容易继续变成零散页面。

## 3. Goals And Non-Goals

### 3.1 Goals

- 重建一个完整的登录后 AI Agent 控制台，而不是营销页或演示页。
- 建立清晰的信息架构：工作、知识、产物、系统、账号。
- 将研究工作台升级为核心体验：输入任务、绑定知识库、查看执行流、查看报告和产物。
- 将知识库页面升级为 Dify/RAGFlow 风格的知识资源工作区。
- 将模型配置和 MCP 管理升级为统一的系统配置体验。
- 将历史回放升级为可审计的执行记录，而不是普通历史列表。
- 建立可复用的 UI 组件系统、样式 token 和页面模板。
- 保留现有后端 API 契约、认证逻辑、路由路径和业务数据流。
- 保证桌面端体验优先，移动端基础可用。

### 3.2 Non-Goals

- 不迁移到 Next.js。
- 不重写后端 API。
- 不新增 Dify 的应用发布、外部嵌入、Marketplace、团队协作等完整平台能力。
- 不在第一阶段实现可视化 workflow canvas。
- 不把页面改成 landing page、官网、作品集或大面积装饰性视觉。
- 不为了重构引入大型 UI 框架并重写构建链路。

## 4. Reference Model

### 4.1 Dify 借鉴点

| Dify 能力 | AiAgent 重构借鉴方式 |
| --- | --- |
| Studio/Knowledge/Tools/Settings 的模块化控制台 | 重构主导航和页面分组，让用户明确当前在工作、知识、系统还是账号区域 |
| Agent/Workflow 运行与调试 | 用执行时间线表达 plan、step、tool call、summary 和 artifact |
| Knowledge/Dataset 管理 | 将知识库做成资源主页、文档表格、索引状态、检索测试和配置入口 |
| Model Provider 设置 | 模型配置页采用 provider 列表、能力标签、连接测试、密钥脱敏和状态反馈 |
| 运行日志和监控 | 历史回放页突出可审计执行链路和产物引用 |

### 4.2 AiAgent 差异化重点

| AiAgent 特性 | 重构要求 |
| --- | --- |
| 研究任务工作台 | 核心页面必须服务“发起研究 -> 过程可见 -> 报告产出 -> 产物复用” |
| MCP HTTP/SSE/STDIO 管理 | MCP 服务器页必须比普通工具列表更偏运维：健康、发现、白名单、工具清单 |
| 图片生成工作室 | 保留独立图片工作区，支持文本生图、参考图编辑、历史和产物关联 |
| 个人资源归属 | 会话、知识库、产物默认强调个人归属和权限边界 |

## 5. Target Users

| 用户 | 目标 | 重构关注点 |
| --- | --- | --- |
| 普通研究用户 | 发起研究任务、绑定知识库、查看报告和复用产物 | 工作台效率、执行过程可理解、历史可找回 |
| 业务分析用户 | 上传资料、运行分析、生成报告和图片 | 知识库状态清晰、结果可阅读、产物入口稳定 |
| 管理员 | 配置模型、维护 MCP、管理系统能力 | 配置项明确、状态和错误可见、操作风险可控 |
| 开发/运维用户 | 联调模型、MCP、SSE 和存储链路 | endpoint、provider、健康检查、调用记录可审计 |

## 6. Product Information Architecture

### 6.1 Navigation

登录后主导航必须重建为平台型控制台结构：

```text
AiAgent
├── Work
│   ├── 研究工作台          /workspace/chat
│   ├── 知识库              /workspace/knowledge-bases
│   ├── 图片工作室          /workspace/image-generation
│   └── 历史回放            /workspace/history
├── System, admin only
│   ├── 模型配置            /admin/settings
│   └── MCP 服务器          /admin/mcp-servers
└── Account
    └── 账号中心            /account
```

### 6.2 Global Shell

Shell 必须包含：

- 左侧主导航，桌面端固定宽度。
- 顶部栏，展示当前页面标题、全局搜索/命令入口、用户角色和关键操作。
- 页面内容区，所有页面使用统一的宽度、间距和滚动规则。
- 管理员入口根据角色显示，普通用户不可见。
- `Cmd/Ctrl + K` 命令面板作为全局快速跳转入口。

### 6.3 Page Categories

| 分类 | 页面 | 页面模式 |
| --- | --- | --- |
| Auth | 登录、注册、找回密码、重置密码 | 双栏认证表单，移动端单列 |
| Work | 研究工作台 | 三栏/双栏执行工作区 |
| Knowledge | 知识库 | 资源列表 + 详情/文档/检索测试 |
| Studio | 图片工作室 | 参数面板 + 结果画廊 + 历史 |
| Observability | 历史回放 | 过滤列表 + 执行详情 + 产物 |
| System | 模型配置、MCP 服务器 | 配置资源管理页 |
| Account | 账号中心 | 分区设置页 |

## 7. Core UX Principles

- 执行过程必须可见：所有长任务都要显示阶段、状态和错误。
- 资源对象必须清楚：会话、知识库、文档、模型、MCP、图片、产物都要有明确状态和操作。
- 配置页面必须可验证：模型和 MCP 配置不能只保存，还要能展示健康或测试结果。
- 页面必须支持空态、加载、错误和成功状态。
- 管理员能力必须在导航、页面和操作层面隔离。
- 不做卡片堆叠式 UI。页面以分区、表格、列表、面板和详情抽屉组织信息。
- 不做大面积紫蓝渐变、玻璃拟态、装饰性背景和 landing page 英雄区。

## 8. Functional Requirements

### 8.1 Auth

- FR-AUTH-1：登录页必须支持用户名、密码、提交中、错误提示和回车提交。
- FR-AUTH-2：邀请注册页必须支持邀请码、用户名、显示名、密码和确认密码。
- FR-AUTH-3：找回密码和重置密码页必须保持当前 API 流程，并提供清楚的成功/失败反馈。
- FR-AUTH-4：未登录访问业务页必须跳转登录页。
- FR-AUTH-5：认证页必须使用统一 auth layout，不复用工作台 shell。

### 8.2 Research Workspace

- FR-WORK-1：工作台必须成为重构后的核心首页。
- FR-WORK-2：页面必须支持会话列表、当前会话区、执行流区、输入区和产物区。
- FR-WORK-3：用户发送任务后必须立即显示用户输入和执行中状态。
- FR-WORK-4：SSE 执行事件必须映射到可读的执行时间线。
- FR-WORK-5：计划步骤必须展示状态、序号、标题、说明和结果。
- FR-WORK-6：工具调用必须展示工具名、状态、耗时、输入摘要、输出摘要和错误。
- FR-WORK-7：最终报告必须作为主要结果展示，并支持 Markdown/HTML 内容的稳定阅读。
- FR-WORK-8：产物面板必须展示当前后端返回的报告、图片和参考图；附件和工具输出引用待后端扩展产物类型后接入。
- FR-WORK-9：工作台必须提供知识库绑定入口，并显示当前绑定状态。
- FR-WORK-10：执行失败或 SSE 中断时必须保留上下文并给出恢复路径。

### 8.3 Knowledge Bases

- FR-KB-1：知识库页必须以资源管理工作区形式重建。
- FR-KB-2：必须展示知识库列表、文档数量、索引状态、更新时间和可用操作。
- FR-KB-3：必须支持新建知识库、上传文档、查看文档状态。
- FR-KB-4：文档表格必须展示解析、分块、索引、失败等状态。
- FR-KB-5：必须提供检索测试区域，支持输入查询并展示召回片段。
- FR-KB-6：必须展示索引中、失败、空库和无检索结果等状态。
- FR-KB-7：知识库详情和文档列表可以采用同页分栏、详情抽屉或详情页，但交互必须稳定。

### 8.4 Image Studio

- FR-IMG-1：图片工作室必须保留独立路由和明确定位。
- FR-IMG-2：必须支持文本生图和参考图编辑两种模式。
- FR-IMG-3：参数输入区必须包含后端已支持的 prompt、模式、尺寸和会话关联；当前后端不支持数量参数。
- FR-IMG-4：结果区必须展示生成状态、图片预览、失败原因和历史入口。
- FR-IMG-5：图片历史必须可分页或分批加载。
- FR-IMG-6：图片结果必须能作为产物与会话或历史记录关联，若后端当前能力有限，前端需要保留入口和降级提示。

### 8.5 History Replay

- FR-HIST-1：历史页必须从普通列表升级为执行回放工作区。
- FR-HIST-2：必须支持会话筛选、状态筛选和关键词搜索。
- FR-HIST-3：选中历史记录后必须展示计划、工具调用、报告和产物。
- FR-HIST-4：回放详情必须清楚区分原始输入、执行过程、最终结果和产物。
- FR-HIST-5：历史数据加载失败时必须允许重试，不得清空已加载列表。

### 8.6 Model Settings

- FR-MODEL-1：模型配置页必须按 provider 或模型能力分组展示。
- FR-MODEL-2：必须区分 Chat、Embedding、Image 模型能力。
- FR-MODEL-3：API key 必须脱敏展示。
- FR-MODEL-4：保存配置时必须有提交中、成功和失败反馈。
- FR-MODEL-5：如果后端支持测试连接，前端必须提供测试入口；如果不支持，需在 spec implementation notes 中标记为待后端补齐。
- FR-MODEL-6：生产危险配置必须有明显提示，例如 mock provider、缺失 key 或维度不匹配。

### 8.7 MCP Servers

- FR-MCP-1：MCP 服务器页必须作为系统能力管理页重建。
- FR-MCP-2：必须展示服务器类型：HTTP/SSE、Streamable HTTP、STDIO。
- FR-MCP-3：必须展示当前接口返回的健康状态、工具发现结果和错误消息；上次检查时间待后端提供字段后接入。
- FR-MCP-4：必须支持新增、编辑、删除、发现工具和健康检查。
- FR-MCP-5：工具列表必须展示当前接口返回的工具名、类型和描述；参数摘要与可用状态待后端提供字段后接入。
- FR-MCP-6：STDIO 配置必须突出可执行文件白名单和安全风险。

### 8.8 Account

- FR-ACC-1：账号中心必须分为资料、安全和登录日志。
- FR-ACC-2：必须支持查看和更新个人资料。
- FR-ACC-3：必须支持修改密码。
- FR-ACC-4：登录日志必须展示时间、IP/设备信息和状态，按后端现有字段降级。
- FR-ACC-5：退出登录入口必须稳定可见，但避免误触。

### 8.9 Global Command Palette

- FR-CMD-1：必须保留 `Cmd/Ctrl + K`。
- FR-CMD-2：必须支持页面跳转命令。
- FR-CMD-3：管理员命令只对管理员显示。
- FR-CMD-4：必须支持键盘上下选择、Enter 执行和 Esc 关闭。
- FR-CMD-5：命令面板不得依赖某个页面的局部状态。

## 9. Non-Functional Requirements

### 9.1 Performance

- NFR-PERF-1：初始页面交互必须保持轻量，不引入大型图表或动画依赖作为基础包。
- NFR-PERF-2：长列表必须避免一次性渲染过多复杂节点；若数据规模变大，需预留分页或虚拟列表接口。
- NFR-PERF-3：SSE 流式追加内容必须避免导致整个页面频繁重渲染。

### 9.2 Accessibility

- NFR-A11Y-1：所有按钮、表单、弹窗、菜单必须可键盘操作。
- NFR-A11Y-2：focus-visible 样式必须清楚。
- NFR-A11Y-3：状态颜色不得作为唯一信息来源，必须配合文本或图标。
- NFR-A11Y-4：弹窗和命令面板必须处理焦点进入、关闭和返回。

### 9.3 Responsive

- NFR-RESP-1：桌面端是主体验，必须支持 1280px 及以上宽度。
- NFR-RESP-2：平板端侧栏可折叠，内容区保持可用。
- NFR-RESP-3：移动端至少支持核心查看、提交和配置操作，不要求三栏同时展示。

### 9.4 Reliability

- NFR-REL-1：所有 API 请求必须有 loading、success、error 状态。
- NFR-REL-2：执行中断不能导致用户输入和已有事件丢失。
- NFR-REL-3：删除、重置、覆盖配置等危险操作必须二次确认。
- NFR-REL-4：页面刷新后必须能基于现有 session 恢复登录态。

## 10. Visual System Requirements

### 10.1 Direction

采用浅色、克制、信息密度较高的 AI operations console 风格。视觉质量来自清晰层级、稳定布局、低噪声色彩和准确状态表达。

禁止：

- 大面积紫蓝渐变。
- 毛玻璃背景。
- 装饰性光斑和漂浮元素。
- 超大圆角卡片堆叠。
- 营销页式 hero。
- 每个页面都使用不同色彩主题。

### 10.2 Tokens

必须建立或重建以下 token：

- color：background、surface、text、muted、border、primary、accent、success、warning、danger、info。
- typography：sans、mono、尺寸、行高。
- spacing：4px 基础网格。
- radius：6px、8px、12px、16px、pill。
- shadow：仅用于 dialog、popover、toast、command palette。
- z-index：shell、overlay、modal、toast。

### 10.3 Components

必须重建或规范以下通用组件：

- Button
- IconButton
- Field
- Input
- Textarea
- Select
- Checkbox/Switch
- Tabs
- Badge
- StatusPill
- Panel
- Table/List
- Dialog
- ConfirmDialog
- Toast
- EmptyState
- Spinner/Skeleton
- CommandPalette

组件必须覆盖 default、hover、active、focus、disabled、loading 和 error 等基础状态。

## 11. Engineering Scope

### 11.1 Must Preserve

以下职责必须保留：

- `frontend/src/services/api.ts`
- `frontend/src/stores/auth.ts`
- `frontend/src/hooks/useAuthSession.ts`
- `frontend/src/components/ProtectedRoute.tsx`
- 现有业务路由路径。
- React + Vite + TypeScript 技术栈。
- 后端 API 契约和 SSE 数据流。

### 11.2 Can Rebuild

以下区域允许删除并重写：

- Shell、导航、顶栏和用户菜单。
- 全部页面 JSX 和页面级 CSS。
- 通用 UI 组件。
- 命令面板、Toast、ConfirmDialog、EmptyState。
- 所有可见样式文件。

### 11.3 Recommended File Structure

```text
frontend/src/
  app/
  router/
  services/
  stores/
  hooks/
  components/
    shell/
    ui/
    command/
    workspace/
    knowledge/
    image/
    history/
    system/
  pages/
  styles/
    tokens.css
    base.css
    layout.css
    components.css
    pages.css
```

## 12. Data And API Notes

- 前端必须优先复用 `api.ts` 中现有类型和请求封装。
- 不得为了 UI 重构改变 API response wrapper。
- 如果页面 spec 中某能力后端尚未支持，前端必须以禁用入口、占位状态或 implementation note 表达，不得伪造成功。
- SSE 事件必须进入统一的前端 view model，再渲染为执行时间线。
- 所有资源状态必须有明确映射表，例如 `RUNNING -> 执行中`、`FAILED -> 失败`。

当前后端约束：

- 会话任务通过 `POST /sessions/{sessionId}/stream` 创建并执行，不存在独立 `/runs` 创建接口。
- 会话运行支持 pause/resume/cancel 控制 API，前端应显示 `PAUSED`、`CANCELLED`、`TIMED_OUT` 等状态。
- 个人 API 配置已进入 Chat、Embedding、Image 运行时，并提供连接测试接口。
- 模型配置支持新增、编辑、启停、删除、默认和连接测试。
- MCP HTTP 类和 STDIO 发现与调用可用；健康检查真实探测服务并返回延迟、工具数和错误分类。
- OpenAI-compatible 图片 provider 已实现参考图编辑 multipart 契约。
- 产物类型包括 `REPORT`、`IMAGE`、`IMAGE_REFERENCE`、`ATTACHMENT`、`TOOL_OUTPUT`、`CONTEXT_SNIPPET`。

## 13. Acceptance Criteria

### 13.1 Product Acceptance

- AC-PROD-1：登录后用户能清楚理解系统由工作台、知识库、图片、历史、系统配置和账号组成。
- AC-PROD-2：用户可以从工作台完成“输入任务 -> 查看执行 -> 查看报告 -> 找到产物”闭环。
- AC-PROD-3：用户可以从知识库完成“创建/选择知识库 -> 上传文档 -> 查看索引状态 -> 检索测试”闭环。
- AC-PROD-4：管理员可以从系统区完成模型配置和 MCP 服务器管理。
- AC-PROD-5：历史回放能恢复一次执行的关键过程和结果。

### 13.2 UX Acceptance

- AC-UX-1：每个页面都有 default、loading、empty、error 状态。
- AC-UX-2：所有危险操作都有确认。
- AC-UX-3：所有长任务都有可见进度或状态。
- AC-UX-4：主导航 active state 清楚，管理员入口权限隔离。
- AC-UX-5：命令面板可用键盘完整操作。

### 13.3 Engineering Acceptance

- AC-ENG-1：`pnpm build` 通过。
- AC-ENG-2：TypeScript 无新增类型错误。
- AC-ENG-3：未修改后端 API 契约。
- AC-ENG-4：未破坏现有路由路径。
- AC-ENG-5：新组件有稳定 props，不把页面业务逻辑塞入通用组件。
- AC-ENG-6：CSS token 化，页面不再依赖大量一次性颜色和 spacing。

### 13.4 Visual Acceptance

- AC-VIS-1：界面看起来像生产级控制台，而不是 landing page 或 demo。
- AC-VIS-2：颜色、圆角、阴影、字体和间距在所有页面一致。
- AC-VIS-3：无大面积紫蓝渐变、毛玻璃和装饰性背景。
- AC-VIS-4：按钮、输入框、表格、状态 pill 和面板的样式统一。
- AC-VIS-5：桌面端、平板端和移动端没有明显文本溢出或控件重叠。

## 14. Rollout Plan

### Phase 1: Foundation

- 重建 style tokens、base、layout。
- 重建 UI primitives。
- 重建 AppShell、Sidebar、Topbar、UserMenu。
- 保留路由和认证逻辑。

Exit criteria：

- 登录后 shell 可用。
- 所有路由能进入占位页面。
- `pnpm build` 通过。

### Phase 2: Core Workspace

- 重建研究工作台。
- 建立执行时间线 view model。
- 重建 composer、session list、artifact panel、tool invocation list。
- 完成 SSE 正常、失败、中断状态展示。

Exit criteria：

- 一次研究任务可以完整运行并展示过程。
- 报告和产物入口稳定可见。

### Phase 3: Resource Workspaces

- 重建知识库页。
- 重建图片工作室。
- 重建历史回放页。

Exit criteria：

- 知识库、图片、历史三条用户链路可用。
- 所有资源页具备空态、加载和错误状态。

### Phase 4: System And Account

- 重建模型配置页。
- 重建 MCP 服务器页。
- 重建账号中心。
- 完善命令面板、toast、confirm dialog。

Exit criteria：

- 管理员系统配置链路可用。
- 普通用户不可见管理员入口。

### Phase 5: QA And Polish

- 完成桌面、平板、移动端检查。
- 完成可访问性基础检查。
- 完成构建和关键链路手测。
- 删除旧样式和未使用组件。

Exit criteria：

- `pnpm build` 通过。
- 关键路径无阻塞问题。
- 旧 UI 残留被清理。

## 15. Risks And Dependencies

| 风险 | 影响 | 处理方式 |
| --- | --- | --- |
| 后端 API 字段不足以支持部分新 UI | 页面无法完整展示状态 | 先降级展示现有字段，并记录后端补齐项 |
| SSE 事件结构不稳定 | 执行时间线难以统一 | 增加前端事件归一层 |
| 一次性重写范围过大 | 回归风险高 | 按 Phase 分支或小 PR 交付 |
| 新组件过度抽象 | 影响开发速度 | 只抽象跨页面重复出现的模式 |
| 移动端三栏布局复杂 | 可用性下降 | 移动端改为 tabs/stacked layout |

## 16. 已决事项与后续问题

- OQ-1：当前未新增图标库或 Radix，基础组件由项目自建。
- OQ-2：模型配置与个人 API 配置目前没有后端测试连接接口。
- OQ-3：图片产物与会话关联已可用。
- OQ-4：知识库检索测试已返回 citation、chunk、score、section、headingPath 和 retrievalStrategy 等字段。
- OQ-5：历史回放保持列表页内详情面板。
- OQ-7：是否计划 V2 增加可视化 workflow canvas？若计划，应避免当前工作台结构阻碍后续扩展。

## 17. Implementation Notes

- 本 spec 是完全重构规格，实施时可以复用业务 API 调用和状态处理，但不应复用旧页面结构作为主要布局。
- 优先实现“能解释任务执行过程”的界面，因为这是 AiAgent 相比普通 Chat UI 的核心价值。
- Dify 是信息架构和平台成熟度参考，不是视觉或功能逐项复制对象。
- 若实施中发现现有 `docs/frontend-ui-rebuild-plan-aiagent-v1.md` 与本文冲突，以本文作为 V2 重构规格；旧文档可作为视觉 token 和局部组件细节参考。
