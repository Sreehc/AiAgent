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

默认预置邀请码：

```text
INVITE-ABC
```

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
