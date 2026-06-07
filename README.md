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

## GitHub 自动部署

仓库已经预留了 `ci` 和 `deploy` 两条 GitHub Actions：

- `ci`：在 `push main` / `pull_request` 时校验前后端构建与测试。
- `deploy`：在 `push main` 或手动触发时，把构建产物发到你的服务器并执行远端部署。

### 部署策略

`deploy` workflow 会先在 GitHub Actions 内完成前端构建与后端打包，然后通过 SSH 上传到服务器。服务器端按以下优先级选择运行方式：

1. 如果宿主机已经有 `Java 21+`、`nginx`、`systemd`，优先复用宿主机环境。
2. 如果宿主机缺少上述运行环境，但有 Docker，则自动创建并复用单个 `shared-web-runtime` 容器。
3. 之后新增网站时，只需要换 `APP_NAME`、域名和后端端口，就可以共用同一个 Docker 运行时容器。

### 需要的 GitHub Secrets

- `DEPLOY_HOST`：服务器地址。
- `DEPLOY_PORT`：SSH 端口，默认可填 `22`。
- `DEPLOY_USER`：部署用户。
- `DEPLOY_SSH_PRIVATE_KEY`：部署私钥。
- `APP_RUNTIME_ENV`：生产环境 `.env` 的完整内容，建议直接基于 `infra/env/.env.production.example` 生成。

### 建议的 GitHub Variables

- `DEPLOY_APP_NAME`：默认 `aiagent`。
- `DEPLOY_APP_DOMAIN`：主域名，例如 `aiagent.example.com`。
- `DEPLOY_SERVER_NAMES`：可选，多域名时用空格分隔，例如 `aiagent.example.com www.aiagent.example.com`。
- `DEPLOY_APP_PORT`：后端监听端口，默认 `18080`。
- `DEPLOY_MODE`：`auto`、`native` 或 `docker`，默认 `auto`。
- `DEPLOY_BASE_PATH`：服务器发布根目录，默认 `/srv/deploy`。
- `DEPLOY_SHARED_RUNTIME_HTTP_PORT`：共享 Docker 容器对外暴露的 HTTP 端口，默认 `80`。
- `NGINX_CONFIG_DIR`：宿主机 nginx 站点配置目录；宝塔面板服务器使用 `/www/server/panel/vhost/nginx`。
- `SHARED_RUNTIME_ROOT`：共享 Docker 运行时状态目录，默认 `/srv/shared-web-runtime`。
- `SHARED_RUNTIME_IMAGE`：共享 Docker 镜像名，默认 `shared-web-runtime:latest`。
- `SHARED_RUNTIME_CONTAINER`：共享 Docker 容器名，默认 `shared-web-runtime`。
- `SHARED_RUNTIME_BACKEND_PORT_START` / `SHARED_RUNTIME_BACKEND_PORT_END`：共享 Docker 容器发布给宿主机 nginx 的后端端口段，默认 `18080` 到 `18120`。
- `SHARED_RUNTIME_REBUILD`：是否强制重建共享镜像，默认 `false`。

### 服务器前置要求

- 部署用户需要对发布目录有写权限。
- 如果走宿主机部署，部署用户需要无密码 `sudo`，以便写入 `systemd` 和 `nginx` 配置。
- 如果走 Docker 回退，部署用户需要能执行 `docker`，或具备无密码 `sudo docker`。
- PostgreSQL、Redis、Kafka、MinIO 这类基础设施默认仍然复用服务器已有实例，本流程不会替你自动新建。

当前服务器已按共享基础设施方式预留 `infra/docker/shared-services` 模板，适合用 Docker 统一提供 PostgreSQL、Kafka、MinIO，并继续复用宿主机已有 Redis。

### 产物布局

默认发布到 `/srv/deploy/<APP_NAME>`：

- `releases/<git-sha>`：每次部署的发布目录。
- `current`：当前生效版本的软链接。
- `shared/app.env`：后端运行时环境变量。
- `shared/logs`：后端运行日志。

如果进入 Docker 回退模式，还会额外使用：

- `/srv/shared-web-runtime/nginx/conf.d`：每个站点的 nginx 配置。
- `/srv/shared-web-runtime/supervisor/conf.d`：每个站点的进程配置。

### 首次部署建议

1. 先把 `infra/env/.env.production.example` 改成你的生产配置，并写入 GitHub Secret `APP_RUNTIME_ENV`。
2. 确认服务器上的数据库、Redis、Kafka、MinIO 连通。
3. 确认域名已经解析到服务器，且 80 端口可用。
4. 向 `main` 分支 push 一次，观察 Actions 中的 `deploy` job。

当前实现默认处理 HTTP。若你要接入 HTTPS，建议继续在宿主机 nginx 或上游负载均衡层做证书终止。
