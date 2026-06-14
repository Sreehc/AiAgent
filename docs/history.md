# AiAgent 项目历史

> 本文档以里程碑顺序叙述 AiAgent 自启动以来的关键阶段、决策与权衡，用于替代分散的计划与任务列表文件。事实文档（`prd.md`、`tech-design.md`、`api-spec.md`、`database-design.md`、`ux-spec.md`）描述当前能力；本文回答"为什么走到这里"。

## 1. 项目定位与起源

AiAgent 自立项即定位为面向技术管理员与业务分析用户的多智能体研究平台，首版以"深度研究报告"作为核心业务闭环：用户提问 → 任务规划 → RAG 检索 / MCP 工具调用 → 报告与图片产物 → 历史回放复用。最初参考 `OWWZO/ai-agent` 的能力分层，但定位是可部署、可扩展的产品化平台，而非示例代码复刻。

V1 在范围上有意收紧：账号密码登录、邀请制注册、个人归属、两类角色（ADMIN / USER），不引入多租户、复杂 RBAC 与计费。这条边界让团队能在三个迭代窗口内把核心闭环、知识库与 MCP 工具一次性铺到位。

## 2. 前端重构 v1 → v2

### v1：基础工作台

最初的前端把"登录—工作台—知识库—图片—历史—账号—配置"页堆齐了，但页面级 JSX 与 CSS 偏功能堆叠，缺一个产品级控制台框架。问题在 v1 后期变得明显：

- 信息架构不够平台化，工作 / 知识 / 系统 / 账号之间关系不清。
- 执行流表达薄弱，计划、工具调用、报告、产物的层级在 UI 上不分明。
- UI primitive 粒度不足，按钮、表单、面板、空态、加载、错误反馈在页面间不一致。
- 没有视觉 token 和页面模板，迭代继续会变成零散页面。

### v2：完全重构

v2 决定**删除并重建可见 UI 层**，但保留 React + Vite + TypeScript 技术栈、路由路径、认证 session、API response wrapper 和 SSE 数据流。Dify 被作为信息架构与平台成熟度的参考，但**不复制**——AiAgent 偏研究执行 / 多工具调用 / 运维控制台，Dify 偏应用构建发布平台，两者形态不同。

关键决策：

- **分层**：从"每页堆状态和 API 调用"演进到"services + view model + page + features + UI primitives"五层。`services/*Api.ts` 集中管控端点字符串，`workspaceViewModel` 把 `SessionDetailResponse` 与 SSE 事件统一映射成执行时间线 item（run / plan-step / tool / artifact / stream-event）。
- **视觉系统**：建立 `tokens.css / base.css / layout.css / components.css / pages.css` 五级样式分层；显式禁用大面积紫蓝渐变、毛玻璃、装饰性光斑、营销页 hero、每页独立色彩主题。视觉质量来自清晰层级、稳定布局和低噪声色彩。
- **不引入大型 UI 框架**：Dialog / Tabs / StatusPill / EmptyState / CommandPalette 全部自建；不引入 Radix、Material 或图标库。代价是组件数量略多，收益是依赖链可控。
- **不重写后端**：API 契约、SSE 事件结构、ProtectedRoute、auth session 一律保留。

v2 按 17 个 Task 分批交付：服务层 → token → UI primitive → Dialog/Toast → Shell → 命令面板 → 认证页 → workspace view model → 研究工作台 → 知识库 → 图片工作室 → 历史回放 → 模型设置 → MCP 管理 → 账号中心 → 响应式与可访问性 → 清理与文档同步。每个 Task 都保持 `pnpm build` 通过。完成时点（2026-06-13）所有路由、SSE 解析、protected-route 行为均无破坏，旧 visual system 被完全移除。

## 3. UI / UX 升级两轮

在 v2 大重构之外，还有两轮独立的样式与体验细化迭代，主要解决重构前 v1 时期的局部痛点。两轮都已完成并归并到当前代码：

- **UI 升级**（2026-06-06 ~ 2026-06-07）：聚焦样式入口收敛与组件 primitive 抽取，建立了后续 v2 重构所依赖的 `frontend/src/styles/` 与 `components/ui/` 雏形。
- **UX 改进**（2026-06-07）：聚焦固定导航、配置入口路径、页面层级、表单提示和关键状态反馈，弥补 v1 工作台在长任务执行中"用户不知道发生了什么"的问题。

这两轮的具体页面级改动已经溶进 v2 重构，不再单独追溯。

## 4. 能力闭环 v1 → v2 → v3

未闭环能力的收口经历了三次迭代。每一次都用**更严格的完成定义**取代上一次。

### v1：第一版闭环

- 列出 P0/P1/P2 能力差距：动态 Agent 策略、动态规划、任务取消 / 暂停、会话记忆注入、个人 API 配置、找回密码邮件、RAG 异常降级、产物复用、统一产物体系、真实 provider 图片编辑、完整 STDIO MCP、MCP 健康检查、管理审计、模型生命周期、知识库文档生命周期、RAG 评估产品化。
- 完成口径偏松：能跑通主路径即视为闭环，未要求测试覆盖、文档同步与真实外部依赖验证。
- 结果：每条能力都"做了第一版"，但很多停在接口可调用 / 代码路径存在的状态。

### v2：全量完成计划

- 收紧完成定义：用户不能依赖手填数据库 ID 或调隐藏 API；状态语义不能混用（`CANCELLED` ≠ `FAILED`、`PAUSED` 不被超时扫描误判）；外部协议必须按真实协议实现；每个任务必须有自动化验证或写明手动验收步骤。
- 拆出 20 个独立可提交 Task，分 5 个 Phase（运行状态 → 配置可靠性 → 产物 → 后台管理 → 文档验收）。
- 列出关键模块边界：`Agent Runtime`、`Model Runtime`、`Artifact Runtime`、`RAG And Knowledge`、`MCP Runtime`、`Admin Console`，并明确每个模块的职责。
- 仍有差距：执行中暴露出"代码做了但文档仍写未实现"、"接口已加但没前端入口"、"接口路径在计划与实现之间漂移"等问题。

### v3：全量完成执行计划

- 完成定义被进一步钉死：代码 + 自动化测试 + 手动验收 + 文档同步**四项同时满足**才算完成；任何一项缺失都视为部分完成。
- 把 v2 模块再切成 6 个 Phase（现状审计 → P0 Agent Runtime → P0 Model Runtime + 找回密码 → P1 RAG/产物/图片 → P1 MCP/管理审计 → P2 文档生命周期与 RAG 评估 → 文档同步与发布）。
- 引入"不允许降级判断"清单：取消显示为 `FAILED`、STDIO MCP 仍依赖关闭 stdin、个人 Embedding 不进 RAG、SMTP 在生产仍是 Noop 等任一命中即不得标记完成。
- 结果（2026-06-13）：V2 的 20 个 Task 与 V3 的 19 项最终验收点全部通过审计，发布门禁完整执行：`mvn test` 通过、`pnpm build` 通过、所有事实文档与代码对齐。

### 三轮迭代沉淀的判断

- **完成口径必须前置**。三轮中只有 v3 在动手前明确"完成意味着什么"，前两轮的差距大多源于完成定义模糊。
- **状态语义不能合并**。`CANCELLED / TIMED_OUT / PAUSED / FAILED / CANCEL_REQUESTED` 是五种不同的运行结局，UI、SSE、数据库字段必须各自表达；任何一处合并都会让用户和审计无法判断真实情况。
- **协议层不能简化**。STDIO MCP 在 v1 用了"写入 → 关闭 stdin → 读全部输出"的简化方案，v2 重写为标准 Content-Length JSON-RPC 帧 + 长生命周期进程复用。简化方案在初次接触真实 MCP server 时就会失效。
- **真实外部依赖与协议契约要分开。** SMTP / OpenAI-compatible / 第三方 STDIO MCP server 不能在 CI 中端到端跑通，但可以用 mock HTTP / fake STDIO server 验证协议契约。把"协议契约"和"真实可用性"分别验证，比"等真实环境再说"现实得多。

## 5. 关键技术决策

以下决策属于代码不会自我解释的部分，归档在此供后续回看。

### 5.1 后端架构

- **单体 + DDD 分层**而非微服务起步：V1 部署成本和数据一致性优先；后续高并发场景再演进。
- **登录态用 Redis**（带登录失败计数），知识索引用 Kafka（异步、可重试），文件 / 图片用 MinIO（短期预签名 URL）。本地文件存储适配器**未实现**，刻意保留为后续扩展位。
- **会话执行用进程内 `ThreadPoolTaskExecutor` + SSE**，不是持久化任务调度器。代价是节点重启会丢未完成 run；通过 `RunRecoveryScheduler` + heartbeat 做僵尸恢复来兜底。

### 5.2 模型运行时

- **配置解析优先级统一**：用户个人配置 enabled → 管理员启用模型 default → 环境变量 fallback → `MODEL_CONFIG_MISSING`。Chat / Embedding / Image 三类共用同一优先级。
- **`UserApiConfig` 是单条共享凭据**而非每类一条。三类 modelType 共用 `baseUrl / apiKey / model`，账号页按 modelType 分别"测试"但不分别"保存"。这一选择来自 V1 范围收紧：避免在用户侧维护三套独立凭证；后续如要支持三套独立，需要 schema 演进。
- **生产强制 SMTP**：`ProductionConfigurationGuard` 在 production profile 启动时校验 `APP_EMAIL_PROVIDER=smtp`，禁止静默使用 Noop。Noop 仅作 dev fallback 存在。

### 5.3 STDIO MCP 协议

- **Content-Length JSON-RPC 帧 + 长生命周期 session**：`McpFrameCodec` 读写帧、`McpSessionManager` 管进程；不依赖关闭 stdin 触发输出读取。
- **可执行文件白名单 + 输出大小上限 + 调用超时 + 进程清理**：STDIO 调用本地命令存在安全风险，白名单与硬限制是必要约束。
- **Streamable HTTP 与 HTTP/SSE 共用 JSON-RPC 客户端**：标准 `tools/list` / `tools/call`，不为传输差异维护两套调用路径。

### 5.4 RAG 异常处理

- **权限和参数错误不吞**：这两类异常代表用户配置或调用问题，必须直接返回。
- **provider / 网络 / embedding / rerank 异常降级为普通执行**：通过 `rag.degraded` SSE 事件和最终报告中的"本次未使用知识库证据"说明告知用户。代价是部分检索失败用户感知是"答案稍弱"而非"任务失败"，这是有意的取舍。
- **空知识库直接走普通执行**，不构造空检索结果。

### 5.5 取消 / 暂停 / 恢复语义

- **不能强杀阻塞 provider 调用**：pause / cancel 在步骤边界或 provider 超时返回后收敛。这意味着用户点取消后还能看到一次步骤内的工具调用执行完，但不会再启动下一步。这是面对 LLM provider 不支持中断流的现实选择。
- **provider 必须配合理超时**：取消的最差延迟由 provider 超时决定，因此 chat / embedding / image / MCP 调用都必须有上限。
- **超时扫描器尊重最终态**：`COMPLETED / CANCELLED / PAUSED` 不会被 `RunRecoveryScheduler` 误标 `TIMED_OUT`。

### 5.6 产物体系

- **六类统一登记**：`REPORT / IMAGE / IMAGE_REFERENCE / ATTACHMENT / TOOL_OUTPUT / CONTEXT_SNIPPET`。共用同一张 `artifact_record` 表、同一套权限校验、同一套下载 / 预览 / 复用 API。
- **复用通过前端选择 + 后端校验**：用户在历史 / 产物面板点击"作为上下文使用" → 前端维护 `selectedArtifacts` 队列 → 提交时传 `artifactIds` → 后端校验归属与 `reusable` 标志 → `ConversationMemoryService` 裁剪并注入 prompt → 本次 run 记录新的 `CONTEXT_SNIPPET`。前端**不再支持手填 artifactId**。

### 5.7 知识库文档版本

- **同名文档形成版本链，恢复旧版会创建新 current 版本并触发 `RESTORE` 索引任务**：旧版 chunks 不污染当前检索；版本恢复的索引耗时未做压测，是已知后续工作。

## 6. 已知边界与未来空间

文档同步事实写入 `prd.md`、`tech-design.md`、`api-spec.md`、`database-design.md`、`ux-spec.md`，本节只列**仍允许存在的外部环境约束**与**有意保留的扩展位**：

- **真实外部依赖**：SMTP、真实 OpenAI-compatible 图片编辑、真实第三方 STDIO MCP server 需要可用凭证与网络环境。CI 用 mock / fake server 验证协议契约，真实可用性需手动验收。
- **本地文件存储适配器未实现**：当前对象存储仅 MinIO，刻意保留扩展位。
- **图片任务同步调用**：图片任务记录直接落完成态，不参与 run 级 pause / cancel。独立异步进度不在 V1 闭环范围。
- **PDF / DOCX / OCR 不在当前 RAG 范围**：当前允许 `txt`、`md`、`markdown`、`csv`、`json`。
- **大规模知识库版本恢复的索引耗时**未做压测。
- **前端自动化测试未配置**：回归依赖 `pnpm build` 与浏览器手动 smoke。

## 7. 关键时间点

| 日期 | 里程碑 |
| --- | --- |
| 2026-06-06 | UI 升级第一轮启动，建立样式入口与 UI primitive 雏形 |
| 2026-06-07 | UI 升级完成；UX 改进同期完成 |
| 2026-06-13 | 前端 v2 完全重构完成；未闭环能力 v3 全量完成审计通过 |
