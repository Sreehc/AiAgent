# AiAgent 第一轮页面高保真规格

> 任务来源：`docs/tasks.md` D04。本文档基于 `docs/design-delivery-baseline.md`、`docs/visual-system-spec.md`、`docs/component-system-spec.md` 和当前前端代码结构，定义第一轮核心页面的高保真设计规格。本文档是进入 S/W/K/I/A 页面实现前的页面级交付物，不包含第二轮页面、后端重写、assistant-ui runtime 接入或 Next.js 迁移。

## 1. 范围与约束

### 1.1 覆盖页面

| 页面 | 路由 | 当前实现 | 后续任务 |
| --- | --- | --- | --- |
| 登录/注册组合页 | `/login`、`/register/invite` | `LoginPage.tsx`、`RegisterPage.tsx`、`AuthLayout.tsx` | S02 |
| 研究工作台 | `/workspace/chat` | `WorkspacePage.tsx` + workspace features | W01-W06 |
| 知识库 | `/workspace/knowledge-bases` | `KnowledgeBasesPage.tsx` + knowledge features | K01-K03 |
| 图片工作室 | `/workspace/image-generation` | `ImageGenerationPage.tsx` + image features | I01-I06 |
| 管理总览 | `/admin/overview` | 新增页面；数据来自现有 admin API 降级聚合 | A01 |

### 1.2 设计约束

- 视觉方向固定为 graphite/zinc + restrained cyan/teal。
- Light 与 dark 主题必须同时设计。
- 桌面优先，但 390x844 移动端不能出现横向失控滚动、文本重叠或关键操作不可达。
- 页面任务必须复用 D03 组件规格，不为单页重新发明 Button、Badge、Panel、Table、Tabs、Alert、EmptyState、Skeleton、Dialog、DropdownMenu。
- 不改变现有业务流程：认证、会话、SSE、知识库、图片生成、管理权限都保持原有语义。
- 页面高保真稿中的所有新增数据字段，若当前接口没有，应在实现时降级显示，不阻塞首版。

### 1.3 设计稿交付 viewport

| Viewport | 用途 |
| --- | --- |
| 1440x900 | 桌面主稿 |
| 1280x800 | 笔记本可用性检查 |
| 768x1024 | 平板单列/双列折叠检查 |
| 390x844 | 手机主稿 |

每个页面至少输出 light/dark 两套视觉标注；截图回归可优先覆盖 1440x900 和 390x844，后续 T03-T07 补齐 4 viewport。

## 2. 全局页面框架

### 2.1 桌面页面骨架

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Topbar: current page, command, theme, user                                  │
├───────────────┬──────────────────────────────────────────────────────────────┤
│ Sidebar       │ Page header: title + concise subtitle + status meta          │
│ nav groups    ├──────────────────────────────────────────────────────────────┤
│               │ Primary content area                                         │
│               │ - page-specific grid                                         │
│               │ - panels/tables/feed/preview                                 │
│               │ - inline alerts, loading, empty, error states                │
└───────────────┴──────────────────────────────────────────────────────────────┘
```

视觉规则：

- `body` 背景使用 `--color-bg`，主内容区使用 `--color-surface`、`--color-surface-subtle` 和 border 建立层级。
- `page-header` 不做卡片；使用 full-width unframed layout。
- 页面主体最大宽度为 `--content-max-width`，工作台允许接近满宽。
- 图标使用现有 lucide 体系，stroke 保持一致。

### 2.2 移动页面骨架

```text
┌──────────────────────────────┐
│ Mobile topbar / menu         │
├──────────────────────────────┤
│ Page title + primary meta    │
├──────────────────────────────┤
│ Primary action / filters     │
├──────────────────────────────┤
│ Single-column content        │
│ Panels collapse into tabs    │
│ Tables scroll or cardify     │
└──────────────────────────────┘
```

移动规则：

- 主操作按钮高度不小于 `44px`。
- 次级面板默认折叠或进入 Tabs/Drawer。
- 页面内所有横向滚动必须是受控容器，不让整个页面横向滚动。
- 不依赖 hover 暴露关键操作。

## 3. 登录/注册组合页

### 3.1 目标

强化第一印象，表达“专业 AI 研究工作台”，同时保留现有登录、邀请注册、找回密码、重置密码流程。

涉及当前文件：

- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`
- `frontend/src/features/auth/AuthLayout.tsx`

### 3.2 桌面布局

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Auth background: graphite/zinc surface, subtle cyan data grid line           │
│                                                                              │
│  ┌──────────────────────────────┐   ┌────────────────────────────────────┐   │
│  │ Brand block                   │   │ Auth form panel                    │   │
│  │ AiAgent mark                  │   │ eyebrow                            │   │
│  │ Product title                 │   │ h2                                 │   │
│  │ Specific value copy           │   │ intro                              │   │
│  │ Capability list               │   │ fields                             │   │
│  │ System status strip           │   │ alert / success                    │   │
│  └──────────────────────────────┘   │ primary submit                     │   │
│                                      │ footer links                       │   │
│                                      └────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

视觉规格：

- 左侧品牌区不使用卡片，作为页面背景上的 unframed content。
- 右侧表单使用 `Panel` raised 级别，但 radius 不超过 `12px`。
- 背景只允许轻微 grid/noise 或细线，不使用大面积渐变球和装饰 blob。
- `AiAgent` 品牌标记使用 cyan 小面积强调，文字使用 graphite/zinc。
- 表单输入使用 D03 Field/Input/Button；primary submit 只能有一个。

### 3.3 移动布局

```text
┌──────────────────────────────┐
│ Brand mark + AiAgent         │
│ Product title, one-line copy │
├──────────────────────────────┤
│ Auth form                    │
│ Fields                       │
│ Alert / success              │
│ Submit                       │
│ Footer links                 │
└──────────────────────────────┘
```

移动规则：

- 左侧 capability list 收敛为 2-3 个紧凑 meta chips 或直接隐藏。
- 表单不使用双列；注册页用户名/显示名称、密码/确认密码都改为单列。
- 错误 Alert 在提交按钮上方，保留用户输入。

### 3.4 状态稿

| 状态 | 触发 | 外观与交互 |
| --- | --- | --- |
| 默认 | 首次进入 `/login` 或 `/register/invite` | 输入为空，submit 可点击；用户名、密码字段有 visible label。 |
| 输入中 | 用户编辑字段 | Field focus ring 可见；输入区域不改变尺寸。 |
| 提交中 | `submitting=true` | Submit Button loading，禁用重复提交；表单保留原值。 |
| 错误 | API error、密码校验失败、邀请码无效 | Error Alert 使用 `role=alert`；错误在表单内就近展示；邀请码无效额外出现 EmptyState/notice。 |
| 成功/跳转 | 注册成功 | Success Alert 显示“注册成功，正在跳转登录页”；submit 禁用，避免重复注册。 |
| 移动端 | 390x844 | 单列，submit 不溢出；footer links 换行仍可点。 |

### 3.5 文案与字段

| 区域 | 文案方向 |
| --- | --- |
| 登录标题 | “登录工作台”或“进入研究工作台” |
| 左侧标题 | “AI Agent Operations Console” 可保留，但 supporting copy 应更具体：研究、证据、产物、配置 |
| 注册标题 | “创建受邀账号” |
| 错误 | 直接描述原因和下一步，不使用“Oops”或感叹号 |

## 4. 研究工作台

### 4.1 目标

将现有“会话列表 + 表单 + timeline + 右侧堆叠面板”升级为“左侧会话、中间 Agent feed、右侧 Inspector Tabs”的研究工作台。

涉及当前文件：

- `frontend/src/pages/WorkspacePage.tsx`
- `frontend/src/features/workspace/SessionList.tsx`
- `frontend/src/features/workspace/ResearchComposer.tsx`
- `frontend/src/features/workspace/ExecutionTimeline.tsx`
- `frontend/src/features/workspace/ArtifactPanel.tsx`
- `frontend/src/features/workspace/MemoryPanel.tsx`
- `frontend/src/features/workspace/ToolInvocationList.tsx`
- `frontend/src/features/workspace/workspaceViewModel.ts`

### 4.2 桌面布局

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header: 研究工作台 | run status | session count | KB count                  │
├───────────────┬───────────────────────────────────────┬──────────────────────┤
│ Session rail  │ Main research flow                    │ Inspector Tabs        │
│ 280px         │ - Composer                            │ 360px                 │
│ Search/list   │ - Active run summary                  │ Tabs: 产物/证据/记忆/工具 │
│ New session   │ - Agent feed                          │ Tab content           │
│ Session cards │ - Final report preview                │ JSON details folded   │
└───────────────┴───────────────────────────────────────┴──────────────────────┘
```

布局规格：

- `Session rail` 使用 `--workspace-session-width: 280px`，支持刷新、新建、删除。
- 中间主列是唯一主工作流，Composer 固定在顶部或 feed 上方，不使用聊天营销式大气泡。
- Agent feed 使用事件流，区分 run、plan step、tool、evidence、artifact、summary。
- 右侧 Inspector 使用 Tabs，不再把 Artifact、Memory、ToolInvocation 三个 Panel 直接堆叠。
- Inspector tab 最少包含：`产物`、`证据`、`记忆`、`工具`。

### 4.3 移动布局

```text
┌──────────────────────────────┐
│ Header + current status      │
├──────────────────────────────┤
│ Session selector             │
├──────────────────────────────┤
│ Composer                     │
├──────────────────────────────┤
│ Agent feed                   │
├──────────────────────────────┤
│ Inspector tabs               │
└──────────────────────────────┘
```

移动规则：

- 会话列表变成 select/sheet，不常驻左侧。
- Inspector 放到 feed 下方，Tabs 横向滚动。
- Composer 操作按钮换行；暂停/继续/取消按钮仍可达。
- Feed item 不使用宽表格，工具 payload 默认折叠。

### 4.4 状态稿

| 状态 | 触发 | 外观与交互 |
| --- | --- | --- |
| 空态 | 无会话或未选择会话 | 中间显示 EmptyState：创建会话；Composer 运行按钮禁用；Inspector Tabs 显示空态。 |
| Idle | 有会话无运行任务 | Composer 可编辑；feed 展示历史摘要或“准备运行”；StatusPill 为 idle。 |
| 运行中 | `runningTask=true` 或 active run `RUNNING/PENDING` | Header 和 feed 使用 running cyan；Composer 显示暂停/取消；Agent feed 追加 live events；Skeleton 用于待返回摘要。 |
| 暂停 | active run `PAUSED` | Feed 保留当前位置；主操作变为继续；暂停原因在 run summary 可见。 |
| 完成 | run `COMPLETED` | Feed 顶部或尾部显示完成摘要；报告、证据、产物进入 Inspector；复用产物按钮可用。 |
| 失败 | run `FAILED/TIMED_OUT` 或 API error | Error Alert 显示错误摘要；feed 保留已完成事件；提供查看详情、重新运行、历史恢复入口。 |
| SSE 中断 | stream request 中断 | Info/Warning Alert：实时连接中断，已保留事件；尝试从会话详情恢复。 |
| 删除会话 | 点击删除 | Danger Confirm Dialog，确认后删除；删除中按钮 loading。 |

### 4.5 Agent feed item 规格

| Feed item | 必显字段 | 详情 |
| --- | --- | --- |
| Run summary | query、executionMode、strategyMode、status、耗时 | status + meta chips，失败显示 errorMessage |
| Plan step | stepNo、title、status、toolName | observation/completionJudgement 可折叠 |
| Tool call | toolName、toolType、status、耗时 | request/response payload 使用 JsonBlock |
| Evidence | citationId、fileName、rank、score、sectionTitle、contentPreview | score 使用 mono/tabular，点击可进入 Inspector 证据 tab |
| Artifact | artifactType、title、createdAt、reusable | 支持复用、打开、上传 |
| Summary/report | summary/final report | 长文排版使用 `--text-base`，line-height 1.7 |

### 4.6 Inspector Tabs

| Tab | 内容 | 空态 |
| --- | --- | --- |
| 产物 | artifacts、upload、reuse、open | “当前会话还没有产物” |
| 证据 | recall/final evidence 列表，citation、score、source | “运行任务后展示证据” |
| 记忆 | memory textarea、保存、清空、重建 | “选择会话后可编辑记忆” |
| 工具 | tool invocations、状态、耗时、payload details | “暂无工具调用” |

验收要点：

- Tabs 支持键盘切换。
- 切换 Tabs 不丢失 memory 编辑内容。
- Payload、JSON、tool output 默认折叠。

## 5. 知识库

### 5.1 目标

将知识库页面升级为 RAG cockpit：左侧 KB 管理，中间文档与索引状态，底部/右侧检索测试和证据卡片。

涉及当前文件：

- `frontend/src/pages/KnowledgeBasesPage.tsx`
- `frontend/src/features/knowledge/KnowledgeBaseList.tsx`
- `frontend/src/features/knowledge/KnowledgeBaseSummary.tsx`
- `frontend/src/features/knowledge/DocumentTable.tsx`
- `frontend/src/features/knowledge/DocumentVersionsPanel.tsx`
- `frontend/src/features/knowledge/SearchTestPanel.tsx`

### 5.2 桌面布局

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header: 知识库 | KB count | document count | search hit count               │
├─────────────────────┬────────────────────────────────────────────────────────┤
│ KB cockpit rail     │ Main RAG cockpit                                       │
│ - create/search KB  │ ┌ Summary cards: status / docs / chunks / updated ┐    │
│ - KB list           │ ├ Document table + upload                         │    │
│ - selected meta     │ ├ Version panel when opened                        │    │
│                     │ └ Retrieval test + evidence cards                  │    │
└─────────────────────┴────────────────────────────────────────────────────────┘
```

布局规格：

- 左侧 KB rail 宽度约 `300px`，列表 item 显示名称、状态、文档数、更新时间。
- 右侧主区第一层是 KB summary，不再只是一张表单卡。
- 文档表格置于主区中心，上传与重索引操作保持可见。
- 检索测试在文档表格下方，命中结果以 evidence card 列表展示。

### 5.3 移动布局

```text
┌──────────────────────────────┐
│ Header + KB count            │
├──────────────────────────────┤
│ KB selector / create action  │
├──────────────────────────────┤
│ Summary cards                │
├──────────────────────────────┤
│ Documents cards/table scroll │
├──────────────────────────────┤
│ Search test + evidence cards │
└──────────────────────────────┘
```

移动规则：

- KB rail 变成 selector 或 collapsible list。
- 文档表格可横向滚动；若卡片化，每张卡展示 fileName、parseStatus、chunkCount、version、lastError、actions。
- Search hit card 不横向滚动，contentPreview 可折叠。

### 5.4 状态稿

| 状态 | 触发 | 外观与交互 |
| --- | --- | --- |
| Loading | 初始 `loadKnowledgeBases` 或文档加载 | KB rail、summary、document table 使用 Skeleton。 |
| 无知识库 | `knowledgeBases.length=0` | EmptyState：创建第一个知识库；文档和检索区禁用。 |
| KB 默认 | 已选择 KB | Summary 显示 status、documentCount、updatedAt；编辑 name/description 可保存。 |
| 上传中 | `uploading=true` | 上传按钮 loading；文档表格保留当前行。 |
| 索引中 | `indexingActions[documentId]` | 行级 loading；状态列显示 processing；重索引按钮 disabled。 |
| 索引失败 | `lastError` 或 parseStatus failed | 行内 danger StatusPill + 错误摘要；提供重试索引。 |
| 检索中 | `searching=true` | Search button loading；hit 区显示 evidence skeleton。 |
| 检索命中 | `searchHits.length>0` | Evidence cards 展示 rank、score、fileName、citationId、section、chunk、strategy、preview。 |
| 检索无结果 | 搜索成功但无命中 | EmptyState：调整 Query 或 Top K；保留 query。 |
| 删除 KB | 点击删除 | Danger Confirm Dialog；说明文档和索引一并删除。 |

### 5.5 Evidence card

| 字段 | 视觉 |
| --- | --- |
| Rank | 左侧小编号，mono/tabular |
| Score | 右上角 mono，使用 neutral/primary 不用 success |
| 文件名 | 主标题，长文件名截断 |
| Citation ID | 小型 mono badge |
| Section / Chunk | meta row |
| Retrieval strategy | neutral badge |
| Content preview | 正文 2-4 行，展开后显示更多 |

## 6. 图片工作室

### 6.1 目标

让最新输出成为视觉中心，并补齐历史缩略图、批量选择、收藏、对比视图和下载集合的首版交互。

涉及当前文件：

- `frontend/src/pages/ImageGenerationPage.tsx`
- `frontend/src/features/image/ImageGenerationForm.tsx`
- `frontend/src/features/image/ImageGallery.tsx`
- `frontend/src/features/image/ImageHistoryPanel.tsx`

### 6.2 桌面布局

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header: 图片工作室 | mode | size | history count                             │
├─────────────────────┬────────────────────────────────────────────────────────┤
│ Generation controls │ Preview stage                                          │
│ - mode segmented    │ ┌ Latest output large preview ┐                        │
│ - prompt            │ │ image / placeholder / error  │                        │
│ - size/session      │ └ metadata + actions           ┘                        │
│ - reference upload  │ History toolbar: select/favorite/compare/download       │
│ - generate button   │ Thumbnail grid                                          │
└─────────────────────┴────────────────────────────────────────────────────────┘
```

布局规格：

- 左侧参数面板宽度约 `340px`，生成按钮固定在表单底部或明显位置。
- 最新输出使用大预览区域，采用稳定 aspect-ratio，避免图片加载导致跳动。
- 历史区域使用 4-5 列缩略图网格；每张卡片显示状态、尺寸、时间、会话关联。
- 批量选择 toolbar 在历史 grid 上方，进入选择模式后保持 sticky 或固定在 grid 顶部。

### 6.3 移动布局

```text
┌──────────────────────────────┐
│ Header + mode/size chips     │
├──────────────────────────────┤
│ Latest preview               │
├──────────────────────────────┤
│ Generate controls accordion  │
├──────────────────────────────┤
│ History toolbar              │
├──────────────────────────────┤
│ 2-column thumbnail grid      │
└──────────────────────────────┘
```

移动规则：

- 最新输出排在参数表单前，突出结果。
- 表单可折叠，但生成按钮必须可达。
- 对比视图移动端允许横向滚动，不强行压缩到 4 张同屏。

### 6.4 状态稿

| 状态 | 触发 | 外观与交互 |
| --- | --- | --- |
| 默认/无最新输出 | latestResult null | Preview stage 显示生成引导和稳定占位，不显示空白区域。 |
| 生成中 | `submitting=true` | Generate button loading；Preview stage 显示 skeleton/progress；表单保留输入。 |
| 生成成功 | latestResult available | 大图展示 resultUrl；metadata 显示 jobId、size、mode、session、createdAt；可打开/复用。 |
| 生成失败 | API error | Error Alert + preview error placeholder；保留 prompt 和 reference file 状态。 |
| 历史加载 | `loading=true` | Thumbnail skeleton grid。 |
| 图片加载失败 | image onError 或 resultUrl null | Tile placeholder，显示失败原因；提供打开原图/复制信息入口。 |
| 批量选择 | 用户点击选择模式 | Toolbar 显示 selected count；tile 显示 checkbox/selection overlay。 |
| 已选择 | 点击 tile checkbox | Cyan outline + selection number；不改变 tile 尺寸。 |
| 收藏 | 点击 favorite | 收藏标记显示在 tile 角落；首版 localStorage 持久化。 |
| 对比视图 | 选中 2-4 张后点击对比 | Dialog/Sheet 展示并排图片、metadata；少于 2 张禁用；超过 4 张提示减少选择或只取前 4 张。 |
| 下载集合 | 选中图片后点击下载 | Button loading；成功 toast；跨域失败时显示可打开链接列表。 |

### 6.5 Thumbnail tile

| 区域 | 视觉 |
| --- | --- |
| Image | `aspect-ratio: 1 / 1`，object-fit cover，边缘有 subtle outline |
| Status | 左上 StatusPill，failed 用 danger |
| Favorite | 右上 icon button，aria-label 明确 |
| Selection | 选择模式下左上 checkbox 或序号 |
| Metadata | 下方两行：prompt 截断、size + createdAt |
| Session | 可选 badge，长 sessionId 截断 |

## 7. 管理总览

### 7.1 目标

新增仪表盘式总览页，帮助管理员快速识别模型、MCP、审计、RAG 评估和系统风险。总览页只聚合风险，不替代详细配置页。

新增位置：

- 新路由：`/admin/overview`
- 新页面：`frontend/src/pages/AdminOverviewPage.tsx`
- 导航：`frontend/src/components/shell/navigation.ts`

当前可用数据来源：

| 数据 | API | 降级规则 |
| --- | --- | --- |
| 模型 | `adminApi.listModels` | 可计算启用数、默认模型、local-mock 风险、lastTestStatus |
| MCP | `adminApi.listMcpServers`、按需 health | 可计算 active/inactive；健康检查可延迟触发 |
| 审计 | `listAuditRuns`、`listAuditLogins` | 可拉取最近 50 条，失败数按 status/result 过滤或前端统计 |
| RAG | `listRagEvaluations` | 可统计 failed/error、最近评估、metrics 解析状态 |
| 邀请码 | `listInvites` | 可展示有效/过期数量，低优先级 |

### 7.2 桌面布局

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header: 管理总览 | global health badge | last refreshed | refresh            │
├──────────────────────────────────────────────────────────────────────────────┤
│ Risk strip: default model / unhealthy MCP / failed runs / failed logins / RAG │
├──────────────────────────────┬───────────────────────────────────────────────┤
│ System cards                 │ Risk queue                                    │
│ - Models                     │ - provider risk                               │
│ - MCP                        │ - recent failed run                           │
│ - Audit                      │ - login failures                              │
│ - RAG evaluation             │ - failed evaluation                           │
├──────────────────────────────┴───────────────────────────────────────────────┤
│ Recent activity links: go to models / MCP / audit / RAG                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

视觉规格：

- 第一行风险 strip 使用 compact metric cards，不用营销大卡。
- 风险等级：danger > warning > neutral/success。
- 每个指标卡必须可点击跳转到对应模块：模型配置、MCP、审计、RAG。
- 全局健康 badge 根据最高风险决定：正常、需关注、异常。

### 7.3 移动布局

```text
┌──────────────────────────────┐
│ Header + refresh             │
├──────────────────────────────┤
│ Global health summary        │
├──────────────────────────────┤
│ Metric cards single column   │
├──────────────────────────────┤
│ Risk queue                   │
├──────────────────────────────┤
│ Module links                 │
└──────────────────────────────┘
```

移动规则：

- Metric cards 单列或 2 列小卡；数字保持 tabular。
- Risk queue 使用列表，不使用宽表格。
- Refresh 按钮可触达且 loading 明确。

### 7.4 状态稿

| 状态 | 触发 | 外观与交互 |
| --- | --- | --- |
| Loading | 初始加载多个 admin API | Metric cards 使用 Skeleton；header 保留。 |
| 正常状态 | 无 danger/warning 风险 | Global health success；风险队列显示正常摘要，不制造警告噪音。 |
| 风险状态 | 有 failed model test、local-mock、MCP inactive、failed runs/logins/RAG | Risk strip 高亮对应卡；风险队列按 severity 排序。 |
| 无风险空态 | 风险队列为空 | EmptyState：当前没有待处理风险；提供刷新。 |
| 指标跳转 | 点击指标卡 | 跳转对应页面；若后续支持 query，可带筛选参数，否则普通跳转。 |
| 部分 API 失败 | 某个模块加载失败 | 对应卡显示 warning/error；其他模块继续展示；页面级 Alert 汇总失败模块。 |
| 无管理员权限 | 非 admin 直接访问 | EmptyState permission denied；不发起 admin API。 |

### 7.5 指标卡规格

| 卡片 | 主指标 | 次级信息 | 跳转 |
| --- | --- | --- | --- |
| 默认模型 | default model name/code | provider、lastTestStatus | `/admin/settings` |
| 启用模型 | enabled / total | 异常 provider 数、测试失败数 | `/admin/settings` |
| MCP 健康 | active / total | unhealthy 或 inactive 数 | `/admin/mcp-servers` |
| 近期失败任务 | failed/timed out/cancelled count | 最近失败时间或 run id | `/admin/audit` |
| 登录失败 | failed login count | 最近 IP/User | `/admin/audit` |
| RAG 评估 | failed / total | 最近 eval status、主要 metrics | `/admin/rag-evaluations` |

### 7.6 风险队列

| 字段 | 说明 |
| --- | --- |
| Severity | danger/warning/info |
| Source | Models / MCP / Audit / RAG |
| Title | 风险标题 |
| Detail | 简短原因 |
| Time | 最近发生时间，若无则显示 unknown |
| Action | 跳转处理 |

排序规则：

1. danger：local-mock enabled、model test failed、MCP unhealthy、RAG failed、failed login spike。
2. warning：未配置默认模型、MCP inactive、RAG metrics parse failed、最近任务取消较多。
3. info：无风险时的正常摘要。

## 8. 页面状态总表

| 页面 | 必须覆盖状态 |
| --- | --- |
| 登录/注册 | 默认、输入中、提交中、错误、成功/跳转、移动端 |
| 研究工作台 | 空态、idle、运行中、暂停、完成、失败、SSE 中断、Inspector Tabs、移动端 |
| 知识库 | loading、无 KB、KB 默认、上传中、索引中、索引失败、检索中、检索命中、检索无结果、移动端 |
| 图片工作室 | 无最新输出、生成中、生成成功、生成失败、历史加载、图片加载失败、批量选择、收藏、对比视图、下载集合、移动端 |
| 管理总览 | loading、正常状态、风险状态、无风险空态、指标跳转、部分 API 失败、无管理员权限、移动端 |

## 9. 截图回归清单

第一轮实现后至少建立以下截图：

| 页面 | Light | Dark | Desktop 1440x900 | Mobile 390x844 | 备注 |
| --- | --- | --- | --- | --- | --- |
| 登录 | 必须 | 必须 | 必须 | 必须 | 默认 + 错误 |
| 注册 | 必须 | 必须 | 必须 | 必须 | 默认 + 成功/邀请码错误 |
| 研究工作台 | 必须 | 必须 | 必须 | 必须 | 空态、运行中、完成、失败 |
| 知识库 | 必须 | 必须 | 必须 | 必须 | 文档表格、索引失败、检索命中 |
| 图片工作室 | 必须 | 必须 | 必须 | 必须 | 最新输出、批量选择、对比 |
| 管理总览 | 必须 | 必须 | 必须 | 必须 | 正常、风险、无权限 |

后续 T01-T07 补齐 1280x800 和 768x1024。

## 10. 实现边界

| 后续任务 | 页面设计输入 |
| --- | --- |
| S02 | 使用登录/注册组合页规格；不改变认证 API 和路由。 |
| W01-W06 | 使用工作台三栏、Agent feed 和 Inspector Tabs 规格；保留 `workspaceViewModel.ts`。 |
| K01-K03 | 使用 RAG cockpit、文档状态和 evidence card 规格；保留现有 knowledge API。 |
| I01-I06 | 使用 preview stage、history grid、batch/favorite/compare/download 规格；收藏首版 localStorage。 |
| A01 | 使用管理总览规格；新增路由和导航；缺失聚合接口时使用现有 API 降级。 |
| T03-T07 | 使用截图回归清单建立 viewport/theme 覆盖。 |

## 11. 当前状态

D04 已完成。下一项任务是 D05 “产出第二轮页面高保真”。
