# AiAgent V1 数据库设计文档

> 文档状态：基于 2026-06-13 `backend/src/main/resources/db/migration/V1` 至 `V22` 复核。第 4 节保留了早期逻辑设计描述；字段名、类型、约束和索引以 Flyway migration 为唯一事实来源。

## 0. 当前物理模型事实

| 表 | 当前实现重点 | 当前限制 |
| --- | --- | --- |
| `user_account` / `user_role_relation` / `invite_registration` / `login_log` | 用户、角色、邀请注册和登录审计已落库 | 系统级用户审计已提供，完整用户管理仍可后续扩展 |
| `password_reset_token` | 仅保存重置令牌哈希，支持过期和单次使用 | 邮件投递由 SMTP 或开发日志 sender 承担，生产禁止静默 Noop |
| `user_api_config` | 保存个人模型配置，API key 加密、脱敏展示 | 已进入 Chat、Embedding、Image 运行时解析 |
| `agent_session` / `session_message` | 保存会话和用户/助手消息 | 会话摘要、最近消息和复用产物可注入后续运行上下文 |
| `execution_run` | 保存查询、模式、知识库 ID、检索查询、召回集、最终证据集、运行状态、heartbeat、取消/暂停/超时字段 | 暂停/取消在步骤边界或 provider 超时后收敛 |
| `execution_plan_step` / `tool_invocation` | 保存动态计划步骤、观察结果、完成判断与 MCP 调用账本 | 并行子任务仍是后续扩展 |
| `artifact_record` | 登记 `REPORT`、`IMAGE`、`IMAGE_REFERENCE`、`ATTACHMENT`、`TOOL_OUTPUT`、`CONTEXT_SNIPPET` | 大文件预览能力可继续增强 |
| `knowledge_base` / `knowledge_document` / `knowledge_chunk` | 支持文档正文、结构化元数据、全文向量、pgvector embedding、HNSW 索引、单文档删除、下载、预览、版本恢复和重索引 | PDF、DOCX、OCR 不在当前代码范围 |
| `index_job` | 支持 Kafka 异步索引、重试、错误信息和 `DEAD_LETTER` | 没有管理 API 和运维页面 |
| `session_kb_binding` | 保存会话与用户知识库绑定 | 绑定通过应用层校验归属 |
| `mcp_server_config` / `tool_invocation` | 保存 MCP 配置和调用结果 | HTTP/STDIO 均支持真实发现、调用和健康检查 |
| `image_generation_job` | 保存文本生图/参考图编辑任务及结果产物 | 当前 provider 调用为同步执行 |
| `model_config` | 保存管理员模型配置和加密密钥 | 已支持新增、编辑、启停、删除、默认和连接测试 |

当前迁移关系补充：

```text
user_account
  ├─1 user_api_config
  ├─< password_reset_token
  ├─< agent_session
  │    ├─< session_message
  │    ├─< execution_run
  │    │    ├─< execution_plan_step
  │    │    └─< tool_invocation
  │    └─< artifact_record
  ├─< knowledge_base
  │    └─< knowledge_document
  │         ├─< knowledge_chunk
  │         └─< index_job
  └─< image_generation_job
```

## 1. 设计原则

- V1 按单库单服务视角设计 PostgreSQL 17.10 数据库
- 会话、知识库、产物默认归属个人用户
- 关系数据与向量检索数据统一落在 PostgreSQL 17.10 中，向量能力通过 `pgvector 0.8.2` 扩展提供
- 优先覆盖核心业务表、关键字段、索引、关系与生命周期

## 2. 存储边界

### 2.1 PostgreSQL 17.10

负责：

- 账号与权限主数据
- 会话与执行账本
- 知识库主数据与文档元数据
- 文档切片与向量索引
- MCP 配置
- 图片生成历史
- 产物索引

### 2.2 pgvector 0.8.2

负责：

- 文档切片向量
- 向量相似度检索
- 向量维度和召回元信息

## 3. 核心实体关系

```text
user_account
  ├─< invite_registration
  ├─< login_log
  ├─< agent_session
  │    ├─< session_message
  │    ├─< execution_run
  │    │    ├─< execution_plan_step
  │    │    ├─< tool_invocation
  │    │    └─< artifact_record
  │    └─< session_kb_binding
  ├─< knowledge_base
  │    ├─< knowledge_document
  │    └─< knowledge_chunk
  └─< image_generation_job

mcp_server_config
```

## 4. 早期逻辑表设计（非物理真源）

本节保留初始设计意图，部分字段名与后续迁移不同。开发、排障和数据迁移必须以 `backend/src/main/resources/db/migration` 为准，并优先参考第 0 节当前物理模型事实。

### 4.1 `user_account`

用途：保存系统用户主信息。

关键字段：

- `id` bigint PK
- `username` varchar(64) unique
- `email` varchar(128) nullable
- `phone` varchar(32) nullable
- `password_hash` varchar(255)
- `display_name` varchar(64)
- `status` varchar(16)
- `created_at` datetime
- `updated_at` datetime

索引：

- `uk_user_account_username`
- `idx_user_account_status`

生命周期：

- 创建于邀请注册完成时
- 禁用时保留历史，不物理删除

### 4.2 `user_role_relation`

用途：保存用户与角色映射。

关键字段：

- `id` bigint PK
- `user_id` bigint
- `role_code` varchar(32) 取值：`ADMIN`、`USER`
- `created_at` datetime

索引：

- `uk_user_role_relation_user_role`
- `idx_user_role_relation_role_code`

### 4.3 `invite_registration`

用途：保存邀请码及其使用状态。

关键字段：

- `id` bigint PK
- `invite_token` varchar(128) unique
- `status` varchar(16) 取值：`NEW`、`USED`、`EXPIRED`
- `created_by` bigint
- `bound_user_id` bigint nullable
- `expires_at` datetime
- `used_at` datetime nullable
- `created_at` datetime

索引：

- `uk_invite_registration_token`
- `idx_invite_registration_status_expire`

### 4.4 `login_log`

用途：记录账号登录行为。

关键字段：

- `id` bigint PK
- `user_id` bigint
- `login_ip` varchar(64)
- `user_agent` varchar(255)
- `login_result` varchar(16)
- `login_at` datetime

索引：

- `idx_login_log_user_time`

### 4.5 `agent_session`

用途：保存会话主记录。

关键字段：

- `id` bigint PK
- `session_id` varchar(64) unique
- `user_id` bigint
- `title` varchar(255)
- `agent_mode` varchar(32)
- `status` varchar(16)
- `created_at` datetime
- `updated_at` datetime

索引：

- `uk_agent_session_session_id`
- `idx_agent_session_user_time`

### 4.6 `session_message`

用途：保存用户消息、系统消息、总结消息等。

关键字段：

- `id` bigint PK
- `session_id` varchar(64)
- `message_id` varchar(64) unique
- `role` varchar(16)
- `message_type` varchar(32)
- `content` longtext
- `created_at` datetime

索引：

- `uk_session_message_message_id`
- `idx_session_message_session_time`

### 4.7 `execution_run`

用途：保存一次任务执行主记录。

关键字段：

- `id` bigint PK
- `run_id` varchar(64) unique
- `session_id` varchar(64)
- `request_id` varchar(64)
- `execution_mode` varchar(32)
- `status` varchar(16)
- `started_at` datetime
- `ended_at` datetime nullable

索引：

- `uk_execution_run_run_id`
- `idx_execution_run_session_time`

### 4.8 `execution_plan_step`

用途：保存计划执行步骤。

关键字段：

- `id` bigint PK
- `run_id` varchar(64)
- `planner_round` int
- `step_no` int
- `title` varchar(255)
- `description` text
- `status` varchar(16)
- `created_at` datetime

索引：

- `idx_execution_plan_step_run_round`

### 4.9 `tool_invocation`

用途：保存工具调用记录。

关键字段：

- `id` bigint PK
- `run_id` varchar(64)
- `tool_call_id` varchar(64) unique
- `tool_name` varchar(128)
- `tool_type` varchar(32)
- `request_payload` json
- `response_payload` json
- `status` varchar(16)
- `started_at` datetime
- `ended_at` datetime nullable

索引：

- `uk_tool_invocation_tool_call_id`
- `idx_tool_invocation_run_time`

### 4.10 `artifact_record`

用途：保存产物索引。当前代码支持报告、图片、参考图、附件、工具输出和上下文片段，并支持下载、预览和复用权限校验。

关键字段：

- `id` bigint PK
- `artifact_id` varchar(64) unique
- `session_id` varchar(64)
- `run_id` varchar(64)
- `user_id` bigint
- `artifact_type` varchar(32)
- `name` varchar(255)
- `storage_uri` varchar(512)
- `mime_type` varchar(128)
- `created_at` datetime

索引：

- `uk_artifact_record_artifact_id`
- `idx_artifact_record_user_time`
- `idx_artifact_record_session_type`

### 4.11 `knowledge_base`

用途：保存知识库主信息。

关键字段：

- `id` bigint PK
- `kb_id` varchar(64) unique
- `user_id` bigint
- `name` varchar(128)
- `description` varchar(255)
- `status` varchar(16)
- `created_at` datetime
- `updated_at` datetime

索引：

- `uk_knowledge_base_kb_id`
- `idx_knowledge_base_user_time`

### 4.12 `knowledge_document`

用途：保存知识库文档元信息。

关键字段：

- `id` bigint PK
- `kb_id` varchar(64)
- `document_id` varchar(64) unique
- `file_name` varchar(255)
- `file_type` varchar(32)
- `storage_uri` varchar(512)
- `parse_status` varchar(16)
- `created_at` datetime

索引：

- `uk_knowledge_document_document_id`
- `idx_knowledge_document_kb_time`

### 4.13 `knowledge_chunk`

用途：保存文档切片元数据和向量检索字段。

关键字段：

- `id` bigint PK
- `document_id` varchar(64)
- `chunk_id` varchar(64) unique
- `chunk_no` int
- `content_preview` varchar(500)
- `embedding` vector(1536)
- `created_at` datetime

索引：

- `uk_knowledge_chunk_chunk_id`
- `idx_knowledge_chunk_document_no`

### 4.14 `session_kb_binding`

用途：保存会话与知识库绑定关系。

关键字段：

- `id` bigint PK
- `session_id` varchar(64)
- `kb_id` varchar(64)
- `created_at` datetime

索引：

- `uk_session_kb_binding_session_kb`

### 4.15 `mcp_server_config`

用途：保存 MCP 服务配置。

关键字段：

- `id` bigint PK
- `server_code` varchar(64) unique
- `name` varchar(128)
- `transport_type` varchar(32)
- `endpoint` varchar(512)
- `command_line` varchar(512) nullable
- `status` varchar(16)
- `created_by` bigint
- `created_at` datetime
- `updated_at` datetime

索引：

- `uk_mcp_server_config_server_code`
- `idx_mcp_server_config_status`

### 4.16 `image_generation_job`

用途：保存图片生成任务和结果索引。

关键字段：

- `id` bigint PK
- `job_id` varchar(64) unique
- `user_id` bigint
- `session_id` varchar(64) nullable
- `mode` varchar(16) 取值：`images`、`edits`
- `prompt_text` text
- `source_artifact_id` varchar(64) nullable
- `result_artifact_id` varchar(64) nullable
- `status` varchar(16)
- `created_at` datetime

索引：

- `uk_image_generation_job_job_id`
- `idx_image_generation_job_user_time`

### 4.17 `model_config`

用途：保存管理员维护的模型运行配置。

关键字段：

- `id` bigint PK
- `model_code` varchar(64) unique
- `name` varchar(128)
- `provider` varchar(64)，例如 `local-mock`、`openai-compatible`
- `model_type` varchar(32)，取值：`CHAT`、`EMBEDDING`、`IMAGE`
- `base_url` varchar(512)
- `api_key_ciphertext` text nullable，保存应用层加密后的密钥
- `api_key_hint` varchar(32) nullable，仅用于管理端脱敏展示
- `api_key_key_version` varchar(32)，用于密钥轮换
- `enabled` boolean
- `created_by` bigint
- `created_at` datetime
- `updated_at` datetime

约束：管理接口不得返回明文 API key；运行时只能通过密钥解密服务读取真实凭证；生产环境不得静默使用 `local-mock` provider。

### 4.18 `password_reset_token`

用途：保存找回密码和重置密码所需的一次性令牌。

关键字段：

- `id` bigint PK
- `token_hash` varchar(128) unique
- `user_id` bigint
- `request_ip` varchar(64) nullable
- `expires_at` datetime
- `used_at` datetime nullable
- `created_at` datetime

约束：仅保存哈希，不保存明文令牌；使用后必须写入 `used_at`；过期或已使用令牌不得再次重置密码。

### 4.19 `index_job`

用途：保存知识库异步索引任务，包含任务状态、触发类型、重试次数、错误信息和起止时间。当前代码使用状态 CAS 防止重复处理，可重试的 embedding 异常会重新入队，最终进入 `DEAD_LETTER`。

### 4.20 `user_api_config`

用途：保存用户个人 OpenAI-compatible 配置，包括 `base_url`、加密 API key、脱敏提示、模型代码、temperature 和 max tokens。

当前事实：该表已用于账号中心保存、展示和连接测试；Chat、Embedding、Image 运行时均会优先读取当前用户启用的个人配置。

## 5. 关键约束

- `knowledge_chunk` 增加 `source_offset` 字段用于证据定位，并在向量列上建立 pgvector HNSW ANN 索引以支撑生产检索性能。
- `index_job` 支持 `DEAD_LETTER` 状态，索引任务领取采用状态 CAS，避免并发重复处理。
- `agent_session.user_id` 必须存在，禁止匿名空归属
- `knowledge_base.user_id` 必须存在
- `artifact_record.user_id` 必须存在
- `session_kb_binding` 只能绑定当前用户拥有的知识库
- `mcp_server_config` 默认由管理员创建和维护

## 6. 生命周期说明

- 用户：软禁用，不物理删除
- 会话：默认长期保留
- 运行记录和工具调用：用于审计和回放，默认长期保留
- 知识库：当前支持整体删除、单文档删除、预览、下载、版本列表、恢复版本和重新索引
- 会话：当前支持整体删除，并同步删除关联对象存储产物和数据库级联记录
- 产物：当前没有独立删除或作为新任务输入的复用接口

## 7. 非目标

- 不定义分库分表策略
- 不定义团队空间表
- 不定义多租户隔离字段
- 不定义复杂审批和计费表
