# AiAgent V1 API 接口文档

> 文档状态：基于 2026-06-13 `trigger/*Controller.java` 复核。本文档只描述当前实际公开接口，不再保留未落地或已删除的规划接口。

## 1. 总体约定

- 风格：REST + OpenAPI 风格
- 鉴权：登录后使用；登录、邀请注册、找回密码、重置密码和健康检查为公开接口，其余接口默认需要登录态
- 内容类型：`application/json`
- 流式接口：`text/event-stream`
- 基础前缀：`/api/v1`

统一响应体：

```json
{
  "code": "SUCCESS",
  "message": "ok",
  "data": {}
}
```

统一错误体：

```json
{
  "code": "AUTH_INVALID",
  "message": "Login required",
  "requestId": "req_xxx"
}
```

### 1.1 健康检查

- Method：`GET`
- Path：`/api/v1/health`
- Auth：否
- Notes：当前仅返回应用存活状态，不验证模型服务、MCP 服务、Kafka、Redis 或 PostgreSQL 等依赖的实际连通性。

## 2. 认证与账号中心

### 2.1 登录

- Method：`POST`
- Path：`/api/v1/auth/login`
- Auth：否
- Purpose：账号密码登录

Request:

```json
{
  "username": "alice",
  "password": "Secret123!"
}
```

Response:

```json
{
  "code": "SUCCESS",
  "message": "ok",
  "data": {
    "accessToken": "token_xxx",
    "expiresIn": 7200,
    "user": {
      "userId": "u_1001",
      "username": "alice",
      "displayName": "Alice",
      "roles": ["USER"]
    }
  }
}
```

### 2.2 退出登录

- Method：`POST`
- Path：`/api/v1/auth/logout`
- Auth：是
- Purpose：销毁当前登录态

### 2.3 邀请注册

- Method：`POST`
- Path：`/api/v1/auth/register-by-invite`
- Auth：否
- Purpose：使用邀请码注册账号

Request:

```json
{
  "inviteToken": "INVITE-ABC",
  "username": "alice",
  "password": "Secret123!",
  "confirmPassword": "Secret123!",
  "displayName": "Alice"
}
```

### 2.4 找回密码

- Method：`POST`
- Path：`/api/v1/auth/forgot-password`
- Auth：否
- Purpose：发起找回密码流程；即使账号不存在也返回统一成功结果，避免枚举账号。

Request:

```json
{
  "usernameOrEmail": "alice@example.com"
}
```

### 2.5 重置密码

- Method：`POST`
- Path：`/api/v1/auth/reset-password`
- Auth：否
- Purpose：使用重置令牌更新密码

Request:

```json
{
  "resetToken": "reset_xxx",
  "newPassword": "Secret123!",
  "confirmPassword": "Secret123!"
}
```

### 2.6 修改密码

- Method：`POST`
- Path：`/api/v1/account/change-password`
- Auth：是

### 2.7 获取个人资料

- Method：`GET`
- Path：`/api/v1/account/profile`
- Auth：是

### 2.8 更新个人资料

- Method：`PUT`
- Path：`/api/v1/account/profile`
- Auth：是

### 2.9 登录日志

- Method：`GET`
- Path：`/api/v1/account/login-logs`
- Auth：是
- Query：`pageNo`、`pageSize`

### 2.10 获取个人 API 配置

- Method：`GET`
- Path：`/api/v1/account/api-config`
- Auth：是
- Notes：只返回脱敏 API key 提示，不返回明文。启用后的个人配置会优先进入 Chat、Embedding、Image 运行时。

### 2.11 更新个人 API 配置

- Method：`PUT`
- Path：`/api/v1/account/api-config`
- Auth：是
- Notes：API key 留空时保留原密钥。

### 2.12 测试个人 API 配置

- Method：`POST`
- Path：`/api/v1/account/api-config/test`
- Auth：是
- Notes：用于测试 `CHAT`、`EMBEDDING`、`IMAGE` 类型个人配置；响应不返回明文 API key。

## 3. 会话与执行

### 3.1 创建会话

- Method：`POST`
- Path：`/api/v1/sessions`
- Auth：是

Request:

```json
{
  "title": "新能源市场研究",
  "agentMode": "REACT"
}
```

Response fields:

- `sessionId`
- `title`
- `agentMode`
- `createdAt`

### 3.2 会话列表

- Method：`GET`
- Path：`/api/v1/sessions`
- Auth：是
- Query：`pageNo`、`pageSize`

### 3.3 会话详情

- Method：`GET`
- Path：`/api/v1/sessions/{sessionId}`
- Auth：是

### 3.4 删除会话

- Method：`DELETE`
- Path：`/api/v1/sessions/{sessionId}`
- Auth：是
- Notes：运行中的会话不可删除；删除会同步清理会话关联的对象存储产物。

### 3.5 SSE 执行流与运行创建

- Method：`POST`
- Path：`/api/v1/sessions/{sessionId}/stream`
- Auth：是
- Content-Type：`application/json`
- Response：`text/event-stream`
- Purpose：创建或复用待执行 Run，并异步执行研究任务。当前不存在独立的 `POST /sessions/{sessionId}/runs` 接口。

Request:

```json
{
  "query": "分析 2026 年储能行业竞争格局，并输出结构化报告",
  "executionMode": "REACT",
  "strategyMode": "AUTO",
  "knowledgeBaseIds": ["kb_001"],
  "artifactIds": ["art_001"]
}
```

SSE 事件定义：

- `session.started`
- `strategy.selected`
- `plan.generated`
- `task.started`
- `tool.called`
- `tool.completed`
- `task.observed`
- `plan.judged`
- `plan.replanned`
- `rag.degraded`
- `artifact.created`
- `session.paused`
- `session.resumed`
- `session.cancelled`
- `session.timed_out`
- `summary.completed`
- `session.completed`
- `session.failed`
- `request.failed`

`plan.generated` 示例：

```json
{
  "event": "plan.generated",
  "data": {
    "sessionId": "s_001",
    "runId": "run_001",
    "plannerRound": 1,
    "plan": [
      {
        "stepNo": 1,
        "title": "收集行业背景"
      },
      {
        "stepNo": 2,
        "title": "分析主要玩家"
      }
    ]
  }
}
```

### 3.6 历史回放详情

- Method：`GET`
- Path：`/api/v1/sessions/{sessionId}/replay`
- Auth：是

Response highlights:

- `session`
- `runs`
- `planSteps`
- `toolInvocations`
- `artifacts`
- `summary`

### 3.7 取消运行

- Method：`POST`
- Path：`/api/v1/sessions/{sessionId}/runs/{runId}/cancel`
- Auth：是
- Notes：请求取消运行；执行器会在步骤边界或 provider 调用返回后收敛为 `CANCELLED`。

### 3.8 暂停运行

- Method：`POST`
- Path：`/api/v1/sessions/{sessionId}/runs/{runId}/pause`
- Auth：是
- Notes：仅运行中任务可暂停；暂停后不再启动新步骤。

### 3.9 继续运行

- Method：`POST`
- Path：`/api/v1/sessions/{sessionId}/runs/{runId}/resume`
- Auth：是
- Notes：仅 `PAUSED` 运行可继续；恢复后从未完成步骤继续。

### 3.10 查看会话记忆

- Method：`GET`
- Path：`/api/v1/sessions/{sessionId}/memory`
- Auth：是

### 3.11 更新或清空会话记忆

- Method：`PUT`
- Path：`/api/v1/sessions/{sessionId}/memory`
- Auth：是
- Notes：传空内容表示清空摘要记忆。

### 3.12 从历史重建会话记忆

- Method：`POST`
- Path：`/api/v1/sessions/{sessionId}/memory/rebuild`
- Auth：是

## 4. 知识库接口

### 4.1 创建知识库

- Method：`POST`
- Path：`/api/v1/knowledge-bases`
- Auth：是

### 4.2 知识库列表

- Method：`GET`
- Path：`/api/v1/knowledge-bases`
- Auth：是

### 4.3 更新知识库

- Method：`PUT`
- Path：`/api/v1/knowledge-bases/{kbId}`
- Auth：是

### 4.4 删除知识库

- Method：`DELETE`
- Path：`/api/v1/knowledge-bases/{kbId}`
- Auth：是
- Notes：删除知识库时会清理关联对象存储文件和数据库级联数据。

### 4.5 上传文档

- Method：`POST`
- Path：`/api/v1/knowledge-bases/{kbId}/documents`
- Auth：是
- Notes：支持 multipart 上传；服务端限制文件大小、文件名和类型，当前允许 `txt`、`md`、`markdown`、`csv`、`json`。PDF/DOCX 需要在 P3 文档解析器接入后再开放。

### 4.6 文档列表

- Method：`GET`
- Path：`/api/v1/knowledge-bases/{kbId}/documents`
- Auth：是

### 4.7 文档详情/预览

- Method：`GET`
- Path：`/api/v1/knowledge-bases/{kbId}/documents/{documentId}`
- Auth：是

### 4.8 文档下载

- Method：`GET`
- Path：`/api/v1/knowledge-bases/{kbId}/documents/{documentId}/download`
- Auth：是

### 4.9 删除单文档

- Method：`DELETE`
- Path：`/api/v1/knowledge-bases/{kbId}/documents/{documentId}`
- Auth：是

### 4.10 文档版本列表

- Method：`GET`
- Path：`/api/v1/knowledge-bases/{kbId}/documents/{documentId}/versions`
- Auth：是

### 4.11 恢复文档版本

- Method：`POST`
- Path：`/api/v1/knowledge-bases/{kbId}/documents/{documentId}/versions/{versionId}/restore`
- Auth：是
- Notes：基于指定历史版本创建新的 current 文档并触发 RESTORE 索引任务。

### 4.12 触发切分入库

- Method：`POST`
- Path：`/api/v1/knowledge-bases/{kbId}/documents/{documentId}/index`
- Auth：是
- Notes：接口仅入队异步索引任务，实际切分、向量化和写入由 Kafka consumer 完成。

### 4.13 重新索引

- Method：`POST`
- Path：`/api/v1/knowledge-bases/{kbId}/documents/{documentId}/reindex`
- Auth：是

### 4.14 检索测试

- Method：`POST`
- Path：`/api/v1/knowledge-bases/{kbId}/search-test`
- Auth：是

Request:

```json
{
  "query": "储能成本下降趋势",
  "topK": 5
}
```

### 4.15 绑定会话知识库

- Method：`POST`
- Path：`/api/v1/sessions/{sessionId}/knowledge-bases/bind`
- Auth：是

## 5. MCP 接口

### 5.1 MCP 配置列表

- Method：`GET`
- Path：`/api/v1/admin/mcp-servers`
- Auth：管理员

### 5.2 新增 MCP 配置

- Method：`POST`
- Path：`/api/v1/admin/mcp-servers`
- Auth：管理员

Request:

```json
{
  "name": "web-search",
  "serverCode": "web_search",
  "transportType": "SSE",
  "endpoint": "https://example.com/mcp"
}
```

### 5.3 更新 MCP 配置

- Method：`PUT`
- Path：`/api/v1/admin/mcp-servers/{serverCode}`
- Auth：管理员

### 5.4 删除 MCP 配置

- Method：`DELETE`
- Path：`/api/v1/admin/mcp-servers/{serverCode}`
- Auth：管理员

### 5.5 工具发现

- Method：`POST`
- Path：`/api/v1/admin/mcp-servers/{serverCode}/discover`
- Auth：管理员

### 5.6 健康检查

- Method：`GET`
- Path：`/api/v1/admin/mcp-servers/{serverCode}/health`
- Auth：管理员
- Notes：会真实执行工具发现并返回延迟、工具数、传输类型、错误分类和检查时间。

### 5.7 工具测试

- Method：`POST`
- Path：`/api/v1/admin/mcp-servers/{serverCode}/tools/{toolName}/test`
- Auth：管理员
- Notes：用于以 JSON 参数测试单个 MCP 工具调用。

## 6. 图片生成接口

### 6.1 文本生图

- Method：`POST`
- Path：`/api/v1/images/generations`
- Auth：是

Request:

```json
{
  "prompt": "生成一张现代科技感的产业报告封面图",
  "size": "1024x1024"
}
```

### 6.2 参考图编辑

- Method：`POST`
- Path：`/api/v1/images/edits`
- Auth：是
- Notes：参考图必须通过服务端校验，当前允许 PNG、JPEG、WebP，且大小不超过服务端限制。`openai-compatible` provider 使用 `/images/edits` multipart 契约；真实可用性取决于外部 provider 兼容性。

### 6.3 图片历史

- Method：`GET`
- Path：`/api/v1/images/history`
- Auth：是
- Query：`pageNo`、`pageSize`

## 7. 基础配置接口

### 7.1 模型配置列表

- Method：`GET`
- Path：`/api/v1/admin/models`
- Auth：管理员
- Notes：返回的 `apiKeyMasked` 仅为脱敏提示，不返回明文密钥。

### 7.2 新增模型配置

- Method：`POST`
- Path：`/api/v1/admin/models`
- Auth：管理员
- Notes：`modelType` 支持 `CHAT`、`EMBEDDING`、`IMAGE`；`apiKey` 只在创建时提交，服务端以密文保存；当前没有独立轮换接口。

Request:

```json
{
  "modelCode": "gpt-4o-mini",
  "name": "OpenAI GPT-4o Mini",
  "provider": "openai-compatible",
  "modelType": "CHAT",
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk_xxx",
  "enabled": true
}
```

### 7.3 更新模型配置

- Method：`PUT`
- Path：`/api/v1/admin/models/{modelCode}`
- Auth：管理员
- Notes：API key 留空时保留原密钥。

### 7.4 启用模型

- Method：`POST`
- Path：`/api/v1/admin/models/{modelCode}/enable`
- Auth：管理员

### 7.5 停用模型

- Method：`POST`
- Path：`/api/v1/admin/models/{modelCode}/disable`
- Auth：管理员

### 7.6 删除模型

- Method：`DELETE`
- Path：`/api/v1/admin/models/{modelCode}`
- Auth：管理员

### 7.7 设为默认模型

- Method：`POST`
- Path：`/api/v1/admin/models/{modelCode}/default`
- Auth：管理员

### 7.8 测试模型连接

- Method：`POST`
- Path：`/api/v1/admin/models/{modelCode}/test`
- Auth：管理员

创建、更新、启停、默认和删除会影响运行时默认模型选择。

### 7.9 账号邀请创建

- Method：`POST`
- Path：`/api/v1/admin/invites`
- Auth：管理员

### 7.10 账号邀请列表

- Method：`GET`
- Path：`/api/v1/admin/invites`
- Auth：管理员
- Query：`limit`，范围 `1..50`

## 8. 产物接口

### 8.1 产物列表

- Method：`GET`
- Path：`/api/v1/artifacts`
- Auth：是
- Query：`artifactType`、`reusable`、`pageNo`、`pageSize`

### 8.2 产物详情

- Method：`GET`
- Path：`/api/v1/artifacts/{artifactId}`
- Auth：是

### 8.3 上传附件产物

- Method：`POST`
- Path：`/api/v1/artifacts?sessionId={sessionId}`
- Auth：是
- Content-Type：`multipart/form-data`

### 8.4 复用产物

- Method：`POST`
- Path：`/api/v1/artifacts/{artifactId}/reuse`
- Auth：是
- Notes：后端会校验归属和 `reusable`。

### 8.5 下载产物

- Method：`GET`
- Path：`/api/v1/artifacts/{artifactId}/download`
- Auth：是

## 9. 管理审计与 RAG 评估

### 9.1 用户审计

- Method：`GET`
- Path：`/api/v1/admin/audit/users`
- Auth：管理员

### 9.2 运行审计

- Method：`GET`
- Path：`/api/v1/admin/audit/runs`
- Auth：管理员

### 9.3 工具调用审计

- Method：`GET`
- Path：`/api/v1/admin/audit/tool-invocations`
- Auth：管理员

### 9.4 登录日志审计

- Method：`GET`
- Path：`/api/v1/admin/audit/login-logs`
- Auth：管理员

### 9.5 RAG 评估运行

- Method：`POST`
- Path：`/api/v1/admin/rag-evaluations`
- Auth：管理员
- Notes：`knowledgeBaseIds` 可选；为空时评估当前用户可访问的全部知识库。

Request:

```json
{
  "topK": 10,
  "knowledgeBaseIds": ["kb_001"],
  "cases": [
    {
      "query": "储能成本趋势",
      "expectedCitationIds": ["kb_001:doc_001:1"],
      "expectedTextContains": ["成本下降"]
    }
  ]
}
```

### 9.6 RAG 评估历史

- Method：`GET`
- Path：`/api/v1/admin/rag-evaluations`
- Auth：管理员

### 9.7 RAG 评估详情

- Method：`GET`
- Path：`/api/v1/admin/rag-evaluations/{evalId}`
- Auth：管理员

### 9.8 RAG 评估用例 CRUD

- `GET /api/v1/admin/rag-evaluation-cases`
- `POST /api/v1/admin/rag-evaluation-cases`
- `PUT /api/v1/admin/rag-evaluation-cases/{caseId}`
- `DELETE /api/v1/admin/rag-evaluation-cases/{caseId}`
- Auth：管理员

## 10. 关键公共类型

### 10.1 `AgentRequest`

```json
{
  "query": "string",
  "executionMode": "REACT | PLAN_EXECUTE",
  "strategyMode": "AUTO | MANUAL",
  "knowledgeBaseIds": ["string"],
  "artifactIds": ["string"]
}
```

### 10.2 `AgentSession`

```json
{
  "sessionId": "string",
  "title": "string",
  "agentMode": "string",
  "status": "string"
}
```

### 10.3 `ExecutionPlan`

```json
{
  "plannerRound": 1,
  "steps": [
    {
      "stepNo": 1,
      "title": "string",
      "status": "PENDING | RUNNING | COMPLETED | FAILED | SKIPPED | CANCELLED",
      "observation": "string | null",
      "completionJudgement": "string | null"
    }
  ]
}
```

### 10.4 `ToolInvocation`

```json
{
  "toolCallId": "string",
  "toolName": "string",
  "toolType": "string",
  "status": "RUNNING | SUCCESS | FAILED"
}
```

### 10.5 `ArtifactRef`

```json
{
  "artifactId": "string",
  "artifactType": "REPORT | IMAGE | IMAGE_REFERENCE | ATTACHMENT | TOOL_OUTPUT | CONTEXT_SNIPPET",
  "title": "string",
  "storageUri": "string | null",
  "resultUrl": "string | null"
}
```

## 11. 错误码

### 11.1 通用与认证

- `SUCCESS`：请求成功。
- `PARAM_INVALID`：请求参数、请求体或统一响应契约不合法。
- `RESPONSE_INVALID`：前端检测到后端响应体不符合统一响应契约。
- `NETWORK_ERROR`：前端网络层或流式连接错误。
- `AUTH_INVALID`：未登录、令牌无效或用户名密码错误。
- `AUTH_FORBIDDEN`：已登录但无权限访问目标资源或管理能力；早期实现中的 `FORBIDDEN` 已统一映射为该错误码。
- `AUTH_RATE_LIMITED`：登录失败次数过多，被临时限流。
- `LOGIN_FAILED`：登录失败的兼容错误码；当前实现对外统一返回 `AUTH_INVALID`，避免泄露敏感原因。
- `PASSWORD_INVALID`：原密码或密码确认不正确。

### 11.2 邀请、会话、知识库

- `INVITE_INVALID`：邀请码不存在、已使用或不可用。
- `INVITE_EXPIRED`：邀请码已过期；当前实现可合并返回 `INVITE_INVALID`。
- `USERNAME_EXISTS`：用户名已存在。
- `SESSION_NOT_FOUND`：会话不存在或当前用户无权访问。
- `RUN_NOT_CANCELABLE`：运行不是可取消状态。
- `RUN_NOT_PAUSABLE`：运行不是可暂停状态。
- `RUN_NOT_RESUMABLE`：运行不是可继续状态。
- `KB_NOT_FOUND`：知识库不存在或当前用户无权访问。
- `DOCUMENT_NOT_FOUND`：知识库文档不存在或当前用户无权访问。
- `DOCUMENT_UPLOAD_FAILED`：文档上传、存储或解析失败。
- `FILE_INVALID`：上传文件为空、损坏或无法读取。
- `FILE_TOO_LARGE`：上传文件超过服务端限制。
- `FILE_TYPE_UNSUPPORTED`：上传文件类型不在允许列表。
- `EMBEDDING_PROVIDER_FAILED`：Embedding provider 调用失败。

### 11.3 MCP、图片与系统

- `MCP_SERVER_UNAVAILABLE`：MCP 服务不可用。
- `MCP_SERVER_NOT_FOUND`：MCP 服务不存在或不可访问。
- `IMAGE_GENERATION_FAILED`：图片生成失败。
- `REFERENCE_IMAGE_REQUIRED`：图片编辑缺少参考图。
- `IMAGE_UPLOAD_FAILED`：参考图或生成结果上传失败。
- `PROMPT_REQUIRED`：图片或研究任务 prompt 为空。
- `INTERNAL_ERROR`：服务端内部错误。
