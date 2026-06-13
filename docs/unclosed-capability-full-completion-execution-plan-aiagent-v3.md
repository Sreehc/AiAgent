# AiAgent 未闭环能力全量完成执行计划 V3

> 文档状态：基于 2026-06-13 当前代码、V2 全量完成计划和已产生的 WIP 改动重写。
> 目标：不再接受“第一版闭环”“接口已加但未验收”“代码已做但文档仍漂移”的完成口径。本计划用于把全部未闭环能力推进到可验收状态。

## 1. 为什么上一轮只能算部分完成

上一轮问题不在于 V2 计划完全不清楚，而在于执行和验收没有严格按“全量完成”收口：

- 一部分能力完成了后端或前端主路径，但缺少对应的契约测试、异常路径测试或真实协议 mock 测试。
- 一部分能力已经写了代码，但 `docs/` 仍保留旧事实，例如“STDIO 仍为占位”“个人 API 尚未进入运行时”“真实邮件未实现”。
- 一部分能力只证明了本地构建通过，没有跑完整验收场景，例如真实 SMTP、真实 STDIO MCP、真实 OpenAI-compatible 图片编辑。
- 一部分能力状态语义仍需审计，尤其是取消、暂停、超时、僵尸恢复是否在代码、SSE、前端状态、数据库字段中一致。

因此，V3 的完成定义是：代码实现、自动化测试、手动验收步骤、文档事实同步四项全部满足，才算完成。

## 2. 全量完成总原则

任一能力不得标记完成，除非同时满足：

- 后端领域模型、Service、Repository、Controller 和错误语义完整。
- 前端页面可直接操作，不依赖手填数据库 ID、隐藏 API 或浏览器控制台。
- API 响应模型、前端类型、SSE 事件和页面状态一致。
- 有自动化测试覆盖正常路径、权限路径、失败路径；外部服务能力至少有 mock 协议测试。
- 真实外部依赖无法在本机自动化时，必须写清手动验收步骤、所需环境变量和未验证风险。
- `docs/api-spec-aiagent-v1.md`、`docs/database-design-aiagent-v1.md`、`docs/tech-design-aiagent-v1.md`、`docs/ux-spec-aiagent-v1.md`、`docs/prd-aiagent-v1.md` 不再与实际代码冲突。

## 3. 执行阶段

### Phase 0：现状审计与缺口冻结

目标：先把“已经写了什么、还差什么”钉死，避免继续凭印象判断。

影响文件：

- `docs/unclosed-capability-full-closure-plan-aiagent-v2.md`
- `docs/unclosed-capability-full-completion-execution-plan-aiagent-v3.md`
- 后端 Controller、Service、Repository、Flyway migration
- 前端 services、pages、features

任务：

1. 对照 V2 的 20 个任务逐项检查代码。
2. 用 `rg` 搜索旧限制文案：`尚未`、`未实现`、`占位`、`No-op`、`待后端支持`、`手填 artifactId`。
3. 列出每项能力的状态：`已实现待验收`、`实现缺口`、`测试缺口`、`文档漂移`、`真实服务待验收`。
4. 先不新增功能，除非审计发现编译或测试已经失败。

验证：

- `git diff --check`
- `cd backend && mvn test`
- `cd frontend && pnpm build`

退出标准：

- 有一张逐项闭环清单，后续实现只围绕清单补齐。

### Phase 1：P0 Agent Runtime 全闭环

覆盖能力：

- 动态 Agent 策略选择
- 真正动态规划
- 任务取消、暂停、继续、超时、僵尸恢复
- 会话记忆进入后续执行

模块划分：

- `AgentStrategySelector`：自动/手动策略选择和原因输出。
- `DynamicPlannerService`：plan -> execute -> observe -> judge -> replan/done。
- `SessionRunExecutor`：运行状态机、SSE、步骤执行、RAG 降级入口、产物登记入口。
- `RunControlService`：cancel/pause/resume 控制。
- `RunRecoveryScheduler`：heartbeat、超时和僵尸任务恢复。
- `ConversationMemoryService`：记忆摘要、最近消息、产物上下文注入。

必须补齐：

1. `AUTO` 默认策略必须前端可选且默认可用，SSE 发 `strategy.selected`，展示选择原因。
2. 动态规划必须有 `observation`、`completion_judgement`、规划轮次上限、步骤上限和重规划事件。
3. `CANCELLED`、`PAUSED`、`TIMED_OUT`、`FAILED` 不能混用；取消不能落成失败。
4. 暂停后不能继续启动新步骤；恢复后从未完成步骤继续。
5. 超时恢复不能误伤 `COMPLETED/CANCELLED/PAUSED`。
6. 会话记忆必须支持查看、编辑、清空、重建，并在下一次运行 prompt 中可证明注入。

影响文件：

- `backend/src/main/java/com/sreehc/aiagent/application/session/AgentStrategySelector.java`
- `backend/src/main/java/com/sreehc/aiagent/application/session/DynamicPlannerService.java`
- `backend/src/main/java/com/sreehc/aiagent/application/session/SessionRunExecutor.java`
- `backend/src/main/java/com/sreehc/aiagent/application/session/RunControlService.java`
- `backend/src/main/java/com/sreehc/aiagent/application/session/RunRecoveryScheduler.java`
- `backend/src/main/java/com/sreehc/aiagent/application/session/ConversationMemoryService.java`
- `backend/src/main/java/com/sreehc/aiagent/trigger/session/SessionController.java`
- `backend/src/main/resources/db/migration/V18__run_lifecycle_and_memory.sql`
- `backend/src/main/resources/db/migration/V21__run_pause_resume_and_step_judgement.sql`
- `frontend/src/pages/WorkspacePage.tsx`
- `frontend/src/features/workspace/ResearchComposer.tsx`
- `frontend/src/features/workspace/MemoryPanel.tsx`
- `frontend/src/components/ui/StatusPill.tsx`
- `frontend/src/services/sessionsApi.ts`

验证：

- 后端单元/契约测试：策略选择、run control 权限与冲突、动态重规划、记忆注入、僵尸恢复。
- 前端构建：`cd frontend && pnpm build`。
- 手动场景：启动任务 -> 查看策略原因 -> 暂停 -> 继续 -> 取消另一任务 -> 超时任务恢复状态正确。

### Phase 2：P0 Model Runtime 与找回密码闭环

覆盖能力：

- 个人 API 配置实际生效
- 找回密码完整闭环

模块划分：

- `ModelRuntimeResolver`：统一解析用户配置、管理员配置、环境 fallback。
- `UserApiConfigService`：保存、加密、脱敏、测试个人配置。
- Chat/Embedding/Image provider：全部支持 runtime override。
- `EmailSender`：SMTP 与开发日志发送统一接口。

必须补齐：

1. Chat、Embedding、Image 都按 `个人 enabled 配置 -> 管理员默认模型 -> 环境 fallback` 解析。
2. 个人配置不能泄露 API key，不能影响其他用户。
3. 账号页可以分别测试 Chat、Embedding、Image。
4. SMTP 支持认证、STARTTLS/SSL、超时和失败审计。
5. 生产环境禁止静默使用 Noop 邮件发送。

影响文件：

- `backend/src/main/java/com/sreehc/aiagent/application/admin/ModelRuntimeResolver.java`
- `backend/src/main/java/com/sreehc/aiagent/application/account/UserApiConfigService.java`
- `backend/src/main/java/com/sreehc/aiagent/application/knowledge/QueryEmbeddingService.java`
- `backend/src/main/java/com/sreehc/aiagent/application/image/ImageGenerationService.java`
- `backend/src/main/java/com/sreehc/aiagent/application/auth/EmailSender.java`
- `backend/src/main/java/com/sreehc/aiagent/application/auth/SmtpEmailSender.java`
- `backend/src/main/java/com/sreehc/aiagent/application/auth/NoopEmailSender.java`
- `backend/src/main/java/com/sreehc/aiagent/app/AppProperties.java`
- `backend/src/main/java/com/sreehc/aiagent/app/ProductionConfigurationGuard.java`
- `frontend/src/pages/AccountPage.tsx`
- `frontend/src/features/account/ApiConfigForm.tsx`
- `frontend/src/services/accountApi.ts`

验证：

- 单元测试：用户 A/B 配置隔离、Embedding 走个人配置、禁用配置回退管理员配置。
- SMTP mock 测试：TLS、认证失败、超时、邮件内容不泄露明文 token。
- 手动场景：SMTP sandbox 收到找回密码邮件，token 可完成重置。

### Phase 3：P1 RAG、Artifact、图片编辑闭环

覆盖能力：

- RAG 异常降级
- 历史产物复用
- 统一产物体系
- 真实 Provider 图片编辑

模块划分：

- `RagFallbackPolicy` 或等价策略：分类处理 rewrite、embedding、retrieve、rerank 异常。
- `ArtifactService`：报告、图片、参考图、附件、工具输出、上下文片段统一登记。
- `ArtifactController`：列表、详情、上传、下载、复用预览。
- `OpenAiCompatibleImageGenerationProvider`：生成与参考图编辑 multipart 契约。

必须补齐：

1. Provider/网络/embedding/rerank 异常降级为普通执行，权限和参数错误不能吞。
2. 降级原因进入 SSE 和最终报告。
3. 历史页、产物面板、工作台都能“作为上下文使用”，不再手填 artifactId。
4. 附件、工具输出、报告、图片、上下文片段都进入 `artifact_record`，并做权限校验。
5. 图片参考图编辑至少有 mock HTTP multipart 测试；真实 provider 验收步骤写入文档。

影响文件：

- `backend/src/main/java/com/sreehc/aiagent/application/knowledge/*`
- `backend/src/main/java/com/sreehc/aiagent/application/session/ArtifactService.java`
- `backend/src/main/java/com/sreehc/aiagent/trigger/session/ArtifactController.java`
- `backend/src/main/java/com/sreehc/aiagent/domain/session/ArtifactType.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/model/OpenAiCompatibleImageGenerationProvider.java`
- `frontend/src/pages/HistoryPage.tsx`
- `frontend/src/features/history/ReplayDetail.tsx`
- `frontend/src/features/workspace/ArtifactPanel.tsx`
- `frontend/src/features/workspace/ResearchComposer.tsx`
- `frontend/src/services/artifactsApi.ts`
- `frontend/src/services/imagesApi.ts`

验证：

- 单元测试：embedding 异常 run 仍完成，权限错误仍失败。
- 集成/契约测试：非本人 artifact 不可下载/复用。
- mock HTTP 测试：图片编辑 multipart 字段正确。
- 手动场景：复用历史报告 -> 新任务引用旧产物；上传附件 -> 作为上下文运行。

### Phase 4：P1 MCP 与管理后台闭环

覆盖能力：

- 完整 STDIO MCP
- MCP 真实健康检查
- 管理员审计视图
- 模型生命周期管理

模块划分：

- `McpFrameCodec`：Content-Length 帧读写。
- `McpSessionManager`：STDIO 进程生命周期、初始化、超时、清理。
- `StdioMcpTransportClient`：initialize、tools/list、tools/call。
- `McpAdminService`：discover、health、tool test。
- `AdminAuditService`：用户、失败任务、工具调用、登录记录查询。
- `AdminSettingsService`：模型新增、编辑、启停、删除、默认、测试。

必须补齐：

1. STDIO MCP 不能再依赖关闭 stdin 后读取完整输出。
2. 健康检查必须真实探测 HTTP/STDIO 服务，返回 latency、toolCount、transportType、errorCode、checkedAt。
3. 工具调用结果登记审计，必要时登记 TOOL_OUTPUT artifact。
4. 管理员审计页支持分页、筛选、详情和错误原因。
5. 模型前端必须覆盖新增、编辑、启停、删除、默认、测试。

影响文件：

- `backend/src/main/java/com/sreehc/aiagent/infrastructure/mcp/McpFrameCodec.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/mcp/McpSessionManager.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/mcp/StdioMcpTransportClient.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/mcp/McpRuntimeGateway.java`
- `backend/src/main/java/com/sreehc/aiagent/application/mcp/McpAdminService.java`
- `backend/src/main/java/com/sreehc/aiagent/application/admin/AdminAuditService.java`
- `backend/src/main/java/com/sreehc/aiagent/application/admin/AdminSettingsService.java`
- `backend/src/main/java/com/sreehc/aiagent/trigger/admin/*`
- `frontend/src/pages/McpServersPage.tsx`
- `frontend/src/pages/AdminAuditPage.tsx`
- `frontend/src/pages/AdminSettingsPage.tsx`
- `frontend/src/features/system/*`
- `frontend/src/services/adminApi.ts`

验证：

- 单元测试：frame codec、多帧粘包/半包、超时、错误响应。
- fake STDIO MCP 集成测试：initialize -> tools/list -> tools/call。
- Controller 测试：MCP health/discover/tool test、审计分页筛选、模型生命周期。
- 手动场景：配置 fake MCP -> 发现工具 -> 健康检查 -> 工具测试 -> 查看审计。

### Phase 5：P2 知识库文档生命周期与 RAG 评估产品化

覆盖能力：

- 知识库文档生命周期
- RAG 评估产品化

模块划分：

- `KnowledgeBaseService` / `KnowledgeDocumentService`：删除、预览、下载、版本、恢复、重新索引。
- `KnowledgeRepository`：版本链、current 标记、chunks/index jobs 一致性。
- `RagEvaluationService`：用例 CRUD、运行、指标、失败样本、历史。
- `RagEvaluationController` / `RagEvaluationCaseController`：管理端 API。

必须补齐：

1. 单文档删除、预览、下载、版本列表、恢复指定版本、重新索引都可从前端操作。
2. 恢复旧版本必须创建新 current 版本并触发索引，旧 chunks 不应污染当前检索。
3. RAG 评估页支持创建/编辑/删除用例、选择 KB、运行评估、查看指标和失败样本。
4. 指标计算有测试，至少覆盖 hit rate/recall 类基础指标。

影响文件：

- `backend/src/main/java/com/sreehc/aiagent/application/knowledge/KnowledgeBaseService.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/knowledge/KnowledgeRepository.java`
- `backend/src/main/java/com/sreehc/aiagent/application/knowledge/RagEvaluationService.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/knowledge/RagEvaluationRepository.java`
- `backend/src/main/java/com/sreehc/aiagent/trigger/knowledge/KnowledgeBaseController.java`
- `backend/src/main/java/com/sreehc/aiagent/trigger/admin/RagEvaluationController.java`
- `backend/src/main/java/com/sreehc/aiagent/trigger/admin/RagEvaluationCaseController.java`
- `frontend/src/pages/KnowledgeBasesPage.tsx`
- `frontend/src/features/knowledge/DocumentTable.tsx`
- `frontend/src/pages/RagEvaluationPage.tsx`
- `frontend/src/services/knowledgeApi.ts`
- `frontend/src/services/adminApi.ts`

验证：

- Service/Repository 测试：同名文档版本链、恢复旧版、删除后检索不可见。
- Controller 测试：文档生命周期 API、RAG 用例 CRUD、评估运行。
- 手动场景：上传两版文档 -> 恢复旧版 -> 重建索引 -> 检索和评估结果变化可见。

### Phase 6：文档事实同步与发布验收

目标：把代码事实、API、数据库、UX 和 PRD 全部同步，防止再次出现“代码做了但文档还写未实现”。

必须更新：

- `docs/api-spec-aiagent-v1.md`
- `docs/database-design-aiagent-v1.md`
- `docs/tech-design-aiagent-v1.md`
- `docs/ux-spec-aiagent-v1.md`
- `docs/prd-aiagent-v1.md`
- `docs/README.md`
- 新增或更新发布验收清单：`docs/release-checklist-aiagent-v1.md`

验证：

- 路由对齐：`rg -n '@(RequestMapping|GetMapping|PostMapping|PutMapping|DeleteMapping)' backend/src/main/java/com/sreehc/aiagent/trigger`
- 旧限制文案复查：`rg -n '尚未|未实现|占位|No-op|待后端支持|手填 artifactId' docs backend/src/main/java frontend/src`
- 自动化：`git diff --check`、`cd backend && mvn test`、`cd frontend && pnpm build`
- 手动验收：按 release checklist 跑完整用户和管理员场景。

## 4. 独立提交切分

建议按下面顺序提交，避免一个巨大 diff 难以回滚：

| 提交 | 内容 | 依赖 | 验证 |
| --- | --- | --- | --- |
| 1 | Phase 0 审计清单与破损修复 | 无 | diff check、backend test、frontend build |
| 2 | Run 状态机、控制 API、恢复调度 | 1 | 后端 run control 测试 |
| 3 | 工作台运行控制和状态显示 | 2 | 前端 build、手动 pause/resume/cancel |
| 4 | 动态规划、策略选择、SSE 事件 | 2 | planner/executor 测试 |
| 5 | 会话记忆管理和注入 | 4 | memory service 测试、手动二次运行 |
| 6 | 个人模型配置全类型生效 | 1 | resolver/provider 测试 |
| 7 | SMTP 找回密码闭环 | 1 | SMTP mock + sandbox 手动验收 |
| 8 | RAG 异常降级 | 4 | provider 异常降级测试 |
| 9 | Artifact 统一体系和历史复用 | 5 | artifact 权限测试、手动复用 |
| 10 | 图片编辑 provider 契约 | 6 | multipart mock 测试 |
| 11 | STDIO MCP 协议和健康检查 | 1 | fake MCP 集成测试 |
| 12 | 管理审计和模型生命周期前端 | 6、11 | Controller 测试、前端 build |
| 13 | 知识库文档生命周期 | 1 | KB service/repository 测试 |
| 14 | RAG 评估产品化 | 13 | RAG eval service/controller 测试 |
| 15 | 文档同步和 release checklist | 2-14 | 文档 rg 检查、全量测试 |

## 5. 最终验收清单

必须逐项给出证据：

- P0 动态策略：默认 AUTO、选择原因可见、手动选择优先。
- P0 动态规划：存在 observe/judge/replan，轮次上限生效。
- P0 运行控制：pause/resume/cancel/timeout/recovery 状态语义正确。
- P0 会话记忆：可查看、编辑、清空、重建，并注入下一次运行。
- P0 个人 API：Chat/Embedding/Image 均可测试并进入运行时。
- P0 找回密码：SMTP 真实可发，生产禁用静默 Noop。
- P1 RAG 降级：检索类异常不阻塞普通执行，报告说明降级原因。
- P1 历史产物复用：前端无需手填 ID，后端做权限校验。
- P1 统一产物：附件、工具输出、报告、图片、上下文片段统一登记。
- P1 图片编辑：mock multipart 测试通过，真实 provider 验收步骤明确。
- P1 STDIO MCP：标准 JSON-RPC 帧协议，fake server 集成通过。
- P1 MCP 健康：真实探测并返回延迟、工具数、错误分类。
- P1 管理审计：用户、失败任务、工具调用、登录记录可筛选查看。
- P1 模型生命周期：新增、编辑、启停、删除、默认、测试前端全接入。
- P2 文档生命周期：删除、预览、下载、版本恢复、重索引可用。
- P2 RAG 评估：用例 CRUD、运行、指标、失败样本可用。
- 文档：API、数据库、技术设计、UX、PRD 与代码事实一致。

## 6. 不允许降级的判断

以下情况出现任一项，就不能说“全部完成”：

- `backend && mvn test` 或 `frontend && pnpm build` 失败。
- 取消后的 run/session 仍显示 `FAILED`。
- 前端仍需要手填 artifactId 才能复用历史产物。
- `STDIO MCP` 仍返回占位工具或依赖进程退出读取输出。
- 个人 Embedding 配置没有进入 RAG/检索运行时。
- OpenAI-compatible 图片编辑没有 mock 契约测试。
- SMTP 仍只是 Noop 或日志输出，且生产环境不拦截。
- docs 当前事实仍写“尚未支持”，但代码已经支持；或 docs 写支持，代码实际不支持。
- 只做了 API，没有前端可操作入口。
- 只做了前端入口，没有后端权限、状态和测试。

## 7. 剩余风险的正确表达

完成后仍允许存在的风险只能是外部环境风险，不能是项目内部功能缺口：

- 真实 SMTP 服务、真实 OpenAI-compatible 图片编辑服务、真实第三方 STDIO MCP server 需要可用凭证和网络环境。
- pause/resume 不能强行中断已经发出的阻塞 provider 调用，只能在 provider 超时或步骤边界收敛；必须确保 provider 超时已配置。
- 动态规划会增加模型调用成本和不确定性；必须依靠轮次、步骤上限和失败降级控制。
- 大规模知识库版本恢复的索引耗时需要后续压测，但功能闭环不能因此缺失。
