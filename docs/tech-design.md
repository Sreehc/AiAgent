# AiAgent V1 技术方案设计

> 文档状态：基于 2026-06-13 仓库代码复核。本文档描述目标架构时，会同时标注当前实现边界；代码事实优先于早期设计假设。

## 0. 当前技术实现摘要

- 后端为 Spring Boot 单体，按 `trigger`、`application`、`domain`、`infrastructure`、`app` 分层。
- 登录态和登录失败计数使用 Redis；知识索引任务通过 Kafka 消费；文件和图片使用 MinIO；数据库迁移使用 Flyway。
- 会话运行通过进程内 `ThreadPoolTaskExecutor` 异步执行并用 SSE 返回事件，不是持久化任务调度器。
- RAG 已实现结构化分块、Kafka 异步索引与重试、向量/全文混合召回、查询改写、重排、上下文预算、缓存和检索审计。
- HTTP 类 MCP 已实现标准 `tools/list` / `tools/call`；STDIO 已实现 MCP Content-Length JSON-RPC 帧协议、`initialize`、`tools/list`、`tools/call` 和长生命周期进程复用。
- 管理员模型配置和个人 API 配置均进入运行时解析；Chat、Embedding、Image 按“个人配置 -> 管理员默认模型 -> 环境 fallback”选择。
- 会话运行支持 heartbeat、暂停、继续、取消、超时回收和僵尸任务恢复；取消、暂停、超时、失败使用独立状态语义。

## 1. 概述

本文档基于 `prd.md`，定义 AiAgent V1 的整体技术实现方案。目标是给研发一个可直接开工的结构化实现基线，覆盖服务边界、核心数据流、认证模型、主要模块、可靠性要求和演进路径。

V1 产品基线：

- 账号密码登录
- 邀请制注册
- 管理员与普通用户两类角色
- 会话、知识库、产物默认归属个人用户
- 核心能力包括多 Agent 执行、RAG、MCP、图片生成、历史回放、账号中心

## 2. 总体架构

### 2.1 技术栈

- 前端：React + TypeScript
- 后端：Java 21 + Spring Boot
- 数据库：PostgreSQL 17.10
- 向量存储：PostgreSQL + pgvector 0.8.2
- 缓存：Redis 8.4.0
- 消息队列：Kafka 3.8.0
- 文件/产物存储：MinIO RELEASE.2025-09-07T16-13-09Z
- LLM 接入：OpenAI 兼容 API

### 2.2 后端分层

- `trigger`：REST、SSE、认证拦截、参数校验、响应序列化
- `application`：会话调度、执行策略选择、用例编排、权限编排
- `domain`：Agent runtime、计划执行、工具调用抽象、账本语义、知识库语义、产物语义
- `infrastructure`：DAO、Redis、Kafka、PostgreSQL/pgvector 访问层、对象存储、MCP 适配器、第三方模型适配器
- `app`：启动、配置绑定、Bean 装配

### 2.3 前端信息架构

- 认证入口：登录页、邀请注册页、找回密码页
- 工作台：聊天工作台、研究结果、知识库工作区、图片生成工作区、历史会话页
- 用户中心：个人资料、修改密码、登录日志
- 配置中心：模型配置、MCP 配置、知识库基础配置。模型配置按 `CHAT`、`EMBEDDING`、`IMAGE` 三类接入运行时 provider；管理接口只展示脱敏密钥，运行时通过密钥解密服务读取真实凭证，本地可使用 `local-mock`，生产不得静默使用 mock provider。

### 2.4 前端分层架构

```text
React Router
  -> ProtectedRoute / Auth routes
  -> AppShell（Sidebar + Topbar + UserMenu + MobileNav + CommandPalette）
  -> Page containers（pages/）
  -> Feature components（features/{workspace, knowledge, image, history, system, account}）
  -> UI primitives（components/ui）
  -> API service modules（services/{auth, sessions, knowledge, images, admin, account, artifacts}Api.ts）
  -> apiRequest / streamRequest（services/api.ts）
```

约束：

- 页面容器只组合 feature 组件并发起数据加载，不写大段业务逻辑。
- API 端点字符串只能出现在 `services/*.ts` 中，页面通过 typed wrapper 调用。
- 共享 UI primitive（Button、Field、Dialog、Tabs、StatusPill、EmptyState 等）不允许夹带业务逻辑。
- 工作台和历史回放使用统一的 `workspaceViewModel`，把 `SessionDetailResponse` 与 SSE `SessionStreamEvent[]` 合并为执行时间线 item（run / plan-step / tool / artifact / stream-event）。
- 视觉系统受设计 token 收敛：颜色、间距、圆角、阴影、z-index 通过 `styles/tokens.css` 统一来源；禁用大面积紫蓝渐变、毛玻璃、装饰性光斑、营销页式 hero。

### 2.4 开发基线与约束

- 必须优先完成“登录 -> 发起研究任务 -> 查看执行过程 -> 获取结构化报告 -> 回看历史”的主闭环。
- 开发按阶段推进，先完成最小可运行链路，再做增强，不提前铺开下一阶段复杂能力。
- 后端优先保证接口边界、权限、数据模型和事件流正确，再处理体验增强。
- 前端优先保证主路径打通、状态完整、异常态明确，再处理视觉细节。
- 除非文档明确要求，V1 不提前引入微服务、复杂 RBAC、组织空间和多租户能力。
- 所有运行配置必须外置，禁止把环境差异和密钥写死在代码中。

## 3. 核心模块设计

### 3.1 认证与权限模块

职责：

- 处理登录、注册、退出登录、找回密码、修改密码、登录日志
- 颁发和校验会话令牌
- 绑定用户角色
- 进行接口鉴权和资源归属校验
- 使用一次性密码重置令牌完成重置密码流程

关键规则：

- 普通用户只能访问自己的会话、知识库、产物和图片历史
- 管理员可访问基础配置能力，并可查看必要审计信息
- 邀请码必须具备有效期、状态和使用人绑定信息

### 3.2 会话与 Agent 执行模块

职责：

- 创建和管理会话
- 接收任务请求并流式返回执行事件
- 按用户请求使用 `ReAct` 或 `Plan-Execute`
- 记录执行过程中的 plan、task、summary、artifact
- 通过独立执行器异步执行 SSE 研究任务，避免请求线程长时间阻塞

执行角色：

- Planner：在复杂任务下生成执行计划
- Executor：执行单步骤工具调用与推理
- Summary：汇总最终结果，生成报告或结论

当前实现边界：

- Planner 会调用 Chat provider 生成结构化计划；模型输出不可用时使用动态 fallback 计划。
- Executor 按 `plan -> execute -> observe -> judge -> replan/done/continue` 推进，支持受配置限制的重规划轮次和步骤上限。
- 会话摘要、最近消息和复用产物可注入后续运行上下文，并提供查看、编辑、清空和重建 API。
- 任务运行支持取消、暂停、继续、heartbeat 和超时回收；暂停/取消在步骤边界或 provider 调用返回后收敛，不能强杀已发出的阻塞外部调用。

### 3.3 RAG 模块

职责：

- 文档上传
- 文档切分与清洗
- 向量化与 pgvector 写入
- 检索与重排
- 会话级知识库绑定

V1 策略：

- PostgreSQL 保存账号、会话、知识库、产物等关系数据
- PostgreSQL + pgvector 保存文档切片、向量索引和检索定位信息
- 查询时先做会话绑定知识库过滤，再做混合检索
- 文档上传后写入索引任务，通过 Kafka 异步处理；可重试的 embedding 异常最多按任务配置重试，最终进入 `DEAD_LETTER`
- 检索结果记录 recall set、final evidence set 和改写后的 retrieval query，供回放与审计

当前实现边界：

- 当前允许上传 `txt`、`md`、`markdown`、`csv`、`json`，PDF、DOCX、OCR 不在当前代码范围。
- 空知识库会回退到普通执行；会话执行路径会把检索、embedding、重排等非权限类异常降级为普通执行，并通过 `rag.degraded` 事件和报告说明原因。
- RAG 评估已提供管理 API、评估用例 CRUD 和前端页面；当前以同步小批量评估为主。

### 3.4 MCP 模块

职责：

- 管理 MCP 工具源
- 工具发现与健康检查
- 运行时调用 MCP 工具
- 将工具返回结果映射为统一的 ToolInvocation 与 Artifact

V1 支持：

- SSE
- STDIO
- Streamable HTTP

实现约束：

- HTTP/SSE MCP 通过 `tools/list` / `tools/call` 标准请求发现和调用工具。
- STDIO MCP 仅允许白名单可执行文件，并且不得通过 shell 拼接执行。
- 健康检查与运行时调用都必须遵循 MCP host allowlist 与私网访问限制。

当前实现边界：

- HTTP/SSE 与 Streamable HTTP 共用 HTTP JSON-RPC 客户端，已实现发现和调用。
- STDIO 调用受可执行文件白名单保护，已实现标准 MCP 初始化、`notifications/initialized`、`tools/list`、`tools/call`、帧大小限制、调用超时和进程清理。
- 健康检查会真实执行工具发现，并返回延迟、工具数、传输类型、错误分类和检查时间。
- MCP 调用失败会记录失败结果并回退内置流程，不直接终止会话。

### 3.5 图片生成模块

职责：

- 文本生图
- 参考图编辑
- 结果存储与会话绑定
- 图片历史查询

当前实现边界：

- 文本生图、参考图上传、对象存储、历史和会话关联已实现。
- `local-mock` 支持编辑演示流程；OpenAI-compatible provider 已实现参考图编辑 multipart 请求契约，并有本地 mock HTTP 测试覆盖。
- 图片任务当前同步调用 provider，任务记录直接落为完成状态；图片任务独立异步进度和取消不在当前闭环范围。

### 3.6 历史回放与账本模块

职责：

- 持久化会话运行轨迹
- 记录 planner round、tool call、summary、artifact
- 提供历史列表和单会话回放详情

## 4. 关键数据流

### 4.1 登录与使用

1. 用户通过邀请码进入注册页
2. 完成账号注册
3. 使用账号密码登录
4. 后端签发会话令牌
5. 前端进入工作台并拉取用户上下文

### 4.2 研究任务执行

1. 用户在工作台输入研究任务
2. 前端创建或复用会话
3. 后端校验用户身份与会话归属
4. 执行器按请求中指定的模式使用 `ReAct` 或 `Plan-Execute`
5. 执行过程中按需调用 RAG、MCP、图片工具或报告工具
6. 事件通过 SSE 回传前端
7. 总结阶段生成报告与产物索引
8. 账本持久化并进入历史回放

当前代码中第 4 步默认使用 `AUTO` 策略选择，复杂任务自动选择 `PLAN_EXECUTE`，用户手动选择时优先用户选择；选择原因通过 `strategy.selected` SSE 事件返回。

### 4.3 知识库增强

1. 用户上传文档
2. 文档进入解析队列或同步处理链路
3. 切分、向量化、写入 PostgreSQL + pgvector
4. 会话执行时按绑定知识库检索
5. 检索证据回写到执行上下文

## 5. 核心接口边界

### 5.1 REST

- 认证接口
- 账号中心接口
- 会话管理接口
- 历史查询接口
- 知识库管理接口
- MCP 管理接口
- 图片生成接口
- 基础配置接口

### 5.2 SSE

用于长任务执行事件流回传，主要事件类型：

- `session.started`
- `plan.generated`
- `task.started`
- `tool.called`
- `tool.completed`
- `artifact.created`
- `summary.completed`
- `session.completed`
- `session.failed`

## 6. 非功能要求

### 6.1 安全

- 密码使用安全哈希存储
- 登录接口具备失败限制与基础风控扩展位
- 邀请码具备过期和单次使用控制
- 所有业务资源按用户归属校验

### 6.2 可用性

- 长任务目标支持运行级暂停、继续、取消、heartbeat 和超时恢复；外部 provider 阻塞调用仍依赖 provider 超时在步骤边界收敛
- SSE 断连后前端支持从历史接口恢复状态
- MCP 工具失败已有内置回退；模型与 RAG 异常的完整降级路径仍待补齐

### 6.3 可观测性

- 每个请求必须有 requestId
- 每次会话执行必须有 sessionId 和 runId
- requestId、sessionId、runId 和持久化账本已存在；结构化应用日志、指标和系统级审计视图仍待补齐

### 6.4 可部署性

- 配置通过环境变量或配置文件外置
- 前后端独立部署
- 当前存储实现为 MinIO，对象访问使用短期预签名 URL；本地文件存储适配器尚未实现

## 7. 可靠性与异常处理

- 登录失败：返回统一错误码，不暴露敏感原因
- SSE 中断：前端提示执行中断，允许用户刷新历史回放
- MCP 工具失败：记录工具错误，不直接导致整个会话丢失
- RAG 无命中：允许任务回退到无知识库上下文继续执行
- RAG 检索异常：当前会使运行失败，待增加异常隔离和降级
- 图片生成失败：保留任务上下文并回传失败原因

## 8. 权衡与取舍

- 采用单体 + DDD 分层，而不是一开始拆微服务：
  - 优点：实现快，结构清晰，部署成本低
  - 代价：后续高并发拆分需要额外演进
- 采用账号密码 + 邀请制，而不是开放注册：
  - 优点：治理可控，适合首版可部署产品
  - 代价：增长速度慢，需要管理员参与发放
- 采用单库单服务视角，而不是多服务数据拆分：
  - 优点：数据一致性和实现复杂度可控
  - 代价：后续扩容时需要拆分迁移

## 9. 演进建议

- V1.1：补全模型切换、报告模板、知识库权限细化
- V1.2：支持组织空间和团队协作
- V1.3：补充复杂 RBAC、审计视图、配置中心

## 10. 推荐开发顺序

### 10.1 基础骨架

- 建立 React + TypeScript 前端工程和 Spring Boot + Java 21 后端工程。
- 建立统一请求封装、统一响应体、统一错误体和健康检查。
- 接入 PostgreSQL 17.10、pgvector 0.8.2、Redis 8.4.0、Kafka 3.8.0、MinIO 和模型配置。
- 建立前端路由骨架、登录态容器和基础 CI 校验。

### 10.2 认证与账号中心

- 完成登录、退出、邀请注册、找回密码、修改密码、个人资料和登录日志。
- 建立 `ADMIN`、`USER` 角色模型与资源归属校验。
- 完成登录页、邀请注册页、找回密码页和账号中心页。

### 10.3 会话与研究执行闭环

- 完成会话创建、会话列表、会话详情、任务执行和 SSE 事件流。
- 打通 `ReAct` 与 `Plan-Execute` 主链路。
- 落地计划步骤、工具调用、总结消息和结构化报告产物。

### 10.4 知识库增强与 MCP 编排

- 完成知识库工作区、文档上传、切分、向量化、索引写入和会话绑定。
- 完成 MCP 服务配置、工具发现、健康检查、调用封装和调用账本。
- 保证 RAG 检索失败可回退，MCP 工具失败不导致整条会话数据丢失。

### 10.5 图片生成、历史回放与配置收口

- 完成图片生成工作区、图片历史和图片产物挂接。
- 完成历史会话列表、回放详情、产物引用恢复和执行账本投影。
- 完成基础配置页、管理员配置能力、回归测试和权限测试。

## 11. 推荐目录结构

### 11.1 前端

```text
frontend/
  src/
    app/
    pages/
    components/
    features/
    services/
    hooks/
    stores/
    router/
    styles/
```

### 11.2 后端

```text
backend/
  src/main/java/.../
    trigger/
    application/
    domain/
    infrastructure/
    app/
  src/main/resources/
```

### 11.3 基础设施

```text
infra/
  sql/
  docker/
  scripts/
  env/
```

## 12. 开发完成口径

### 12.1 单阶段完成标准

每个阶段只有在同时满足以下条件时，才算完成：

- 功能主链路可运行。
- 关键异常路径可验证。
- 与前一阶段没有明显回归。
- 关键接口、页面和数据结构已落地。
- 至少完成该阶段最小测试或自测脚本。

### 12.2 联调整体验收

- 主链路功能联调通过。
- 关键空态、失败态、权限态都可用。
- SSE 中断后可从历史接口恢复结果。
- 文档与实现不存在明显冲突。

### 12.3 当前验证基线

- 后端 `mvn test`：30 个测试通过。
- 前端 `pnpm build`：构建通过。
- 仓库包含端到端冒烟脚本，但需要运行中的后端、数据库、Redis、Kafka、MinIO 和测试账号。
- 当前缺少前端自动化测试、真实模型/MCP 集成测试和完整数据库集成测试。
