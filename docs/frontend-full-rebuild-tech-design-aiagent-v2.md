# AiAgent V2 前端完全重构技术设计与任务列表

## 1. Context

本文档承接 `docs/frontend-full-rebuild-spec-aiagent-v2.md`，用于把 V2 前端完全重构规格落成工程设计和可提交任务列表。

本轮只设计，不写实现代码。待确认后再按任务拆分逐步修改前端代码。

## 2. Design Goals

- 保留现有 React + Vite + TypeScript 技术栈。
- 保留现有路由路径、认证 session、API response wrapper 和 SSE 数据流。
- 删除并重建可见 UI 层：Shell、页面 JSX、通用组件、样式系统、页面布局。
- 将页面逻辑从“每页堆状态和 API 调用”演进为“服务层 + view model + 页面组件”。
- 以小任务逐步交付，每个任务都能独立构建验证。

## 3. High-Level Architecture

### 3.1 Target Frontend Layers

```text
React Router
  -> ProtectedRoute / Auth routes
  -> AppShell
  -> Page containers
  -> Feature components
  -> UI primitives
  -> API service functions
  -> apiRequest / streamRequest
```

### 3.2 Module Boundaries

| 模块 | 责任 | 典型文件 |
| --- | --- | --- |
| `app` | 全局 provider、toast、command palette 挂载 | `frontend/src/app/App.tsx` |
| `router` | 路由定义和访问控制结构 | `frontend/src/router/AppRouter.tsx` |
| `services` | API 类型、端点函数、SSE 封装 | `frontend/src/services/api.ts`, `frontend/src/services/*.ts` |
| `stores` | 本地 session 存储 | `frontend/src/stores/auth.ts` |
| `hooks` | auth/session、键盘、页面状态 helper | `frontend/src/hooks/*` |
| `components/ui` | 通用基础组件，不包含业务逻辑 | Button, Field, Dialog, Tabs, StatusPill |
| `components/shell` | 左侧导航、顶栏、用户菜单、移动导航 | AppShell, Sidebar, Topbar, UserMenu |
| `components/command` | 全局命令面板 | CommandPalette |
| `features/workspace` | 会话、composer、执行时间线、产物面板 | SessionList, ResearchComposer, ExecutionTimeline |
| `features/knowledge` | 知识库列表、文档表格、检索测试 | KnowledgeBaseList, DocumentTable |
| `features/image` | 图片模式表单、结果画廊、历史 | ImagePromptPanel, ImageGallery |
| `features/history` | 历史列表、回放详情、执行审计 | HistoryList, ReplayDetail |
| `features/system` | 模型和 MCP 管理 | ModelRegistry, McpServerRegistry |
| `pages` | 页面容器，负责组合 feature 和发起数据加载 | `frontend/src/pages/*.tsx` |
| `styles` | token、base、layout、components、pages | `frontend/src/styles/*.css` |

说明：当前仓库尚无 `features/` 目录。重构时可以创建该目录，也可以放在 `components/workspace` 等目录下；推荐用 `features/` 明确业务模块边界。

## 4. Proposed File Structure

```text
frontend/src/
  app/
    App.tsx
  router/
    AppRouter.tsx
  services/
    api.ts
    authApi.ts
    sessionsApi.ts
    knowledgeApi.ts
    imagesApi.ts
    adminApi.ts
    accountApi.ts
  stores/
    auth.ts
  hooks/
    useAuthSession.ts
    useKeyboard.ts
    useAsyncState.ts
  components/
    ui/
      Alert.tsx
      Badge.tsx
      Button.tsx
      Dialog.tsx
      EmptyState.tsx
      Field.tsx
      FormControls.tsx
      IconButton.tsx
      Panel.tsx
      Skeleton.tsx
      StatusPill.tsx
      Tabs.tsx
      Toast.tsx
      index.ts
    shell/
      AppShell.tsx
      Sidebar.tsx
      Topbar.tsx
      UserMenu.tsx
      MobileNav.tsx
    command/
      CommandPalette.tsx
  features/
    workspace/
      ArtifactPanel.tsx
      ExecutionTimeline.tsx
      ResearchComposer.tsx
      SessionList.tsx
      ToolInvocationList.tsx
      workspaceViewModel.ts
    knowledge/
      DocumentTable.tsx
      KnowledgeBaseList.tsx
      KnowledgeBaseSummary.tsx
      SearchTestPanel.tsx
    image/
      ImageGenerationForm.tsx
      ImageGallery.tsx
      ImageHistoryPanel.tsx
    history/
      HistoryFilters.tsx
      HistoryList.tsx
      ReplayDetail.tsx
    system/
      ModelRegistry.tsx
      ModelForm.tsx
      McpServerRegistry.tsx
      McpServerForm.tsx
      McpToolList.tsx
  pages/
    AccountPage.tsx
    AdminSettingsPage.tsx
    ForgotPasswordPage.tsx
    HistoryPage.tsx
    ImageGenerationPage.tsx
    KnowledgeBasesPage.tsx
    LoginPage.tsx
    McpServersPage.tsx
    RegisterPage.tsx
    ResetPasswordPage.tsx
    WorkspacePage.tsx
  styles/
    tokens.css
    base.css
    layout.css
    components.css
    pages.css
    global.css
```

## 5. Data Model And API Design

### 5.1 Existing Data Types To Preserve

The following types already exist in `frontend/src/services/api.ts` and should remain the source of truth unless backend contracts change:

- `ApiError`
- `SessionItem`
- `SessionListResponse`
- `RunItem`
- `PlanStepItem`
- `ToolInvocationItem`
- `ArtifactItem`
- `SessionDetailResponse`
- `KnowledgeBaseItem`
- `KnowledgeDocumentItem`
- `SearchHit`
- `McpServerItem`
- `McpDiscoverResponse`
- `McpHealthResponse`
- `ModelConfigItem`
- `InviteItem`
- `ImageGenerationItem`
- `ImageHistoryItem`
- `ImageHistoryResponse`
- `SessionStreamEvent`

### 5.2 Proposed API Service Modules

`api.ts` should keep shared primitives:

- `apiRequest<T>()`
- `streamRequest()`
- shared response parsing
- shared error parsing
- shared exported DTO types

New API modules should wrap endpoint paths so pages no longer embed raw URL strings:

| Module | Functions | Existing endpoint |
| --- | --- | --- |
| `authApi.ts` | `login`, `logout`, `registerByInvite`, `forgotPassword`, `resetPassword` | `/auth/*` |
| `sessionsApi.ts` | `listSessions`, `getSession`, `getReplay`, `createSession`, `deleteSession`, `bindKnowledgeBases`, `streamSessionRun` | `/sessions*` |
| `knowledgeApi.ts` | `listKnowledgeBases`, `createKnowledgeBase`, `updateKnowledgeBase`, `deleteKnowledgeBase`, `listDocuments`, `uploadDocument`, `indexDocument`, `searchTest` | `/knowledge-bases*` |
| `imagesApi.ts` | `listImageHistory`, `listSessionsForImage`, `generateImage`, `editImage` | `/images/*`, `/sessions` |
| `adminApi.ts` | `listModels`, `createModel`, `listInvites`, `createInvite`, `listMcpServers`, `createMcpServer`, `updateMcpServer`, `deleteMcpServer`, `discoverMcpTools`, `checkMcpHealth` | `/admin/*` |
| `accountApi.ts` | `getProfile`, `updateProfile`, `changePassword`, `listLoginLogs`, `getApiConfig`, `updateApiConfig` | `/account/*` |

Trade-off：新增 service wrapper 会增加文件数量，但能降低页面复杂度，并让后续 API 契约变更更集中。

### 5.3 Frontend View Models

后端 DTO 不直接决定 UI。需要添加轻量 view model 层，尤其是工作台和历史回放。

#### Workspace View Model

```ts
type ExecutionTimelineItem =
  | {
      id: string;
      kind: "run";
      title: string;
      status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
      timestamp?: string | null;
      detail?: string | null;
    }
  | {
      id: string;
      kind: "plan-step";
      stepNo: number;
      title: string;
      status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
      toolName?: string | null;
      inputPreview?: string | null;
      outputPreview?: string | null;
    }
  | {
      id: string;
      kind: "tool";
      toolName: string;
      toolType: string;
      status: string;
      startedAt?: string | null;
      endedAt?: string | null;
      requestPreview?: string | null;
      responsePreview?: string | null;
    }
  | {
      id: string;
      kind: "artifact";
      artifactType: "REPORT" | "IMAGE" | "IMAGE_REFERENCE";
      title: string;
      url?: string | null;
      createdAt: string;
    }
  | {
      id: string;
      kind: "stream-event";
      event: string;
      createdAt: string;
      payload: Record<string, unknown>;
    };
```

Mapping inputs:

- `SessionDetailResponse.runs`
- `SessionDetailResponse.planSteps`
- `SessionDetailResponse.toolInvocations`
- `SessionDetailResponse.artifacts`
- live `SessionStreamEvent[]`

#### Resource State Model

Use a shared async state shape for page-level requests:

```ts
type AsyncStatus = "idle" | "loading" | "success" | "error";

type AsyncState<T> = {
  status: AsyncStatus;
  data: T;
  error: string | null;
};
```

Do not over-engineer with global state. Page-local state is enough for V2 unless cross-page caching becomes necessary.

## 6. State Flow

### 6.1 Auth Flow

```text
LoginPage
  -> authApi.login()
  -> writeSession()
  -> useAuthSession state update
  -> navigate /workspace/chat
  -> ProtectedRoute allows business routes
```

Files involved:

- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`
- `frontend/src/pages/ForgotPasswordPage.tsx`
- `frontend/src/pages/ResetPasswordPage.tsx`
- `frontend/src/stores/auth.ts`
- `frontend/src/hooks/useAuthSession.ts`
- `frontend/src/components/ProtectedRoute.tsx`
- `frontend/src/services/authApi.ts`

### 6.2 Research Run Flow

```text
WorkspacePage loads:
  -> sessionsApi.listSessions()
  -> sessionsApi.getSession(first or selected)
  -> knowledgeApi.listKnowledgeBases()

User submits run:
  -> optimistic UI appends user query / running state
  -> sessionsApi.streamSessionRun()
  -> streamRequest() emits SessionStreamEvent
  -> workspaceViewModel merges live stream events
  -> on stream complete: reload sessions + selected session detail
  -> render timeline + report + artifacts

Stream error:
  -> mark stream disconnected
  -> keep current timeline
  -> reload selected session detail if possible
  -> show recovery alert
```

Files involved:

- `frontend/src/pages/WorkspacePage.tsx`
- `frontend/src/features/workspace/*`
- `frontend/src/services/sessionsApi.ts`
- `frontend/src/services/knowledgeApi.ts`
- `frontend/src/services/api.ts`

### 6.3 Knowledge Flow

```text
KnowledgeBasesPage loads:
  -> knowledgeApi.listKnowledgeBases()
  -> select first KB
  -> knowledgeApi.listDocuments(kbId)

Create/update/delete KB:
  -> mutate
  -> reload KB list
  -> preserve selected KB when possible

Upload document:
  -> FormData upload
  -> reload KB list + documents

Index document:
  -> trigger index
  -> reload documents

Search test:
  -> knowledgeApi.searchTest()
  -> render SearchHit[]
```

Files involved:

- `frontend/src/pages/KnowledgeBasesPage.tsx`
- `frontend/src/features/knowledge/*`
- `frontend/src/services/knowledgeApi.ts`

### 6.4 Image Flow

```text
ImageGenerationPage loads:
  -> imagesApi.listSessionsForImage()
  -> imagesApi.listImageHistory()

Generate image:
  -> imagesApi.generateImage()
  -> append result to gallery
  -> reload history

Edit image:
  -> FormData upload
  -> imagesApi.editImage()
  -> append result to gallery
  -> reload history
```

Files involved:

- `frontend/src/pages/ImageGenerationPage.tsx`
- `frontend/src/features/image/*`
- `frontend/src/services/imagesApi.ts`

### 6.5 History Replay Flow

```text
HistoryPage loads:
  -> sessionsApi.listSessions()
  -> select session
  -> sessionsApi.getReplay(sessionId)
  -> map detail into replay timeline

Filters/search:
  -> client-side filter for current endpoint
  -> keep selected detail if still visible
```

Files involved:

- `frontend/src/pages/HistoryPage.tsx`
- `frontend/src/features/history/*`
- `frontend/src/features/workspace/workspaceViewModel.ts`
- `frontend/src/services/sessionsApi.ts`

### 6.6 System Flow

```text
AdminSettingsPage:
  -> adminApi.listModels()
  -> adminApi.listInvites()
  -> create model / invite
  -> reload data

McpServersPage:
  -> adminApi.listMcpServers()
  -> create/update/delete server
  -> discover tools
  -> health check
  -> show per-server operation state
```

Files involved:

- `frontend/src/pages/AdminSettingsPage.tsx`
- `frontend/src/pages/McpServersPage.tsx`
- `frontend/src/features/system/*`
- `frontend/src/services/adminApi.ts`

## 7. Error, Loading, Empty, Success Rules

| State | Rule |
| --- | --- |
| Loading | Page-level first load uses skeleton or subdued loading block. Button mutations use button loading. |
| Empty | Empty state must include next action when applicable. |
| Error | Page-level error uses `Alert`. Field-level errors stay near field when available. |
| Success | Mutations use toast or inline success state, not only silent refresh. |
| Dangerous action | Use `ConfirmDialog` before delete or destructive overwrite. |

## 8. Files That Will Be Affected

### 8.1 Must Modify

| File | Expected change |
| --- | --- |
| `frontend/src/app/App.tsx` | Rewire global toast and command palette location if needed. |
| `frontend/src/router/AppRouter.tsx` | Keep routes, update shell import path and possibly auth layout composition. |
| `frontend/src/components/AppShell.tsx` | Remove or replace legacy duplicate shell wrapper. |
| `frontend/src/components/shell/AppShell.tsx` | Rebuild shell layout, navigation, topbar, mobile nav. |
| `frontend/src/components/CommandPalette.tsx` | Move/rebuild under `components/command`, improve keyboard behavior. |
| `frontend/src/components/ConfirmDialog.tsx` | Rebuild as shared dialog primitive or wrapper. |
| `frontend/src/components/Toast.tsx` | Rebuild toast system or align with new UI primitives. |
| `frontend/src/components/ui/*` | Rebuild/extend shared UI primitives. |
| `frontend/src/pages/*.tsx` | Rebuild all page JSX and move repeated logic to feature components/services. |
| `frontend/src/styles/*.css` | Rebuild tokens, base, layout, components, pages. |

### 8.2 Should Modify Carefully

| File | Rule |
| --- | --- |
| `frontend/src/services/api.ts` | Preserve contracts. Add exports only when needed. Avoid changing wrapper semantics. |
| `frontend/src/hooks/useAuthSession.ts` | Preserve behavior. Only adapt if new shell needs explicit refresh helpers. |
| `frontend/src/stores/auth.ts` | Preserve storage format unless migration is added. |
| `frontend/src/components/ProtectedRoute.tsx` | Preserve route guard behavior. |
| `frontend/src/main.tsx` | Only modify if new global providers are required. |
| `frontend/package.json` | Only modify if confirmed dependency additions are accepted. |

### 8.3 New Files Expected

- `frontend/src/services/authApi.ts`
- `frontend/src/services/sessionsApi.ts`
- `frontend/src/services/knowledgeApi.ts`
- `frontend/src/services/imagesApi.ts`
- `frontend/src/services/adminApi.ts`
- `frontend/src/services/accountApi.ts`
- `frontend/src/features/workspace/*`
- `frontend/src/features/knowledge/*`
- `frontend/src/features/image/*`
- `frontend/src/features/history/*`
- `frontend/src/features/system/*`
- Optional: `frontend/src/hooks/useAsyncState.ts`

## 9. Independent Task List

Each task is designed to be independently reviewable and committable. Later tasks may depend on earlier foundation tasks, but each should leave the app buildable.

### Task 1: API Service Wrappers

Scope:

- Add endpoint wrapper modules under `frontend/src/services/`.
- Move raw endpoint strings out of pages only where touched by this task.
- Keep `api.ts` shared primitives unchanged.

Affected files:

- `frontend/src/services/api.ts`
- `frontend/src/services/authApi.ts`
- `frontend/src/services/sessionsApi.ts`
- `frontend/src/services/knowledgeApi.ts`
- `frontend/src/services/imagesApi.ts`
- `frontend/src/services/adminApi.ts`
- `frontend/src/services/accountApi.ts`

Verification:

- `cd frontend && pnpm build`
- Search check: `rg 'apiRequest<|streamRequest\\(' frontend/src/pages frontend/src/components` should show reduced or no direct raw endpoint use after migration is complete.

### Task 2: Design Tokens And Base CSS

Scope:

- Rebuild `tokens.css`, `base.css`, `global.css`.
- Define color, typography, spacing, radius, shadow, z-index, motion tokens.
- Remove visual patterns banned by spec.

Affected files:

- `frontend/src/styles/tokens.css`
- `frontend/src/styles/base.css`
- `frontend/src/styles/global.css`

Verification:

- `cd frontend && pnpm build`
- Manual CSS scan: no large purple/blue gradient background, no old one-off global styles dominating layout.

### Task 3: UI Primitive Components

Scope:

- Rebuild shared primitives: Button, Field, Input/Textarea/Select, Panel, Alert, Badge, StatusPill, EmptyState, Skeleton.
- Keep props small and stable.
- Do not add business logic.

Affected files:

- `frontend/src/components/ui/*`
- `frontend/src/styles/components.css`

Verification:

- `cd frontend && pnpm build`
- Manual import check: `frontend/src/components/ui/index.ts` exports all primitives.
- Visual smoke after shell task confirms states render consistently.

### Task 4: Dialog, Toast, ConfirmDialog

Scope:

- Rebuild modal/dialog structure.
- Rebuild confirm dialog for destructive actions.
- Rebuild toast container and toast API, or preserve current API with new UI.

Affected files:

- `frontend/src/components/ConfirmDialog.tsx`
- `frontend/src/components/Toast.tsx`
- `frontend/src/components/ui/Dialog.tsx`
- `frontend/src/styles/components.css`

Verification:

- `cd frontend && pnpm build`
- Keyboard check: Esc closes dialog; focus target remains usable.
- Destructive action pages still compile with confirm dialog.

### Task 5: App Shell And Navigation

Scope:

- Rebuild desktop shell, sidebar, topbar, user menu, mobile nav.
- Preserve route paths and admin-only navigation.
- Resolve duplicate shell files.

Affected files:

- `frontend/src/components/AppShell.tsx`
- `frontend/src/components/shell/AppShell.tsx`
- `frontend/src/components/shell/Sidebar.tsx`
- `frontend/src/components/shell/Topbar.tsx`
- `frontend/src/components/shell/UserMenu.tsx`
- `frontend/src/router/AppRouter.tsx`
- `frontend/src/styles/layout.css`

Verification:

- `cd frontend && pnpm build`
- Login with admin and normal user, verify admin navigation visibility.
- Check active nav state on every route.

### Task 6: Command Palette

Scope:

- Move/rebuild command palette under `components/command`.
- Support keyboard navigation, Enter, Esc, admin-only commands, logout.

Affected files:

- `frontend/src/components/CommandPalette.tsx`
- `frontend/src/components/command/CommandPalette.tsx`
- `frontend/src/app/App.tsx`
- `frontend/src/hooks/useKeyboard.ts`

Verification:

- `cd frontend && pnpm build`
- Manual check: `Cmd/Ctrl + K`, arrow keys, Enter navigation, Esc close.
- Normal user does not see admin commands.

### Task 7: Auth Pages

Scope:

- Rebuild login, invite register, forgot password, reset password pages with common auth layout.
- Preserve request behavior and navigation.

Affected files:

- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`
- `frontend/src/pages/ForgotPasswordPage.tsx`
- `frontend/src/pages/ResetPasswordPage.tsx`
- Optional: `frontend/src/features/auth/*`
- `frontend/src/styles/pages.css`

Verification:

- `cd frontend && pnpm build`
- Manual check: login success navigates to `/workspace/chat`.
- Manual check: failed login keeps username and shows error.

### Task 8: Workspace View Model

Scope:

- Add `workspaceViewModel.ts`.
- Map session detail, stream events, plan steps, tools, artifacts into timeline items.
- Add safe payload preview helpers.

Affected files:

- `frontend/src/features/workspace/workspaceViewModel.ts`
- Optional tests if test setup exists.

Verification:

- `cd frontend && pnpm build`
- Type check ensures all `SessionDetailResponse` mappings compile.
- Manual fixture check can be done by temporarily logging mapped items during later workspace task.

### Task 9: Research Workspace Page

Scope:

- Rebuild `WorkspacePage` using feature components.
- Implement session list, composer, knowledge binding, execution timeline, report panel, artifact panel.
- Preserve SSE flow and recovery behavior.

Affected files:

- `frontend/src/pages/WorkspacePage.tsx`
- `frontend/src/features/workspace/SessionList.tsx`
- `frontend/src/features/workspace/ResearchComposer.tsx`
- `frontend/src/features/workspace/ExecutionTimeline.tsx`
- `frontend/src/features/workspace/ToolInvocationList.tsx`
- `frontend/src/features/workspace/ArtifactPanel.tsx`
- `frontend/src/services/sessionsApi.ts`
- `frontend/src/services/knowledgeApi.ts`
- `frontend/src/styles/pages.css`

Verification:

- `cd frontend && pnpm build`
- Manual check: create session, bind knowledge bases, run task, see stream events, final reload, artifacts.
- Manual interruption check: backend stopped or network failure shows recoverable error.

### Task 10: Knowledge Base Workspace

Scope:

- Rebuild knowledge page as resource workspace.
- Add knowledge list, summary, document table, upload, index, search test.

Affected files:

- `frontend/src/pages/KnowledgeBasesPage.tsx`
- `frontend/src/features/knowledge/*`
- `frontend/src/services/knowledgeApi.ts`
- `frontend/src/styles/pages.css`

Verification:

- `cd frontend && pnpm build`
- Manual check: create KB, upload document, trigger index, run search test, delete KB.
- Empty state check with no KB.

### Task 11: Image Studio

Scope:

- Rebuild image generation page.
- Separate text-to-image and edit modes.
- Show result gallery, status, error, history.

Affected files:

- `frontend/src/pages/ImageGenerationPage.tsx`
- `frontend/src/features/image/*`
- `frontend/src/services/imagesApi.ts`
- `frontend/src/styles/pages.css`

Verification:

- `cd frontend && pnpm build`
- Manual check: generate image, edit image with file upload if backend configured, history reloads.
- Empty history check.

### Task 12: History Replay

Scope:

- Rebuild history page as execution replay workspace.
- Reuse workspace timeline mapping.
- Add filters/search within current API constraints.

Affected files:

- `frontend/src/pages/HistoryPage.tsx`
- `frontend/src/features/history/*`
- `frontend/src/features/workspace/workspaceViewModel.ts`
- `frontend/src/services/sessionsApi.ts`
- `frontend/src/styles/pages.css`

Verification:

- `cd frontend && pnpm build`
- Manual check: load sessions, select replay, see query, plan steps, tools, report, artifacts.
- Error check: failed replay request allows retry without clearing list.

### Task 13: Model Settings

Scope:

- Rebuild model configuration page.
- Group by model type/provider.
- Preserve invite generation unless later split into a separate admin page.
- Show masked key, enabled state, warning states.

Affected files:

- `frontend/src/pages/AdminSettingsPage.tsx`
- `frontend/src/features/system/ModelRegistry.tsx`
- `frontend/src/features/system/ModelForm.tsx`
- `frontend/src/services/adminApi.ts`
- `frontend/src/styles/pages.css`

Verification:

- `cd frontend && pnpm build`
- Manual admin check: list models, create model, create invite, copy invite.
- Normal user check: access denied state.

### Task 14: MCP Server Management

Scope:

- Rebuild MCP page with server registry, form, health/discover actions, tool list.
- Show transport type, endpoint/command line, health, discover cache, security hints.

Affected files:

- `frontend/src/pages/McpServersPage.tsx`
- `frontend/src/features/system/McpServerRegistry.tsx`
- `frontend/src/features/system/McpServerForm.tsx`
- `frontend/src/features/system/McpToolList.tsx`
- `frontend/src/services/adminApi.ts`
- `frontend/src/styles/pages.css`

Verification:

- `cd frontend && pnpm build`
- Manual admin check: create/update/delete server, health check, discover tools.
- STDIO entry shows whitelist/security hint.

### Task 15: Account Center

Scope:

- Rebuild account page into profile/security/login logs sections.
- Preserve profile update, password change, login logs and API config if still required.

Affected files:

- `frontend/src/pages/AccountPage.tsx`
- Optional: `frontend/src/features/account/*`
- `frontend/src/services/accountApi.ts`
- `frontend/src/styles/pages.css`

Verification:

- `cd frontend && pnpm build`
- Manual check: load profile/logs, update profile, change password validation.
- Empty login logs state.

### Task 16: Responsive And Accessibility Pass

Scope:

- Desktop, tablet, mobile layout cleanup.
- Keyboard focus, dialog focus, command palette, reduced motion.
- Text overflow and table/list wrapping.

Affected files:

- `frontend/src/styles/layout.css`
- `frontend/src/styles/components.css`
- `frontend/src/styles/pages.css`
- Any component with accessibility gaps.

Verification:

- `cd frontend && pnpm build`
- Browser manual check at 1440px, 1024px, 390px.
- Keyboard-only smoke: nav, forms, dialogs, command palette.

### Task 17: Cleanup And Documentation Sync

Scope:

- Remove unused duplicate components and stale CSS.
- Update docs if implementation deviates from this design.
- Ensure no old visual system remnants remain.

Affected files:

- `frontend/src/components/*`
- `frontend/src/styles/*`
- `docs/frontend-full-rebuild-tech-design-aiagent-v2.md`
- `docs/frontend-full-rebuild-spec-aiagent-v2.md` if needed

Verification:

- `cd frontend && pnpm build`
- `rg` check for unused legacy class names or duplicate shell imports.
- Final manual smoke of all routes.

## 10. Suggested Commit Sequence

Recommended sequence:

1. API service wrappers.
2. Tokens/base CSS.
3. UI primitives.
4. Dialog/toast/confirm.
5. Shell/navigation.
6. Command palette.
7. Auth pages.
8. Workspace view model.
9. Research workspace.
10. Knowledge base workspace.
11. Image studio.
12. History replay.
13. Model settings.
14. MCP management.
15. Account center.
16. Responsive/accessibility pass.
17. Cleanup/docs sync.

Rationale:

- Foundation tasks keep later page work smaller.
- Workspace view model is separated from the workspace page because it carries the highest behavioral risk.
- Resource pages can be implemented independently after shell and primitives exist.
- Cleanup is intentionally last to avoid deleting components still needed during migration.

## 11. Validation Strategy

### 11.1 Build Gate

Every task must pass:

```bash
cd frontend
pnpm build
```

### 11.2 Manual Route Smoke

After shell and page tasks:

```text
/login
/register/invite
/forgot-password
/reset-password
/workspace/chat
/workspace/knowledge-bases
/workspace/image-generation
/workspace/history
/admin/settings
/admin/mcp-servers
/account
```

### 11.3 Critical User Flows

- Login -> workspace.
- Create session -> run task -> stream events -> final report/artifacts.
- Create KB -> upload document -> index -> search test.
- Generate image -> view history.
- Open history -> replay session.
- Admin creates model and invite.
- Admin creates MCP server -> health -> discover tools.
- Account profile and password forms.

### 11.4 Regression Checks

- Routes unchanged.
- API response wrapper unchanged.
- `ProtectedRoute` still blocks unauthenticated access.
- Admin routes still hide navigation for normal users and show denied state if directly accessed.
- SSE parser behavior unchanged unless intentionally extended.

## 12. Open Decisions Before Implementation

- 是否允许新增图标库？推荐 `lucide-react`，但可不加依赖完成第一版。
- 是否允许新增 Radix primitives？如果不允许，Dialog、Tabs、Popover 需要自建基础交互。
- 邀请码管理是否继续留在模型配置页，还是后续拆成独立管理员页面？
- 模型测试连接接口是否存在？若不存在，前端只展示“待后端支持”的禁用入口。
- 历史回放是否保持单页详情面板，还是新增详情路由？当前建议保持单页，避免改路由契约。
- 是否需要为 `api.ts` 的 DTO 类型拆分文件？当前建议暂不拆，避免影响范围过大。

## 13. Initial Implementation Recommendation

确认后建议从 Task 1 到 Task 5 开始，先完成服务层、token、组件和 shell。不要先重写单个业务页，因为旧 shell 和旧组件会限制页面重构质量。

第一批可合并范围建议：

- Task 1: API service wrappers
- Task 2: Design tokens and base CSS
- Task 3: UI primitive components
- Task 4: Dialog/toast/confirm
- Task 5: App shell and navigation

完成这批后，所有业务页面可以逐个替换，且每个页面 PR 的风险会明显降低。

## 14. Implementation Completion

The full rebuild was completed in the planned 17-task sequence.

- Pages call domain API wrappers instead of raw endpoint helpers.
- The application shell, command palette, authentication flow, workspaces, admin pages, and account center use the rebuilt component system.
- Responsive layouts, keyboard focus, mobile navigation, permission-denied states, and a dedicated 404 route are implemented.
- Existing routes, API response envelopes, protected-route behavior, and SSE parsing contracts remain unchanged.
- Model and personal API connection-test actions remain disabled because the backend does not expose a connection-test API.

Final verification includes:

```bash
cd frontend
pnpm build

rg 'apiRequest<|apiRequest\(|streamRequest\(' src/pages src/components src/features
rg 'style=\{|gradient|backdrop-filter|100vh|连接测试成功' src
```

The `rg` checks must return no matches. Browser smoke coverage includes all public, workspace, account, and admin routes at desktop and mobile widths.
