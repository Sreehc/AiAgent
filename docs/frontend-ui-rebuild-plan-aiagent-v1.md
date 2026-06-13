# AiAgent V1 前端 UI 删除重建设计与实施计划

> 文档状态：历史实施计划。前端重构已完成，当前实现状态以 `frontend-full-rebuild-tech-design-aiagent-v2.md` 的 Implementation Completion 和实际代码为准。

## 1. 文档目的

本文档用于指导后续 Codex 对 AiAgent V1 前端进行可见 UI 层的完全重构。

本次重构的边界是：删除并重建用户能看到、能交互的前端页面、组件和样式系统；保留 API、路由结构、认证/session、后端契约和核心业务数据流。

目标不是做一个营销页，也不是做炫技型 demo，而是把现有前端重建为一个稳定、清晰、适合反复使用的 AI Agent 工作台。

## 2. Design Read

Reading this as: AI agent operations console for analysts, admins, and technical operators, with a calm product UI language, leaning toward a restrained custom React/Vite design system rather than a landing-page aesthetic.

基于 taste skill，本项目不应使用 landing page / portfolio 的默认高表现力方案。当前产品是登录后使用的工作台，视觉设计应该服务于任务执行、状态理解、配置管理和历史追踪。

推荐 taste dials：

| Dial | Value | Reason |
| --- | ---: | --- |
| DESIGN_VARIANCE | 4-5 | 后台/工作台需要稳定结构，允许轻微品牌差异，但不做大幅艺术化布局。 |
| MOTION_INTENSITY | 2-3 | 动效只用于反馈状态，不做大面积滚动动画或装饰性动效。 |
| VISUAL_DENSITY | 6 | 产品需要展示会话、计划、工具调用、知识库、配置项等较多信息。 |

设计关键词：

- AI research operations console
- calm operator workspace
- precise configuration surfaces
- high signal, low decoration
- structured execution trace

明确避免：

- AI 紫蓝渐变、玻璃拟态大面积背景、中心 hero、三张功能卡片模板。
- 大量 `24px+` 圆角和厚重阴影。
- 装饰性 serif 标题作为全站默认风格。
- 所有内容都包进卡片，导致页面层级混乱。
- 为了“高级感”牺牲信息密度和操作效率。

## 3. 重构范围

### 3.1 必须保留

以下文件或职责属于业务骨架，不应在 UI 重建中删除：

| Path | Keep Reason |
| --- | --- |
| `frontend/src/services/api.ts` | 后端 API 类型、请求封装、SSE stream 解析逻辑。 |
| `frontend/src/stores/auth.ts` | 登录 session 存储和认证状态。 |
| `frontend/src/hooks/useAuthSession.ts` | 页面读取和更新登录状态的 hook。 |
| `frontend/src/router/AppRouter.tsx` | 路由路径结构和 ProtectedRoute 关系。可小改 import，但不要改变业务路径。 |
| `frontend/src/components/ProtectedRoute.tsx` | 登录态保护逻辑。 |
| `frontend/src/main.tsx` | React mount 入口。仅在引入新全局 provider 时小改。 |
| `frontend/package.json` | 当前 React/Vite 技术栈。新增依赖需谨慎。 |
| `frontend/vite.config.ts` | 构建配置。除非新方案需要，否则不改。 |

### 3.2 可以删除并重建

以下属于可见 UI 层，可完全重写：

| Area | Files |
| --- | --- |
| 应用框架 | `frontend/src/components/AppShell.tsx` |
| 全局反馈 | `Toast.tsx`, `ConfirmDialog.tsx`, `CommandPalette.tsx`, `EmptyState.tsx`, `Confetti.tsx` |
| 认证页面 | `LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx` |
| 工作台页面 | `WorkspacePage.tsx` |
| 功能页面 | `KnowledgeBasesPage.tsx`, `ImageGenerationPage.tsx`, `HistoryPage.tsx`, `AccountPage.tsx` |
| 管理页面 | `AdminSettingsPage.tsx`, `McpServersPage.tsx` |
| 样式文件 | `global.css`, `variables.css`, `animations.css`, `page-layout.css`, `command-palette.css`, `empty-state.css`, `confetti.css` |

注意：重写页面时可以复制原页面中的 API 调用函数和状态逻辑，但 JSX、className、布局结构和样式应重新设计。

## 4. 技术方案

### 4.1 保持 React + Vite + TypeScript

不建议迁移 Next.js。当前项目是产品工作台，保留 Vite 能降低构建和路由迁移成本。

### 4.2 样式策略

推荐继续使用原生 CSS + CSS variables，不引入 Tailwind 作为第一阶段重构依赖。

理由：

- 当前项目已有 CSS token 基础，迁移成本低。
- 不需要重写构建链路。
- 后续 Codex 可直接按 CSS 文件分层实现，diff 清晰。
- 本项目不是营销页面，组件样式更适合稳定 token 化，而不是大量 utility class。

可选增强：后续如果 Dialog、Popover、Tabs、Tooltip、Dropdown 交互复杂度增加，可以引入 Radix primitives。但第一阶段不需要强制引入。

### 4.3 图标策略

当前 `package.json` 没有图标库。重构有两种选择：

1. 不新增依赖，先用文本导航和少量 CSS 状态符号完成重建。
2. 新增一个图标库，建议 `@phosphor-icons/react`，全站统一使用，不混用多套图标。

如果使用图标库，应先修改 `package.json` 并安装依赖，再在导航、按钮、状态、空态中使用。图标 stroke/weight 需全站统一。

## 5. 新 UI 信息架构

保持现有路由：

```text
/login
/register/invite
/forgot-password
/reset-password

/workspace/chat
/workspace/knowledge-bases
/workspace/image-generation
/workspace/history
/account

/admin/settings
/admin/mcp-servers
```

登录后主导航建议分组：

```text
AiAgent
├── Work
│   ├── Research Workspace      (/workspace/chat)
│   ├── Knowledge Bases         (/workspace/knowledge-bases)
│   ├── Image Studio            (/workspace/image-generation)
│   └── History                 (/workspace/history)
├── System, admin only
│   ├── Model Settings          (/admin/settings)
│   └── MCP Servers             (/admin/mcp-servers)
└── Account                     (/account)
```

中文 UI 文案可保留，但导航层级要更像工具产品：

- 研究工作台
- 知识库
- 图片工作室
- 历史回放
- 模型配置
- MCP 服务器
- 账号中心

## 6. 视觉系统

### 6.1 Overall Direction

新界面应采用浅色专业控制台风格。核心视觉来自清晰结构、稳定间距、低噪声颜色和明确状态，而不是大背景渐变或装饰性卡片。

页面背景：接近白色或冷中性浅灰。  
主色：保留墨绿，但降低饱和和使用面积。  
强调色：保留橙色，仅用于关键 CTA、警告或少量 highlight。  
状态色：成功、警告、错误、信息必须语义明确，不和品牌色混淆。

### 6.2 Color Tokens

建议新建 `frontend/src/styles/tokens.css`，替代旧 `variables.css`。

推荐 token 方向：

```css
:root {
  --color-bg: #f7f8f6;
  --color-surface: #ffffff;
  --color-surface-subtle: #f0f3ef;
  --color-surface-raised: #ffffff;

  --color-text: #17201c;
  --color-text-muted: #5f6b65;
  --color-text-soft: #87918c;

  --color-border: #dbe2dd;
  --color-border-strong: #b8c4bd;

  --color-primary: #17483d;
  --color-primary-hover: #0f372f;
  --color-primary-soft: #e1eee9;

  --color-accent: #d9763d;
  --color-accent-soft: #f7e7dc;

  --color-success: #187047;
  --color-warning: #a96314;
  --color-danger: #b33a2f;
  --color-info: #3366a8;
}
```

要求：

- 主背景不再使用大面积 radial gradient。
- 主 CTA 可以使用实色，不使用渐变按钮作为默认。
- 页面中只允许一个品牌 accent 体系；不要某些页面变蓝、某些页面变紫。
- 管理配置页优先使用中性色和状态色，避免花哨。

### 6.3 Typography

建议全站使用 sans 字体，不再把 serif 作为标题默认。

```css
:root {
  --font-sans: "IBM Plex Sans", "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;

  --text-xs: 12px;
  --text-sm: 13px;
  --text-md: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 22px;
  --text-2xl: 28px;
}
```

使用规则：

- 应用内页面标题最大到 `28px`，不要使用 landing page 级别大标题。
- 表格、列表、元信息使用 `13px/14px`，保证信息密度。
- 工具调用 payload、ID、token、endpoint 使用 mono。
- 不使用负 letter-spacing。
- 中文界面不要过度大写英文 eyebrow。

### 6.4 Radius, Shadow, Border

推荐统一圆角系统：

```css
:root {
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-pill: 999px;
}
```

使用规则：

- 按钮、输入框：`8px`。
- 面板、dialog、toast：`12px`。
- 大型工作区容器：最多 `16px`。
- 不再使用 `24px/28px` 作为常规卡片圆角。
- 阴影仅用于浮层：dialog、popover、toast、command palette。
- 普通页面区域用 border 和背景层级，不用重阴影。

### 6.5 Spacing

推荐 4px 基础网格：

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
}
```

工作台页面建议：

- shell padding: `24px` desktop, `16px` tablet/mobile。
- panel padding: `16px` or `20px`。
- dense list item height: `44px-56px`。
- form field height: `40px-44px`。

### 6.6 Motion

只保留必要动效：

- Button hover/active: 120-160ms。
- Dialog/command palette enter: 160-200ms。
- Toast enter/exit: 180ms。
- Streaming indicator: subtle pulse。
- Loading skeleton: optional, low contrast。

必须支持 `prefers-reduced-motion: reduce`。

禁止：

- 页面大面积 entrance animation。
- 每个卡片 hover 都上浮。
- 光泽扫过按钮作为默认。
- 背景持续流动动画。

## 7. 文件结构建议

重建后建议结构：

```text
frontend/src/
  app/
    App.tsx
  router/
    AppRouter.tsx
  services/
    api.ts
  stores/
    auth.ts
  hooks/
    useAuthSession.ts
    useKeyboard.ts

  components/
    shell/
      AppShell.tsx
      Sidebar.tsx
      Topbar.tsx
      UserMenu.tsx
    ui/
      Badge.tsx
      Button.tsx
      Dialog.tsx
      EmptyState.tsx
      Field.tsx
      Input.tsx
      Panel.tsx
      Select.tsx
      Spinner.tsx
      StatusPill.tsx
      Tabs.tsx
      Textarea.tsx
      Toast.tsx
    command/
      CommandPalette.tsx
    workspace/
      SessionList.tsx
      ResearchComposer.tsx
      ExecutionTimeline.tsx
      ArtifactPanel.tsx
      ToolInvocationList.tsx

  pages/
    LoginPage.tsx
    RegisterPage.tsx
    ForgotPasswordPage.tsx
    ResetPasswordPage.tsx
    WorkspacePage.tsx
    KnowledgeBasesPage.tsx
    ImageGenerationPage.tsx
    HistoryPage.tsx
    AccountPage.tsx
    AdminSettingsPage.tsx
    McpServersPage.tsx

  styles/
    tokens.css
    base.css
    layout.css
    components.css
    pages.css
```

`global.css` 可以保留为 import 汇总文件：

```css
@import "./tokens.css";
@import "./base.css";
@import "./layout.css";
@import "./components.css";
@import "./pages.css";
```

## 8. App Shell 设计

### 8.1 Desktop Layout

```text
┌────────────────────────────────────────────────────────────┐
│ Sidebar 248px │ Topbar: page title / search / actions / user │
│               ├──────────────────────────────────────────────┤
│ Navigation    │ Page content                                 │
│ Account       │                                              │
│ Logout        │                                              │
└────────────────────────────────────────────────────────────┘
```

Shell 规则：

- Sidebar fixed width: `248px`。
- Main content uses `minmax(0, 1fr)`，避免内容撑破。
- Topbar sticky optional，高度 `64px`。
- 页面标题放 topbar 或页面 header，二者不要重复。
- admin navigation 只在 `ADMIN` role 下显示。
- 当前路由必须有 active state。

### 8.2 Mobile Layout

移动端不保留固定 sidebar：

- Topbar 显示产品名、当前页、菜单按钮。
- 点击菜单打开 drawer 或全屏导航面板。
- 主内容单列。
- 工作台三栏降级为：会话选择 -> composer -> result tabs。

### 8.3 Command Palette

保留 `Cmd/Ctrl + K`。

命令建议：

- 打开研究工作台
- 打开知识库
- 打开图片工作室
- 打开历史回放
- 打开账号中心
- 管理员：打开模型配置、MCP 服务器
- 退出登录

Command palette 应为浮层，不依赖页面布局。必须支持 Esc 关闭、键盘上下选择、Enter 执行。

## 9. 通用组件规格

### 9.1 Button

Variants：

- `primary`: 主 CTA，例如运行任务、保存配置。
- `secondary`: 次级操作。
- `ghost`: 导航或轻量操作。
- `danger`: 删除会话、删除配置。

States：default, hover, active, focus-visible, disabled, loading。

要求：

- 不使用渐变作为默认按钮。
- loading 状态保持按钮宽度稳定。
- danger 操作必须视觉明确，但不大面积使用红色背景。

### 9.2 Form Fields

组件：Input, Textarea, Select, Field wrapper。

要求：

- label、description、error 三层结构统一。
- focus-visible ring 明确。
- error message 靠近字段。
- disabled/read-only 状态清晰。

### 9.3 Panel

用于页面主要区域。

Variants：

- `plain`: 无边框，仅排版。
- `outlined`: 常规面板。
- `subtle`: 次级背景。
- `raised`: 仅浮层或特殊强调。

不要在 panel 里继续嵌套大量 card。列表项可以使用 `border-top` 或 `divide-y`。

### 9.4 StatusPill

覆盖状态：

- Session: IDLE, RUNNING, COMPLETED, FAILED
- Run: PENDING, RUNNING, COMPLETED, FAILED
- PlanStep: PENDING, RUNNING, COMPLETED, FAILED
- MCP: ACTIVE, INACTIVE, health status
- Document parse status
- Image history status

颜色必须语义一致。

### 9.5 EmptyState

空态应该直接给出下一步操作，不写营销文案。

示例：

- 无会话：显示“创建一个研究会话”，提供创建按钮。
- 无知识库：显示“上传文档建立知识库”，提供上传入口。
- 无图片历史：显示“生成第一张图片”，提供跳转或输入区。

## 10. 页面设计规格

### 10.1 Auth Pages

Routes：

- `/login`
- `/register/invite`
- `/forgot-password`
- `/reset-password`

布局：

```text
┌──────────────────────────────────────┐
│ left: product context                │
│ right: auth form                     │
└──────────────────────────────────────┘
```

Desktop：左右两栏，左侧为产品名、简短说明、能力点；右侧为表单。  
Mobile：单列，产品上下文压缩为顶部 brand strip。

视觉：

- 不使用大背景渐变。
- 表单 panel 使用 `outlined` 或轻 shadow。
- 错误信息在表单顶部和字段处都可见。

登录页行为：

- 成功后进入 `/workspace/chat`。
- 提交中禁用按钮。
- 登录失败保留用户名输入。

注册页行为：

- 邀请码、用户名、显示名、密码、确认密码。
- 密码不一致时前端直接提示。
- 注册成功后跳转登录页。

找回/重置行为：

- 保留当前 API 调用方式。
- 结果状态明确：sent, invalid token, success, error。

### 10.2 Research Workspace

Route: `/workspace/chat`

这是重构优先级最高的页面。

推荐 desktop layout：

```text
┌────────────────────────────────────────────────────────────────┐
│ Page header: Research Workspace / mode / current status          │
├───────────────┬───────────────────────────┬────────────────────┤
│ Sessions      │ Task composer + timeline  │ Results + artifacts │
│ 280px         │ minmax(420px, 1fr)        │ 360px              │
└───────────────┴───────────────────────────┴────────────────────┘
```

Responsive：

- `>=1200px`: 三栏。
- `768px-1199px`: 两栏，右侧结果移动到下方 tabs。
- `<768px`: 单列，顶部 session selector。

核心区域：

1. Session rail
   - 创建会话表单可折叠。
   - 会话列表显示 title、status、mode、createdAt。
   - RUNNING 会话有明确状态 indicator。
   - 删除动作放在二级菜单或明确 danger button，必须 confirm。

2. Research composer
   - Query textarea 是页面主输入。
   - 执行模式使用 segmented control：ReAct / Plan Execute。
   - 知识库绑定使用 multi-select 或 comma input 的清晰替代方案。
   - 主按钮：运行任务。
   - streamDisconnected 时显示 inline alert。

3. Execution timeline
   - 展示 stream logs、plan steps、tool invocations。
   - RUNNING 状态下最新事件在顶部或 timeline 当前节点突出。
   - payload 默认折叠，点击展开查看 JSON/mono。
   - 计划步骤显示 stepNo、title、status、toolName。

4. Results panel
   - Summary 优先显示。
   - Report artifact 支持 Markdown-like prose display。
   - Images 显示 thumbnail 和打开链接。
   - Tool invocation 作为 secondary tab，不抢主结果空间。

状态：

- Loading sessions
- No sessions
- Session selected but detail loading
- Running task
- Stream disconnected
- Task failed
- Completed with report
- Completed without artifact

实现注意：

- 保留原 `WorkspacePage` 中的 API 函数和状态关系。
- 可以把展示拆到 `components/workspace/*`。
- 不要把 stream 事件更新放进过度复杂的全局状态。

### 10.3 Knowledge Bases

Route: `/workspace/knowledge-bases`

推荐 layout：

```text
┌────────────────────────────────────────┐
│ Header: Knowledge Bases + create/upload │
├───────────────┬────────────────────────┤
│ KB list       │ Selected KB detail      │
│ filters       │ documents + search      │
└───────────────┴────────────────────────┘
```

要求：

- 知识库列表显示 name、status、documentCount、updatedAt。
- 选中知识库后右侧显示文档列表。
- 上传文档区域不要做成巨大拖拽 hero，保持工具化。
- 文档 parseStatus 使用 StatusPill。
- 搜索结果显示 fileName、chunkNo、score、contentPreview。

状态：无知识库、上传中、索引中、解析失败、搜索无结果。

### 10.4 Image Studio

Route: `/workspace/image-generation`

推荐 layout：

```text
┌────────────────────────────────────────┐
│ Header: Image Studio                    │
├─────────────────┬──────────────────────┤
│ Prompt controls │ Result preview        │
│ mode / size     │ history strip         │
└─────────────────┴──────────────────────┘
```

要求：

- Mode 使用 segmented control: Images / Edits。
- Size 使用 select 或 segmented options。
- Prompt textarea 清晰标注。
- 上传参考图仅在 edits mode 显示。
- 结果区域保持固定 aspect ratio，避免图片加载导致布局跳动。
- resultUrl 为空时显示 pending/failed 状态。

### 10.5 History

Route: `/workspace/history`

推荐 layout：

- 左侧历史会话列表或顶部 filter bar。
- 右侧 detail replay：summary、runs、plan steps、tool invocations、artifacts。
- 支持从历史打开产物或重新进入工作台会话。

要求：

- 历史不是简单列表，要能恢复执行链路。
- 时间、状态、mode 清晰可扫读。
- 长 payload 默认折叠。

### 10.6 Account Center

Route: `/account`

推荐 tabs：

- Profile
- Password
- API / Model access, if current API supports it
- Login logs

要求：

- 账号资料与安全操作分区。
- 修改密码是独立 panel。
- 登录日志用 dense table/list。
- 危险操作单独分区。

### 10.7 Admin Settings

Route: `/admin/settings`

职责：模型配置、邀请码管理等基础配置。

推荐 layout：

- Header: System Settings。
- Tabs: Models / Invites。
- Model list: modelCode、name、provider、modelType、enabled、updatedAt。
- Model form: add/edit panel。
- Invite list: token、status、expiresAt、createdAt。

要求：

- API key 使用 masked display。
- enabled 使用 switch 或 clear status control。
- admin-only 页面需要无权限 fallback，虽然路由层通常已控制。

### 10.8 MCP Servers

Route: `/admin/mcp-servers`

推荐 layout：

- Server list table/card hybrid。
- Detail panel 显示 endpoint/commandLine、transportType、status。
- Actions: discover tools、health check、enable/disable。
- Tool descriptors 列表显示 toolName、toolType、description。

要求：

- endpoint 和 commandLine 使用 mono，支持换行/截断。
- health check result 明确显示时间和 message。
- discover result cached 状态可见。

## 11. Copywriting Guidelines

界面文案应短、直接、任务导向。

建议：

- “运行研究”优于“立即开启智能探索”。
- “绑定知识库”优于“让知识为智能体赋能”。
- “连接中断，可在历史回放查看结果”优于“网络似乎开小差了”。
- “删除会话后无法恢复”必须明确。

不要在页面中解释功能如何高级，也不要写营销式说明。帮助文本只解释当前操作的影响。

## 12. Accessibility Requirements

必须满足：

- 所有按钮、输入、菜单可键盘访问。
- 使用 `:focus-visible`，不要移除 outline 后不补偿。
- Dialog 打开后焦点进入浮层，Esc 可关闭。
- Toast 不应遮挡主 CTA。
- 颜色对比满足常规可读性。
- 表单错误不只依赖颜色，还需要文字。
- `prefers-reduced-motion` 下关闭或缩短动画。
- 移动端触控目标不小于 `40px`。

## 13. Implementation Plan

### Phase 0: Audit and Safety

目标：确认当前工作区改动，并建立可控重构范围。

步骤：

1. 运行 `git status --short`。
2. 确认是否存在用户未提交改动。
3. 阅读保留文件：`api.ts`, `auth.ts`, `useAuthSession.ts`, `AppRouter.tsx`, `ProtectedRoute.tsx`。
4. 阅读所有页面中当前 API 调用，记录不能丢失的业务行为。

验收：

- 明确哪些文件可删除、哪些文件必须保留。
- 无任何用户改动被误删。

### Phase 1: Rebuild Design Foundation

目标：替换旧视觉系统。

步骤：

1. 新建或重写 `frontend/src/styles/tokens.css`。
2. 新建或重写 `base.css`, `layout.css`, `components.css`, `pages.css`。
3. 将 `global.css` 改为 import 汇总。
4. 移除旧暖米色大渐变、大圆角、重阴影、serif 标题默认。

验收：

- 应用能启动，基础字体、背景、链接、按钮默认样式正常。
- `pnpm build` 不因 CSS import 失败。

### Phase 2: Rebuild UI Components

目标：建立页面可复用组件。

步骤：

1. 实现 `Button`, `Field`, `Input`, `Textarea`, `Select`。
2. 实现 `Panel`, `Badge`, `StatusPill`, `EmptyState`, `Spinner`。
3. 重写 `Toast`, `Dialog/ConfirmDialog`, `CommandPalette`。
4. 若引入图标库，统一在本阶段处理。

验收：

- 组件覆盖 loading/disabled/error/focus-visible 状态。
- Command palette 支持键盘操作。
- Confirm dialog 可用于删除会话等 danger 操作。

### Phase 3: Rebuild App Shell

目标：建立登录后统一框架。

步骤：

1. 重写 `AppShell`，可拆为 `Sidebar`, `Topbar`, `UserMenu`。
2. 保留 `useAuthSession` 和 logout API 行为。
3. 按角色显示 admin navigation。
4. 实现 active route state。
5. 实现移动端导航。

验收：

- 登录后所有 protected route 在 shell 中显示。
- 普通用户不显示 admin 项。
- 退出登录仍调用 `/auth/logout` 并跳转 `/login`。

### Phase 4: Rebuild Auth Pages

目标：完成登录、注册、找回、重置页面。

步骤：

1. 重写四个 auth 页面 JSX 和样式。
2. 保留原 API 行为。
3. 统一表单错误、loading、success 状态。

验收：

- 登录成功后 session 写入并跳转工作台。
- 注册、找回、重置流程的错误和成功状态可见。

### Phase 5: Rebuild Research Workspace

目标：重建最核心工作台。

步骤：

1. 将 `WorkspacePage` 拆成容器 + 展示组件。
2. 保留会话加载、详情加载、创建、删除、运行任务、绑定知识库、stream 事件处理。
3. 实现三栏/两栏/单列响应式布局。
4. 实现 session rail、composer、timeline、results panel。
5. 处理所有 loading/empty/error/running/completed 状态。

验收：

- 可以创建会话。
- 可以选择会话并加载详情。
- 可以运行任务并看到 stream logs。
- 可以绑定知识库。
- 可以删除会话并弹出确认。
- 报告、计划步骤、工具调用、产物能展示。

### Phase 6: Rebuild Secondary Workspace Pages

目标：重建知识库、图片、历史、账号页面。

步骤：

1. 重写 `KnowledgeBasesPage`。
2. 重写 `ImageGenerationPage`。
3. 重写 `HistoryPage`。
4. 重写 `AccountPage`。

验收：

- 各页面 API 行为不回退。
- 表单、列表、状态、空态使用统一组件。
- 移动端不横向溢出。

### Phase 7: Rebuild Admin Pages

目标：重建模型配置和 MCP 配置。

步骤：

1. 重写 `AdminSettingsPage`。
2. 重写 `McpServersPage`。
3. 统一 model, invite, server, tool descriptor 的列表和表单样式。

验收：

- 管理员能查看和操作配置。
- endpoint、commandLine、API key masked 等敏感/长文本展示稳定。

### Phase 8: Verification

目标：确保重建后可运行、可构建、可用。

必须执行：

1. `cd frontend && pnpm build`
2. `cd frontend && npm run dev`
3. 用浏览器检查：
   - `/login`
   - `/workspace/chat`
   - `/workspace/knowledge-bases`
   - `/workspace/image-generation`
   - `/workspace/history`
   - `/account`
   - `/admin/settings`
   - `/admin/mcp-servers`
4. 检查 viewport：
   - desktop: 1440x900
   - tablet: 834x1112
   - mobile: 390x844

验收：

- 无 TypeScript build error。
- 无明显布局重叠。
- 无水平滚动条，除非代码/payload 区域内部滚动。
- 主要按钮、输入、弹窗、导航可键盘操作。
- 页面文案无营销腔和占位内容。

## 14. Definition of Done

本次 UI 删除重建完成需满足：

- 可见页面已全部从旧视觉系统迁移到新视觉系统。
- 保留 API、路由、认证/session 和核心业务流。
- 所有页面使用统一 token、组件和状态样式。
- 核心工作台支持创建会话、运行任务、查看 stream、查看结果。
- 管理员页面仍按角色显示。
- `pnpm build` 成功。
- 已在桌面和移动视口做人工检查。
- 旧样式文件和旧组件已清理，除非保留为兼容 wrapper 并有明确说明。

当前完成情况：

- 可见页面、AppShell、通用 UI 组件和样式系统已经完成重建。
- API service wrapper、SSE 事件归一、响应式导航、权限态、404、Dialog 和 ConfirmDialog 已落地。
- 当前前端构建命令为 `pnpm build`，已通过。
- 模型/个人 API 连接测试、附件/工具输出产物、STDIO MCP 完整发现和真实 provider 图片编辑属于后端待补能力。

## 15. Suggested Codex Prompt for Implementation

后续可以用下面的提示让 Codex 开始执行：

```text
请按照 docs/frontend-ui-rebuild-plan-aiagent-v1.md 执行 AiAgent V1 前端可见 UI 删除重建。

边界：保留 frontend/src/services/api.ts、frontend/src/stores/auth.ts、frontend/src/hooks/useAuthSession.ts、frontend/src/router/AppRouter.tsx 的路由路径结构、ProtectedRoute 和认证/session 行为；重写所有可见页面、AppShell、通用 UI 组件和 CSS 样式系统。

请分阶段实施：先重建 tokens/base/layout/components，然后 AppShell 和 auth pages，再重点重建 WorkspacePage，最后处理其他页面和 admin 页面。每个阶段后运行 `pnpm build`，最终启动 dev server 并做桌面/移动视口检查。

不要引入 Tailwind 或 Next.js。除非确有必要，不新增依赖；如果新增图标库，统一使用 @phosphor-icons/react。
```
