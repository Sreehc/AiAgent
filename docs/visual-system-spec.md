# AiAgent 视觉系统高保真规格

> 任务来源：`docs/tasks.md` D02。本文档将 graphite/zinc + restrained cyan/teal 视觉方向落成可执行的设计 token，供后续组件高保真、页面高保真和前端实现使用。本文档不包含组件逐状态稿和页面布局稿；对应内容分别由 D03、D04、D05 交付。

## 1. 视觉原则

| 原则 | 说明 |
| --- | --- |
| 工作台优先 | 视觉应服务于研究、检索、审计和配置效率，不使用营销页式大面积装饰。 |
| 中性底色 | graphite/zinc 作为主体，保证长时间阅读、表格扫描和日志排查不疲劳。 |
| 克制强调 | cyan/teal 只用于主操作、运行态、active navigation、focus ring 和关键信息强调。 |
| 状态语义清晰 | success、warning、danger、info 不与品牌色混用，状态必须配合文字或图标，不只依赖颜色。 |
| 亮暗同源 | light/dark 两套主题同时设计，不能简单反相。 |
| 低噪声质感 | 默认使用边框、分层背景和轻微阴影建立层级，避免过重投影、渐变和胶囊标签堆叠。 |

## 2. 色彩系统

### 2.1 基础色阶

#### Graphite / Zinc

| Token | Hex | 用途 |
| --- | --- | --- |
| `graphite-950` | `#0c0f13` | 暗色背景、最高优先文本 |
| `graphite-900` | `#111318` | 亮色主文本、暗色深表面 |
| `graphite-850` | `#151a21` | 暗色 surface |
| `graphite-800` | `#1b222b` | 暗色 subtle surface |
| `graphite-700` | `#2a3340` | 暗色 border |
| `zinc-600` | `#525866` | 亮色 muted text |
| `zinc-500` | `#7b8190` | 亮色 soft text、meta text |
| `zinc-300` | `#d9dee7` | 亮色 border |
| `zinc-200` | `#e8ebf0` | 亮色 soft border |
| `zinc-100` | `#f2f4f7` | 亮色 subtle surface |
| `zinc-050` | `#f7f8fa` | 亮色 app background |

#### Cyan / Teal

| Token | Hex | 用途 |
| --- | --- | --- |
| `cyan-700` | `#0e7490` | 主按钮 hover、强调文本 |
| `cyan-600` | `#0891b2` | 主操作、active、focus |
| `cyan-500` | `#06b6d4` | 运行中状态、图表强调 |
| `cyan-300` | `#67e8f9` | 暗色主操作 hover、暗色高亮 |
| `cyan-100` | `#cffafe` | 亮色 selected/focus soft |
| `cyan-050` | `#ecfeff` | 亮色 very subtle tint |
| `teal-600` | `#0d9488` | 次级高亮、成功以外的系统联通感 |
| `teal-300` | `#5eead4` | 暗色次级高亮 |

使用限制：

- `cyan-600` 是唯一默认品牌主色。
- `teal-600` 只能作为同色系辅助强调，不用于 success。
- 不再使用绿色/橙色作为品牌主色；橙色只保留 warning。

### 2.2 亮色主题语义 token

| CSS Token | Hex / Value | 用途 |
| --- | --- | --- |
| `--color-bg` | `#f7f8fa` | App 背景 |
| `--color-bg-strong` | `#eef1f4` | Shell、侧栏、页面分割背景 |
| `--color-surface` | `#ffffff` | 默认 panel、表格、表单表面 |
| `--color-surface-subtle` | `#f2f4f7` | 次级 panel、hover row、输入底色 |
| `--color-surface-raised` | `#ffffff` | Popover、Dropdown、Dialog |
| `--color-surface-inset` | `#eaedf1` | 代码块、JSON、内嵌详情 |
| `--color-overlay` | `rgba(12, 15, 19, 0.48)` | Modal overlay |
| `--color-text` | `#111318` | 主文本 |
| `--color-text-muted` | `#525866` | 次级文本 |
| `--color-text-soft` | `#7b8190` | 时间、说明、placeholder |
| `--color-text-inverse` | `#f8fafc` | 深色按钮文字 |
| `--color-border` | `#d9dee7` | 默认边框 |
| `--color-border-strong` | `#b6bfcc` | 强边界、选中 outline |
| `--color-border-soft` | `#e8ebf0` | 分割线、表格行 |
| `--color-primary` | `#0891b2` | 主操作、active navigation |
| `--color-primary-hover` | `#0e7490` | 主操作 hover |
| `--color-primary-soft` | `#cffafe` | 选中背景、轻量提示 |
| `--color-primary-subtle` | `#ecfeff` | hover/selected very subtle |
| `--color-accent` | `#0d9488` | 辅助强调，不作为状态色 |
| `--color-accent-hover` | `#0f766e` | 辅助强调 hover |
| `--color-accent-soft` | `#ccfbf1` | 辅助强调背景 |

### 2.3 暗色主题语义 token

| CSS Token | Hex / Value | 用途 |
| --- | --- | --- |
| `--color-bg` | `#0c0f13` | App 背景 |
| `--color-bg-strong` | `#11161c` | Shell、侧栏、页面分割背景 |
| `--color-surface` | `#151a21` | 默认 panel、表格、表单表面 |
| `--color-surface-subtle` | `#1b222b` | 次级 panel、hover row、输入底色 |
| `--color-surface-raised` | `#1e2630` | Popover、Dropdown、Dialog |
| `--color-surface-inset` | `#0f141a` | 代码块、JSON、内嵌详情 |
| `--color-overlay` | `rgba(0, 0, 0, 0.64)` | Modal overlay |
| `--color-text` | `#f1f5f9` | 主文本 |
| `--color-text-muted` | `#a8b1bf` | 次级文本 |
| `--color-text-soft` | `#768194` | 时间、说明、placeholder |
| `--color-text-inverse` | `#062936` | 浅色按钮文字 |
| `--color-border` | `#2a3340` | 默认边框 |
| `--color-border-strong` | `#3a4655` | 强边界、选中 outline |
| `--color-border-soft` | `#202833` | 分割线、表格行 |
| `--color-primary` | `#22d3ee` | 主操作、active navigation |
| `--color-primary-hover` | `#67e8f9` | 主操作 hover |
| `--color-primary-soft` | `#123744` | 选中背景、轻量提示 |
| `--color-primary-subtle` | `#0e2730` | hover/selected very subtle |
| `--color-accent` | `#5eead4` | 辅助强调，不作为状态色 |
| `--color-accent-hover` | `#99f6e4` | 辅助强调 hover |
| `--color-accent-soft` | `#113a35` | 辅助强调背景 |

### 2.4 Tailwind bridge token

`frontend/src/styles/tokens.css` 应作为语义 token 的主来源，`frontend/src/styles/theme.css` 仅桥接 Tailwind/internal UI variables。

| Tailwind token | Light HSL | Dark HSL | 映射 |
| --- | --- | --- | --- |
| `--background` | `220 23% 98%` | `216 23% 6%` | `--color-bg` |
| `--foreground` | `225 17% 8%` | `210 40% 96%` | `--color-text` |
| `--card` | `0 0% 100%` | `217 22% 11%` | `--color-surface` |
| `--card-foreground` | `225 17% 8%` | `210 40% 96%` | `--color-text` |
| `--popover` | `0 0% 100%` | `216 23% 15%` | `--color-surface-raised` |
| `--popover-foreground` | `225 17% 8%` | `210 40% 96%` | `--color-text` |
| `--primary` | `191 92% 36%` | `188 86% 53%` | `--color-primary` |
| `--primary-foreground` | `210 40% 98%` | `194 80% 12%` | `--color-text-inverse` |
| `--secondary` | `220 24% 95%` | `216 23% 15%` | `--color-surface-subtle` |
| `--secondary-foreground` | `225 17% 8%` | `210 40% 96%` | `--color-text` |
| `--muted` | `220 24% 95%` | `216 23% 15%` | `--color-surface-subtle` |
| `--muted-foreground` | `223 11% 36%` | `218 15% 70%` | `--color-text-muted` |
| `--accent` | `183 100% 96%` | `192 55% 12%` | `--color-primary-subtle` |
| `--accent-foreground` | `191 82% 24%` | `188 86% 76%` | `--color-primary-hover` / dark primary hover |
| `--border` | `219 22% 88%` | `215 21% 21%` | `--color-border` |
| `--input` | `219 22% 88%` | `215 21% 21%` | `--color-border` |
| `--ring` | `191 92% 36%` | `188 86% 53%` | `--color-primary` |

## 3. 状态色

| 状态 | Light text | Light soft | Dark text | Dark soft | 用途 |
| --- | --- | --- | --- | --- | --- |
| `success` | `#15803d` | `#dcfce7` | `#4ade80` | `#10291c` | 完成、通过、连接成功 |
| `warning` | `#b45309` | `#fef3c7` | `#fbbf24` | `#35260a` | 风险、缺配置、处理中断 |
| `danger` | `#dc2626` | `#fee2e2` | `#f87171` | `#3b1215` | 错误、失败、破坏性操作 |
| `info` | `#2563eb` | `#dbeafe` | `#93c5fd` | `#14213f` | 普通信息、说明、非运行态通知 |
| `running` | `#0891b2` | `#cffafe` | `#22d3ee` | `#123744` | Agent 执行中、SSE streaming |
| `paused` | `#7c3aed` | `#ede9fe` | `#c4b5fd` | `#241a3f` | 暂停、等待用户继续 |
| `neutral` | `#525866` | `#f2f4f7` | `#a8b1bf` | `#1b222b` | idle、unknown、普通标签 |

规则：

- 状态 token 只用于状态组件、Alert、表格状态列和日志摘要。
- Warning 使用 amber，不得用品牌 cyan/teal 代替。
- Success 使用 green，但不得承担品牌强调。
- Danger/destructive 操作需要文字确认或二次确认，不只依赖红色按钮。

## 4. 字体与排版

### 4.1 字体栈

| Token | 字体栈 | 用途 |
| --- | --- | --- |
| `--font-sans` | `"Geist Sans", "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif` | 全站 UI、正文、表单、导航 |
| `--font-mono` | `"IBM Plex Mono", "SFMono-Regular", Consolas, monospace` | ID、代码、JSON、日志、耗时、分数、token 数 |

字体规则：

- 本地托管优先，使用 `font-display: swap`。
- 字体加载失败时自动 fallback，不阻塞页面渲染。
- 数字密集区域启用 `font-variant-numeric: tabular-nums`。
- 长 ID、URL、文件名默认截断，tooltip 或展开详情中展示完整值。
- 全站 `letter-spacing` 默认为 `0`。

### 4.2 字号与行高

| Token | Size | Line-height | Weight | 用途 |
| --- | --- | --- | --- | --- |
| `--text-xs` | `12px` | `16px` | `500` | 表格 meta、badge、辅助说明 |
| `--text-sm` | `13px` | `18px` | `400/500` | 表格单元格、次级正文 |
| `--text-md` | `14px` | `20px` | `400/500/600` | 默认 UI 文本、按钮、输入 |
| `--text-base` | `16px` | `24px` | `400/500` | 长正文、报告内容 |
| `--text-lg` | `18px` | `26px` | `600` | 卡片标题、分区标题 |
| `--text-xl` | `22px` | `30px` | `600` | 页面标题 |
| `--text-2xl` | `28px` | `36px` | `650/700` | 关键页面标题、Auth 标题 |
| `--text-3xl` | `34px` | `42px` | `700` | 首屏品牌标题，仅认证页或空态使用 |

## 5. 间距与布局

### 5.1 间距 scale

| Token | Value | 用途 |
| --- | --- | --- |
| `--space-0` | `0` | reset |
| `--space-1` | `4px` | 紧凑元素内部间距、图标间隔 |
| `--space-2` | `8px` | badge、表格内元素、控件间距 |
| `--space-3` | `12px` | button padding、列表行内间距 |
| `--space-4` | `16px` | 表单组、panel 内边距最小值 |
| `--space-5` | `20px` | 紧凑 panel 内边距 |
| `--space-6` | `24px` | 默认页面分区间距 |
| `--space-8` | `32px` | 页面主分区、空态内容间距 |
| `--space-10` | `40px` | 大块内容上下间距 |
| `--space-12` | `48px` | Auth、空态、页面顶部留白 |
| `--space-16` | `64px` | 少数首屏或大空态使用 |

### 5.2 布局尺寸

| Token | Value | 用途 |
| --- | --- | --- |
| `--sidebar-width` | `248px` | 桌面侧栏 |
| `--topbar-height` | `56px` | 顶栏 |
| `--control-height-sm` | `32px` | 小按钮、小输入 |
| `--control-height-md` | `40px` | 默认按钮、输入、select |
| `--control-height-lg` | `44px` | 触控友好主操作 |
| `--content-max-width` | `1600px` | 主内容最大宽度 |
| `--workspace-inspector-width` | `360px` | 工作台右侧 Inspector |
| `--workspace-session-width` | `280px` | 工作台会话列 |

响应式规则：

- `>= 1200px`：工作台可使用三栏。
- `< 1200px`：Inspector 进入主内容下方 tabs 或抽屉。
- `< 900px`：页面主体改为单列，导航进入移动菜单。
- `< 640px`：表格优先横向滚动或卡片化，不能压缩到不可读。

## 6. 圆角、边框与阴影

### 6.1 圆角

| Token | Value | 用途 |
| --- | --- | --- |
| `--radius-xs` | `4px` | badge、表格标签、内嵌 code |
| `--radius-sm` | `6px` | 小按钮、输入、紧凑控件 |
| `--radius-md` | `8px` | panel、table wrapper、dropdown item |
| `--radius-lg` | `12px` | dialog、popover、sheet |
| `--radius-xl` | `16px` | Auth 容器、少数高层 overlay |
| `--radius-full` | `999px` | 头像、圆形 icon button，不作为 badge 默认形态 |

规则：

- 普通 panel/card 默认不超过 `8px`。
- Badge 默认使用 `4px` 或 `6px`，不使用全局胶囊。
- 圆角层级应由外到内逐级减小。

### 6.2 边框

| Token | Light | Dark | 用途 |
| --- | --- | --- | --- |
| `--border-subtle` | `1px solid #e8ebf0` | `1px solid #202833` | 分割线、表格行 |
| `--border-default` | `1px solid #d9dee7` | `1px solid #2a3340` | panel、input、table wrapper |
| `--border-strong` | `1px solid #b6bfcc` | `1px solid #3a4655` | 选中、拖拽、重点边界 |
| `--border-primary` | `1px solid #0891b2` | `1px solid #22d3ee` | active、focus 辅助边界 |

### 6.3 阴影

| Token | Light | Dark | 用途 |
| --- | --- | --- | --- |
| `--shadow-none` | `none` | `none` | 默认页面区块 |
| `--shadow-sm` | `0 1px 2px rgba(17, 19, 24, 0.06)` | `0 1px 2px rgba(0, 0, 0, 0.28)` | 轻微浮起 |
| `--shadow-md` | `0 14px 36px rgba(17, 19, 24, 0.10)` | `0 18px 44px rgba(0, 0, 0, 0.38)` | dropdown、popover |
| `--shadow-lg` | `0 24px 72px rgba(17, 19, 24, 0.16)` | `0 28px 88px rgba(0, 0, 0, 0.48)` | dialog、sheet |
| `--shadow-focus` | `0 0 0 4px rgba(8, 145, 178, 0.20)` | `0 0 0 4px rgba(34, 211, 238, 0.22)` | focus 辅助，不单独使用 |

规则：

- 页面层级优先靠背景、边框和间距区分，阴影只用于浮层和可交互 overlay。
- 暗色主题 panel 默认不使用强投影，靠边框和表面亮度区分。

## 7. Focus、hover 与 active state

### 7.1 Focus ring

| 场景 | Light | Dark |
| --- | --- | --- |
| 默认控件 | `0 0 0 2px #ffffff, 0 0 0 4px rgba(8, 145, 178, 0.42)` | `0 0 0 2px #151a21, 0 0 0 4px rgba(34, 211, 238, 0.46)` |
| 深色主按钮 | `0 0 0 2px #f7f8fa, 0 0 0 4px rgba(8, 145, 178, 0.36)` | `0 0 0 2px #0c0f13, 0 0 0 4px rgba(34, 211, 238, 0.42)` |
| danger 控件 | `0 0 0 2px #ffffff, 0 0 0 4px rgba(220, 38, 38, 0.26)` | `0 0 0 2px #151a21, 0 0 0 4px rgba(248, 113, 113, 0.30)` |

规则：

- 所有 keyboard focus 必须可见。
- 使用 `:focus-visible`，鼠标点击不应产生持续强 focus ring。
- Icon-only button 必须有 `aria-label`，点击区域不小于 `40px`，移动端主操作不小于 `44px`。

### 7.2 Hover state

| 元素 | Hover 规则 |
| --- | --- |
| Primary button | 背景切换到 `--color-primary-hover`，文字保持 inverse |
| Secondary button | 背景切换到 `--color-surface-subtle`，边框增强一级 |
| Ghost button | 背景切换到 `--color-primary-subtle` 或 surface subtle |
| Table row | 使用 `--color-surface-subtle`，不得改变行高 |
| Nav item | 背景使用 `--color-primary-subtle`，active item 增加左侧或底部 indicator |
| Image tile | 显示轻微 outline 和 action overlay，不能遮挡主体预览 |

### 7.3 Active / pressed state

| 元素 | Active 规则 |
| --- | --- |
| Button | `transform: translateY(1px) scale(0.99)`，transition 使用 `--transition-fast` |
| IconButton | `transform: scale(0.96)`，背景保持 hover 色 |
| Selectable card/tile | outline 切换到 primary，背景进入 selected subtle，不改变尺寸 |
| Nav item | 保持 active indicator，不使用大面积高饱和背景 |
| Tabs trigger | active 下方/左侧 indicator，文字使用 `--color-text` 或 primary |

状态切换不得造成布局跳动。涉及动画时只使用 `transform` 和 `opacity`。

## 8. 动效与过渡

| Token | Value | 用途 |
| --- | --- | --- |
| `--transition-fast` | `140ms cubic-bezier(0.2, 0, 0, 1)` | hover、press、focus |
| `--transition-normal` | `180ms cubic-bezier(0.2, 0, 0, 1)` | dropdown、tabs、tooltip |
| `--transition-slow` | `240ms cubic-bezier(0.2, 0, 0, 1)` | dialog、sheet、page-level reveal |

规则：

- 支持 `prefers-reduced-motion: reduce`，将非必要动效降到 `1ms`。
- loading 超过 `300ms` 时显示 skeleton 或明确 loading 状态。
- 不使用持续闪烁、循环光效或装饰性大面积动画。

## 9. 使用规则

### 9.1 推荐用法

- 主 CTA、运行中状态、active nav、focus ring 使用 cyan。
- 页面主体用 graphite/zinc 中性色组织信息层级。
- 表格、审计、RAG 详情优先使用结构化字段，原始 JSON 放入折叠详情。
- 数据列、耗时、分数、ID 使用 mono 或 tabular numbers。
- Panel 用于明确工具区、浮层、重复项目，不把每个页面区块都做成卡片。

### 9.2 禁止用法

- 禁止重新引入绿色/橙色作为品牌主色。
- 禁止大面积 cyan/teal 背景铺满页面。
- 禁止把 warning、success、danger 当作装饰色。
- 禁止 badge 默认胶囊化。
- 禁止在组件内写散落 raw hex；实现阶段应落到语义 token。
- 禁止用隐藏 focus ring 换取视觉简洁。
- 禁止移动端关键操作依赖 hover。

## 10. 后续任务交接

| 后续任务 | 使用方式 |
| --- | --- |
| D03 组件高保真 | 以本文件 token 为唯一视觉基础，补齐组件 default/hover/focus/active/disabled/loading/empty/error 状态。 |
| D04 第一轮页面高保真 | 登录/注册、研究工作台、知识库、图片工作室、管理总览必须同时输出 light/dark 和桌面/移动布局。 |
| D05 第二轮页面高保真 | 历史、账号、模型、MCP、审计、RAG、404 不得自行引入新色系或新组件状态。 |
| E02/E03 工程实现 | `tokens.css` 为主 token 源；`theme.css` 只做 Tailwind bridge；避免保留绿橙品牌色。 |
| T01-T07 回归验证 | 截图覆盖 light/dark、1440x900、1280x800、768x1024、390x844，并固定测试数据。 |

## 11. 当前状态

D02 已完成。下一项任务是 D03 “产出组件高保真”。
