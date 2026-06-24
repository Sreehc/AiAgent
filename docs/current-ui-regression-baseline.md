# 当前 UI 回归基线

> 任务来源：`docs/tasks.md` E01。本文档记录 UI 升级进入代码实现前的当前前端页面状态，用作后续视觉重构和截图回归的对照基线。

## 1. 基线信息

| 项目 | 内容 |
| --- | --- |
| 采集时间 | 2026-06-20 17:47:17 CST |
| 前端地址 | `http://127.0.0.1:5173/` |
| 前端启动命令 | `npm run dev -- --host 127.0.0.1 --port 5173` |
| 前端脚本 | `dev`、`build`、`preview` |
| 当前测试配置 | 未发现 Playwright/Vitest/E2E 配置 |
| 截图工具 | `npx -y -p playwright playwright screenshot` + 本机 Chrome channel |
| 基线 viewport | 桌面 `1440x900` light；补充 `390x844` light 代表样张 |
| 后端状态 | `localhost:8080` 未监听，`/api/v1/health` 与 `/api/v1/auth/login` 返回 `000` |
| 登录态处理 | 受保护页面使用 `docs/ui-regression-baseline/storage-admin.json` 注入临时 admin localStorage |
| 代码改动范围 | 仅新增文档、截图和截图用 storage state；未修改前端业务代码 |

## 2. 截图资产

截图目录：

- `docs/ui-regression-baseline/screenshots/`

截图辅助文件：

- `docs/ui-regression-baseline/storage-admin.json`

该 storage state 只包含假的 `ui-baseline-token` 和 admin 用户信息，用于打开受保护页面，不包含真实凭据。

## 3. 桌面截图清单

| 路由 | 截图 | 当前观察 |
| --- | --- | --- |
| `/login` | `desktop-login-light.png` | 登录页正常渲染；当前主色偏深绿，左侧能力入口是卡片化后台风格。 |
| `/register/invite` | `desktop-register-light.png` | 邀请注册页正常渲染；与登录页共享 AuthLayout。 |
| `/forgot-password` | `desktop-forgot-password-light.png` | 找回密码页正常渲染；提交依赖后端，当前未验证成功流。 |
| `/reset-password` | `desktop-reset-password-light.png` | 重置密码页正常渲染；提交依赖后端，当前未验证成功流。 |
| `/workspace/chat` | `desktop-workspace-chat-light.png` | Shell、会话、Composer、Timeline、Artifacts、Memory、Tools 均渲染；接口不可用时显示 `Request failed with status 500`。 |
| `/workspace/knowledge-bases` | `desktop-knowledge-bases-light.png` | 知识库页面结构可见；接口不可用时进入错误态/空态组合。 |
| `/workspace/image-generation` | `desktop-image-generation-light.png` | 图片工作室结构可见；会话和历史数据因接口不可用为空或错误。 |
| `/workspace/history` | `desktop-history-light.png` | 历史回放页面结构可见；接口不可用时无法加载真实历史。 |
| `/account` | `desktop-account-light.png` | 账号中心页面结构可见；profile/log/API 配置请求失败时显示错误。 |
| `/admin/settings` | `desktop-admin-settings-light.png` | 模型配置与邀请码区域可见；admin fake session 可进入；数据请求失败。 |
| `/admin/mcp-servers` | `desktop-admin-mcp-servers-light.png` | MCP 表单、列表、发现和健康检查区域可见；数据请求失败。 |
| `/admin/audit` | `desktop-admin-audit-light.png` | 审计 tab 和表格区域可见；当前仍以通用表格/原始字段方式呈现，数据请求失败。 |
| `/admin/rag-evaluations` | `desktop-admin-rag-evaluations-light.png` | RAG 评估页结构可见；评估历史和用例请求失败。 |
| `/admin/overview` | `desktop-admin-overview-missing-light.png` | 当前路由不存在，进入 404；后续 A01 需要新增。 |
| `*` | `desktop-404-light.png` | 404 页可渲染，提供返回工作台和登录入口。 |

## 4. 移动代表截图

| 路由 | 截图 | 当前观察 |
| --- | --- | --- |
| `/login` | `mobile-login-light.png` | 登录页移动端正常渲染。 |
| `/workspace/chat` | `mobile-workspace-chat-light.png` | 工作台移动端为长单列堆叠，导航压缩为“菜单”；接口错误、Composer、Timeline、Session、Artifacts、Memory、Tools 都出现在同一纵向流中。 |

## 5. 手测结果

| 检查项 | 结果 |
| --- | --- |
| Vite dev server | 可启动，`http://127.0.0.1:5173/` 可访问。 |
| 公共认证页 | 登录、邀请注册、找回密码、重置密码均可渲染。 |
| 未登录访问受保护页 | `ProtectedRoute` 会重定向到 `/login`。 |
| fake admin 登录态访问受保护页 | 页面 Shell 和内容区可渲染，admin 导航可见。 |
| 后端依赖 | 后端未运行时，受保护页面无法加载真实业务数据。 |
| 错误态 | 多数业务页会展示 `Request failed with status 500` 或空态；这是当前无后端基线。 |
| 管理总览 | `/admin/overview` 当前不存在。 |
| 截图文件完整性 | 17 张 PNG 均生成成功，尺寸正常，非 0 字节。 |

## 6. 当前测试缺口

- 当前仓库未接入 Playwright 配置，截图通过临时 CLI 命令采集，不能作为 CI 回归直接复用。
- 当前没有 mock 数据，受保护页面截图主要是无后端错误态，不能覆盖成功态、运行中、完成、失败等业务状态。
- 当前未采集完整 `1440x900`、`1280x800`、`768x1024`、`390x844` 四 viewport 组合。
- 当前未采集 dark 主题截图。
- 当前未覆盖真实交互：主题切换、登录提交、会话创建、运行研究、知识库检索、图片生成、审计展开、RAG metrics 展开。

这些缺口应在后续 T01/T02 建立 Playwright 与 mock 数据后补齐。

## 7. 采集命令摘要

```bash
npm run dev -- --host 127.0.0.1 --port 5173
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/v1/health
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/v1/auth/login
npx -y -p playwright playwright screenshot --channel chrome --viewport-size 1440,900 --color-scheme light --full-page --wait-for-timeout 1500 http://127.0.0.1:5173/login docs/ui-regression-baseline/screenshots/desktop-login-light.png
npx -y -p playwright playwright screenshot --channel chrome --viewport-size 1440,900 --color-scheme light --load-storage docs/ui-regression-baseline/storage-admin.json --full-page --wait-for-timeout 2500 http://127.0.0.1:5173/workspace/chat docs/ui-regression-baseline/screenshots/desktop-workspace-chat-light.png
file docs/ui-regression-baseline/screenshots/*.png
```
