# AiAgent 未闭环能力全量完成计划 V2

> 文档状态：基于 2026-06-13 实际代码与 `docs/unclosed-capability-tech-plan-aiagent-v1.md` 复核后生成。
> 本文用于下一轮实现，不再按“第一版弱闭环”口径验收。除非任务明确标为后续扩展，否则本计划中的能力必须同时满足后端、前端、状态语义、测试和可操作流程。

## 1. 目标与完成口径

本计划的目标是把上一版“已做第一版但未完全闭环”的能力补齐到可验收状态。

全量完成必须同时满足：

- 用户能在前端完成对应操作，不依赖手工复制数据库 ID 或调用隐藏 API。
- 后端状态模型语义正确，`CANCELLED`、`TIMED_OUT`、`PAUSED`、`FAILED` 等状态不能混用。
- API、领域模型、Repository、前端类型和页面状态一致。
- 外部协议能力必须按真实协议实现并有 mock/integration 验证，不以“能发出一段 JSON”作为完成。
- 每个任务有自动化验证；无法自动化的真实 provider、SMTP、MCP server 验证必须写入手动验收步骤。
- 更新受影响的 API、数据库、UX 或运行文档。

## 2. 当前未全量闭环清单

| 优先级 | 能力 | 当前状态 | 全量完成定义 |
| --- | --- | --- | --- |
| P0 | 动态 Agent 策略选择 | 规则选择已接入 | 自动模式默认可用；策略选择原因可见；用户手选优先；有测试覆盖不同任务类型 |
| P0 | 真正动态规划 | 模型可生成步骤，失败时追加补救步骤 | 支持 plan -> execute -> observe -> judge -> replan 循环；达到完成条件或轮次上限；步骤状态和事件完整 |
| P0 | 任务取消、暂停、继续、超时、僵尸恢复 | 取消和超时有基础实现 | 支持 cancel/pause/resume；状态语义正确；SSE 事件完整；超时恢复不会误伤已完成任务 |
| P0 | 会话记忆进入后续执行 | 摘要、最近消息和产物可注入 | 记忆可查看、编辑、清空；下一次执行稳定注入；提示词长度受控；有测试证明注入生效 |
| P0 | 个人 API 配置实际生效 | Chat/Image 优先个人配置 | Chat、Embedding、Image 均按个人配置优先；账号页可测试；失败回退和错误提示明确 |
| P0 | 找回密码邮件闭环 | 有 SMTP 和日志 sender | SMTP 支持 STARTTLS/TLS、认证、超时、失败审计；开发环境可日志发送；生产可禁用 Noop |
| P1 | RAG 异常降级 | Session 执行路径可降级 | 检索、改写、embedding、rerank 异常均分类处理；执行事件和最终报告标记降级原因 |
| P1 | 历史产物复用 | 后端支持、前端手填 ID | 历史页、产物面板、工作台有“作为上下文使用”；复用队列可增删；无需手填 ID |
| P1 | 统一产物体系 | 工具输出可登记，类型已扩展 | 附件、工具输出、报告、图片、上下文片段均登记；有统一列表、下载、复用、权限校验 |
| P1 | 真实 Provider 图片编辑 | OpenAI-compatible multipart 初版 | 有 mock HTTP 测试；前端按能力启用；真实 provider 手动验收步骤明确 |
| P1 | 完整 STDIO MCP | 进程一次性写入/读取，协议不完整 | 有长生命周期 session manager；Content-Length 帧解析；initialize/tools/list/tools/call 完整；超时和输出限制 |
| P1 | MCP 真实健康检查 | 调 discoverTools | HTTP/STDIO 均真实探测；返回延迟、工具数、错误分类；不把配置校验当健康 |
| P1 | 管理员审计视图 | 基础页面/API | 可筛选用户、失败任务、工具调用、登录记录；支持分页、详情、错误原因 |
| P1 | 模型生命周期管理 | 后端较完整，前端缺编辑 | 前端支持新增、编辑、启停、删除、默认、测试；表单状态和后端 API 完全对齐 |
| P2 | 知识库文档生命周期 | 删除/预览/下载/版本列表初版 | 单文档删除、预览、下载、版本列表、恢复指定版本、当前版本标记、重新索引 |
| P2 | RAG 评估产品化 | API 和页面初版 | 管理页可创建用例、运行评估、查看指标、失败样本、历史趋势；支持系统级 KB 选择 |

## 3. 模块划分

### 3.1 Agent Runtime

职责：

- 负责任务策略选择、动态规划、步骤执行、观察、重规划、报告生成。
- 负责运行级状态流转：`PENDING`、`RUNNING`、`PAUSED`、`CANCEL_REQUESTED`、`CANCELLED`、`TIMED_OUT`、`FAILED`、`COMPLETED`。
- 负责 SSE 事件顺序和幂等恢复。

主要类：

- `SessionRunExecutor`
- `AgentStrategySelector`
- 新增 `DynamicPlannerService`
- 新增 `RunLifecycleService`
- 新增 `RunControlService`
- `ConversationMemoryService`
- `SessionRepository`

### 3.2 Model Runtime

职责：

- 合并个人 API 配置、管理员模型配置、环境 fallback。
- 为 Chat、Embedding、Image 提供同一套解析规则。
- 提供用户侧和管理员侧连接测试。

主要类：

- `ModelRuntimeResolver`
- `UserApiConfigService`
- `AdminSettingsService`
- `QueryEmbeddingService`
- `ImageGenerationService`
- `SessionRunExecutor`
- `OpenAiCompatibleChatModelProvider`
- `OpenAiCompatibleEmbeddingProvider`
- `OpenAiCompatibleImageGenerationProvider`

### 3.3 Artifact Runtime

职责：

- 统一报告、图片、附件、工具输出和上下文片段。
- 管理产物权限、下载、预览、复用。
- 为任务执行提供 selected artifacts 上下文。

主要类：

- `ArtifactService`
- `ArtifactController`
- `SessionRepository`
- `ObjectStorageService`
- `ArtifactRecord`
- `ArtifactType`

### 3.4 RAG And Knowledge

职责：

- 文档生命周期、索引生命周期、检索降级、评估产品化。
- 单文档维度的删除、版本恢复、重新索引。

主要类：

- `KnowledgeBaseService`
- 新增 `KnowledgeDocumentService`
- `KnowledgeRepository`
- `KnowledgeIndexJobService`
- `RagEvaluationService`
- `RagEvaluationRepository`
- `RagEvaluationController`

### 3.5 MCP Runtime

职责：

- 管理 HTTP、SSE、Streamable HTTP、STDIO MCP 的发现、健康检查和调用。
- STDIO 必须符合 MCP Content-Length JSON-RPC 协议。
- 工具调用结果进入审计和 artifact。

主要类：

- `McpRuntimeGateway`
- `McpExecutionService`
- `HttpMcpTransportClient`
- `StdioMcpTransportClient`
- 新增 `McpSessionManager`
- 新增 `McpFrameCodec`
- `McpAdminService`
- `McpServerRepository`

### 3.6 Admin Console

职责：

- 系统级模型、MCP、审计、RAG 评估管理。
- 前端交互必须覆盖后端已暴露能力。

主要文件：

- `frontend/src/pages/AdminSettingsPage.tsx`
- `frontend/src/features/system/ModelForm.tsx`
- `frontend/src/features/system/ModelRegistry.tsx`
- `frontend/src/pages/McpServersPage.tsx`
- `frontend/src/pages/AdminAuditPage.tsx`
- `frontend/src/pages/RagEvaluationPage.tsx`
- `frontend/src/services/adminApi.ts`

## 4. 数据模型与状态流

### 4.1 execution_run

需要确认或补齐字段：

| 字段 | 用途 |
| --- | --- |
| `status` | 使用完整运行状态，不再把取消写成失败 |
| `strategy_mode` | 用户选择：`AUTO`、`MANUAL` 或具体模式 |
| `selected_agent_mode` | 实际执行模式：`REACT`、`PLAN_EXECUTE` |
| `strategy_reason` | 自动选择原因 |
| `planning_rounds` | 实际规划轮次 |
| `heartbeat_at` | 运行心跳 |
| `cancel_requested_at` | 取消请求时间 |
| `cancel_reason` | 取消原因 |
| `paused_at` | 暂停时间 |
| `pause_reason` | 暂停原因 |
| `resumed_at` | 最近恢复时间 |
| `timeout_at` | 超时标记时间 |
| `recovered_at` | 僵尸任务恢复时间 |

运行状态流：

```text
PENDING
  -> RUNNING
  -> PAUSED
  -> RUNNING
  -> COMPLETED

RUNNING
  -> CANCEL_REQUESTED
  -> CANCELLED

RUNNING
  -> TIMED_OUT

RUNNING
  -> FAILED
```

约束：

- `CANCELLED` 不等于 `FAILED`。
- `PAUSED` 不应被僵尸扫描直接标为 `TIMED_OUT`。
- `CANCEL_REQUESTED` 是短暂中间态；执行器必须在步骤边界或 provider 超时返回后收敛到 `CANCELLED`。
- `TIMED_OUT` 必须写入错误原因和恢复时间。

### 4.2 execution_plan_step

需要确认或补齐字段：

| 字段 | 用途 |
| --- | --- |
| `planner_round` | 第几轮规划 |
| `parent_step_id` | 重规划或子任务来源 |
| `status` | `PENDING/RUNNING/COMPLETED/FAILED/SKIPPED/CANCELLED` |
| `observation` | 执行观察结果 |
| `completion_judgement` | 是否已满足目标 |
| `started_at/completed_at` | 步骤时间线 |

动态规划状态流：

```text
planner.generate
  -> step.running
  -> step.observed
  -> planner.judge
  -> planner.replan 或 planner.completed
```

### 4.3 artifact

需要确认或补齐字段：

| 字段 | 用途 |
| --- | --- |
| `artifact_type` | `REPORT/IMAGE/IMAGE_REFERENCE/ATTACHMENT/TOOL_OUTPUT/CONTEXT_SNIPPET` |
| `reusable` | 是否可复用 |
| `source` | `RUN/UPLOAD/TOOL/IMAGE/REUSE` |
| `content` | 文本类内容或摘要 |
| `result_url` | 文件或图片地址 |
| `mime_type` | 内容类型 |
| `metadata_json` | 大小、原文件名、工具名、模型名等 |

复用状态流：

```text
用户在历史页/产物面板点击“作为上下文使用”
  -> 前端加入 selectedArtifacts
  -> 工作台 composer 展示复用队列
  -> 发送任务时传 artifactIds
  -> 后端校验归属与 reusable
  -> ConversationMemoryService 裁剪并注入 prompt
  -> 本次 run 记录 CONTEXT_SNIPPET artifact
```

### 4.4 user_api_config 与 model_config

解析优先级：

```text
用户个人配置 enabled=true
  -> 管理员启用模型 default=true
  -> 环境变量 fallback
  -> 返回 MODEL_CONFIG_MISSING
```

要求：

- Chat、Embedding、Image 都使用同一优先级。
- 个人配置不能影响其他用户。
- API Key 不出现在响应体、日志和前端状态中。

### 4.5 knowledge_document

文档版本状态：

```text
UPLOADED -> PARSED -> INDEXED
                 -> FAILED
INDEXED -> DELETED
INDEXED -> SUPERSEDED
SUPERSEDED -> RESTORED -> INDEX_QUEUED -> INDEXED
```

要求：

- 同一 KB 内同名文档形成版本链。
- 删除单文档必须级联删除或软删除 chunks/index jobs。
- 恢复版本后必须重新索引并标记 current version。

## 5. API 设计

### 5.1 Run Control

| Method | Path | 用途 | 验收 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/sessions/{sessionId}/runs/{runId}/cancel` | 请求取消 | 返回当前 run；最终状态为 `CANCELLED` |
| `POST` | `/api/v1/sessions/{sessionId}/runs/{runId}/pause` | 暂停运行 | 仅 `RUNNING` 可暂停；SSE 发 `session.paused` |
| `POST` | `/api/v1/sessions/{sessionId}/runs/{runId}/resume` | 继续运行 | 仅 `PAUSED` 可继续；恢复后从下一个未完成步骤执行 |
| `GET` | `/api/v1/sessions/{sessionId}/runs/{runId}` | 查看运行详情 | 返回状态、步骤、规划轮次、错误和控制字段 |

### 5.2 Session Memory

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/api/v1/sessions/{sessionId}/memory` | 查看摘要、最近消息和可注入上下文 |
| `PUT` | `/api/v1/sessions/{sessionId}/memory` | 编辑或清空摘要记忆 |
| `POST` | `/api/v1/sessions/{sessionId}/memory/rebuild` | 从历史消息重建摘要 |

### 5.3 Artifact Reuse

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/api/v1/artifacts` | 当前用户产物库，支持类型/会话/关键词筛选 |
| `GET` | `/api/v1/artifacts/{artifactId}` | 产物详情 |
| `GET` | `/api/v1/artifacts/{artifactId}/download` | 下载产物 |
| `POST` | `/api/v1/artifacts/{artifactId}/reuse` | 返回可注入上下文预览 |
| `POST` | `/api/v1/sessions/{sessionId}/runs/stream` | 请求体包含 `artifactIds` |

### 5.4 Model Management

| Method | Path | 用途 |
| --- | --- | --- |
| `POST` | `/api/v1/admin/models` | 新增模型 |
| `PUT` | `/api/v1/admin/models/{modelCode}` | 编辑模型 |
| `POST` | `/api/v1/admin/models/{modelCode}/enable` | 启用 |
| `POST` | `/api/v1/admin/models/{modelCode}/disable` | 停用 |
| `POST` | `/api/v1/admin/models/{modelCode}/default` | 设为默认 |
| `POST` | `/api/v1/admin/models/{modelCode}/test` | 连接测试 |
| `DELETE` | `/api/v1/admin/models/{modelCode}` | 删除 |
| `POST` | `/api/v1/account/api-configs/{modelType}/test` | 测试个人配置 |

### 5.5 MCP Management

| Method | Path | 用途 |
| --- | --- | --- |
| `POST` | `/api/v1/admin/mcp-servers/{serverCode}/discover` | 真实发现工具 |
| `POST` | `/api/v1/admin/mcp-servers/{serverCode}/health` | 真实健康检查 |
| `POST` | `/api/v1/admin/mcp-servers/{serverCode}/tools/{toolName}/test` | 测试工具调用 |

健康检查响应必须包含：

- `status`
- `latencyMs`
- `toolCount`
- `transportType`
- `errorCode`
- `message`
- `checkedAt`

### 5.6 Knowledge Documents

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/api/v1/knowledge-bases/{kbId}/documents/{docId}` | 详情/预览 |
| `GET` | `/api/v1/knowledge-bases/{kbId}/documents/{docId}/download` | 下载 |
| `DELETE` | `/api/v1/knowledge-bases/{kbId}/documents/{docId}` | 删除单文档 |
| `GET` | `/api/v1/knowledge-bases/{kbId}/documents/{docId}/versions` | 版本列表 |
| `POST` | `/api/v1/knowledge-bases/{kbId}/documents/{docId}/versions/{versionId}/restore` | 恢复版本 |
| `POST` | `/api/v1/knowledge-bases/{kbId}/documents/{docId}/reindex` | 重新索引 |

### 5.7 RAG Evaluation

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/api/v1/admin/rag-evaluations` | 评估历史 |
| `POST` | `/api/v1/admin/rag-evaluations` | 创建并运行评估 |
| `GET` | `/api/v1/admin/rag-evaluations/{runId}` | 评估详情 |
| `GET` | `/api/v1/admin/rag-evaluation-cases` | 用例列表 |
| `POST` | `/api/v1/admin/rag-evaluation-cases` | 创建用例 |
| `PUT` | `/api/v1/admin/rag-evaluation-cases/{caseId}` | 编辑用例 |
| `DELETE` | `/api/v1/admin/rag-evaluation-cases/{caseId}` | 删除用例 |

## 6. SSE 事件

必须补齐并保持前端类型同步：

| 事件 | 触发时机 |
| --- | --- |
| `strategy.selected` | 自动或手动策略确定 |
| `plan.generated` | 初始计划生成 |
| `task.started` | 步骤开始 |
| `task.observed` | 步骤产出 observation |
| `plan.judged` | 判断是否完成或需要重规划 |
| `plan.replanned` | 追加或替换后续步骤 |
| `rag.degraded` | RAG 降级 |
| `artifact.created` | 产物登记 |
| `session.paused` | 运行暂停 |
| `session.resumed` | 运行继续 |
| `session.cancelled` | 运行取消完成 |
| `session.timed_out` | 运行超时 |
| `session.completed` | 运行完成 |
| `session.failed` | 运行失败 |

## 7. 可独立提交任务列表

### Task 1：统一运行状态语义和数据库迁移

目标：让运行状态能表达取消、暂停、继续、超时和恢复。

影响文件：

- `backend/src/main/java/com/sreehc/aiagent/domain/session/RunStatus.java`
- `backend/src/main/java/com/sreehc/aiagent/domain/session/ExecutionRun.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/session/SessionRepository.java`
- `backend/src/main/resources/db/migration/*`
- `backend/src/test/java/**/SessionRepository*Test.java`

实现：

- 增加或确认 `PAUSED`、`CANCEL_REQUESTED`、`CANCELLED`、`TIMED_OUT` 状态。
- 补齐 `paused_at`、`pause_reason`、`resumed_at`、`timeout_at`。
- Repository 提供状态 CAS 更新，避免并发覆盖最终态。

验证：

- Repository 测试覆盖合法和非法状态迁移。
- `cd backend && mvn test`

### Task 2：RunControlService 与取消/暂停/继续 API

目标：用户可以控制运行中任务，状态和 SSE 语义正确。

影响文件：

- 新增 `backend/src/main/java/com/sreehc/aiagent/application/session/RunControlService.java`
- `backend/src/main/java/com/sreehc/aiagent/trigger/session/SessionController.java`
- `backend/src/main/java/com/sreehc/aiagent/application/session/SessionService.java`
- `frontend/src/services/sessionsApi.ts`
- `frontend/src/services/api.ts`

实现：

- 增加 `cancel`、`pause`、`resume` API。
- 非本人 run 返回 404 或权限错误。
- 已完成 run 控制操作返回冲突。
- pause 后执行器不继续新步骤；resume 后从第一个未完成步骤继续。

验证：

- Controller 测试覆盖权限、冲突、正常流。
- 手动验证：运行中点击取消，最终 run 为 `CANCELLED`，session 不显示 `FAILED`。
- `cd backend && mvn test`

### Task 3：前端运行控制闭环

目标：工作台能看到并操作取消、暂停、继续。

影响文件：

- `frontend/src/pages/WorkspacePage.tsx`
- `frontend/src/features/workspace/ResearchComposer.tsx`
- `frontend/src/features/workspace/ExecutionTimeline.tsx`
- `frontend/src/features/workspace/workspaceViewModel.ts`
- `frontend/src/components/ui/StatusPill.tsx`

实现：

- 运行中显示取消和暂停。
- 暂停后显示继续。
- 时间线显示 `PAUSED/CANCELLED/TIMED_OUT`。
- 禁止重复提交控制请求。

验证：

- `cd frontend && pnpm build`
- 浏览器手动验证：运行、暂停、继续、取消的按钮状态和事件流。

### Task 4：动态规划服务与观察-判断-重规划循环

目标：实现真正的 plan -> execute -> observe -> judge -> replan。

影响文件：

- 新增 `backend/src/main/java/com/sreehc/aiagent/application/session/DynamicPlannerService.java`
- `backend/src/main/java/com/sreehc/aiagent/application/session/SessionRunExecutor.java`
- `backend/src/main/java/com/sreehc/aiagent/domain/session/ExecutionPlanStep.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/session/SessionRepository.java`
- `backend/src/test/java/**/DynamicPlannerServiceTest.java`
- `backend/src/test/java/**/SessionRunExecutor*Test.java`

实现：

- Planner 生成结构化步骤。
- 每步执行后写 `observation`。
- Judge 判断 `DONE`、`REPLAN`、`CONTINUE`。
- `maxPlanningRounds`、`maxStepsPerRun` 可配置。
- MCP 失败只是重规划触发条件之一，不是唯一触发条件。

验证：

- 单元测试：模型返回 `REPLAN` 时追加新步骤。
- 单元测试：达到 `DONE` 时提前停止。
- 单元测试：超过轮次上限时生成受控失败或降级报告。
- `cd backend && mvn test`

### Task 5：策略选择可解释和前端默认 AUTO

目标：自动策略选择成为默认可用能力。

影响文件：

- `backend/src/main/java/com/sreehc/aiagent/application/session/AgentStrategySelector.java`
- `backend/src/main/java/com/sreehc/aiagent/application/session/SessionRunExecutor.java`
- `frontend/src/features/workspace/ResearchComposer.tsx`
- `frontend/src/features/workspace/ExecutionTimeline.tsx`

实现：

- 前端默认 `AUTO`。
- SSE 发 `strategy.selected`，包含实际模式和原因。
- 用户显式选择时优先用户选择。

验证：

- 单元测试覆盖短任务、复杂任务、绑定知识库、手动选择。
- 前端构建通过。

### Task 6：会话记忆可查看、编辑、重建并稳定注入

目标：记忆不是隐藏实现，而是可管理上下文。

影响文件：

- `backend/src/main/java/com/sreehc/aiagent/application/session/ConversationMemoryService.java`
- `backend/src/main/java/com/sreehc/aiagent/trigger/session/SessionController.java`
- `frontend/src/pages/WorkspacePage.tsx`
- 新增 `frontend/src/features/workspace/MemoryPanel.tsx`
- `frontend/src/services/sessionsApi.ts`

实现：

- 增加 memory 查看、编辑、清空、重建 API。
- Prompt 注入做长度裁剪和来源标记。
- 本次 run 详情能看到注入了哪些 memory/artifact。

验证：

- 单元测试：上轮消息进入下轮 planner prompt。
- 手动验证：编辑摘要后再次运行，报告引用新摘要。

### Task 7：个人 API 配置覆盖 Chat/Embedding/Image

目标：个人配置真正影响所有模型类型。

影响文件：

- `backend/src/main/java/com/sreehc/aiagent/application/admin/ModelRuntimeResolver.java`
- `backend/src/main/java/com/sreehc/aiagent/application/account/UserApiConfigService.java`
- `backend/src/main/java/com/sreehc/aiagent/application/knowledge/QueryEmbeddingService.java`
- `backend/src/main/java/com/sreehc/aiagent/application/image/ImageGenerationService.java`
- `backend/src/main/java/com/sreehc/aiagent/application/session/SessionRunExecutor.java`
- `frontend/src/features/account/ApiConfigForm.tsx`
- `frontend/src/services/accountApi.ts`

实现：

- Embedding 路径改为按 user 解析配置。
- 账号页每种模型类型都能测试连接。
- 错误信息区分个人配置失败和管理员配置缺失。

验证：

- 单元测试：用户 A 的 embedding 配置不会影响用户 B。
- mock provider 测试 Chat/Embedding/Image 个人配置优先。

### Task 8：找回密码 SMTP 生产闭环

目标：生产环境可以真实发送找回密码邮件，开发环境可安全日志发送。

影响文件：

- `backend/src/main/java/com/sreehc/aiagent/application/auth/SmtpEmailSender.java`
- `backend/src/main/java/com/sreehc/aiagent/application/auth/NoopEmailSender.java`
- `backend/src/main/java/com/sreehc/aiagent/app/AppProperties.java`
- `backend/src/main/resources/application.yml`
- `backend/src/test/java/**/SmtpEmailSenderTest.java`

实现：

- 支持 STARTTLS/TLS、认证、连接/读超时。
- 生产 profile 未配置 SMTP 时启动失败或降级被明确禁止。
- 发送失败记录审计，不泄露 token。

验证：

- 单元测试构造邮件头和正文。
- 手动 SMTP sandbox 验收：找回密码邮件可收到。

### Task 9：RAG 异常降级策略全链路

目标：RAG 失败不阻断普通执行，并且用户能看到降级原因。

影响文件：

- 新增 `backend/src/main/java/com/sreehc/aiagent/application/knowledge/RagFallbackPolicy.java`
- `backend/src/main/java/com/sreehc/aiagent/application/session/SessionRunExecutor.java`
- `backend/src/main/java/com/sreehc/aiagent/application/knowledge/QueryRewriteService.java`
- `backend/src/main/java/com/sreehc/aiagent/application/knowledge/QueryEmbeddingService.java`
- `backend/src/main/java/com/sreehc/aiagent/application/knowledge/RetrievalReranker.java`
- `frontend/src/features/workspace/ExecutionTimeline.tsx`

实现：

- 权限和参数错误不吞。
- Provider、网络、embedding、rerank 异常降级。
- 报告中记录“本次未使用知识库证据/部分证据不可用”。

验证：

- 单元测试模拟 embedding provider 异常，run 仍完成。
- 单元测试权限错误仍返回错误。

### Task 10：历史产物复用 UI 闭环

目标：用户不用手填 artifactId 即可复用历史产物。

影响文件：

- `frontend/src/pages/HistoryPage.tsx`
- `frontend/src/features/history/ReplayDetail.tsx`
- `frontend/src/features/workspace/ArtifactPanel.tsx`
- `frontend/src/features/workspace/ResearchComposer.tsx`
- `frontend/src/pages/WorkspacePage.tsx`
- `frontend/src/services/artifactsApi.ts`
- `backend/src/main/java/com/sreehc/aiagent/application/session/ArtifactService.java`

实现：

- 历史页产物增加“作为上下文使用”。
- 工作台 composer 展示已选择产物，可移除。
- 发送任务传 `artifactIds`。
- 后端返回 reuse preview，前端展示简短摘要。

验证：

- 前端构建通过。
- 手动验证：从历史报告点击复用 -> 跳到工作台 -> 运行新任务 -> 新 run prompt 注入报告摘要。

### Task 11：统一产物库和附件登记

目标：附件、工具输出、报告、图片都进入 artifact 体系。

影响文件：

- `backend/src/main/java/com/sreehc/aiagent/application/session/ArtifactService.java`
- `backend/src/main/java/com/sreehc/aiagent/trigger/session/ArtifactController.java`
- `backend/src/main/java/com/sreehc/aiagent/application/common/UploadValidationService.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/storage/ObjectStorageService.java`
- `frontend/src/features/workspace/ArtifactPanel.tsx`
- 新增 `frontend/src/pages/ArtifactLibraryPage.tsx` 可选

实现：

- 工作台支持上传附件并登记 `ATTACHMENT`。
- 工具输出统一通过 `ArtifactService` 创建。
- 产物列表支持下载、预览、复用。

验证：

- 集成测试：非本人 artifact 不可读取/下载/复用。
- 手动验证：上传附件后可作为新任务上下文。

### Task 12：真实 Provider 图片编辑验证

目标：图片编辑不只是代码路径存在，而是有可验证契约。

影响文件：

- `backend/src/main/java/com/sreehc/aiagent/infrastructure/model/OpenAiCompatibleImageGenerationProvider.java`
- `backend/src/test/java/**/OpenAiCompatibleImageGenerationProviderTest.java`
- `frontend/src/features/image/ImageGenerationForm.tsx`
- `frontend/src/features/image/ImageGallery.tsx`

实现：

- 使用 mock HTTP server 验证 multipart 字段。
- 支持 provider 错误响应透传。
- 前端在无参考图时走生成，有参考图时走编辑。

验证：

- 后端 mock HTTP 测试通过。
- 手动真实 provider 验收，记录必需环境变量。

### Task 13：STDIO MCP 标准协议实现

目标：STDIO MCP 可连接真实 MCP server，不依赖进程退出读取输出。

影响文件：

- 新增 `backend/src/main/java/com/sreehc/aiagent/infrastructure/mcp/McpFrameCodec.java`
- 新增 `backend/src/main/java/com/sreehc/aiagent/infrastructure/mcp/McpSessionManager.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/mcp/StdioMcpTransportClient.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/mcp/McpRuntimeGateway.java`
- `backend/src/test/java/**/StdioMcpTransportClientTest.java`

实现：

- 按 `Content-Length: n\r\n\r\n{json}` 读写帧。
- initialize 后保持进程生命周期，执行 tools/list 和 tools/call。
- 设置启动超时、调用超时、输出大小上限、进程清理。
- 命令必须白名单。

验证：

- 单元测试 frame codec。
- 使用本地 fake MCP server 集成测试 discover/call。
- 手动验证一个真实 STDIO MCP server。

### Task 14：MCP 健康检查和工具测试

目标：健康检查反映真实服务可用性。

影响文件：

- `backend/src/main/java/com/sreehc/aiagent/application/mcp/McpAdminService.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/mcp/McpRuntimeGateway.java`
- `backend/src/main/java/com/sreehc/aiagent/trigger/admin/McpAdminController.java`
- `frontend/src/pages/McpServersPage.tsx`
- `frontend/src/features/system/McpToolList.tsx`

实现：

- health 返回 latency、toolCount、错误分类。
- 工具测试支持输入 JSON。
- 前端展示最近检查时间和错误原因。

验证：

- Controller 测试 HTTP/STDIO health 成功失败。
- 前端手动验证发现、健康、工具测试三条路径。

### Task 15：管理员审计视图增强

目标：审计页面可用于实际排障。

影响文件：

- `backend/src/main/java/com/sreehc/aiagent/application/admin/AdminAuditService.java`
- `backend/src/main/java/com/sreehc/aiagent/trigger/admin/AdminAuditController.java`
- `frontend/src/pages/AdminAuditPage.tsx`
- `frontend/src/services/adminApi.ts`

实现：

- 用户、运行、工具调用、登录记录支持分页、筛选、详情。
- 失败任务展示 errorCode、message、时间线。
- 工具调用展示 server/tool/status/latency/input/output 摘要。

验证：

- Controller 测试分页和筛选。
- 手动验证管理员账号可定位一次失败 run。

### Task 16：模型生命周期前端完整接入

目标：前端覆盖后端模型管理全部能力。

影响文件：

- `frontend/src/pages/AdminSettingsPage.tsx`
- `frontend/src/features/system/ModelForm.tsx`
- `frontend/src/features/system/ModelRegistry.tsx`
- `frontend/src/services/adminApi.ts`

实现：

- 模型列表提供编辑按钮。
- 表单支持新增/编辑模式。
- 启停、删除、默认、测试都有 loading/error/success 状态。
- 移除“测试连接待后端支持”的旧文案。

验证：

- `cd frontend && pnpm build`
- 手动验证新增、编辑、测试、设默认、停用、删除。

### Task 17：知识库文档版本恢复与重新索引

目标：文档生命周期达到可管理状态。

影响文件：

- 新增 `backend/src/main/java/com/sreehc/aiagent/application/knowledge/KnowledgeDocumentService.java`
- `backend/src/main/java/com/sreehc/aiagent/application/knowledge/KnowledgeBaseService.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/knowledge/KnowledgeRepository.java`
- `backend/src/main/java/com/sreehc/aiagent/trigger/knowledge/KnowledgeBaseController.java`
- `frontend/src/pages/KnowledgeBasesPage.tsx`
- `frontend/src/features/knowledge/DocumentTable.tsx`
- `frontend/src/services/knowledgeApi.ts`

实现：

- 版本列表标记 current。
- 支持恢复版本并触发重新索引。
- 支持单文档重新索引。
- 删除单文档后列表、索引状态、搜索结果一致。

验证：

- Repository/Service 测试版本恢复。
- 手动验证上传同名文档两版，恢复旧版后搜索命中新内容。

### Task 18：RAG 评估用例管理和趋势

目标：RAG 评估成为管理员可用工具。

影响文件：

- `backend/src/main/java/com/sreehc/aiagent/application/knowledge/RagEvaluationService.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/knowledge/RagEvaluationRepository.java`
- `backend/src/main/java/com/sreehc/aiagent/trigger/admin/RagEvaluationController.java`
- `frontend/src/pages/RagEvaluationPage.tsx`
- `frontend/src/services/adminApi.ts`

实现：

- 支持评估用例 CRUD。
- 运行评估可选择 KB、topK、期望文档/片段。
- 展示 recall、precision、MRR 或命中率。
- 展示失败样本和历史趋势。

验证：

- Service 测试指标计算。
- Controller 测试用例 CRUD。
- 手动验证创建用例、运行评估、查看失败样本。

### Task 19：API、数据库和 UX 文档同步

目标：实现后文档不再和代码漂移。

影响文件：

- `docs/api-spec-aiagent-v1.md`
- `docs/database-design-aiagent-v1.md`
- `docs/tech-design-aiagent-v1.md`
- `docs/ux-spec-aiagent-v1.md`
- `docs/prd-aiagent-v1.md`
- `docs/README.md`

实现：

- 更新新增/调整 API。
- 更新 run/artifact/document/model/MCP/RAG evaluation 数据模型。
- 更新 UX 限制，删除已完成能力的“尚未支持”说明。

验证：

- `rg -n '@(RequestMapping|GetMapping|PostMapping|PutMapping|DeleteMapping)' backend/src/main/java/com/sreehc/aiagent/trigger`
- 文档 API 路由与 Controller 对齐。

### Task 20：端到端验收脚本与回归清单

目标：用一组验收场景防止再次出现“部分完成被误判完成”。

影响文件：

- 新增 `docs/release-checklist-aiagent-v1.md`
- 可选新增 `frontend/e2e/*`
- 可选新增 `backend/src/test/java/**/Contract*Test.java`

验收场景：

- 普通用户：创建会话 -> AUTO 运行 -> 查看计划 -> 暂停 -> 继续 -> 完成 -> 复用报告 -> 再运行。
- 普通用户：绑定知识库 -> 模拟 RAG 降级 -> run 仍完成且有降级提示。
- 普通用户：配置个人 Chat/Embedding/Image -> 运行和图片生成使用个人配置。
- 管理员：新增模型 -> 测试 -> 编辑 -> 设默认 -> 停用 -> 删除。
- 管理员：配置 STDIO fake MCP -> 发现工具 -> 健康检查 -> 工具测试 -> 运行任务登记工具输出 artifact。
- 管理员：上传文档两版 -> 恢复旧版 -> 重新索引 -> RAG 评估看到指标变化。
- 找回密码：SMTP sandbox 收到邮件 -> token 可重置密码。

验证：

- `cd backend && mvn test`
- `cd frontend && pnpm build`
- 浏览器手动验收上述场景。

## 8. 推荐提交顺序

### Phase 1：P0 状态和执行闭环

1. Task 1：统一运行状态语义和数据库迁移
2. Task 2：RunControlService 与取消/暂停/继续 API
3. Task 3：前端运行控制闭环
4. Task 4：动态规划服务与观察-判断-重规划循环
5. Task 5：策略选择可解释和前端默认 AUTO
6. Task 6：会话记忆可查看、编辑、重建并稳定注入

### Phase 2：运行时配置和可靠性

1. Task 7：个人 API 配置覆盖 Chat/Embedding/Image
2. Task 8：找回密码 SMTP 生产闭环
3. Task 9：RAG 异常降级策略全链路

### Phase 3：产物与工具闭环

1. Task 10：历史产物复用 UI 闭环
2. Task 11：统一产物库和附件登记
3. Task 12：真实 Provider 图片编辑验证
4. Task 13：STDIO MCP 标准协议实现
5. Task 14：MCP 健康检查和工具测试

### Phase 4：管理后台和知识库闭环

1. Task 15：管理员审计视图增强
2. Task 16：模型生命周期前端完整接入
3. Task 17：知识库文档版本恢复与重新索引
4. Task 18：RAG 评估用例管理和趋势

### Phase 5：文档和验收

1. Task 19：API、数据库和 UX 文档同步
2. Task 20：端到端验收脚本与回归清单

## 9. 全量验收标准

完成后必须汇报：

- 改了哪些文件。
- 每个 P0/P1/P2 能力对应哪些任务完成。
- 自动化验证命令和结果。
- 手动验收场景和结果。
- 仍不可验证的外部依赖，例如真实 SMTP、真实 OpenAI-compatible 图片编辑、真实 STDIO MCP server。

不满足以下任一项，不得标记“全部完成”：

- `backend && mvn test` 失败。
- `frontend && pnpm build` 失败。
- run 取消后仍显示为 `FAILED`。
- 前端仍要求手填 artifactId 才能复用历史产物。
- 模型管理前端仍不能编辑模型。
- STDIO MCP 仍依赖关闭 stdin 和等待进程退出读取全部输出。
- 知识库版本只能查看不能恢复。
- docs 中仍写“尚未支持”但代码已支持，或反过来。

## 10. 风险与边界

- 动态规划会增加模型调用次数，需要配置轮次和步骤上限。
- pause/resume 不能中断已经发出的阻塞 HTTP 调用，只能在 provider 超时或步骤边界收敛；需要给 provider 设置合理超时。
- STDIO MCP 执行本地命令，有安全风险，必须保留命令白名单和输出限制。
- 真实图片编辑和 SMTP 需要外部服务，自动化测试只能覆盖协议契约，最终仍需手动集成验收。
- 知识库版本恢复会影响索引一致性，必须保证恢复后重新索引和旧 chunks 失效。
