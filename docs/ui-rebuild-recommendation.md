# AiAgent UI 重构计划(详细版)

> 本文档基于对 `frontend/` 当前代码的逐文件核查重写,从「方向性建议」升级为「可排期、可验收、可回滚的执行计划」。
> 核查基准(2026-06):React 19.1 + Vite 6.3.5 + react-router-dom 7.6.2 + TypeScript 5.8.3,pnpm。
> `src` 共 6331 行(75 个文件),其中手写 CSS 1893 行(tokens 99 / base 134 / layout 446 / components 849 / pages 365)。

---

## 0. 结论与核查更正

**采用 shadcn/ui + Radix + Tailwind 的增量(绞杀者)迁移,不推倒重建。** 现有信息架构(IA)、导航数据、设计 token 语义、数据层均贴合目标,重建投入产出比低于增量。

本次核查对旧文档的更正(影响计划准确性):

| 旧文档说法 | 核查结果 | 影响 |
|---|---|---|
| Toast 是"内存发布订阅" | `showToast` **0 处页面调用**,整套 Toast 机制是死代码 | Phase 2 需「接线」而非「替换」 |
| 分页靠 `rows.length < 50` 启发式 | 实际是 `result.items.length === result.pageSize`(`ImageGenerationPage.tsx:53`) | 债务 6 描述更正 |
| 手写 CSS ~1898 行 | 实测 1893 行,分布见上 | 工作量估算依据 |
| Command 用静态命令数组 | 确认:`COMMANDS` 8 项静态数组,**非 cmdk**,纯手写 combobox | Phase 3 替换 |
| Badge 导出无人用 | 确认:0 处 `import Badge`,35 处裸 `<span className="badge">`,跨 22 文件 | 债务 1 量化 |

---

## 1. 现状速查(逐文件迁移决策依据)

### 1.1 UI 原语(`src/components/ui/`,13 个,经 `index.ts` 统一导出)

| 文件 | 导出 | 当前实现 | shadcn 对应 | 关键迁移点 |
|---|---|---|---|---|
| `Button.tsx` | `Button` | `variant: primary/secondary/ghost/danger`、`size: sm/md`、`fullWidth`、`loading`(内置 `.spinner`),class 字符串拼接 | `button` | variant 映射:primary→default、danger→destructive;`loading`/`fullWidth` 需薄封装保留 |
| `Dialog.tsx` | `Dialog` | **手写** `createPortal` + 焦点陷阱(Tab 循环首尾)+ Esc + `body.overflow` 锁 + 关闭恢复焦点;props `isOpen/title/description/footer/onClose` | Radix `dialog` | 删手写焦点逻辑;保留 `title/description/footer` 插槽形态 |
| `Tabs.tsx` | `Tabs<T>` | **手写** roving tabindex + Arrow/Home/End;泛型 `TabItem<T>{id,label}` | Radix `tabs` | 删手写键盘;泛型 `value/onChange` API 需封装 |
| `StatusPill.tsx` | `StatusPill` | `getTone()` 把 18 种状态映射到 success/info/danger/warning/neutral;`formatStatus()` 含 **19 条中文 label 字典** | 基于 `badge` 重建 | **必须保留 `getTone()` + 中文字典**,仅换视觉底座 |
| `Badge.tsx` | `Badge` | `tone: primary/neutral/success/warning/danger/info` | `badge` | 当前 **0 引用**;迁移时让它真正取代裸 span |
| `Panel.tsx` | `Panel` | `title/eyebrow/description/action/footer` 插槽 + `variant: default/plain/subtle/raised` | `card` | 映射到 Card,保留全部插槽与 4 个 variant |
| `FormControls.tsx` | `Input/Select/Textarea` | 原生标签 + class | `input`/`select`/`textarea` | `Select` 当前包原生 `<select>`,13 文件在用,换 Radix Select 需逐处适配 |
| `Field.tsx` | `Field` | `label/description/error` + `<label>` 包裹 | `form`/`label` | 表单校验规范统一到此 |
| `Alert.tsx` | `Alert` | `tone: info/success/error`,`role` 切换 | `alert` | 保留 role 语义 |
| `Switch.tsx` | `Switch` | 原生 checkbox + `role="switch"` | Radix `switch` | API `label/description` 保留 |
| `Skeleton.tsx` | `Skeleton` | `lines/compact` | `skeleton` | 直接映射 |
| `EmptyState.tsx` | `EmptyState` | `title/message/action` | 组合 Card | 保留 |
| `IconButton.tsx` | `IconButton` | `label`(aria)+`tone: default/danger` | `button size=icon` | 保留 aria-label |

> 共性:**所有 variant 都靠字符串数组 `.filter(Boolean).join(" ")` 拼接**,无 `cva`,无 `tailwind-merge`。这是 Phase 2 的统一改造对象。

### 1.2 App Shell 与导航(`src/components/shell/`)

- `navigation.ts`:三个数组 `workNavigation`(4)/`adminNavigation`(4)/`accountNavigation`(1),item 形态 `{to,label,shortLabel}`,另有合并导出 `allNavigation`。**结构需原样保留**。
- `AppShell.tsx`:两栏(`app-sidebar` + `app-main`),`sidebarOpen` 状态驱动移动抽屉,顶层 `<div className="app-shell">` 是挂主题 class 的天然位置。admin 分组按 `session.user.roles.includes("ADMIN")` 条件渲染。
- `Sidebar.tsx`:`NavLink` + 分组 `工作区/系统/账户`,admin 组按 `isAdmin` 渲染。
- `Topbar.tsx`:含 `command-trigger`(⌘K 提示)+ 角色 `badge`(裸 span)+ 移动端菜单按钮。
- `UserMenu.tsx`:**当前不是下拉**,是侧栏底部固定的 `user-card` + 退出按钮 → Phase 3 改 DropdownMenu。
- `MobileNav.tsx`:仅一个全屏 backdrop 按钮(手写遮罩)→ 改 shadcn Sheet。

### 1.3 命令面板(`src/components/command/`)

- `CommandPalette.tsx`(111):**手写** combobox,`COMMANDS` 静态数组 8 项(workspace/knowledge/images/history/account/settings/mcp/logout),`adminOnly` 与 `action:"logout"` 过滤,手写 Arrow/Enter/Esc + `role="listbox/option"`。
- `commandEvents.ts`:`window` 自定义事件 `aiagent.command-palette.open` 解耦触发;⌘K 在 `App.tsx` 经 `useKeyboard` 绑定。
- 迁移:换 cmdk-based shadcn `Command`,**保留事件解耦与 ⌘K**,扩展动态命令(跳转具体 session/最近项)。

### 1.4 Workspace(核心,`src/pages/WorkspacePage.tsx` 324 + `src/features/workspace/`)

- **已是三栏** `workspace-grid: 280px minmax(420px,1fr) 360px`(`layout.css:302`),≤断点降为两栏再降一栏(`layout.css:332/391`)。
  - 左 `SessionList`、中 `ResearchComposer` + `ExecutionTimeline`、右 `ArtifactPanel` + `MemoryPanel` + `ToolInvocationList`。
- `WorkspacePage.tsx` 持有 **19 个 `useState`**,直接 `fetch` 编排 + SSE,逻辑密集(创建/运行/暂停/继续/取消/绑定 KB/上传产物/记忆)。
- `workspaceViewModel.ts`(138)**纯函数,迁移时零改动保留**:`buildExecutionTimeline()`(合并 runs/planSteps/tools/artifacts/liveEvents 并按时间排序)、`normalizeStreamEvent()`、`previewPayload()`。
- `ExecutionTimeline.tsx` / `ToolInvocationList.tsx`:用 `<pre className="json-block">` 直出 JSON → Phase 5 升级为富对话流。`ResearchComposer.tsx` 用 `Tabs` 选策略/模式 + 复选框选 KB。

### 1.5 业务页(`src/pages/`,按状态复杂度)

| 页面 | 行 | useState | 备注 |
|---|---|---|---|
| `WorkspacePage` | 324 | 19 | 最复杂,单独 Phase 5 |
| `KnowledgeBasesPage` | 273 | 16 | 需拆 Page 编排与展示 |
| `AdminSettingsPage` | 167 | 11 | 邀请码段内联裸标记,需抽组件 |
| `McpServersPage` | 158 | 10 | `setError` 当工具测试结果通道(`:139`) |
| `RagEvaluationPage` | 131 | 11 | |
| `AccountPage` | 131 | 16 | ProfileForm 受控 vs SecurityForm `FormData` |
| `ImageGenerationPage` | 99 | 11 | 分页 `items.length===pageSize` 启发式 |
| `HistoryPage` | 91 | 10 | + `ReplayDetail` |
| `AdminAuditPage` | 87 | 8 | |

### 1.6 数据层(与 UI 正交)

- `services/api.ts`(429):`apiRequest(path, init, accessToken?)` **token 作第 3 参手动穿线**;统一解析 `ApiResponse{code,message,data}`;**无拦截器 / 无 401→登出 / 无刷新 / 无重试 / 无超时**。`streamRequest()` 手写 SSE 分块解析(`\n\n` 切分 + 终止事件 `reader.cancel()`)。
- 7 个领域 service:`authApi/accountApi/adminApi/artifactsApi/imagesApi/knowledgeApi/sessionsApi`。
- `stores/auth.ts`:localStorage(`aiagent.auth.session`)+ `expiresAt` 校验;`useAuthSession` 经自定义事件 `aiagent.auth.sessionchange` + `storage` 事件跨标签同步。
- `components/Toast.tsx`:模块级 `listeners/store` 发布订阅,**`showToast` 全仓 0 调用 → 死代码**。

### 1.7 工程约束(接入 shadcn 的前置障碍)

- `tsconfig.app.json`:`moduleResolution: "Node"`、`module: "ESNext"`、`target: ES2022`、**无 `@/*` 别名**。shadcn CLI 需 `Bundler` 解析 + `@` 别名 → **Phase 0 必改**。
- `vite.config.ts`:仅 `react()` 插件 + `/api`→`:8080` 代理,**无 alias**。
- **无** `tailwind.config.*` / `postcss.config.*` / `components.json` → 全部新建。
- `package.json` 依赖极简:仅 react/react-dom/react-router-dom + 构建链。Tailwind/shadcn/Radix/cva/lucide **均未安装**。

---

## 2. 总体策略

- **绞杀者模式**:新底座(Tailwind + shadcn)与旧 CSS(`styles/*.css`)并存,按"原语→Shell→页面"逐块替换,每步独立验证、可回滚。
- **自下而上**:token/原语稳定后,业务页迁移退化为机械替换。
- **保持可发布**:每个 Phase 结束 `pnpm build` 通过且功能不退化。
- **债务随迁清理**:第 6 节债务在对应 Phase 顺带收敛,不单开重构。

依赖顺序(硬约束):**Phase 0 → 1 → 2** 必须串行(后者依赖前者产物);**Phase 3/4** 在 Phase 2 原语稳定后可并行;**Phase 5** 依赖 Phase 2 + 4;数据层(第 7 节)全程独立并行。

---

## 3. 任务划分(分阶段 + 文件级清单 + 验收)

### Phase 0 — 工程基建(接入 shadcn 前置)

> 目标:让 shadcn/Tailwind 能正确生成与解析组件。**全程不动业务代码**。

- [ ] **T0.1** 安装 `tailwindcss postcss autoprefixer`;新建 `tailwind.config.ts`(`content: ["./index.html","./src/**/*.{ts,tsx}"]`、`darkMode: "class"`)与 `postcss.config.js`。
- [ ] **T0.2** 改 `tsconfig.app.json`:`moduleResolution: "Bundler"`,`paths: { "@/*": ["./src/*"] }`,`baseUrl: "."`。
- [ ] **T0.3** 改 `vite.config.ts`:加 `resolve.alias { "@": path.resolve(__dirname, "src") }`(保留现有 `/api` 代理不变)。
- [ ] **T0.4** 安装 `class-variance-authority clsx tailwind-merge lucide-react`;新建 `src/lib/utils.ts` 导出 `cn()`。
- [ ] **T0.5** `pnpm dlx shadcn@latest init` 生成 `components.json`;**输出目录冲突处理**:现有 `src/components/ui/`(大驼峰文件名)与 shadcn 习惯(小写)冲突 → 暂将 shadcn 产物落到 `src/components/ui/`,以小写文件名与旧大驼峰文件共存,旧文件在 Phase 2 逐个删除。
- [ ] **T0.6** 在 `tailwind.config` 与 shadcn `:root` 中**映射 `tokens.css` 语义变量**(见 Phase 1),不在本阶段删 `tokens.css`。

**验收**:`pnpm dlx shadcn@latest add button` 成功生成,在一处临时挂载渲染正常;`pnpm build` 通过;旧 UI 与样式零回归。

### Phase 1 — 设计 token 与暗色模式

- [ ] **T1.1** 把 `tokens.css` 的语义变量映射进 shadcn 变量:`--color-surface→--card/--background`、`--color-border→--border`、`--color-primary→--primary`、`--color-text→--foreground`、`--color-text-muted→--muted-foreground`、`--color-danger→--destructive`、各 `*-soft` 作为 accent/muted 变体。
- [ ] **T1.2** **新增 `.dark` 变量集**(当前 `color-scheme: light`,无暗色)——这是从零新建,需为上表每个变量给暗色值。
- [ ] **T1.3** 保留 IBM Plex Sans/Mono → 接入 Tailwind `theme.fontFamily`。
- [ ] **T1.4** 间距(`--space-*`)、圆角(`--radius-*`)、阴影、`--z-*`、`--focus-ring` 对齐 Tailwind 主题。
- [ ] **T1.5** 在 `AppShell` 顶层 `<div className="app-shell">` 挂主题 class,新增主题切换(localStorage 持久化,默认跟随系统)。
- [ ] **T1.6** 保留 `tokens.css` 中的 `prefers-reduced-motion` 块。

**验收**:亮/暗切换全站无失明区(尤其新建的暗色);`tokens.css` 仅作为变量源,不再被业务直接引用。

### Phase 2 — UI 原语迁移(逐个,保 API 形态)

> 策略:每个 shadcn 原语提供与旧 props 等价的薄封装,降低业务页改动面;旧大驼峰文件逐个删除并更新 `index.ts`。

直接映射(换实现,保 API):
- [ ] **T2.1** Button(primary→default、secondary、ghost、danger→destructive;size sm/md;封装 `loading`/`fullWidth`)
- [ ] **T2.2** Dialog → Radix Dialog,**删 `Dialog.tsx` 手写 portal/焦点陷阱**;保 `title/description/footer/onClose`。同步检查 `ConfirmDialog.tsx`(基于 Dialog)。
- [ ] **T2.3** Tabs → Radix Tabs,**删手写键盘导航**;保泛型 `value/onChange`(`ResearchComposer` 依赖)。
- [ ] **T2.4** Alert / Switch / Skeleton / Field / Input·Textarea(直接映射)
- [ ] **T2.5** StatusPill → 基于 Badge 重建,**原样保留 `getTone()` 与 19 条中文字典**。
- [ ] **T2.6** EmptyState / IconButton / Panel(→ Card,保 4 variant 与全部插槽)

新增缺口原语:
- [ ] **T2.7** Table(shadcn Table)—— 替换 `table-row`/`list-item` 手写表(`DocumentTable`/`ModelRegistry`/`LoginLogTable`/`KnowledgeBasesPage`/`AdminSettingsPage`)。
- [ ] **T2.8** Select(Radix)—— 替换 13 文件中包原生 `<select>` 的旧 `Select`,**逐处适配**(原 `onChange(event)` → Radix `onValueChange(value)`,改动面较大,单列子任务)。
- [ ] **T2.9** DropdownMenu、Popover、Tooltip(为 Phase 3 UserMenu/命令做准备)。
- [ ] **T2.10** Toast → shadcn/sonner Toast,**替换 `Toast.tsx` 死代码并真正接线**(见债务 3)。

**验收**:`index.ts` 导出口径稳定;旧 `Dialog.tsx`/`Tabs.tsx` 手写逻辑删除;Badge/Toast 真正被使用;`pnpm build` 通过。

### Phase 3 — App Shell、导航与命令面板

- [ ] **T3.1** AppShell/Sidebar/Topbar 换 shadcn 视觉,**保留 `navigation.ts` 数据结构与 work/admin/account 分组及 admin 条件渲染**。
- [ ] **T3.2** MobileNav 用 shadcn **Sheet** 替换手写 backdrop。
- [ ] **T3.3** UserMenu 从侧栏固定卡片升级为 **DropdownMenu**;Topbar 角色裸 span 换 Badge。
- [ ] **T3.4** Command Palette 换 cmdk-based shadcn `Command`,**保留 `commandEvents` 解耦与 ⌘K(`App.tsx`+`useKeyboard`)**,扩展动态命令(跳转具体 session、最近项、分组)。

**验收**:导航/快捷键(⌘K)/移动端抽屉行为不退化;命令面板支持动态项。

### Phase 4 — 业务页迁移(原语稳定后机械替换,每页独立任务)

按复杂度从低到高,迁移时同步清债(第 6 节):
- [ ] **T4.1** AdminAuditPage(87)—— 先验证表格/筛选规范
- [ ] **T4.2** ImageGenerationPage(99)—— 顺带统一分页组件(债务 6)
- [ ] **T4.3** HistoryPage(91)+ ReplayDetail
- [ ] **T4.4** AccountPage(131)—— **统一 ProfileForm/SecurityForm 受控规范**(债务 5)
- [ ] **T4.5** RagEvaluationPage(131)
- [ ] **T4.6** McpServersPage(158)+ system features —— **修 `setError` 当结果通道(`:139`)→ 走 Toast**(债务 3)
- [ ] **T4.7** AdminSettingsPage(167)—— **抽出内联邀请码段为组件**(债务 7)
- [ ] **T4.8** KnowledgeBasesPage(273,16 state)—— 拆 Page 编排与展示

**验收**:每页迁移后 `pnpm build` 通过,功能与视觉一致,对应债务项关闭。

### Phase 5 — Workspace 专用交互升级(核心差异化)

> 保留 `workspaceViewModel.ts` 纯函数与 SSE(`streamRequest`)接线。

- [ ] **T5.1** 中栏对话/执行流从「卡片 + `<pre>` JSON」升级为富对话流:评估引入 `assistant-ui`(streaming/tool call 场景)。
- [ ] **T5.2** `ExecutionTimeline` 增强状态标签密度与可读性(StatusPill/Badge 统一)。
- [ ] **T5.3** `ArtifactPanel`/`MemoryPanel`/`ToolInvocationList` 视觉密度与一致性。
- [ ] **T5.4** 右栏 trace 细化;`ResearchComposer` 策略/模式用新 Tabs/Select。
- [ ] **T5.5**(可选)将 `WorkspacePage` 19 个 state 中的数据加载部分迁移到 TanStack Query(与第 7 节联动)。

**验收**:三栏布局与现有功能等价,对话流可读性显著提升。

### Phase 6 — 收尾

- [ ] **T6.1** 删除 `styles/*.css` 中已无引用规则;评估能否整体移除 `base/layout/components/pages.css`。
- [ ] **T6.2** 统一空状态/加载骨架/错误条规范。
- [ ] **T6.3** 无障碍回归(焦点、aria、键盘:⌘K、Tab 陷阱、Tabs 方向键)。
- [ ] **T6.4** `pnpm build` + 全页面手测金路径与边界。

---

## 4. 推荐技术栈(锁定版)

- 主底座:`shadcn/ui` + `Radix` + `Tailwind` + `class-variance-authority` + `clsx` + `tailwind-merge` + `lucide-react`。
- 表格:`shadcn Table`,数据量大时叠加 `TanStack Table`。
- 可选增强:`assistant-ui`(Phase 5 对话流)、`Recharts`(运行监控,若需要)。
- 暂不引入:`CopilotKit`(当前无明确场景);TanStack Query(数据层改造,见第 7 节,与 UI 解耦)。

---

## 5. 债务清单(迁移时一并收敛,已逐项核查并指明 Phase)

1. **Badge 死导出**:0 处 `import Badge`,35 处裸 `<span className="badge">`(22 文件)→ 统一用 Badge(Phase 2/4)。
2. **无 Table 原语**:`table-row`/`list-item` 在 5 处手工重复 → 统一 Table(Phase 2)。
3. **Toast 死代码 + setError 滥用**:`showToast` 全仓 0 调用;成功/结果信息走 `setError`(`McpServersPage.tsx:139` 工具测试结果、`KnowledgeBasesPage.tsx:188` 预览)→ 成功/通知走 Toast,error 仅用于错误(Phase 2 接线 + Phase 4 改用)。
4. **StatusPill 用法矛盾**:硬编码 vs 数据驱动 → 统一数据驱动(Phase 4/5)。
5. **表单受控漂移**:`ProfileForm` 受控(`value+onChange`)vs `SecurityForm` 非受控(`name`+`FormData`)→ 统一受控 + 校验规范(Phase 4)。
6. **分页启发式**:`ImageGenerationPage.tsx:53` 用 `items.length === pageSize` 推断 `hasMore` → 后端补 `total` 或统一分页组件(Phase 4)。
7. **组件化不均**:`AdminSettingsPage` 内联裸标记(邀请码段 `:150/:154`)→ 抽组件(Phase 4)。

---

## 6. 数据层(与 UI 正交,可选并行轨道)

现状:`api.ts` 手写 fetch,token 作参数手动穿线,无拦截器、无 401→登出、无刷新/重试/超时;`stores/auth` = localStorage + 自定义 window 事件;`Toast` = 模块级发布订阅(未用)。三套各自为政。

若并行改造(建议置于独立轨道,避免阻塞 UI):
- [ ] 引入 TanStack Query 统一加载/缓存/去重/后台刷新,替换各 Page 的 `useState + Promise.all`。
- [ ] 在 `apiRequest` 外层集中 token 注入与 401→登出拦截(消除第 3 参手动穿线)。
- [ ] 列表分页/筛选交由 Query + Table(联动债务 6)。

排期上置于 Phase 4 之后或全程独立并行。

---

## 7. 版式与视觉方向(已对齐现状)

- 左:session / history / mode / command(现 `SessionList`)
- 中:conversation / plan / execution(现 `ResearchComposer` + `ExecutionTimeline`)
- 右:artifacts / memory / tools / trace(现三个右栏面板)
- 系统页/账号页共用同一套表单、弹窗、卡片、空状态规范。
- 视觉:强调结构感、操作密度、清晰状态标签,有品牌感但不过度装饰;比传统后台轻,但不做成营销页;对话区做富对话流而非单一聊天样式。

---

## 8. 备选:全量重建(不推荐)

新建 `frontend-next/`,复制 `tokens.css` 语义、`navigation.ts`、`workspaceViewModel.ts`、`services/*` 作为起点按 IA 重搭。代价是重写所有 Page 编排与 SSE 接线,短期不可发布。鉴于现有 IA 已贴合目标,投入产出比低于增量迁移。

---

## 9. 里程碑顺序(一句话回顾)

Phase 0 基建 → 1 token/暗色 → 2 原语(含 Table/Select/Toast 缺口)→ 3 Shell/命令 → 4 业务页(顺带清 7 项债务)→ 5 Workspace 富交互 → 6 收尾。数据层(第 6 节)作为独立并行轨道。

**硬依赖**:0→1→2 串行;3、4 在 2 稳定后可并行;5 依赖 2+4。
