# AiAgent 文档索引

本文档目录同时包含产品目标、当前接口事实、技术设计和历史实施计划。

## 事实优先级

当文档之间或文档与代码发生冲突时，按以下顺序判断：

1. 实际 Controller、Service、领域类型和 Flyway migration。
2. 自动化测试、契约测试、CI 和可执行脚本。
3. `api-spec-aiagent-v1.md`、`database-design-aiagent-v1.md` 中标记的当前事实。
4. PRD、技术方案和 UX 规格中的目标能力。
5. `archive/` 和历史实施计划。

## 当前文档

| 文档 | 用途 | 维护说明 |
| --- | --- | --- |
| `prd-aiagent-v1.md` | 产品目标、用户故事、当前能力状态和后续缺口 | 同时保留目标与实现状态 |
| `tech-design-aiagent-v1.md` | 当前架构、核心数据流、实现边界和可靠性设计 | 代码事实优先 |
| `api-spec-aiagent-v1.md` | 当前公开 REST/SSE 接口与错误码 | 应与 Controller 和契约测试同步 |
| `database-design-aiagent-v1.md` | 数据边界、当前物理模型事实和早期逻辑设计 | 物理字段以 Flyway migration 为准 |
| `ux-spec-aiagent-v1.md` | 当前可实现 UX、页面与交互边界 | 后端未支持能力必须明确标注 |
| `unclosed-capability-tech-plan-aiagent-v1.md` | 未闭环能力的技术设计和可独立提交任务计划 | 写代码前需要先确认范围 |
| `unclosed-capability-full-closure-plan-aiagent-v2.md` | 未闭环能力全量完成计划，收紧完成定义和验收口径 | 下一轮实现应以此作为完成标准 |
| `unclosed-capability-full-completion-execution-plan-aiagent-v3.md` | 未闭环能力全量完成执行计划，纳入当前 WIP、测试、文档和手动验收 | 当前全量收口应以此作为执行清单 |
| `frontend-full-rebuild-spec-aiagent-v2.md` | 已完成前端重构的产品与 UX 规格 | 保留为前端演进基线 |
| `frontend-full-rebuild-tech-design-aiagent-v2.md` | 已完成前端重构的技术设计和验证记录 | 包含 Implementation Completion |
| `frontend-ui-rebuild-plan-aiagent-v1.md` | 历史前端重构实施计划 | 不作为当前事实来源 |
| `release-checklist-aiagent-v1.md` | 全量闭环发布验收清单 | 发布或声明全部完成前必须按此复核 |
| `archive/` | 历史阶段报告和计划 | 仅供追溯 |

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
