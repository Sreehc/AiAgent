# AiAgent 未闭环能力技术设计与任务计划

> 文档状态：基于 2026-06-13 实际代码复核生成，并已按本文任务完成第一版实现。后续应以当前代码、测试结果和 API 文档为准继续细化。

## 1. 范围与目标

本计划覆盖当前明确未闭环的 P0/P1/P2 能力：

- P0：动态 Agent 策略选择、真实动态规划、任务取消/超时/僵尸恢复、会话记忆注入、个人 API 配置生效、找回密码邮件闭环。
- P1：RAG 异常降级、历史产物复用、统一产物体系、真实 Provider 图片编辑、完整 STDIO MCP、MCP 真实健康检查、管理员审计视图、模型生命周期管理。
- P2：知识库文档生命周期、RAG 评估产品化。

设计目标：

- 优先补齐会影响核心研究执行闭环的能力。
- 保持现有 REST + SSE + Redis Session + PostgreSQL/Flyway 架构。
- 每个任务可独立提交、独立回滚、独立验证。
- 不在一次提交中混合数据库迁移、执行器重构和 UI 大改。

## 2. 当前代码事实

| 能力 | 当前实现位置 | 代码状态 |
| --- | --- | --- |
| Agent 执行 | `backend/src/main/java/com/sreehc/aiagent/application/session/SessionRunExecutor.java` | 已接入自动策略选择、动态步骤解析、受控补救重规划、取消检查、心跳和 RAG 降级 |
| 会话详情 | `backend/src/main/java/com/sreehc/aiagent/application/session/SessionService.java` | 已提供记忆读写接口，执行器会将摘要、最近消息和复用产物注入 Planner/Summary prompt |
| 运行心跳 | `backend/src/main/resources/db/migration/V18__run_lifecycle_and_memory.sql` | 已扩展生命周期字段，并由 `RunRecoveryScheduler` 扫描超时运行 |
| 个人 API 配置 | `backend/src/main/java/com/sreehc/aiagent/application/account/UserApiConfigService.java` | 已提供 runtime view，Chat/Image 会优先使用个人配置 |
| 运行时模型配置 | `backend/src/main/java/com/sreehc/aiagent/application/admin/ModelRuntimeResolver.java` | 已支持按用户解析，个人配置优先、管理员配置回退 |
| 找回密码邮件 | `backend/src/main/java/com/sreehc/aiagent/application/auth/EmailSender.java` | 已抽象发送接口，提供日志发送和 JDK SMTP 发送实现 |
| RAG 检索 | `backend/src/main/java/com/sreehc/aiagent/application/session/SessionRunExecutor.java` | 检索链路异常会记录 fallback 并通过 `rag.degraded` 继续普通执行 |
| Artifact 类型 | `backend/src/main/java/com/sreehc/aiagent/domain/session/ArtifactType.java` | 已扩展 `ATTACHMENT`、`TOOL_OUTPUT`、`CONTEXT_SNIPPET`，并新增 Artifact API |
| 图片编辑 | `backend/src/main/java/com/sreehc/aiagent/infrastructure/model/OpenAiCompatibleImageGenerationProvider.java` | 已支持参考图 multipart `/images/edits` |
| STDIO MCP | `backend/src/main/java/com/sreehc/aiagent/infrastructure/mcp/StdioMcpTransportClient.java` | 已发送 MCP 初始化、`tools/list` 和 `tools/call` JSON-RPC 消息 |
| MCP 调用账本 | `backend/src/main/java/com/sreehc/aiagent/application/mcp/McpExecutionService.java` | 已记录工具调用成功/失败并提供 fallback 文本 |
| 模型配置管理 | `backend/src/main/java/com/sreehc/aiagent/trigger/admin/AdminSettingsController.java` | 已支持编辑、启停、删除、连接测试和默认模型 |
| 知识库文档 | `backend/src/main/java/com/sreehc/aiagent/trigger/knowledge/KnowledgeBaseController.java` | 已支持上传、列表、详情预览、下载、删除、版本、索引、重建索引、检索测试 |
| RAG 评估 | `backend/src/main/java/com/sreehc/aiagent/application/knowledge/RagEvaluationService.java` | 已新增 API、持久化和管理员页面入口 |

## 3. 模块划分

### 3.1 Agent Runtime

职责：

- 根据任务内容、绑定知识库、用户偏好和可用工具选择执行策略。
- 生成、执行、观察和必要时重规划任务步骤。
- 管理运行状态、心跳、取消、超时和恢复。
- 组装会话记忆、知识库证据、历史产物和工具结果作为模型上下文。

建议新增/调整：

- `AgentStrategySelector`：选择 `REACT`、`PLAN_EXECUTE` 或后续扩展模式。
- `DynamicPlannerService`：将模型输出解析为结构化步骤。
- `RunLifecycleService`：统一 run 状态变更、心跳、取消、超时。
- `ConversationMemoryService`：提取最近消息、摘要和可复用产物上下文。
- `SessionRunExecutor`：保留编排入口，逐步瘦身为 orchestration。

### 3.2 Model Runtime

职责：

- 合并管理员模型配置、用户个人 API 配置和环境 fallback。
- 支持连接测试、启停、编辑、删除和默认模型选择。
- 为 Chat、Embedding、Image 提供统一运行时配置。

建议新增/调整：

- `ModelRuntimeResolver` 增加按用户解析入口。
- `UserApiConfigService` 暴露运行时密钥解密视图，仅内部使用。
- `AdminSettingsService` 增加模型更新、启停、删除、连接测试。

### 3.3 RAG And Knowledge

职责：

- 检索异常时降级为普通执行，并记录降级原因。
- 完整管理单文档删除、预览、下载和版本。
- 将 RAG 评估服务产品化为 API 和管理页面。

建议新增/调整：

- `RagFallbackPolicy`：定义异常降级策略和错误码。
- `KnowledgeDocumentService` 或继续扩展 `KnowledgeBaseService`：处理文档级生命周期。
- `RagEvaluationController`：暴露评估执行与历史结果。

### 3.4 Artifact And Reuse

职责：

- 将报告、图片、参考图、附件、工具输出统一登记为 artifact。
- 支持历史产物作为新任务输入。
- 在工作台、历史页、图片页之间建立产物复用入口。

建议新增/调整：

- `ArtifactService`：从 `SessionRepository` 中抽离 artifact 创建、查询、复用。
- `ArtifactType` 扩展 `ATTACHMENT`、`TOOL_OUTPUT`、`CONTEXT_SNIPPET`。
- `CreateRunCommand` 增加 `artifactIds` 或 `inputArtifacts`。

### 3.5 MCP Runtime

职责：

- HTTP MCP 和 STDIO MCP 统一工具发现、调用、健康检查。
- STDIO 支持标准 MCP 初始化、`tools/list`、`tools/call`。
- 健康检查真实探测远端服务或本地命令。

建议新增/调整：

- `McpSessionManager`：管理 STDIO 进程生命周期、初始化和超时。
- `StdioMcpTransportClient`：从占位工具改为标准 JSON-RPC MCP 协议。
- `HttpMcpTransportClient`：健康检查和工具发现结果带延迟、错误信息。

### 3.6 Admin And Audit

职责：

- 系统级用户、失败任务、工具调用、模型配置、RAG 评估可观测。
- 前端提供面向管理员的审计和配置工作台。

建议新增/调整：

- `AdminAuditController`、`AdminAuditService`。
- 前端新增 `AdminAuditPage`、扩展 `AdminSettingsPage`、`McpServersPage`。

### 3.7 Notification

职责：

- 将找回密码 Token 发送给用户。
- 支持本地开发日志发送、SMTP 生产发送和失败审计。

建议新增/调整：

- `EmailSender` 接口。
- `SmtpEmailSender`、`LoggingEmailSender`、现有 `NoopEmailSender` 调整为 profile fallback。

## 4. 数据模型设计

### 4.1 execution_run 扩展

新增字段建议：

| 字段 | 类型 | 用途 |
| --- | --- | --- |
| `cancel_requested_at` | `timestamptz` | 用户请求取消时间 |
| `cancel_reason` | `text` | 取消原因 |
| `timeout_at` | `timestamptz` | 运行超时边界 |
| `recovered_at` | `timestamptz` | 僵尸任务恢复/标记时间 |
| `strategy_source` | `varchar(32)` | `USER_SELECTED`、`AUTO_SELECTED` |
| `planning_rounds` | `int` | 实际规划轮次 |
| `fallback_reasons` | `jsonb` | RAG/MCP/模型等降级原因 |

状态流建议：

```text
PENDING
  -> RUNNING
  -> COMPLETED
  -> FAILED
  -> CANCEL_REQUESTED -> CANCELLED
  -> TIMED_OUT
  -> RECOVERED_FAILED
```

注意：如果不想改变现有 `RunStatus` 太多，可先新增 `CANCELLED`、`TIMED_OUT`，将 `RECOVERED_FAILED` 映射为 `FAILED + recovered_at`。

### 4.2 execution_plan_step 扩展

新增字段建议：

| 字段 | 类型 | 用途 |
| --- | --- | --- |
| `parent_step_id` | `bigint` | 支持子任务/重规划 |
| `planner_round` | `int` | 标记来自第几轮规划 |
| `depends_on` | `jsonb` | 并行/依赖关系 |
| `observation` | `text` | 执行观察结果 |
| `retry_count` | `int` | 步骤重试次数 |

### 4.3 session_memory

新增表建议：

```sql
create table session_memory (
    id bigserial primary key,
    session_id bigint not null references agent_session(id) on delete cascade,
    user_id bigint not null references user_account(id) on delete cascade,
    memory_type varchar(32) not null,
    content text not null,
    source_run_id bigint references execution_run(id) on delete set null,
    token_estimate int,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

`memory_type` 建议：`SUMMARY`、`RECENT_MESSAGES`、`USER_FACT`、`ARTIFACT_CONTEXT`。

### 4.4 artifact_record 扩展

新增字段建议：

| 字段 | 类型 | 用途 |
| --- | --- | --- |
| `metadata` | `jsonb` | 来源、工具名、文件大小、可复用标记 |
| `source_artifact_id` | `bigint` | 派生产物关系 |
| `reusable` | `boolean` | 是否允许作为新任务输入 |

`ArtifactType` 扩展：

- `ATTACHMENT`
- `TOOL_OUTPUT`
- `CONTEXT_SNIPPET`

### 4.5 model_config 扩展

建议字段：

| 字段 | 类型 | 用途 |
| --- | --- | --- |
| `is_default` | `boolean` | 同类型默认模型 |
| `last_tested_at` | `timestamptz` | 最近连接测试时间 |
| `last_test_status` | `varchar(32)` | `SUCCESS`、`FAILED`、`SKIPPED` |
| `last_test_message` | `text` | 失败原因或 provider 摘要 |

### 4.6 knowledge_document 扩展

建议字段：

| 字段 | 类型 | 用途 |
| --- | --- | --- |
| `version_no` | `int` | 文档版本 |
| `deleted_at` | `timestamptz` | 软删除 |
| `checksum` | `varchar(128)` | 去重和版本判断 |
| `file_size` | `bigint` | 展示和下载校验 |

### 4.7 rag_evaluation_run

新增表建议：

```sql
create table rag_evaluation_run (
    id bigserial primary key,
    eval_id varchar(64) not null unique,
    user_id bigint not null references user_account(id),
    knowledge_base_ids jsonb not null default '[]'::jsonb,
    cases jsonb not null,
    metrics jsonb,
    status varchar(32) not null,
    error_message text,
    created_at timestamptz not null default now(),
    completed_at timestamptz
);
```

## 5. API 设计

### 5.1 会话与运行

新增/调整：

| Method | Path | 用途 |
| --- | --- | --- |
| `POST` | `/api/v1/sessions/{sessionId}/runs/stream` | 保留现有 SSE；请求体增加 `strategyMode`、`artifactIds` |
| `POST` | `/api/v1/sessions/{sessionId}/runs/{runId}/cancel` | 请求取消 |
| `POST` | `/api/v1/sessions/{sessionId}/runs/{runId}/resume` | 可选，恢复可恢复任务 |
| `GET` | `/api/v1/sessions/{sessionId}/memory` | 查看会话记忆 |
| `PUT` | `/api/v1/sessions/{sessionId}/memory` | 更新/清空摘要记忆 |

SSE 事件建议：

- `strategy.selected`
- `plan.generated`
- `plan.replanned`
- `task.started`
- `task.observed`
- `task.cancelled`
- `task.timed_out`
- `rag.degraded`
- `artifact.created`
- `session.completed`
- `session.failed`

### 5.2 Artifact

新增：

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/api/v1/artifacts` | 按类型、会话、可复用状态查询 |
| `GET` | `/api/v1/artifacts/{artifactId}` | 查看详情 |
| `POST` | `/api/v1/artifacts/{artifactId}/reuse` | 生成可作为任务输入的引用 |
| `GET` | `/api/v1/artifacts/{artifactId}/download` | 下载二进制产物 |

### 5.3 模型配置

新增：

| Method | Path | 用途 |
| --- | --- | --- |
| `PUT` | `/api/v1/admin/models/{modelCode}` | 编辑模型 |
| `POST` | `/api/v1/admin/models/{modelCode}/enable` | 启用 |
| `POST` | `/api/v1/admin/models/{modelCode}/disable` | 停用 |
| `DELETE` | `/api/v1/admin/models/{modelCode}` | 删除 |
| `POST` | `/api/v1/admin/models/{modelCode}/test` | 连接测试 |
| `POST` | `/api/v1/admin/models/{modelCode}/default` | 设为同类型默认 |

### 5.4 MCP

新增/调整：

| Method | Path | 用途 |
| --- | --- | --- |
| `POST` | `/api/v1/admin/mcp-servers/{serverCode}/discover` | STDIO/HTTP 均真实发现 |
| `GET` | `/api/v1/admin/mcp-servers/{serverCode}/health` | 真实健康检查，返回 latency、details |
| `POST` | `/api/v1/admin/mcp-servers/{serverCode}/tools/{toolName}/test` | 工具测试调用 |

### 5.5 知识库与 RAG 评估

新增：

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/api/v1/knowledge-bases/{kbId}/documents/{documentId}` | 文档详情和预览 |
| `GET` | `/api/v1/knowledge-bases/{kbId}/documents/{documentId}/download` | 下载原文 |
| `DELETE` | `/api/v1/knowledge-bases/{kbId}/documents/{documentId}` | 删除单文档 |
| `GET` | `/api/v1/knowledge-bases/{kbId}/documents/{documentId}/versions` | 版本列表 |
| `POST` | `/api/v1/admin/rag-evaluations` | 创建评估 |
| `GET` | `/api/v1/admin/rag-evaluations` | 评估历史 |
| `GET` | `/api/v1/admin/rag-evaluations/{evalId}` | 评估详情 |

### 5.6 管理员审计

新增：

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/api/v1/admin/audit/users` | 用户与状态概览 |
| `GET` | `/api/v1/admin/audit/runs` | 失败/运行中任务列表 |
| `GET` | `/api/v1/admin/audit/tool-invocations` | 工具调用审计 |
| `GET` | `/api/v1/admin/audit/login-logs` | 系统级登录日志 |

## 6. 状态流设计

### 6.1 自动策略选择

```text
用户提交任务
  -> StrategySelector 读取 query、knowledgeBaseIds、artifactIds、可用 MCP tools、用户配置
  -> 输出 selectedMode + reason + confidence
  -> 写入 execution_run.strategy_source 和 SSE strategy.selected
  -> 进入 Planner
```

策略规则第一阶段建议以确定性规则为主：

- 有复杂拆解词、对比词、多个目标对象：优先 `PLAN_EXECUTE`。
- 短问题、单步问答、无需工具：优先 `REACT`。
- 用户显式选择时尊重用户选择，并记录 `USER_SELECTED`。

第二阶段再允许模型辅助分类，避免一开始把策略选择也变成不可测的模型行为。

### 6.2 动态规划与重规划

```text
Planner 生成结构化 steps
  -> 写 execution_plan_step
  -> 执行 step
  -> 收集 observation
  -> 判断是否完成/是否需要重规划
  -> 需要重规划则生成下一轮 steps
  -> 达到 maxPlanningRounds 或完成
```

建议限制：

- `maxPlanningRounds` 默认 2。
- `maxStepsPerRun` 默认 8。
- 并行子任务先只落数据结构，第一版执行仍可串行，避免一次引入线程编排复杂度。

### 6.3 取消、超时和僵尸恢复

```text
RUNNING
  -> 每个步骤前后 update heartbeat_at
  -> 用户 cancel 写 cancel_requested_at
  -> 执行器在步骤边界检查 cancel
  -> 定时任务扫描 heartbeat_at 过期 run
  -> 标记 TIMED_OUT 或 FAILED(recovered_at)
```

第一阶段不强杀正在执行的外部 HTTP 请求，只保证步骤边界可取消；第二阶段再引入 provider 级超时和中断。

### 6.4 会话记忆注入

```text
Run 完成
  -> 从 assistant report + 最近消息生成 SUMMARY
  -> 写 session_memory
下一次 Run
  -> 加载 SUMMARY + 最近 N 条消息 + selected artifacts
  -> 拼入 Planner/Summary prompt
```

上下文预算：

- 摘要优先级高于原始历史消息。
- 只注入最近 N 条消息，默认 N=8。
- artifact 内容按类型和长度裁剪。

### 6.5 RAG 异常降级

```text
绑定知识库
  -> 检索成功：写 retrieval audit 和 evidence
  -> 检索异常：记录 rag.degraded + fallback_reasons
  -> evidenceHits=[]
  -> 继续普通 Agent 执行
```

降级只覆盖检索链路异常，不吞掉权限错误和参数错误。`KB_NOT_FOUND` 仍应返回错误。

## 7. 影响文件清单

### 7.1 后端核心

- `backend/src/main/java/com/sreehc/aiagent/application/session/SessionRunExecutor.java`
- `backend/src/main/java/com/sreehc/aiagent/application/session/SessionService.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/session/SessionRepository.java`
- `backend/src/main/java/com/sreehc/aiagent/domain/session/RunStatus.java`
- `backend/src/main/java/com/sreehc/aiagent/domain/session/PlanStepStatus.java`
- `backend/src/main/java/com/sreehc/aiagent/domain/session/ArtifactType.java`
- `backend/src/main/java/com/sreehc/aiagent/trigger/session/SessionController.java`

### 7.2 后端配置与模型

- `backend/src/main/java/com/sreehc/aiagent/application/admin/ModelRuntimeResolver.java`
- `backend/src/main/java/com/sreehc/aiagent/application/admin/AdminSettingsService.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/admin/AdminSettingsRepository.java`
- `backend/src/main/java/com/sreehc/aiagent/application/account/UserApiConfigService.java`
- `backend/src/main/java/com/sreehc/aiagent/trigger/admin/AdminSettingsController.java`

### 7.3 后端 RAG、MCP、图片、通知

- `backend/src/main/java/com/sreehc/aiagent/application/knowledge/KnowledgeBaseService.java`
- `backend/src/main/java/com/sreehc/aiagent/application/knowledge/RagEvaluationService.java`
- `backend/src/main/java/com/sreehc/aiagent/trigger/knowledge/KnowledgeBaseController.java`
- `backend/src/main/java/com/sreehc/aiagent/application/mcp/McpAdminService.java`
- `backend/src/main/java/com/sreehc/aiagent/application/mcp/McpExecutionService.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/mcp/StdioMcpTransportClient.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/mcp/HttpMcpTransportClient.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/model/OpenAiCompatibleImageGenerationProvider.java`
- `backend/src/main/java/com/sreehc/aiagent/application/auth/NoopEmailSender.java`

### 7.4 数据库迁移

- 新增 `backend/src/main/resources/db/migration/V18__run_lifecycle_and_memory.sql`
- 新增 `backend/src/main/resources/db/migration/V19__artifact_reuse_and_model_lifecycle.sql`
- 新增 `backend/src/main/resources/db/migration/V20__knowledge_document_versions_and_rag_eval.sql`

实际版本号以落地时最新 migration 为准。

### 7.5 前端

- `frontend/src/services/sessionsApi.ts`
- `frontend/src/services/adminApi.ts`
- `frontend/src/services/knowledgeApi.ts`
- `frontend/src/services/imagesApi.ts`
- 新增 `frontend/src/services/artifactsApi.ts`
- `frontend/src/features/workspace/ResearchComposer.tsx`
- `frontend/src/features/workspace/ArtifactPanel.tsx`
- `frontend/src/features/workspace/ExecutionTimeline.tsx`
- `frontend/src/features/workspace/workspaceViewModel.ts`
- `frontend/src/pages/WorkspacePage.tsx`
- `frontend/src/pages/HistoryPage.tsx`
- `frontend/src/pages/AdminSettingsPage.tsx`
- `frontend/src/pages/McpServersPage.tsx`
- `frontend/src/pages/KnowledgeBasesPage.tsx`
- 新增 `frontend/src/pages/AdminAuditPage.tsx`
- 新增 `frontend/src/pages/RagEvaluationPage.tsx`
- `frontend/src/components/shell/navigation.ts`
- `frontend/src/router/AppRouter.tsx`

### 7.6 文档与测试

- `docs/api-spec-aiagent-v1.md`
- `docs/database-design-aiagent-v1.md`
- `docs/tech-design-aiagent-v1.md`
- `docs/prd-aiagent-v1.md`
- 后端现有测试目录下新增对应单元、集成或 Controller 测试。
- 前端当前未配置自动化测试，短期以 `pnpm build` 和浏览器 smoke 为验证门槛。

## 8. 可独立提交任务列表

### Task P0-1：运行生命周期基础模型

目标：为取消、超时、心跳和恢复补齐数据基础。

改动：

- 新增 migration，扩展 `execution_run` 生命周期字段。
- 扩展 `RunStatus`。
- 在 `SessionRepository` 增加心跳、取消请求、超时标记、查询僵尸 run 方法。
- 不改变现有 SSE 执行行为。

影响文件：

- `backend/src/main/resources/db/migration/V18__run_lifecycle_and_memory.sql`
- `backend/src/main/java/com/sreehc/aiagent/domain/session/RunStatus.java`
- `backend/src/main/java/com/sreehc/aiagent/infrastructure/session/SessionRepository.java`

验证：

- `cd backend && mvn test`
- 新增 Repository 测试覆盖 run 心跳更新时间、取消标记、超时查询。

### Task P0-2：取消接口与 SSE 状态

目标：用户可以取消运行中任务，并在前端看到取消状态。

改动：

- 新增 `POST /api/v1/sessions/{sessionId}/runs/{runId}/cancel`。
- `SessionRunExecutor` 在步骤边界检查取消状态。
- SSE 增加 `task.cancelled` 或 `session.cancelled`。
- 前端工作台增加取消按钮和状态处理。

影响文件：

- `SessionController.java`
- `SessionService.java`
- `SessionRunExecutor.java`
- `SessionRepository.java`
- `frontend/src/services/sessionsApi.ts`
- `frontend/src/features/workspace/ResearchComposer.tsx`
- `frontend/src/features/workspace/ExecutionTimeline.tsx`
- `frontend/src/pages/WorkspacePage.tsx`

验证：

- 后端 Controller 测试：取消非本人 run 返回 404 或权限错误；取消已完成 run 返回冲突。
- 手动验证：启动任务后点击取消，SSE 收到取消事件，run 状态变为 `CANCELLED`。
- `cd frontend && pnpm build`

### Task P0-3：心跳更新、超时扫描和僵尸恢复

目标：运行卡死后可被自动标记，避免长期 RUNNING。

改动：

- `SessionRunExecutor` 在 run 开始、步骤开始、步骤结束、完成前更新 `heartbeat_at`。
- 新增定时任务扫描超过阈值的 RUNNING run。
- 标记 `TIMED_OUT` 或 `FAILED + recovered_at`。
- 前端展示超时/恢复失败状态。

影响文件：

- `SessionRunExecutor.java`
- 新增 `RunRecoveryScheduler.java`
- `SessionRepository.java`
- `frontend/src/features/workspace/ExecutionTimeline.tsx`
- `frontend/src/features/history/ReplayDetail.tsx`

验证：

- 单元测试：给定过期 heartbeat，扫描后状态更新。
- 集成测试：模拟执行器抛异常不会留下 RUNNING。
- `cd backend && mvn test`

### Task P0-4：自动 Agent 策略选择

目标：系统可根据任务自动选择执行模式，同时保留用户手动选择。

改动：

- 新增 `AgentStrategySelector`。
- 请求体新增 `strategyMode`: `AUTO`、`MANUAL`，兼容旧的 `executionMode`。
- `execution_run` 记录 `strategy_source`。
- SSE 增加 `strategy.selected`。
- 前端执行模式控件增加“自动”。

影响文件：

- `SessionService.CreateRunCommand`
- `SessionRunExecutor.java`
- 新增 `AgentStrategySelector.java`
- `SessionController.java`
- `frontend/src/features/workspace/ResearchComposer.tsx`
- `frontend/src/services/sessionsApi.ts`

验证：

- 单元测试覆盖短任务选择 ReAct、复杂对比任务选择 Plan-Execute、手动选择优先。
- SSE 测试或手动验证包含 `strategy.selected`。
- `cd backend && mvn test`
- `cd frontend && pnpm build`

### Task P0-5：动态 Planner 结构化输出

目标：Planner 不再只返回提示文本，而是返回可执行步骤。

改动：

- 新增 `DynamicPlannerService`。
- 定义 `PlannedStep` DTO，包含 `title`、`toolName`、`toolInput`、`dependsOn`。
- 模型输出 JSON，解析失败时降级到当前固定计划。
- `buildPlan(...)` 改为调用 planner 服务。

影响文件：

- `SessionRunExecutor.java`
- 新增 `DynamicPlannerService.java`
- 可能新增 `domain/session/PlannedStep.java`
- `SessionRepository.java`

验证：

- 单元测试：合法 JSON 生成步骤；非法 JSON 回退固定计划。
- 运行一次任务，`execution_plan_step` 标题随 query 变化。
- `cd backend && mvn test`

### Task P0-6：重规划与规划轮次

目标：执行观察结果可触发第二轮规划。

改动：

- `execution_plan_step` 增加 `planner_round`、`observation`。
- `SessionRunExecutor` 在步骤执行后判断是否需要重规划。
- 增加 `plan.replanned` SSE。
- 设置最大轮次和最大步骤数。

影响文件：

- migration
- `SessionRunExecutor.java`
- `SessionRepository.java`
- `frontend/src/features/workspace/ExecutionTimeline.tsx`

验证：

- 单元测试：工具失败时生成补救步骤；超过最大轮次停止。
- 手动验证：前端时间线显示第 1/2 轮计划。
- `cd backend && mvn test`
- `cd frontend && pnpm build`

### Task P0-7：会话记忆入模

目标：后续执行能使用历史摘要和最近消息。

改动：

- 新增 `session_memory` 表。
- 新增 `ConversationMemoryService`。
- Run 完成后生成/更新摘要。
- 下一次 Planner 和 Summary prompt 注入摘要与最近消息。
- 前端在会话详情中显示“已使用会话记忆”提示，可后续加编辑入口。

影响文件：

- migration
- `SessionRunExecutor.java`
- `SessionService.java`
- `SessionRepository.java`
- 新增 `ConversationMemoryService.java`
- `frontend/src/features/workspace/ArtifactPanel.tsx`

验证：

- 单元测试：生成 prompt 包含上一轮 assistant summary。
- 集成测试：同一 session 第二次执行读取 memory。
- `cd backend && mvn test`

### Task P0-8：个人 API 配置进入运行时

目标：用户个人配置可实际驱动 Chat/Image，管理员配置仍作为默认。

改动：

- `ModelRuntimeResolver` 增加 `findForUser(SessionUser, ModelType, modelCode)`。
- `UserApiConfigService` 增加内部 runtime view，返回解密后的 baseUrl/apiKey/model。
- `SessionRunExecutor` 和 `ImageGenerationService` 使用按用户解析。
- 明确优先级：用户配置启用且密钥存在 > 管理员模型配置 > 环境/local mock。

影响文件：

- `ModelRuntimeResolver.java`
- `UserApiConfigService.java`
- `SessionRunExecutor.java`
- `ImageGenerationService.java`
- `AccountController.java` 如需增加 enabled 字段

验证：

- 单元测试：有用户配置时 resolver 返回用户配置；无用户配置时回退管理员配置。
- 集成测试：个人 API 配置不会在响应中泄露明文。
- `cd backend && mvn test`

### Task P0-9：找回密码邮件发送闭环

目标：Token 生成后真实发送，生产环境不再 No-op。

改动：

- 新增 `EmailSender` 接口。
- `NoopEmailSender` 改为 `LoggingEmailSender` 或 dev profile。
- 新增 `SmtpEmailSender`，配置 host、port、username、password、from。
- `AuthService` 依赖接口而非具体 No-op。
- 文档补充本地和生产邮件配置。

影响文件：

- `NoopEmailSender.java`
- `AuthService.java`
- `AppProperties.java`
- `application.yml` 或配置示例
- `docs/api-spec-aiagent-v1.md`

验证：

- 单元测试：forgot password 调用 email sender。
- 本地 profile 验证日志输出 reset link。
- 生产 profile 缺 SMTP 配置时启动保护或明确降级。
- `cd backend && mvn test`

### Task P1-1：RAG 检索异常降级

目标：检索 provider、embedding、rerank 等异常不导致整个 run 失败。

改动：

- 新增 `RagFallbackPolicy`。
- `SessionRunExecutor` 捕获 RAG 检索链路异常，记录 `fallback_reasons`。
- SSE 增加 `rag.degraded`。
- 保留权限错误、参数错误为硬失败。

影响文件：

- `SessionRunExecutor.java`
- `KnowledgeBaseService.java`
- `SessionRepository.java`
- `frontend/src/features/workspace/ArtifactPanel.tsx`

验证：

- 单元测试：模拟 embedding provider 异常，run 继续完成。
- 验证 `finalEvidenceSet` 为空且报告说明降级。
- `cd backend && mvn test`

### Task P1-2：统一 Artifact 服务与类型扩展

目标：工具输出、附件、上下文片段也进入统一产物账本。

改动：

- 新增 `ArtifactService`。
- `ArtifactType` 增加 `ATTACHMENT`、`TOOL_OUTPUT`、`CONTEXT_SNIPPET`。
- MCP 工具调用成功后可登记 `TOOL_OUTPUT`。
- 前端 ArtifactPanel 支持不同类型图标、下载和复用动作。

影响文件：

- `ArtifactType.java`
- 新增 `ArtifactService.java`
- `SessionRepository.java`
- `McpExecutionService.java`
- `frontend/src/features/workspace/ArtifactPanel.tsx`

验证：

- 单元测试：工具输出登记 artifact。
- 手动验证：任务完成后产物列表出现工具输出。
- `cd backend && mvn test`
- `cd frontend && pnpm build`

### Task P1-3：历史产物复用为新任务输入

目标：用户可以将历史报告、图片、工具输出作为新任务上下文。

改动：

- `CreateRunCommand` 增加 `artifactIds`。
- 新增 artifact 查询/复用 API。
- `ConversationMemoryService` 或 `ArtifactService` 将 artifact 内容裁剪后注入 prompt。
- 前端历史页和工作台增加“作为上下文使用”。

影响文件：

- `SessionController.java`
- `SessionRunExecutor.java`
- `SessionService.java`
- 新增 `ArtifactController.java`
- `frontend/src/pages/HistoryPage.tsx`
- `frontend/src/features/workspace/ResearchComposer.tsx`
- `frontend/src/features/workspace/ArtifactPanel.tsx`

验证：

- 集成测试：传入非本人 artifactId 返回 404/权限错误。
- 单元测试：报告 artifact 注入 prompt，图片 artifact 只注入元数据/URL。
- `cd backend && mvn test`
- `cd frontend && pnpm build`

### Task P1-4：真实 Provider 图片编辑

目标：OpenAI-compatible provider 支持参考图编辑。

改动：

- `OpenAiCompatibleImageGenerationProvider` 支持 `/images/edits` multipart 请求。
- Provider 根据 `referenceImage` 自动选择 generations 或 edits。
- 错误响应返回明确 provider message。
- 前端根据 provider 能力显示编辑可用性。

影响文件：

- `OpenAiCompatibleImageGenerationProvider.java`
- `ImageGenerationProvider.java`
- `ImageGenerationService.java`
- `frontend/src/features/image/ImageGenerationForm.tsx`

验证：

- 单元测试或 mock HTTP 测试：multipart body 包含 image、prompt、model、size。
- 无参考图仍走 generation。
- `cd backend && mvn test`

### Task P1-5：STDIO MCP 标准协议

目标：STDIO MCP 不再使用占位工具，支持初始化、工具发现和调用。

改动：

- 新增 `McpSessionManager` 管理进程、stdin/stdout、超时。
- `StdioMcpTransportClient.discoverTools` 实现 JSON-RPC `initialize`、`tools/list`。
- `invoke` 实现 `tools/call`。
- 对命令白名单、超时、输出大小做限制。

影响文件：

- `StdioMcpTransportClient.java`
- 新增 `McpSessionManager.java`
- `McpRuntimeGateway.java`
- `McpAdminService.java`
- `AppProperties.java`

验证：

- 使用测试用假 MCP 进程，验证 discover 和 call。
- 超时进程会被清理。
- `cd backend && mvn test`

### Task P1-6：MCP 真实健康检查与工具测试

目标：健康检查真实探测服务，不只是校验配置格式。

改动：

- HTTP：调用远端 health 或 tools/list。
- STDIO：启动进程并完成 initialize。
- 返回 `status`、`latencyMs`、`message`、`details`。
- 新增工具测试 API。
- 前端 MCP 页面展示延迟、最近错误和测试按钮。

影响文件：

- `McpAdminController.java`
- `McpAdminService.java`
- `HttpMcpTransportClient.java`
- `StdioMcpTransportClient.java`
- `frontend/src/pages/McpServersPage.tsx`
- `frontend/src/features/system/McpServerRegistry.tsx`

验证：

- Controller 测试：健康检查返回 latency。
- 手动验证：错误 endpoint 返回 FAILED 和错误消息。
- `cd backend && mvn test`
- `cd frontend && pnpm build`

### Task P1-7：模型生命周期管理

目标：管理员可以编辑、启停、删除和测试模型。

改动：

- 后端增加 update/enable/disable/delete/test/default API。
- Repository 支持模型更新、软删除或硬删除策略。
- 前端 ModelRegistry 增加编辑、启停、删除、连接测试。
- 删除策略建议第一版禁止删除正在作为默认启用的模型。

影响文件：

- `AdminSettingsController.java`
- `AdminSettingsService.java`
- `AdminSettingsRepository.java`
- `ModelRuntimeResolver.java`
- `frontend/src/pages/AdminSettingsPage.tsx`
- `frontend/src/features/system/ModelForm.tsx`
- `frontend/src/features/system/ModelRegistry.tsx`

验证：

- Controller 测试：非管理员无法管理；启停后 list 状态变化。
- 连接测试 mock provider 成功/失败均有可读结果。
- `cd backend && mvn test`
- `cd frontend && pnpm build`

### Task P1-8：管理员审计视图

目标：管理员可以查看系统级用户、任务失败、工具调用和登录审计。

改动：

- 新增 `AdminAuditService` 和 `AdminAuditController`。
- API 支持分页、状态筛选、时间筛选。
- 前端新增 `AdminAuditPage` 和导航入口。
- 先复用已有 `login_log`、`execution_run`、`tool_invocation` 数据，不新增复杂审计表。

影响文件：

- 新增 `backend/src/main/java/com/sreehc/aiagent/application/admin/AdminAuditService.java`
- 新增 `backend/src/main/java/com/sreehc/aiagent/trigger/admin/AdminAuditController.java`
- 可能扩展 `AccountRepository`、`SessionRepository`、`McpServerRepository`
- `frontend/src/router/AppRouter.tsx`
- `frontend/src/components/shell/navigation.ts`
- 新增 `frontend/src/pages/AdminAuditPage.tsx`

验证：

- Controller 测试：管理员可访问，普通用户拒绝。
- 手动验证：失败 run 和工具调用记录可筛选。
- `cd backend && mvn test`
- `cd frontend && pnpm build`

### Task P2-1：知识库单文档删除、预览、下载

目标：补齐文档级基础生命周期。

改动：

- 新增文档详情、预览、下载、删除 API。
- 删除文档时删除 object storage 和 chunk。
- 前端 DocumentTable 增加预览、下载、删除动作。

影响文件：

- `KnowledgeBaseController.java`
- `KnowledgeBaseService.java`
- `KnowledgeRepository.java`
- `ObjectStorageService.java`
- `frontend/src/features/knowledge/DocumentTable.tsx`
- `frontend/src/services/knowledgeApi.ts`

验证：

- 集成测试：删除文档后 chunks 被级联删除，检索不再命中。
- 手动验证：下载链接可用，删除后列表刷新。
- `cd backend && mvn test`
- `cd frontend && pnpm build`

### Task P2-2：知识库文档版本管理

目标：重复上传同名/同 checksum 文档时可追踪版本。

改动：

- 扩展 `knowledge_document` 版本字段。
- 上传时计算 checksum。
- API 增加版本列表。
- 前端显示版本号和当前版本。

影响文件：

- migration
- `KnowledgeBaseService.java`
- `KnowledgeRepository.java`
- `KnowledgeDocument.java`
- `frontend/src/features/knowledge/DocumentTable.tsx`

验证：

- 单元测试：同名不同内容生成新版本，同内容可提示重复。
- `cd backend && mvn test`

### Task P2-3：RAG 评估 API

目标：把已有 `RagEvaluationService` 暴露为产品能力。

改动：

- 新增 `RagEvaluationController`。
- 新增 `rag_evaluation_run` 表保存 cases、metrics、状态。
- 支持同步小批量评估，后续可异步化。
- API 限制 case 数量和 topK。

影响文件：

- `RagEvaluationService.java`
- 新增 `RagEvaluationController.java`
- 新增 Repository 或扩展 `KnowledgeRepository`
- migration

验证：

- Controller 测试：提交 eval cases 返回 metrics。
- 权限测试：只能评估本人知识库。
- `cd backend && mvn test`

### Task P2-4：RAG 评估管理页面

目标：管理员可运行评估、查看历史和指标。

改动：

- 新增 `RagEvaluationPage`。
- 新增 `ragEvaluationApi.ts`。
- 展示 recall@5、recall@10、MRR、citation hit rate、no result rate。
- 支持 JSON case 输入和结果表格。

影响文件：

- `frontend/src/router/AppRouter.tsx`
- `frontend/src/components/shell/navigation.ts`
- 新增 `frontend/src/pages/RagEvaluationPage.tsx`
- 新增 `frontend/src/services/ragEvaluationApi.ts`

验证：

- `cd frontend && pnpm build`
- 手动验证：提交评估用例后显示指标和失败提示。

## 9. 推荐提交顺序

### Phase 1：P0 运行闭环

1. `P0-1` 运行生命周期基础模型。
2. `P0-2` 取消接口与 SSE 状态。
3. `P0-3` 心跳更新、超时扫描和僵尸恢复。
4. `P0-4` 自动 Agent 策略选择。
5. `P0-5` 动态 Planner 结构化输出。
6. `P0-6` 重规划与规划轮次。
7. `P0-7` 会话记忆入模。
8. `P0-8` 个人 API 配置进入运行时。
9. `P0-9` 找回密码邮件发送闭环。

Phase 1 完成后，核心 Agent 执行才算从“可演示”进入“可长期运行”。

### Phase 2：P1 产品闭环

1. `P1-1` RAG 异常降级。
2. `P1-2` 统一 Artifact 服务与类型扩展。
3. `P1-3` 历史产物复用为新任务输入。
4. `P1-4` 真实 Provider 图片编辑。
5. `P1-5` STDIO MCP 标准协议。
6. `P1-6` MCP 真实健康检查与工具测试。
7. `P1-7` 模型生命周期管理。
8. `P1-8` 管理员审计视图。

Phase 2 完成后，系统管理、工具生态和产物复用能力基本闭环。

### Phase 3：P2 运营增强

1. `P2-1` 知识库单文档删除、预览、下载。
2. `P2-2` 知识库文档版本管理。
3. `P2-3` RAG 评估 API。
4. `P2-4` RAG 评估管理页面。

Phase 3 完成后，知识库和 RAG 质量管理具备运营入口。

## 10. 全局验证策略

每个后端任务至少执行：

```bash
cd backend
mvn test
```

每个前端任务至少执行：

```bash
cd frontend
pnpm build
```

涉及接口变更时同步更新并检查：

- `docs/api-spec-aiagent-v1.md`
- `docs/database-design-aiagent-v1.md`
- `docs/tech-design-aiagent-v1.md`

涉及用户可见流程时，增加手动 smoke：

- 登录。
- 创建会话。
- 运行研究任务。
- 查看历史回放。
- 打开管理员页面。
- 移动端和桌面端各检查一次。

## 11. 关键取舍

- 动态策略选择第一版用规则，不直接依赖模型分类，便于测试和回归。
- 重规划第一版限制轮次和步骤数，避免无限循环和不可控成本。
- 取消第一版在步骤边界生效，不强杀已发出的外部请求。
- RAG 降级只吞检索链路异常，不吞权限和参数错误。
- STDIO MCP 必须有命令白名单、超时和输出大小限制，否则安全风险高于功能收益。
- 个人 API 配置生效后要明确优先级和密钥隔离，避免用户配置影响其他用户。

## 12. 待确认问题

1. P0 是否按本文 Phase 1 全量推进，还是先只做任务生命周期、记忆入模和个人 API 生效？
2. 自动策略选择是否允许用户界面默认改为“自动”，还是继续默认 ReAct/Plan-Execute 手选？
3. 取消任务是否需要第一版支持强制中断外部模型请求？
4. 历史产物复用第一版是否只支持报告文本，图片和工具输出后续再接？
5. STDIO MCP 是否有明确的允许命令列表和目标 MCP server，用于写集成测试？
6. 邮件发送生产环境使用 SMTP，还是需要对接第三方邮件服务 API？
