# AiAgent 文档索引

本目录是 AiAgent 当前事实文档来源。当文档之间或文档与代码冲突时，按以下顺序判断：

1. 实际 Controller、Service、领域类型和 Flyway migration。
2. 自动化测试、契约测试、CI 和可执行脚本。
3. `api-spec.md`、`database-design.md` 中的当前事实。
4. `prd.md`、`tech-design.md` 和 `ux-spec.md` 中的目标能力。
5. `history.md` 中的项目演进叙述（仅用于回溯，不作为当前事实）。

## 文档清单

| 文档 | 用途 | 维护说明 |
| --- | --- | --- |
| `prd.md` | 产品目标、用户故事、当前能力状态 | 目标与实现状态并存 |
| `tech-design.md` | 当前架构、核心数据流、前端分层、实现边界 | 代码事实优先 |
| `api-spec.md` | 当前公开 REST/SSE 接口与错误码 | 应与 Controller 和契约测试同步 |
| `database-design.md` | 数据边界、当前物理模型事实 | 物理字段以 Flyway migration 为准 |
| `ux-spec.md` | 当前可实现 UX、页面与交互边界、视觉系统约束 | 后端未支持能力必须明确标注 |
| `history.md` | 项目演进叙述：前端重构、UI/UX 升级、能力闭环、关键技术决策 | 时间冻结，不作为当前事实来源 |

## 同步检查

文档变更前后至少执行：

```bash
cd backend
mvn test

cd ../frontend
pnpm build
```

接口文档更新时，还应检查当前 Controller 路由：

```bash
rg -n '@(RequestMapping|GetMapping|PostMapping|PutMapping|DeleteMapping)' backend/src/main/java/com/sreehc/aiagent/trigger
```
