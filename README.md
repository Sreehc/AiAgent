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
