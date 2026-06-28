# AiAgent

AiAgent 是一个面向研究、知识检索和多工具调用的智能体工作台。当前代码包含 React 前端、Spring Boot 后端、PostgreSQL/pgvector 持久化、Redis 缓存、Kafka 知识库索引任务、MinIO 对象存储、模型 Provider 配置、MCP 服务管理、图片生成和 GitHub Actions 部署流程。

## 当前功能

- 账号与认证：邀请码注册、登录/退出、密码重置、登录失败限流、账号资料和登录日志。
- 工作台会话：创建研究会话、绑定知识库、执行运行任务、SSE 流式返回、计划步骤、工具调用记录和报告产物回放。
- 知识库/RAG：知识库管理、文档上传、结构化分块、异步索引、向量检索、全文检索、查询改写、重排、缓存和回归评估脚本。
- 模型配置：管理员可配置 `CHAT`、`EMBEDDING`、`IMAGE` 模型，API Key 应用层加密保存，列表接口只返回脱敏值。
- MCP 管理：HTTP/SSE、Streamable HTTP 和 STDIO MCP 服务配置、工具发现、健康检查、出站主机和 STDIO 可执行文件白名单。
- 图片生成：图片生成、图片编辑入口、历史记录、对象存储产物和短期预签名访问 URL。
- 前端应用：登录注册、工作台、知识库、图片生成、历史记录、管理员设置、MCP 服务和账号中心页面。

## 技术栈

- 前端：React 19、React Router 7、TypeScript 5、Vite 6、pnpm 10。
- 后端：Java 21、Spring Boot 4.1、Spring AI 2.0、Maven、JDBC、Flyway、Actuator、Spring Kafka、Spring Data Redis。
- 基础设施：PostgreSQL 17 + pgvector、Redis、Kafka 3.8、MinIO。
- CI/CD：GitHub Actions、SSH 远端部署，支持宿主机 native 或共享 Docker runtime 回退模式。

## 目录结构

```text
frontend/                    React + TypeScript + Vite 前端
backend/                     Spring Boot 后端
  src/main/resources/db/     Flyway 数据库迁移
docs/                        PRD、技术设计、API、数据库、UX 与项目历史文档
infra/env/                   本地和生产环境变量模板
infra/sql/                   数据库扩展初始化脚本
infra/scripts/               服务检查、冒烟测试、RAG 评估和远端部署脚本
infra/docker/shared-services PostgreSQL/Kafka/MinIO 共享基础设施模板
infra/docker/shared-runtime  部署回退用共享 Web runtime 模板
.github/workflows/          CI 与部署流水线
```

## 环境要求

- Node.js 22+，本地当前可使用 Node.js 23。
- pnpm 10。
- Java 21+。
- Maven 3.9+。
- PostgreSQL 17 + pgvector。
- Redis。
- Kafka 3.8+。
- MinIO。

## 本地基础设施

后端默认读取本机服务：

```text
PostgreSQL: localhost:5432 / postgres / postgres
Redis:      localhost:6379
Kafka:      localhost:9092
MinIO:      http://localhost:9000 / minioadmin / minioadmin
```

如果使用仓库里的共享基础设施模板，可以从 `infra/docker/shared-services` 启动 PostgreSQL、Kafka 和 MinIO。该模板要求先提供数据库和 MinIO 密钥环境变量，Redis 仍按当前部署说明复用已有实例。

```bash
cd infra/docker/shared-services
POSTGRES_PASSWORD=change-me \
AIAGENT_DB_PASSWORD=change-me \
MINIO_ROOT_USER=minioadmin \
MINIO_ROOT_PASSWORD=minioadmin \
docker compose up -d
```

`infra/scripts/check-services.sh` 当前检查容器名是否匹配 `kafka`、`minio`、`PostgreSQL` 或 `redis`。如果使用 `shared-*` 容器名，该脚本需要相应调整或仅作为已有本机服务检查参考。

## 本地启动

### 后端

建议从环境模板创建本地配置，并替换所有密钥和密码占位值：

```bash
cp infra/env/.env.example .env.local
```

Spring Boot 不会自动读取仓库根目录的 `.env.local`。可以在 shell 中导出变量后启动，也可以直接使用系统环境变量、IDE Run Configuration 或部署环境注入。

```bash
set -a
source .env.local
set +a

cd backend
mvn spring-boot:run
```

默认端口为 `8080`，健康检查：

```text
GET http://localhost:8080/api/v1/health
```

Flyway 会自动执行 `backend/src/main/resources/db/migration` 下的迁移。初始化扩展脚本位于 `infra/sql/001_init_extensions.sql`，数据库需要启用 `vector` 扩展。

### 前端

```bash
cd frontend
pnpm install
pnpm dev
```

前端开发服务器默认访问 `http://localhost:5173`。前端 API 前缀固定为 `/api/v1`，本地联调时需要由 Vite/反向代理或同源部署把请求转发到后端。

### 默认演示数据

本地默认 `APP_BOOTSTRAP_DEMO_DATA_ENABLED=true`，迁移脚本和启动逻辑会提供演示邀请码，例如：

```text
INVITE-ABC
```

生产环境必须设置：

```text
APP_BOOTSTRAP_DEMO_DATA_ENABLED=false
```

并在上线前禁用或过期所有默认演示邀请码。

## 关键环境变量

完整模板见 `infra/env/.env.example` 和 `infra/env/.env.production.example`。重点变量包括：

- `APP_PORT`：后端监听端口，本地默认 `8080`，生产模板默认 `18080`。
- `APP_JWT_SECRET`：JWT 签名密钥，生产必须使用长随机值。
- `APP_SECRET_ENCRYPTION_KEY`：模型 API Key 加密密钥，生产必须配置。
- `APP_DB_*`：PostgreSQL 连接信息。
- `APP_REDIS_*`：Redis 连接信息。
- `APP_KAFKA_*`：Kafka bootstrap、知识库索引 topic 和 consumer group。
- `APP_MINIO_*`：对象存储 endpoint、凭证和 bucket。
- `APP_STORAGE_PRESIGNED_URL_TTL_SECONDS`：对象访问预签名 URL 有效期。
- `APP_EMBEDDING_*`：Embedding provider、模型、base URL、API key、维度、超时、重试和 observation 开关。
- `APP_RAG_*`：RAG embedding/retrieval 缓存 TTL 和检索超时。
- `APP_CHAT_*`：Chat provider 运行配置，包含超时、重试和 observation 开关。
- `APP_IMAGE_*`：图片生成 provider 运行配置，包含超时、重试和 observation 开关。
- `APP_MCP_ALLOWED_HOSTS`：允许 MCP HTTP 访问的主机列表。
- `APP_MCP_ALLOW_PRIVATE_NETWORK`：是否允许 MCP 访问私有网络地址。
- `APP_MCP_ALLOWED_STDIO_EXECUTABLES`：允许运行的 STDIO MCP 可执行文件名白名单。
- `APP_BOOTSTRAP_DEMO_DATA_ENABLED`：是否启用本地演示数据。

生产 profile 会拒绝以 `local-mock` 作为默认模型 provider 启动。`openai-compatible` 运行时 provider 当前通过 Spring AI adapter 层接入 chat、embedding 和 text-to-image；参考图编辑仍走同一 provider 内部保留的 multipart `/images/edits` 请求路径，以维持现有能力和返回契约。

`APP_CHAT_*`、`APP_EMBEDDING_*` 和 `APP_IMAGE_*` 除 provider、model、base URL、API key 外，还支持 `*_CONNECT_TIMEOUT_MILLIS`、`*_READ_TIMEOUT_MILLIS`、`*_RETRY_MAX_ATTEMPTS`、`*_RETRY_BACKOFF_MILLIS`、`*_OBSERVATION_ENABLED`。其中 retry 默认以 `1` 次表示关闭增强重试，observation 默认关闭。

## 常用命令

### 后端编译和测试

```bash
cd backend
mvn -q -DskipTests compile
mvn test
```

### 前端构建

```bash
cd frontend
pnpm build
```

### RAG 评估

```bash
./infra/scripts/rag-eval.sh
```

默认样例数据位于 `backend/src/test/resources/rag_eval/sample-eval.json`。

### 冒烟测试

先启动后端服务并确保基础设施、管理员账号和必要模型配置可用，再执行：

```bash
chmod +x ./infra/scripts/smoke-test.sh
./infra/scripts/smoke-test.sh
```

脚本覆盖健康检查、登录、邀请码、模型配置、会话运行、SSE、图片生成、历史回放、知识库上传、索引和检索测试。

## API 概览

详细接口见 `docs/api-spec.md`。当前后端主要路由：

- `GET /api/v1/health`
- `/api/v1/auth/*`：注册、登录、登出、忘记密码、重置密码。
- `/api/v1/account/*`：资料、修改密码、登录日志。
- `/api/v1/sessions/*`：会话、运行、SSE 执行、回放、知识库绑定。
- `/api/v1/knowledge-bases/*`：知识库、文档上传、索引、重建索引、检索测试。
- `/api/v1/images/*`：图片生成、编辑、历史记录。
- `/api/v1/admin/models`：模型配置。
- `/api/v1/admin/invites`：邀请码管理。
- `/api/v1/admin/mcp-servers/*`：MCP 服务配置、发现和健康检查。

响应统一包装为：

```json
{
  "code": "SUCCESS",
  "message": "OK",
  "data": {}
}
```

## 文档

- `docs/prd.md`：产品需求。
- `docs/tech-design.md`：技术设计。
- `docs/api-spec.md`：API 规格。
- `docs/database-design.md`：数据库设计。
- `docs/ux-spec.md`：UX 规格。
- `docs/history.md`：项目演进与关键技术决策。

## CI

`.github/workflows/ci.yml` 在 `push main` 和 `pull_request` 时运行：

- 前端：Node.js 22、pnpm 10、`pnpm install --no-frozen-lockfile`、`pnpm build`。
- 后端：Java 21、`mvn test`。

## GitHub 自动部署

`.github/workflows/deploy.yml` 在 `push main` 或手动触发时运行。流水线会构建前端、测试并打包后端、组装 release bundle，通过 SSH 上传服务器，然后执行 `infra/scripts/deploy-remote.sh`。

### 部署策略

远端脚本按配置选择：

1. `DEPLOY_MODE=native`：使用宿主机 Java 21、nginx、systemd。
2. `DEPLOY_MODE=docker`：使用共享 Docker runtime。
3. `DEPLOY_MODE=auto`：优先 native，条件不足时回退 Docker runtime。

PostgreSQL、Redis、Kafka、MinIO 默认视为外部已有基础设施，部署流程不会自动创建。

### 必需 GitHub Secrets

- `DEPLOY_HOST`：服务器地址。
- `DEPLOY_PORT`：SSH 端口，通常为 `22`。
- `DEPLOY_USER`：部署用户。
- `DEPLOY_SSH_PRIVATE_KEY`：部署私钥。
- `APP_RUNTIME_ENV`：生产 `.env` 完整内容，建议基于 `infra/env/.env.production.example` 生成。

### 常用 GitHub Variables

- `DEPLOY_APP_NAME`：应用名，默认 `aiagent`。
- `DEPLOY_APP_DOMAIN`：主域名。
- `DEPLOY_SERVER_NAMES`：nginx server_name，可用空格分隔多个域名。
- `DEPLOY_APP_PORT`：后端端口，默认 `18080`。
- `DEPLOY_MODE`：`auto`、`native` 或 `docker`。
- `DEPLOY_BASE_PATH`：发布根目录，默认 `/srv/deploy`。
- `NGINX_CONFIG_DIR`：宿主机 nginx 站点配置目录，例如宝塔面板常用 `/www/server/panel/vhost/nginx`。
- `SHARED_RUNTIME_ROOT`、`SHARED_RUNTIME_IMAGE`、`SHARED_RUNTIME_CONTAINER`：共享 Docker runtime 配置。
- `SHARED_RUNTIME_BACKEND_PORT_START` / `SHARED_RUNTIME_BACKEND_PORT_END`：共享 runtime 后端端口池。
- `SHARED_RUNTIME_REBUILD`：是否强制重建共享 runtime 镜像。
- `APP_RUNTIME_IMAGE` / `APP_RUNTIME_CONTAINER`：应用运行容器配置。

### 服务器前置要求

- 部署用户对发布目录有写权限。
- native 模式需要 Java 21+、nginx、systemd，并允许部署用户无密码执行必要 `sudo` 操作。
- docker 模式需要可执行 `docker` 或无密码 `sudo docker`。
- 域名已解析到服务器，HTTP 入口端口可用。

默认发布目录：

```text
/srv/deploy/<APP_NAME>/releases/<git-sha>  单次发布目录
/srv/deploy/<APP_NAME>/current             当前版本软链接
/srv/deploy/<APP_NAME>/shared/app.env      后端运行时环境变量
/srv/deploy/<APP_NAME>/shared/logs         后端日志
```

当前部署实现默认处理 HTTP。HTTPS 建议在宿主机 nginx 或上游负载均衡层做证书终止。
