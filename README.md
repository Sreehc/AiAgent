# AiAgent

AiAgent 是一个面向研究任务的多智能体工作台。当前仓库已经具备前端 React 骨架、后端 Spring Boot 基线、认证与账号中心主链路、基础环境配置模板和健康检查接口。

## 当前环境

- Node.js 23
- pnpm 10
- Java 21+
- Maven 3.9+
- PostgreSQL 17.10 + pgvector 0.8.2
- Redis 8.4.0
- Kafka 3.8.0
- MinIO RELEASE.2025-09-07T16-13-09Z

## 目录

```text
frontend/  React + TypeScript + Vite
backend/   Spring Boot baseline
infra/     env/sql/scripts
```

## 本地启动

### 前端

```bash
cd frontend
pnpm install
pnpm dev
```

### 后端

```bash
cd backend
mvn spring-boot:run
```

默认环境直接复用本机现有 Docker 服务：

- PostgreSQL: `localhost:5432` / `postgres` / `root`
- Redis: `localhost:6379`
- Kafka: `localhost:9092`
- MinIO: `http://localhost:9000`

健康检查接口：

```text
GET /api/v1/health
```

本地开发数据库可能包含演示邀请码，例如：

```text
INVITE-ABC
```

该邀请码仅用于本地/demo profile。生产环境必须关闭 `APP_BOOTSTRAP_DEMO_DATA_ENABLED`，并在上线前禁用或过期所有默认演示邀请码。

## 关键环境变量

从 `infra/env/.env.example` 复制本地配置，并替换所有 `change-me` / 空白密钥值。除数据库、Redis、Kafka、MinIO 外，生产化链路还需要：

- `APP_SECRET_ENCRYPTION_KEY`：用于模型密钥加密存储；生产环境必须配置。
- `APP_EMBEDDING_*`：Embedding provider、模型、base URL、API key、维度和超时。
- `APP_RAG_*`：RAG embedding/retrieval 缓存 TTL 与检索超时。
- `APP_CHAT_*`：Chat provider 运行时配置。
- `APP_IMAGE_*`：图片生成 provider 运行时配置。
- `APP_MCP_ALLOWED_HOSTS` / `APP_MCP_ALLOW_PRIVATE_NETWORK`：MCP 出站访问边界。
- `APP_MCP_ALLOWED_STDIO_EXECUTABLES`：允许健康检查/运行的 STDIO MCP 可执行文件名；生产默认应为空或严格白名单。
- `APP_STORAGE_PRESIGNED_URL_TTL_SECONDS`：对象下载 URL 的短期有效期。
- `APP_BOOTSTRAP_DEMO_DATA_ENABLED=false`：生产环境必须关闭 demo 数据入口。

## 模型 Provider 与密钥

管理员可以在基础配置页创建 `CHAT`、`EMBEDDING`、`IMAGE` 三类模型配置。模型 API Key 写入后会以应用层密文保存，列表接口只返回 `apiKeyMasked`。本地开发默认可使用 `local-mock` provider；生产 profile 会拒绝以 `local-mock` 作为默认模型 provider 启动。OpenAI-compatible provider 使用对应的 `baseUrl` 和模型 code 访问外部服务，真实凭证必须通过环境变量或管理端安全写入。

## 本地校验

### 基础构建

```bash
cd backend
mvn -q -DskipTests compile

cd ../frontend
pnpm build
```

### 服务检查

```bash
./infra/scripts/check-services.sh
```

### 冒烟回归

先启动后端服务，再执行：

```bash
chmod +x ./infra/scripts/smoke-test.sh
./infra/scripts/smoke-test.sh
```

默认脚本会覆盖以下主链路：

- 健康检查与登录成功/失败
- 管理员邀请码创建与普通用户访问管理员接口被拒绝
- 模型配置创建与查询
- 会话创建、SSE 执行、报告产物生成
- 图片生成、历史查询、回放产物恢复
- 知识库创建、上传、索引和检索测试

## 当前验证结果

本轮已完成以下本地验证：

- 后端编译：`mvn -DskipTests compile` 通过
- 后端测试：`mvn test` 通过（16 tests, 0 failures）
- 前端构建：`pnpm build` 通过

剩余边界说明：

- MCP 已切到 transport client 结构，并具备 HTTP/STDIO 的真实调用路径与安全边界；若要完成生产联调，仍需要真实 MCP 服务端与认证信息。
- 图片生成 provider 已接入真实 provider 路径；图片编辑场景是否可用取决于所配置的外部 provider 是否支持 edit 接口。
- `infra/scripts/smoke-test.sh` 需要运行中的本地后端、管理员账号和基础设施服务，适合作为联调/回归脚本单独执行。

说明：`infra/scripts/smoke-test.sh` 仍依赖运行中的后端服务、管理员账号和本地基础设施，适合作为联调/回归脚本单独执行。