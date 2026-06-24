# AiAgent 前端 UI 升级任务清单

> 来源：`docs/requirements.md`、`docs/spec.md`。本文档只拆解前端 UI 与体验升级任务，不包含后端重写、Next.js 迁移、assistant-ui runtime 接入或超出规格的能力。

## 0. 实施状态

| ID | 状态 | 交付物 | 说明 |
| --- | --- | --- | --- |
| D01 | 已完成 | `docs/design-delivery-baseline.md` | 已固化字体、主题、核心页面覆盖范围、组件设计范围和截图基线 |
| D02 | 已完成 | `docs/visual-system-spec.md` | 已定义 light/dark 视觉 token、graphite/zinc + cyan/teal 色彩、字体、间距、圆角、阴影、状态色、focus ring 和 active state |
| D03 | 已完成 | `docs/component-system-spec.md` | 已定义 Button、IconButton、Badge、StatusPill、Panel、Table、Tabs、Alert、EmptyState、Skeleton、Dialog、DropdownMenu、CommandPalette 和 JsonBlock/Details 的关键状态 |
| D04 | 已完成 | `docs/first-round-page-design-spec.md` | 已定义登录/注册、研究工作台、知识库、图片工作室、管理总览的桌面与移动布局、关键状态、字段展示和截图回归清单 |
| D05 | 已完成 | `docs/second-round-page-design-spec.md` | 已定义历史、账号、模型、MCP、审计、RAG、404 的桌面与移动布局、正常/空态/加载/错误状态、结构化详情和截图回归清单 |
| E01 | 已完成 | `docs/current-ui-regression-baseline.md`、`docs/ui-regression-baseline/screenshots/` | 已记录当前路由、工具链、后端未运行阻塞、17 张 light 截图和后续 Playwright/mock 缺口；未修改前端业务代码 |
| E02 | 已完成 | `frontend/src/styles/fonts.css`、`frontend/public/fonts/` | 已本地托管 Geist Sans 与 IBM Plex Mono 常用权重，使用 `font-display: swap` 和系统 fallback，并同步 CSS token 与 Tailwind 字体栈 |
| E03 | 已完成 | `frontend/src/styles/tokens.css`、`frontend/src/styles/theme.css`、`frontend/scripts/verify-theme-tokens.mjs` | 已将语义 token 与 Tailwind bridge 切换为 graphite/zinc + cyan/teal，状态色保持 success/warning/danger/info 语义，并新增主题 token 验证脚本 |
| E04 | 已完成 | `frontend/src/lib/theme.ts`、`frontend/src/hooks/useTheme.ts`、`frontend/src/main.tsx`、`frontend/src/components/shell/Topbar.tsx` | 已实现默认 `system` 主题偏好、系统主题变化监听、手动 light/dark 持久化覆盖，并新增主题行为验证脚本 |
| E05 | 已完成 | `frontend/src/styles/base.css`、`frontend/scripts/verify-typography-rules.mjs`、知识库/工作台核心数字与 ID 展示组件 | 已新增 `tabular-nums`、`numeric`、`id-text`、`truncate-id` 基础规则；计数、分数、token、版本/大小使用 tabular；长 ID 默认截断并通过 `title` 暴露完整值 |
| C01 | 已完成 | `frontend/src/components/ui/Button.tsx`、`frontend/src/components/ui/IconButton.tsx`、`frontend/scripts/verify-button-components.mjs` | 已统一按钮 hover/focus/active/disabled/loading 状态；Button 新增 `lg` 尺寸和 loading 宽度稳定处理；IconButton 默认提升到 40x40，支持 `lg` 和 loading，保留必填 `label` 到 `aria-label` |
| C02 | 已完成 | `frontend/src/components/ui/Badge.tsx`、`frontend/src/components/ui/StatusPill.tsx`、`frontend/scripts/verify-badge-status.mjs` | 已将 Badge 默认改为 neutral 紧凑矩形标签；StatusPill 使用显式状态映射，补齐 idle/running/paused/completed/failed/cancelled/unknown 语义，保留中文文案并为运行态提供 reduced-motion 友好的脉冲状态点 |
| C03 | 已完成 | `frontend/src/components/ui/Panel.tsx`、`frontend/src/styles/components.css`、`frontend/scripts/verify-panel-surfaces.mjs` | 已将 Panel 默认层级改为无阴影安静 surface，补齐 `plain/subtle/raised/empty` 变体和 `loading/empty/error` 状态语义，并新增基础 surface 工具类以统一边框、背景和阴影 |
| C04 | 已完成 | `frontend/src/components/ui/Table.tsx`、`frontend/src/styles/components.css`、`frontend/scripts/verify-table-components.mjs` | 已增强 Table 横向滚动 wrapper、最小宽度、紧凑密度、数字列右对齐、状态列紧凑、selected/disabled/expanded 行状态，并新增 loading/empty/error/expanded 表格状态组件 |
| C05 | 已完成 | `frontend/src/components/ui/Tabs.tsx`、`frontend/src/styles/components.css`、`frontend/scripts/verify-tabs-components.mjs` | 已增强 Tabs 的 segmented/underline 形态、disabled trigger、横向 overflow、active indicator 和 focus 状态，并新增 `TabsContent`/`TabsContentState` 支持 loading/empty/error 内容状态 |
| C06 | 已完成 | `frontend/src/components/ui/Alert.tsx`、`frontend/src/components/ui/EmptyState.tsx`、`frontend/src/components/ui/Skeleton.tsx`、`frontend/scripts/verify-feedback-components.mjs` | 已增强 Alert 的 info/success/warning/error、title/action/dismiss 与 live-region 语义；EmptyState 支持 plain/permission/no-results/first-run 和双 action；Skeleton 支持 list/table/card/feed/form 并尊重 reduced motion |
| C07 | 已完成 | `frontend/src/features/workspace/JsonBlock.tsx`、`frontend/src/pages/AdminAuditPage.tsx`、`frontend/src/pages/RagEvaluationPage.tsx`、`frontend/scripts/verify-jsonblock-details.mjs` | 已增强 JsonBlock 的 summary、空态、JSON pretty print、parse error 和长 payload 滚动；审计与 RAG metrics 不再直接渲染原始 `<pre>`，改为摘要优先 + 折叠详情 |
| C08 | 已完成 | `frontend/src/components/ui/DropdownMenu.tsx`、`frontend/src/components/command/CommandPalette.tsx`、`frontend/src/components/shell/UserMenu.tsx`、`frontend/scripts/verify-command-dropdown.mjs` | 已增强 DropdownMenu 的 group/separator/selected/disabled/danger/empty 状态；CommandPalette 支持受控搜索空态、admin-only 过滤、错误 Alert 和 primary selected 状态；UserMenu 使用分组、选中账号和危险操作分隔 |
| S01 | 已完成 | `frontend/src/components/shell/AppShell.tsx`、`frontend/src/components/shell/Sidebar.tsx`、`frontend/src/components/shell/Topbar.tsx`、`frontend/src/components/shell/MobileNav.tsx`、`frontend/src/components/shell/navigation.ts`、`frontend/src/styles/layout.css`、`frontend/scripts/verify-shell-navigation.mjs` | 已集中导航 section helper，保留 admin-only 过滤；Sidebar 使用显式 active class、分组 heading 和 collapsed 可访问标签；Topbar 显示当前 section/page、移动菜单 aria 状态和搜索图标；MobileNav 支持 Escape 关闭 |
| S02 | 已完成 | `frontend/src/features/auth/AuthLayout.tsx`、`frontend/src/pages/LoginPage.tsx`、`frontend/src/pages/RegisterPage.tsx`、`frontend/src/pages/ForgotPasswordPage.tsx`、`frontend/src/pages/ResetPasswordPage.tsx`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-auth-pages.mjs` | 已将认证页升级为 graphite 背景 + 克制 grid、品牌状态条、raised Panel 表单；四个认证表单统一 `auth-form`，注册页改为单列，错误/成功 Alert 就近展示，成功后禁用重复提交并保留现有认证流程 |
| S03 | 已完成 | `frontend/src/pages/NotFoundPage.tsx`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-not-found-page.mjs` | 已将 404 页改为登录态感知：已登录主 CTA 返回研究工作台，未登录主 CTA 返回登录，并始终保留另一路径入口；页面复用 AuthLayout 背景和共享 Button |
| W01 | 已完成 | `frontend/src/pages/WorkspacePage.tsx`、`frontend/src/features/workspace/WorkspaceInspector.tsx`、`frontend/src/styles/layout.css`、`frontend/scripts/verify-workspace-layout.mjs` | 已将工作台外层改为 session rail / main flow / Inspector 三栏骨架；Inspector 使用键盘可达 tabs 承载产物、证据、记忆、工具；1199px 下 Inspector 下移，900px 下单列，创建/选择/删除会话接线保持不变 |
| W02 | 已完成 | `frontend/src/features/workspace/ExecutionTimeline.tsx`、`frontend/src/features/workspace/workspaceViewModel.ts`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-agent-feed-items.mjs` | 已将执行记录从通用 timeline item 拆为 Agent feed item：run、plan step、tool、artifact、stream event 分别使用独立渲染和稳定 class；payload 继续通过 JsonBlock 折叠展示 |
| W03 | 已完成 | `frontend/src/features/workspace/ToolInvocationList.tsx`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-tool-invocation-summary.mjs` | 已将工具调用账本改为摘要优先：显示工具名、类型、状态、开始时间、耗时、请求摘要和响应摘要；请求/响应 payload 分别通过 JsonBlock 默认折叠展示 |
| W04 | 已完成 | `frontend/src/features/workspace/ArtifactPanel.tsx`、`frontend/src/features/workspace/EvidencePanel.tsx`、`frontend/src/features/workspace/WorkspaceInspector.tsx`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-evidence-artifacts.mjs` | 已将证据从产物面板拆出为独立 EvidencePanel，展示 final/recall evidence 的来源、分数、citation、section、chunk、策略和预览；ArtifactPanel 改为报告预览、上传附件和可复用产物卡片 |
| W05 | 已完成 | `frontend/src/features/workspace/WorkspaceInspector.tsx`、`frontend/src/pages/WorkspacePage.tsx`、`frontend/scripts/verify-workspace-inspector-tabs.mjs` | 已将 Inspector 改为受控四标签，使用 `TabsContentState` 统一 loading、empty、error 状态，force-mount 面板以保持内容状态，并由工作台页面传入会话详情加载/错误状态 |
| W06 | 已完成 | `frontend/src/features/workspace/ResearchComposer.tsx`、`frontend/src/features/workspace/ExecutionTimeline.tsx`、`frontend/src/features/workspace/workspaceViewModel.ts`、`frontend/src/components/ui/StatusPill.tsx`、`frontend/src/pages/WorkspacePage.tsx`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-research-run-states.mjs` | 已为运行、暂停、取消中、已取消、完成、失败、超时建立清晰状态说明和样式；暂停/继续/取消按钮改由 active run 状态和控制请求 loading 决定；SSE 中断提示保留 live events 并提供恢复会话详情入口 |
| K01 | 已完成 | `frontend/src/pages/KnowledgeBasesPage.tsx`、`frontend/src/features/knowledge/KnowledgeBaseList.tsx`、`frontend/src/features/knowledge/KnowledgeBaseSummary.tsx`、`frontend/src/features/knowledge/DocumentTable.tsx`、`frontend/src/features/knowledge/SearchTestPanel.tsx`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-knowledge-rag-cockpit.mjs` | 已将知识库页面升级为 RAG cockpit：左侧 KB rail、右侧 summary / 文档与索引 / 检索测试分区清晰；补齐文档独立 loading、未选择 KB 空态、检索初始/无结果状态和移动端单列布局 |
| K02 | 已完成 | `frontend/src/features/knowledge/DocumentTable.tsx`、`frontend/src/features/knowledge/DocumentVersionsPanel.tsx`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-document-table-upgrade.mjs` | 已将文档表格升级为结构化列：文档、状态、版本、大小、chunks、错误摘要和操作分离；索引中行即时显示 PROCESSING 并禁用重复索引；失败行显示错误摘要并提供重试索引；版本面板补齐版本、状态、大小、chunks、创建时间和文档 ID |
| K03 | 已完成 | `frontend/src/features/knowledge/SearchTestPanel.tsx`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-search-evidence-cards.mjs` | 已将检索命中升级为证据卡片：rank、文件名、score 顶栏清晰；citation、section、chunk、检索策略使用可比较字段网格；offset/heading 和内容预览独立展示；保留检索 loading、初始空态和无结果空态 |
| H01 | 已完成 | `frontend/src/pages/HistoryPage.tsx`、`frontend/src/features/history/HistoryFilters.tsx`、`frontend/src/features/history/HistoryList.tsx`、`frontend/src/features/history/ReplayDetail.tsx`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-history-replay-upgrade.mjs` | 已将历史回放升级为 history rail + replay detail 布局；筛选支持刷新 loading 和完整状态；会话卡片 active/ID 截断清晰；详情区分 summary、报告、trace、产物复用；回放刷新失败保留旧数据，产物复用有 loading 反馈和本地存储错误兜底 |
| I01 | 已完成 | `frontend/src/pages/ImageGenerationPage.tsx`、`frontend/src/features/image/ImageGenerationForm.tsx`、`frontend/src/features/image/ImageGallery.tsx`、`frontend/src/features/image/ImageHistoryPanel.tsx`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-image-studio-layout.mjs` | 已将图片工作室升级为 controls rail + preview/history 主区；最新输出拥有 loading、empty、error、ready 四种舞台状态和稳定比例；生成错误与历史加载错误分离；参数表单有明确 action 区；历史记录独立 toolbar/grid，并为缺失或加载失败图片提供占位与失败原因 |
| I02 | 已完成 | `frontend/src/features/image/ImageHistoryPanel.tsx`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-image-history-grid.mjs` | 已将历史缩略图升级为结构化卡片：toolbar 显示总数、完成数和失败数；缩略图 frame 使用清晰 outline，失败状态有 danger 边缘；状态和模式固定在图像 overlay；尺寸、时间、会话关联改为三列 metadata，并对 sessionId 使用 mono 截断和完整 title；移动端 metadata 自动单列 |
| I03 | 已完成 | `frontend/src/features/image/useImageSelection.ts`、`frontend/src/features/image/ImageHistoryPanel.tsx`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-image-batch-selection.mjs` | 已新增图片选择状态 hook；历史记录支持进入/退出选择模式、选择当前页、清空选择和选中计数；选中卡片显示 primary outline、可访问 checkbox 和选择顺序；无选择时清空操作禁用；收藏、对比、下载集合仍留给 I04-I06 |
| I04 | 已完成 | `frontend/src/features/image/useImageFavorites.ts`、`frontend/src/features/image/ImageHistoryPanel.tsx`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-image-favorites.mjs` | 已新增本地收藏 helper/hook，使用 localStorage 持久化收藏图片 ID；收藏状态刷新后保留，无后端依赖；历史卡片支持收藏/取消收藏、收藏 badge、pressed 状态和收藏操作有反馈；localStorage 异常时保留本页临时状态并提示用户 |
| I05 | 已完成 | `frontend/src/features/image/ImageCompareDialog.tsx`、`frontend/src/features/image/ImageHistoryPanel.tsx`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-image-compare.mjs` | 已新增 ImageCompareDialog，对选择集合支持 2 到 4 张图片对比；少于 2 张禁用对比操作；超过 4 张提示并仅展示前 4 张；对比视图展示预览、状态、模式、尺寸、时间、会话和 prompt，移动端保持横向滚动 |
| I06 | 已完成 | `frontend/src/features/image/useImageDownloads.ts`、`frontend/src/features/image/ImageHistoryPanel.tsx`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-image-download-collection.mjs` | 已新增 useImageDownloads 浏览器端下载 helper/hook；下载集合有选中项才可操作，且至少一个选中项存在结果链接；下载中有 loading 和状态反馈；跨域失败时显示可打开链接列表作为兜底；未引入后端打包下载服务 |
| A01 | 已完成 | `frontend/src/pages/AdminOverviewPage.tsx`、`frontend/src/router/AppRouter.tsx`、`frontend/src/components/shell/navigation.ts`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-admin-overview.mjs` | 已新增管理总览页面，聚合模型、MCP、审计、RAG 风险；普通用户无权限；使用现有 admin API 降级展示部分失败数据；指标可跳转到模型配置、MCP、审计和 RAG 评估模块 |
| A02 | 已完成 | `frontend/src/pages/AdminSettingsPage.tsx`、`frontend/src/features/system/ModelRegistry.tsx`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-model-settings-upgrade.mjs` | 已升级模型配置页面摘要和注册表；默认模型和异常 provider 明确；最近测试状态独立展示并标记失败风险；模型启停/测试不回归，默认/编辑/删除操作保留 |
| A03 | 已完成 | `frontend/src/pages/McpServersPage.tsx`、`frontend/src/features/system/McpServerRegistry.tsx`、`frontend/src/features/system/McpToolList.tsx`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-mcp-page-upgrade.mjs` | 已升级 MCP 页面摘要、服务注册表、工具发现和健康检查展示；unhealthy、transport、tools、health 信息清晰；工具测试结果在页面内展示，测试结果不走错误样式，创建/更新/删除/发现/健康/测试接线保留 |
| A04 | 已完成 | `frontend/src/pages/AdminAuditPage.tsx`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-audit-structured-table.mjs` | 已将审计记录替换为结构化 Table；用户、任务、工具、登录 tab 按 `spec.md` 字段展示；详情可展开原始 payload，并保留字段 fallback、加载、空态、分页和筛选 |
| A05 | 已完成 | `frontend/src/pages/RagEvaluationPage.tsx`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-rag-evaluation-structured.mjs` | 已将 RAG 评估升级为指标卡、用例表、评估历史表和展开详情分层；可解析 metrics 优先结构化展示 Hit Rate、Recall、Precision、MRR/NDCG、通过/失败和失败用例；解析失败时展示原始 metrics 详情，并保留原始评估用例兜底 |
| A06 | 已完成 | `frontend/src/pages/AccountPage.tsx`、`frontend/src/features/account/*`、`frontend/src/styles/pages.css`、`frontend/scripts/verify-account-page-upgrade.mjs` | 已将账号中心升级为账户摘要、个人 API、资料、安全、登录日志分区布局；保存、测试、错误、成功反馈一致；API 测试显示具体测试项 loading 和最近测试结果；登录日志表格可读并保留空态 |
| T01 | 已完成 | `frontend/playwright.config.ts`、`frontend/e2e/smoke.spec.ts`、`frontend/scripts/verify-playwright-setup.mjs` | 已接入 Playwright config、HTML report、trace on retry、1440/1280/768/390 四个 Chromium viewport 项目和最小登录 smoke；可运行 Playwright；当前 smoke 不依赖真实生产数据，认证后 mock 数据留给 T02 |
| T02 | 已完成 | `frontend/e2e/fixtures/mockData.ts`、`frontend/e2e/fixtures/mockApi.ts`、`frontend/e2e/fixtures/test.ts`、`frontend/e2e/mock-auth.spec.ts`、`frontend/scripts/verify-playwright-mocks.mjs` | 已建立 Playwright fixtures、mock API 响应、普通用户/admin 登录态；可模拟会话、会话详情、知识库、文档、检索命中、图片历史、账号资料/API 配置/登录日志、模型、MCP、审计和 RAG 评估数据，并提供认证后 workspace/admin smoke |
| T03 | 已完成 | `frontend/e2e/public-pages.spec.ts`、`frontend/e2e/public-pages.spec.ts-snapshots/`、`frontend/scripts/verify-public-page-screenshots.mjs` | 已覆盖登录、注册、找回、重置、404 公共页面；按 4 个 viewport 和亮/暗主题截图生成稳定基线，并在截图前断言页面标题、关键表单控件和 resolved theme |
| T04 | 已完成 | `frontend/e2e/workspace.spec.ts`、`frontend/e2e/fixtures/workspaceScenarios.ts`、`frontend/e2e/workspace.spec.ts-snapshots/`、`frontend/scripts/verify-workspace-e2e-screenshots.mjs` | 已覆盖工作台空态、运行中、完成、失败四种状态；完成态验证 Inspector Tabs 的证据/工具切换和 payload 展开，并按 4 个 viewport 生成截图基线 |
| T05 | 已完成 | `frontend/e2e/knowledge.spec.ts`、`frontend/e2e/fixtures/knowledgeScenarios.ts`、`frontend/e2e/knowledge.spec.ts-snapshots/`、`frontend/scripts/verify-knowledge-e2e-screenshots.mjs` | 已覆盖知识库空态、文档表格、索引失败、检索命中四种状态；断言文档状态、失败原因、检索 rank/score/file/citation/section/chunk/策略/内容预览，并按 4 个 viewport 生成截图基线 |
| T06 | 已完成 | `frontend/e2e/image.spec.ts`、`frontend/e2e/fixtures/imageScenarios.ts`、`frontend/e2e/image.spec.ts-snapshots/`、`frontend/scripts/verify-image-e2e-screenshots.mjs` | 已覆盖图片工作室空态、历史、批量选择、收藏持久化、对比数量边界和下载集合跨域兜底；断言历史统计、选中状态、收藏刷新保留、超过 4 张仅展示前 4 张和下载失败链接，并按 4 个 viewport 生成 20 张截图基线 |
| T07 | 已完成 | `frontend/e2e/admin.spec.ts`、`frontend/e2e/admin.spec.ts-snapshots/`、`frontend/scripts/verify-admin-e2e-screenshots.mjs` | 已覆盖管理总览、审计结构化表格和详情、RAG 结构化指标和详情、普通用户无权限状态；修正 user/admin fixture 隔离，按 4 个 viewport 生成 16 张截图基线 |
| T08 | 已完成 | `frontend/e2e/release-golden-path.spec.ts`、`frontend/e2e/fixtures/mockApi.ts`、`frontend/scripts/verify-release-golden-path.mjs` | 已将发布前手动金路径固化为可重复 Playwright 检查：覆盖登录、研究运行、知识库检索、图片生成、历史回放产物复用、模型测试、MCP 发现/健康/工具测试、审计筛选详情和 RAG 评估详情，并按 4 个 viewport 执行 |

## 1. 开发任务清单

### 1.1 设计与交付准备

| ID | 任务 | 目标 | 涉及模块 | 前置依赖 | 验收标准 |
| --- | --- | --- | --- | --- | --- |
| D01 | 确认设计交付基线 | 固化字体、主题、核心页面覆盖范围和截图基线 | `docs/spec.md`、设计稿 | `requirements.md`、`spec.md` 已确认 | 输出设计交付清单：Geist Sans + IBM Plex Mono、本地托管优先、第一轮核心五页、4 个 viewport、亮/暗主题 |
| D02 | 产出视觉系统高保真 | 建立 graphite/zinc + cyan/teal 的视觉方向 | 设计稿、token 清单 | D01 | 包含亮/暗主题、颜色、字体、间距、圆角、阴影、状态色、focus ring、active state |
| D03 | 产出组件高保真 | 定义通用组件的所有关键状态 | Button、IconButton、Badge、StatusPill、Panel、Table、Tabs、Alert、EmptyState、Skeleton、Dialog、DropdownMenu、CommandPalette | D02 | 每个组件包含 default、hover、focus、active、disabled、loading 或 empty/error 等适用状态 |
| D04 | 产出第一轮页面高保真 | 让核心页面可进入开发 | 登录/注册、研究工作台、知识库、图片工作室、管理总览 | D02、D03 | 每页包含桌面和移动布局，研究工作台包含空态、运行中、完成、失败 |
| D05 | 产出第二轮页面高保真 | 覆盖其余页面，避免实现阶段自行猜设计 | 历史、账号、模型、MCP、审计、RAG、404 | D02、D03 | 每页包含正常、空态、加载、错误状态；审计和 RAG 包含展开详情 |

### 1.2 工程基线与视觉系统

| ID | 任务 | 目标 | 涉及模块 | 前置依赖 | 验收标准 |
| --- | --- | --- | --- | --- | --- |
| E01 | 建立当前 UI 回归基线 | 在改动前记录当前页面行为和截图 | `frontend`、Playwright 或临时截图脚本 | 无 | 记录当前核心路径截图和手测结果；不修改业务代码 |
| E02 | 接入字体资源 | 使用推荐字体并提供 fallback | `frontend/src/styles/*`、`frontend/src/main.tsx`、静态字体目录 | D02 | Geist Sans 用于 UI，IBM Plex Mono 用于代码/ID/日志；字体失败时回退系统字体 |
| E03 | 重构主题 token | 将主色改为 graphite/zinc + cyan/teal | `frontend/src/styles/tokens.css`、`frontend/src/styles/theme.css`、`frontend/tailwind.config.ts` | D02 | 亮/暗主题均可用；不再以绿色/橙色作为品牌主色；状态色语义不混用 |
| E04 | 统一主题跟随系统 | 默认跟随系统，手动切换持久化 | `frontend/src/hooks/useTheme.ts`、`frontend/src/main.tsx`、`Topbar` | E03 | 无用户设置时跟随 `prefers-color-scheme`；用户切换后写入本地存储 |
| E05 | 建立基础排版和数字规则 | 统一标题、正文、mono、tabular numbers | `base.css`、`global.css`、通用组件 | E02、E03 | 计数、耗时、分数、token 数使用 tabular；长 ID 默认截断且详情可见 |

### 1.3 通用组件升级

| ID | 任务 | 目标 | 涉及模块 | 前置依赖 | 验收标准 |
| --- | --- | --- | --- | --- | --- |
| C01 | 升级 Button 和 IconButton | 统一按钮交互质感 | `Button.tsx`、`IconButton.tsx` | E03、D03 | loading、disabled、hover、focus、active 状态完整；icon 按钮有 `aria-label` 和足够点击区域 |
| C02 | 升级 Badge 和 StatusPill | 减少胶囊标签噪音，状态语义清晰 | `Badge.tsx`、`StatusPill.tsx` | E03、D03 | Badge 默认紧凑；StatusPill 只表达状态；现有状态中文映射保留 |
| C03 | 升级 Panel 和基础 surfaces | 减少默认后台卡片感 | `Panel.tsx`、页面布局 CSS | E03、D03 | Panel 层级、边框、阴影统一；避免页面区块全部卡片化 |
| C04 | 升级 Table | 支持结构化审计、RAG、管理页 | `Table.tsx`、表格样式 | E03、D03 | 数字列右对齐；状态列紧凑；小屏可横向滚动或卡片化 |
| C05 | 升级 Tabs | 支持 Inspector 和页面分区 | `Tabs.tsx`、Radix Tabs 相关样式 | E03、D03 | 键盘可达；active 状态清晰；移动端不溢出 |
| C06 | 升级 Alert、EmptyState、Skeleton | 统一反馈、空态和加载态 | `Alert.tsx`、`EmptyState.tsx`、`Skeleton.tsx` | E03、D03 | 所有核心页面的 loading、empty、error 状态有统一表现 |
| C07 | 升级 JsonBlock 和展开详情 | 原始 JSON 默认折叠 | `features/workspace/JsonBlock.tsx`、审计/RAG 详情组件 | C04 | 摘要优先；payload 过长可滚动；展开内容使用 mono |
| C08 | 升级 CommandPalette 和 Dropdown | 保持快捷入口一致 | `CommandPalette.tsx`、`DropdownMenu.tsx`、`UserMenu` | E03、D03 | `Cmd/Ctrl+K` 可用；命令项分组清楚；键盘操作不回归 |

### 1.4 Shell 与公共页面

| ID | 任务 | 目标 | 涉及模块 | 前置依赖 | 验收标准 |
| --- | --- | --- | --- | --- | --- |
| S01 | 升级 AppShell、Sidebar、Topbar | 统一全局导航和品牌质感 | `AppShell.tsx`、`Sidebar.tsx`、`Topbar.tsx`、`navigation.ts` | C01、C02、C08、D04 | active nav 清晰；admin 分组权限不变；移动端菜单可用 |
| S02 | 升级 Auth 页面 | 强化第一印象，不改变认证流程 | `AuthLayout.tsx`、登录/注册/找回/重置页面 | C01、C06、D04 | 表单行为不变；错误提示清楚；移动端不重叠 |
| S03 | 升级 404 页面 | 提供清晰返回路径 | `NotFoundPage.tsx` | C01、C06、D05 | 有返回工作台和登录入口；未登录/已登录均合理 |

### 1.5 研究工作台

| ID | 任务 | 目标 | 涉及模块 | 前置依赖 | 验收标准 |
| --- | --- | --- | --- | --- | --- |
| W01 | 重构 Workspace 布局骨架 | 建立左侧会话、中间 feed、右侧 Inspector Tabs | `WorkspacePage.tsx`、`layout.css`、workspace components | C01-C07、D04 | 桌面三栏清晰；小屏单列或抽屉；现有创建/选择会话流程不变 |
| W02 | 拆分 Agent feed item | 将执行过程从调试 timeline 变成可读 feed | `ExecutionTimeline.tsx`、`workspaceViewModel.ts` | W01、C07 | run、plan step、tool、artifact、stream event 各有可区分展示 |
| W03 | 工具调用摘要与详情 | 默认摘要，payload 展开 | `ToolInvocationList.tsx`、`JsonBlock.tsx` | W02、C07 | 工具名、状态、耗时、摘要可见；请求/响应默认折叠 |
| W04 | 证据和产物展示升级 | 让证据、报告、产物层级清楚 | `ArtifactPanel.tsx`、新增 evidence 视图 | W01、C02、C07 | 展示来源、分数、citation、section、内容预览；产物可复用 |
| W05 | Inspector Tabs | 右侧至少包含产物、证据、记忆、工具 | `ArtifactPanel.tsx`、`MemoryPanel.tsx`、`ToolInvocationList.tsx`、新 Inspector 组件 | W03、W04、C05 | Tabs 可键盘切换；各 tab 空态、加载、错误状态完整 |
| W06 | 研究任务状态反馈 | 区分运行、暂停、取消、失败、完成 | `ResearchComposer.tsx`、`ExecutionTimeline.tsx`、`StatusPill.tsx` | W01-W05 | 暂停/继续/取消按钮可用性正确；SSE 中断保留已收到事件并提示恢复 |

### 1.6 知识库与历史

| ID | 任务 | 目标 | 涉及模块 | 前置依赖 | 验收标准 |
| --- | --- | --- | --- | --- | --- |
| K01 | 知识库页面改为 RAG cockpit | 提升 KB、文档、检索的整体结构 | `KnowledgeBasesPage.tsx`、knowledge features | C01-C07、D04 | KB 列表、文档状态、检索测试分区清晰 |
| K02 | 文档表格升级 | 清晰表达解析/索引状态和失败原因 | `DocumentTable.tsx`、`DocumentVersionsPanel.tsx` | K01、C04 | 文档状态、版本、大小、chunks、错误摘要可见；重索引操作不回归 |
| K03 | 检索证据卡片 | 让命中结果可读可比较 | `SearchTestPanel.tsx` | K01、C02、C07 | 展示 rank、score、文件名、citation、section、chunk、策略、内容预览 |
| H01 | 历史回放视觉升级 | 强化回放摘要、trace、产物复用 | `HistoryPage.tsx`、`ReplayDetail.tsx` | W02-W04、C06 | 筛选、回放、产物复用不回归；trace 和报告层级清楚 |

### 1.7 图片工作室

| ID | 任务 | 目标 | 涉及模块 | 前置依赖 | 验收标准 |
| --- | --- | --- | --- | --- | --- |
| I01 | 图片工作室布局升级 | 让最新输出成为视觉中心 | `ImageGenerationPage.tsx`、`ImageGallery.tsx`、`ImageGenerationForm.tsx` | C01-C06、D04 | 最新输出、参数、历史清晰分区；图片加载失败有占位 |
| I02 | 历史缩略图网格升级 | 提升浏览和选择效率 | `ImageHistoryPanel.tsx`、图片样式 | I01 | 缩略图边缘清晰；状态、尺寸、时间、会话关联可见 |
| I03 | 批量选择模式 | 支持选择集合 | `ImageHistoryPanel.tsx`、新选择状态 hook | I02 | 可进入/退出选择模式；显示选中状态和选择计数；无选择时批量操作禁用 |
| I04 | 收藏功能 | 本地持久化收藏状态 | `ImageHistoryPanel.tsx`、localStorage helper | I03 | 收藏状态刷新后保留；无后端依赖；收藏操作有反馈 |
| I05 | 对比视图 | 支持 2 到 4 张图片对比 | 新 Compare 组件、`ImageHistoryPanel.tsx` | I03 | 少于 2 张禁用；超过 4 张提示减少选择或只取前 4 张；移动端可横向滚动 |
| I06 | 下载集合 | 下载选中图片集合 | `ImageHistoryPanel.tsx`、下载 helper | I03 | 有选中项才可操作；下载中有 loading；跨域失败时显示可打开链接列表 |

### 1.8 管理端与账号

| ID | 任务 | 目标 | 涉及模块 | 前置依赖 | 验收标准 |
| --- | --- | --- | --- | --- | --- |
| A01 | 新增管理总览页面 | 聚合模型、MCP、审计、RAG 风险 | `AppRouter.tsx`、`navigation.ts`、新 `AdminOverviewPage.tsx` | C01-C06、D04 | admin 可见；普通用户无权限；指标可跳转到对应模块 |
| A02 | 模型配置页面升级 | 突出默认模型、测试状态、风险 provider | `AdminSettingsPage.tsx`、`ModelRegistry.tsx` | C04、A01、D05 | 默认模型和异常 provider 明确；模型启停/测试不回归 |
| A03 | MCP 页面升级 | 突出连接状态、发现、健康、测试 | `McpServersPage.tsx`、MCP features | C04、A01、D05 | unhealthy、transport、tools、health 信息清晰；测试结果不走错误样式 |
| A04 | 审计结构化表格 | 替换原始 JSON 列表 | `AdminAuditPage.tsx` | C04、C07、D05 | 用户、任务、工具、登录 tab 按 `spec.md` 字段展示；详情可展开原始 payload |
| A05 | RAG 评估结构化展示 | 指标卡、用例、历史、详情分层 | `RagEvaluationPage.tsx` | C04、C07、D05 | 可解析 metrics 优先结构化；解析失败时展示原始 metrics 详情 |
| A06 | 账号中心视觉升级 | 统一个人 API、资料、安全、登录日志 | `AccountPage.tsx`、account features | C01-C06、D05 | 保存、测试、错误、成功反馈一致；登录日志表格可读 |

## 2. 每个任务的目标

每个任务的目标已在上方表格列出。执行时应保持以下共同目标：

- 任务必须能独立开发、独立验收。
- 每个任务完成后不破坏现有金路径。
- 页面任务不得绕过通用组件自行写一套样式。
- 新增交互必须有 loading、empty、error、disabled 状态。
- 所有新增图标按钮必须有可访问标签。

## 3. 涉及模块

| 模块 | 主要文件 |
| --- | --- |
| 文档与规格 | `docs/requirements.md`、`docs/spec.md`、`docs/tasks.md` |
| 主题与样式 | `frontend/src/styles/tokens.css`、`theme.css`、`base.css`、`layout.css`、`components.css`、`pages.css` |
| 应用入口 | `frontend/src/main.tsx`、`frontend/src/app/App.tsx` |
| Shell | `frontend/src/components/shell/*` |
| 通用组件 | `frontend/src/components/ui/*`、`frontend/src/components/command/*` |
| 工作台 | `frontend/src/pages/WorkspacePage.tsx`、`frontend/src/features/workspace/*` |
| 知识库 | `frontend/src/pages/KnowledgeBasesPage.tsx`、`frontend/src/features/knowledge/*` |
| 图片 | `frontend/src/pages/ImageGenerationPage.tsx`、`frontend/src/features/image/*` |
| 历史 | `frontend/src/pages/HistoryPage.tsx`、`frontend/src/features/history/*` |
| 管理 | `frontend/src/pages/AdminSettingsPage.tsx`、`McpServersPage.tsx`、`AdminAuditPage.tsx`、`RagEvaluationPage.tsx`、新增 `AdminOverviewPage.tsx` |
| 账号 | `frontend/src/pages/AccountPage.tsx`、`frontend/src/features/account/*` |
| 路由 | `frontend/src/router/AppRouter.tsx`、`frontend/src/components/shell/navigation.ts` |
| 测试 | `frontend` Playwright 配置、E2E specs、截图基线目录 |

## 4. 前置依赖

| 阶段 | 前置依赖 |
| --- | --- |
| 设计任务 | `docs/requirements.md`、`docs/spec.md` 已确认 |
| 视觉系统实现 | D02、D03 完成并评审通过 |
| 页面实现 | 对应页面高保真完成；通用组件任务完成或已有可复用组件 |
| 管理总览 | 现有 admin API 可提供模型、MCP、审计、RAG 数据；缺失字段用降级展示 |
| 图片收藏 | 默认本地持久化；跨设备收藏不做 |
| 下载集合 | 使用现有图片 URL；跨域失败用链接列表兜底 |
| 测试任务 | 核心页面实现完成，具备稳定测试数据或网络 mock |

## 5. 验收标准

### 5.1 通用验收标准

- `cd frontend && pnpm build` 通过。
- 页面没有明显文本溢出、重叠、不可点击控件。
- 亮色和暗色主题均可用。
- 主要交互支持键盘访问。
- 错误态不会清空用户已输入内容。
- 原始 JSON 默认折叠，摘要优先展示。

### 5.2 页面验收标准

| 页面 | 验收标准 |
| --- | --- |
| 研究工作台 | 创建/选择会话、运行任务、暂停/继续/取消、SSE 事件、报告、产物复用不回归；Inspector Tabs 可用 |
| 知识库 | 创建 KB、上传文档、索引/重索引、版本、检索测试不回归；命中以证据卡展示 |
| 图片工作室 | 文本生图、参考图编辑、历史分页不回归；批量选择、收藏、对比、下载集合可用 |
| 管理总览 | admin 可访问，普通用户不可访问；风险指标可跳转 |
| 审计 | 用户、任务、工具、登录记录结构化展示；可展开详情 |
| RAG 评估 | 用例管理、运行评估不回归；metrics 可结构化或降级展示 |
| 账号中心 | 资料、密码、API 配置、连接测试、登录日志不回归 |

## 6. 推荐开发顺序

1. D01-D05：完成并评审设计稿。
2. E01：记录当前回归基线。
3. E02-E05：字体、主题、token、排版。
4. C01-C08：通用组件升级。
5. S01-S03：Shell、Auth、404。
6. W01-W06：研究工作台。
7. K01-K03、H01：知识库和历史。
8. I01-I06：图片工作室。
9. A01-A06：管理端和账号。
10. T01-T08：测试、截图回归和发布前检查。

## 7. 可并行任务

| 可并行任务 | 条件 | 注意事项 |
| --- | --- | --- |
| D04 与 D05 | D02、D03 完成 | 两轮设计稿需共享同一 token 和组件规范 |
| C01、C02、C06 | E03 完成 | 组件视觉需保持同一状态体系 |
| C04 与 C07 | E03 完成 | 表格和详情展开要协同，避免重复实现 JSON 展示 |
| S02 与 S03 | C01、C06 完成 | Auth 和 404 不依赖业务页 |
| K01-K03 与 I01-I02 | C01-C06 完成 | 分别改知识库和图片页，不共享业务状态 |
| A02、A03、A06 | C01-C06 完成 | 管理总览 A01 可并行，但导航合并需统一处理 |
| T01、T02 | 页面实现前即可开始 | 测试框架和 mock 数据可以先搭 |

## 8. 测试任务

| ID | 任务 | 目标 | 涉及模块 | 前置依赖 | 验收标准 |
| --- | --- | --- | --- | --- | --- |
| T01 | 接入 Playwright | 建立 E2E 和截图回归基础 | `frontend/package.json`、Playwright config | 无 | 可运行 Playwright；不依赖真实生产数据 |
| T02 | 建立测试数据和网络 mock | 让认证后页面可稳定截图 | Playwright fixtures、mock API 响应 | T01 | 可模拟登录态、会话、知识库、图片、admin 数据 |
| T03 | 公共页面截图 | 覆盖登录、注册、找回、重置、404 | Playwright specs | S02、S03、T01 | 4 个 viewport，亮/暗主题截图稳定 |
| T04 | 工作台 E2E 和截图 | 覆盖空态、运行中、完成、失败、Inspector Tabs | Playwright specs | W01-W06、T02 | 任务流、tab 切换、payload 展开可验证 |
| T05 | 知识库 E2E 和截图 | 覆盖文档表格、索引失败、检索命中 | Playwright specs | K01-K03、T02 | 检索结果字段和空态可验证 |
| T06 | 图片工作室 E2E 和截图 | 覆盖批量选择、收藏、对比、下载集合 | Playwright specs | I01-I06、T02 | 选择状态、收藏持久化、对比数量边界可验证 |
| T07 | 管理端 E2E 和截图 | 覆盖管理总览、审计、RAG 评估 | Playwright specs | A01、A04、A05、T02 | 普通用户无权限，admin 可查看结构化表格和详情 |
| T08 | 发布前手动金路径 | 防止视觉改造破坏真实流程 | 全前端 | 所有页面任务完成 | 手测登录、研究、知识库、图片、历史、模型、MCP、审计、RAG |

## 9. 风险任务

| 风险 | 关联任务 | 风险说明 | 控制方式 |
| --- | --- | --- | --- |
| 高保真设计覆盖不足 | D04、D05 | 页面实现阶段可能自行发挥，导致不一致 | 第一轮只覆盖核心五页，第二轮再补全；未设计页面不进入实现 |
| Token 双轨冲突 | E03 | `tokens.css` 与 `theme.css` 可能继续漂移 | 明确一套语义 token，Tailwind 只做桥接 |
| 字体授权和加载 | E02 | 字体托管方式影响部署和性能 | 本地托管优先，失败自动 fallback |
| 工作台回归风险 | W01-W06 | Workspace 状态多、SSE 流复杂 | 保留 `workspaceViewModel.ts` 纯函数和现有 API 接线，逐步替换展示层 |
| 图片下载跨域 | I06 | 远端图片 URL 可能不能直接下载 | 失败时提供可打开链接列表，不引入后端下载服务 |
| 收藏只能本地持久化 | I04 | 首版不同设备不同步 | 文档和 UI 明确“本地收藏”；跨设备同步另行立项 |
| 管理总览字段不足 | A01 | 现有接口可能没有全部聚合字段 | 使用现有接口降级展示，缺失字段不阻塞首版 |
| 审计/RAG metrics 结构不稳定 | A04、A05 | 原始 payload 字段可能不一致 | 可解析字段结构化，原始 payload 作为展开详情兜底 |
| 截图回归不稳定 | T01-T07 | 动态时间、随机 ID、动画会造成差异 | mock 固定数据，关闭或稳定动画，使用固定 viewport 和主题 |
| 移动端布局复杂 | W01、I05、A04 | Inspector、对比视图、表格在小屏可能拥挤 | 小屏使用 tabs/drawer/横向滚动，不强行压缩信息 |
