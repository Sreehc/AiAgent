# AiAgent V1 全量闭环发布验收清单

> 文档状态：基于 2026-06-13 当前代码和未闭环能力 V3 执行计划生成。
> 用途：每次声称 P0/P1/P2 未闭环能力“全部完成”前，必须按本清单记录证据。

## 1. 自动化质量门禁

必须全部通过：

```bash
git diff --check

cd backend
mvn test

cd ../frontend
pnpm build
```

当前测试覆盖重点：

- 动态策略选择：`AgentStrategySelectorTest`
- 动态规划与重规划上限：`DynamicPlannerServiceTest`
- STDIO MCP 标准协议和进程复用：`StdioMcpTransportClientTest`
- OpenAI-compatible 图片生成/编辑契约：`OpenAiCompatibleImageGenerationProviderTest`
- SMTP 找回密码发送链路：`SmtpEmailSenderTest`
- 个人 API 配置与 Embedding provider：`UserApiConfigServiceTest`、`EmbeddingProviderRouterTest`
- RAG 评估基础指标：`RagEvaluationRegressionTest`

## 2. 普通用户验收

### 2.1 会话运行与动态 Agent

步骤：

1. 登录普通用户。
2. 进入 `/workspace/chat`。
3. 创建或选择会话。
4. 使用默认 `AUTO` 策略提交复杂任务，例如“对比三个竞品的市场趋势、能力差异和策略建议”。
5. 查看 SSE 时间线。

验收：

- 时间线出现 `strategy.selected`，且复杂任务选择 `PLAN_EXECUTE`。
- 时间线按 `task.started -> tool.called -> tool.completed -> task.observed -> plan.judged` 顺序推进。
- 需要重规划时出现 `plan.replanned`。
- 最终产出 `REPORT` artifact。

### 2.2 暂停、继续、取消

步骤：

1. 发起一个运行中任务。
2. 点击暂停。
3. 点击继续。
4. 另起一个运行中任务并点击取消。

验收：

- 暂停后状态为 `PAUSED`，不显示失败。
- 继续后状态回到 `RUNNING`，并从未完成步骤继续。
- 取消后 run/session 状态为 `CANCELLED`，不落成 `FAILED`。

### 2.3 会话记忆

步骤：

1. 完成一次研究任务。
2. 打开记忆面板查看摘要。
3. 编辑摘要并保存。
4. 再发起一次任务。
5. 使用“从历史重建”并再次查看摘要。

验收：

- 摘要可查看、编辑、清空和重建。
- 下一次运行 prompt 会注入记忆上下文。

### 2.4 历史产物复用和附件

步骤：

1. 在历史会话详情中选择一个报告产物，点击“作为上下文使用”。
2. 回到工作台确认复用队列。
3. 上传一个文本附件。
4. 发起新任务。

验收：

- 前端不需要手填 artifactId。
- 提交请求包含 selected artifact ids。
- 后端校验归属和 `reusable`。
- 新 run 可使用历史报告和附件内容。

### 2.5 RAG 降级

步骤：

1. 绑定知识库发起研究任务。
2. 在测试环境模拟 embedding/provider/retrieval 异常。

验收：

- 权限和参数错误仍失败。
- provider、网络、embedding、rerank 类异常触发 `rag.degraded`。
- run 继续完成并在报告中说明本次检索降级原因。

### 2.6 个人 API 配置

步骤：

1. 进入账号中心。
2. 分别配置 Chat、Embedding、Image 的 OpenAI-compatible 信息。
3. 点击测试。
4. 发起会话任务、检索任务和图片任务。

验收：

- 三类配置都可测试。
- 启用的个人配置优先于管理员默认模型。
- 响应体和页面不展示明文 API key。

### 2.7 图片生成与参考图编辑

步骤：

1. 进入图片生成页。
2. 运行文本生图。
3. 上传参考图并运行编辑。

验收：

- `local-mock` 可完成本地流程。
- `openai-compatible` provider 使用 `/images/edits` multipart 请求。
- 真实 provider 验收需要配置可用的 `APP_IMAGE_PROVIDER=openai-compatible`、`APP_IMAGE_BASE_URL`、`APP_IMAGE_API_KEY`。

## 3. 管理员验收

### 3.1 模型生命周期

步骤：

1. 登录管理员。
2. 新增模型。
3. 编辑模型。
4. 测试连接。
5. 设为默认。
6. 停用、启用、删除。

验收：

- 前端覆盖新增、编辑、测试、默认、停用、启用、删除。
- API key 始终脱敏显示。
- 运行时默认模型随启用和默认状态变化。

### 3.2 MCP STDIO 与健康检查

步骤：

1. 配置 allowlist 中的 STDIO fake MCP server。
2. 触发工具发现。
3. 触发健康检查。
4. 执行工具测试。

验收：

- STDIO 使用 `initialize -> notifications/initialized -> tools/list/tools/call`。
- 健康检查返回 `latencyMs`、`toolCount`、`transportType`、`errorCode`、`checkedAt`。
- 工具调用失败会写入调用账本并回退内置流程。

### 3.3 系统审计

步骤：

1. 进入系统审计页。
2. 查看用户、运行、工具调用、登录日志。
3. 筛选失败任务和工具调用。

验收：

- 支持分页和筛选。
- 失败任务展示错误码、错误信息和时间。
- 工具调用展示 server/tool/status/latency/request/response 摘要。

### 3.4 知识库文档生命周期

步骤：

1. 上传同名文档两个版本。
2. 查看文档详情和版本列表。
3. 下载、预览、删除单文档。
4. 恢复旧版本并重新索引。

验收：

- 版本列表能标记当前版本。
- 恢复旧版本会创建新 current 文档并触发 `RESTORE` 索引任务。
- 删除文档后 chunks 和搜索结果不再包含该文档。

### 3.5 RAG 评估

步骤：

1. 进入 RAG 评估页。
2. 创建评估用例。
3. 选择知识库运行评估。
4. 查看指标、失败样本和历史。

验收：

- 用例支持创建、编辑、删除。
- 评估结果展示 recall/hit/MRR 等指标。
- 失败样本可用于定位缺失文档或检索质量问题。

## 4. 找回密码 SMTP 验收

自动化测试已覆盖本地 fake SMTP 发送链路。真实 SMTP 验收步骤：

1. 配置：

```bash
APP_EMAIL_PROVIDER=smtp
APP_EMAIL_FROM=no-reply@example.com
APP_RESET_PASSWORD_BASE_URL=http://localhost:5173/reset-password
APP_SMTP_HOST=smtp.example.com
APP_SMTP_PORT=587
APP_SMTP_USERNAME=...
APP_SMTP_PASSWORD=...
APP_SMTP_STARTTLS=true
APP_SMTP_SSL=false
```

2. 启动后端。
3. 在找回密码页提交已有账号邮箱。
4. 在邮箱中打开重置链接或复制 token。
5. 完成密码重置并用新密码登录。

验收：

- 邮件能收到。
- token 只能使用一次。
- 生产环境未配置 SMTP 时不得静默使用 Noop。

## 5. 不通过条件

出现任一项不得发布：

- 自动化质量门禁失败。
- 取消任务显示为失败。
- 前端仍要求手填 artifactId。
- STDIO MCP 返回占位工具。
- 个人 Embedding 配置不影响 RAG。
- OpenAI-compatible 图片编辑没有 multipart 契约证据。
- 当前事实文档仍把已完成能力写成未实现。
- 真实外部服务没有完成手动验收且发布说明未标记风险。
