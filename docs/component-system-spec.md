# AiAgent 组件高保真规格

> 任务来源：`docs/tasks.md` D03。本文档基于 `docs/visual-system-spec.md` 定义通用组件的关键状态、交互规则和实现边界，供后续 C01-C08、S01-S03、W/K/I/A 页面任务使用。本文档不改变业务范围，不引入 assistant-ui runtime，不替代后续页面高保真稿。

## 1. 组件设计原则

| 原则 | 说明 |
| --- | --- |
| Token first | 所有组件使用 `docs/visual-system-spec.md` 的语义 token，不在组件内散落 raw hex。 |
| 状态显性 | default、hover、focus、active、disabled、loading、empty、error 等适用状态必须可见且可区分。 |
| 键盘可达 | Button、IconButton、Tabs、Dialog、DropdownMenu、CommandPalette 等交互组件必须支持键盘操作和可见 focus。 |
| 信息优先 | 审计、RAG、工具调用和 JSON 详情默认摘要优先，原始数据折叠展示。 |
| 低噪声 | Badge、StatusPill、Panel、Table 不做强装饰，避免全站“白卡 + 胶囊 + 重阴影”的后台模板感。 |
| 不改变业务语义 | 组件升级只改变展示和交互质量，不改变 API、权限、路由和核心业务流程。 |

## 2. 状态矩阵

| 组件 | Default | Hover | Focus | Active | Disabled | Loading | Empty | Error | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button | 必须 | 必须 | 必须 | 必须 | 必须 | 必须 | 不适用 | danger/error variant | C01 |
| IconButton | 必须 | 必须 | 必须 | 必须 | 必须 | 可选 | 不适用 | danger tone | C01 |
| Badge | 必须 | 仅可点击 badge 需要 | 仅可点击 badge 需要 | 仅可点击 badge 需要 | 仅可点击 badge 需要 | 不适用 | 不适用 | danger tone | C02 |
| StatusPill | 必须 | 不适用 | 不适用 | 不适用 | 不适用 | running 状态 | unknown 状态 | failed/error 状态 | C02 |
| Panel | 必须 | 仅可点击 panel 需要 | 仅可点击 panel 需要 | 仅可点击 panel 需要 | 可选 | 可通过 Skeleton | 必须 | 必须 | C03 |
| Table | 必须 | row hover | row/action focus | row/action active | 行操作可 disabled | 必须 | 必须 | 必须 | C04 |
| Tabs | 必须 | 必须 | 必须 | active trigger | disabled trigger 可选 | tab content 可 loading | tab content 可 empty | tab content 可 error | C05 |
| Alert | 必须 | 不适用 | 内部 action 需要 | 内部 action 需要 | 不适用 | 可选 | 不适用 | error tone | C06 |
| EmptyState | 必须 | action hover | action focus | action active | action disabled | 不适用 | 本体 | permission denied / no results | C06 |
| Skeleton | 必须 | 不适用 | 不适用 | 不适用 | 不适用 | 本体 | 不适用 | 不适用 | C06 |
| Dialog | 必须 | footer action hover | focus trap | action active | action disabled | 必须 | 可选 | danger confirm / submit error | D03/C01/C06 |
| DropdownMenu | 必须 | highlighted item | keyboard focus | selected item | disabled item | 可选 | empty menu 可选 | danger item | C08 |
| CommandPalette | 必须 | selected item | keyboard focus | selected/enter | admin-only hidden/disabled | searching | empty result | command error 可选 | C08 |
| JsonBlock/Details | collapsed default | summary hover | summary focus | expanded | 可选 | 不适用 | empty payload | parse error | C07 |

## 3. 全局组件状态规则

### 3.1 Focus

- 使用 `:focus-visible`，不隐藏键盘 focus ring。
- 默认 focus ring 使用 `docs/visual-system-spec.md` 的 cyan ring。
- Danger 控件使用 danger focus ring。
- Dialog、DropdownMenu、CommandPalette 必须将焦点限制在浮层内或由 Radix/cmdk 管理。

### 3.2 Hover 与 Active

- Hover 只改变颜色、边框、surface 或轻微 opacity，不改变组件尺寸。
- Active 使用 `transform`，不得使用 `top/left/width/height` 触发布局重排。
- Button active：`translateY(1px) scale(0.99)`。
- IconButton active：`scale(0.96)`。
- Selectable tile/card active：保持尺寸不变，只改变 outline 与 selected surface。

### 3.3 Disabled

- Disabled 状态必须同时具备语义属性和视觉变化。
- 使用 `disabled`、`aria-disabled` 或 Radix `data-disabled`。
- Disabled 不响应 hover/active。
- 文案不得只说“不可用”，需要在上下文中给出原因或替代动作。

### 3.4 Loading

- 异步动作超过 `300ms` 时显示 loading。
- Button loading 禁止重复提交，保留原按钮宽度，避免文字跳动。
- 页面/表格 loading 使用 Skeleton，不用全屏 spinner。
- Dialog submit loading 时关闭按钮和提交按钮的可用性要明确。

### 3.5 Empty 与 Error

- EmptyState 必须说明当前为空的对象和下一步动作。
- Error state 必须说明失败原因和恢复路径。
- 表格、Tabs 内容区、Panel 内容区都不能在 empty/error 时只显示空白。
- API error 不清空用户已输入内容。

## 4. Button

涉及文件：`frontend/src/components/ui/Button.tsx`

### 4.1 变体

| Variant | 用途 | 视觉 |
| --- | --- | --- |
| `primary` | 页面唯一主操作、运行研究、保存关键配置 | cyan 背景、inverse 文字 |
| `secondary` | 默认操作、非破坏性表单操作 | surface 背景、default border |
| `ghost` | 轻量操作、工具栏、行内操作 | 无边框，hover 显示 subtle surface |
| `danger` | 删除、停用、危险确认 | danger 背景或 danger soft 背景，视层级决定 |

### 4.2 尺寸

| Size | 高度 | 用途 |
| --- | --- | --- |
| `sm` | `32px` | 表格行操作、紧凑工具栏 |
| `md` | `40px` | 默认按钮 |
| `lg` | `44px` | 移动端主操作、Auth 主按钮 |

### 4.3 状态

| 状态 | 规格 |
| --- | --- |
| Default | `rounded-md`，字体 `--text-md` / `font-weight: 500`，gap `8px`。 |
| Hover | Primary 使用 `--color-primary-hover`；secondary/ghost 使用 `--color-surface-subtle`。 |
| Focus | 使用 cyan focus ring；danger 使用 danger focus ring。 |
| Active | `transform: translateY(1px) scale(0.99)`。 |
| Disabled | `disabled` 属性，opacity 降低，cursor 不显示 pointer，不触发 hover。 |
| Loading | `aria-busy=true`；禁用按钮；spinner 或 progress icon 与文字同色；宽度不跳动。 |
| Danger | 破坏性动作应有明确文案，必要时配合 Dialog 二次确认。 |

验收要点：

- loading 和 disabled 都不能重复触发 `onClick`。
- 图标按钮样式不得通过 Button 模拟，使用 IconButton。
- 同一视图中只保留一个 primary CTA。

## 5. IconButton

涉及文件：`frontend/src/components/ui/IconButton.tsx`

### 5.1 变体

| Tone | 用途 | 视觉 |
| --- | --- | --- |
| `default` | 工具栏、关闭、刷新、展开、复制 | surface 背景、default border |
| `danger` | 删除、移除、撤销危险配置 | danger text，hover danger soft |

### 5.2 状态

| 状态 | 规格 |
| --- | --- |
| Default | 最小可见尺寸 `40x40px`；移动端关键按钮使用 `44x44px`。 |
| Hover | surface subtle 或 primary subtle；danger 使用 danger soft。 |
| Focus | 必须有 `aria-label`，focus ring 可见。 |
| Active | `transform: scale(0.96)`。 |
| Disabled | `disabled` 属性或 `aria-disabled=true`，不响应 hover。 |
| Loading | 仅用于刷新、同步、下载等图标按钮；显示小 spinner，保留 `aria-label`。 |

验收要点：

- 禁止 icon-only button 缺少 `aria-label`。
- 不使用文字 tooltip 替代 `aria-label`；tooltip 只能作为补充说明。

## 6. Badge

涉及文件：`frontend/src/components/ui/Badge.tsx`

### 6.1 Tone

| Tone | 用途 |
| --- | --- |
| `neutral` | 普通标签、未知、低优先级 meta |
| `primary` | 当前筛选、active context、轻量品牌强调 |
| `success` | 成功、完成、已连接 |
| `warning` | 风险、暂停、需注意 |
| `danger` | 失败、错误、过期 |
| `info` | 普通信息、非运行态说明 |

### 6.2 状态

| 状态 | 规格 |
| --- | --- |
| Default | 紧凑矩形，`radius-xs` 或 `radius-sm`；不默认胶囊。 |
| Hover | 只有 badge 作为 filter chip 或可点击标签时才有 hover。 |
| Focus | 可点击 badge 必须使用 button/link 语义和 focus ring。 |
| Active | 可点击 selected badge 使用 primary outline 或 primary subtle 背景。 |
| Disabled | 可点击 badge 可 disabled；普通 badge 不需要 disabled。 |
| Error | 使用 danger tone，配合文字说明。 |

验收要点：

- 普通 badge 只做信息标记，不承担按钮职责。
- 不用 success/warning/danger 做装饰色。

## 7. StatusPill

涉及文件：`frontend/src/components/ui/StatusPill.tsx`

### 7.1 状态映射

| 状态 | Tone | 文案 |
| --- | --- | --- |
| `IDLE` | neutral | 空闲 |
| `PENDING` | info | 等待中 |
| `RUNNING` / `PROCESSING` | running/info | 执行中 / 处理中 |
| `PAUSED` | warning | 已暂停 |
| `CANCEL_REQUESTED` | warning | 取消中 |
| `CANCELLED` | neutral/warning | 已取消 |
| `COMPLETED` / `SUCCESS` | success | 已完成 / 成功 |
| `FAILED` / `ERROR` / `TIMED_OUT` | danger | 失败 / 错误 / 已超时 |
| `HEALTHY` / `ACTIVE` | success | 健康 / 活跃 |
| `UNHEALTHY` / `INACTIVE` | danger | 异常 / 未激活 |
| unknown | neutral | 原始状态值 |

### 7.2 状态

| 状态 | 规格 |
| --- | --- |
| Default | Badge + 小状态点；点和文字同时表达状态。 |
| Running | cyan/running tone，可使用轻微 pulse，但必须尊重 reduced motion。 |
| Failed/Error | danger tone，必要时旁边提供错误摘要入口。 |
| Unknown | neutral tone，直接显示后端原始状态，避免吞掉未知值。 |

验收要点：

- StatusPill 只表达状态，不用于普通分类标签。
- 暗色主题下不能只靠点颜色表达状态，文案必须可见。

## 8. Panel

涉及文件：`frontend/src/components/ui/Panel.tsx`

### 8.1 变体

| Variant | 用途 |
| --- | --- |
| `default` | 普通工具区、表单分区 |
| `plain` | 页面布局容器，不增加卡片感 |
| `subtle` | 次级背景、轻量分组 |
| `raised` | Popover 内的重点块或少数高层信息 |
| `empty` | 空态容器，可与 EmptyState 组合 |

### 8.2 状态

| 状态 | 规格 |
| --- | --- |
| Default | `radius-md`，default border，surface 背景，默认不使用重阴影。 |
| Hover | 只有可点击 Panel 需要 hover；边框增强或 surface subtle。 |
| Focus | 可点击 Panel 必须使用 button/link 语义或 `tabIndex=0` + keyboard handler。 |
| Active | selected Panel 使用 primary outline，不改变尺寸。 |
| Loading | 内容区使用 Skeleton，标题和 action 保持稳定。 |
| Empty | 与 EmptyState 组合，说明空对象和下一步动作。 |
| Error | 内容区用 Alert，保留 header/action。 |
| With footer | Footer 用 border-top 分隔，按钮右对齐或按移动端换行。 |

验收要点：

- 不把每个页面区块都包成 raised card。
- Panel header action 在窄屏可换行，不遮挡标题。

## 9. Table

涉及文件：`frontend/src/components/ui/Table.tsx`

### 9.1 结构

| 元素 | 规格 |
| --- | --- |
| Wrapper | 默认支持横向滚动；小屏可在页面任务中切成卡片列表。 |
| Header | `text-xs`、`font-weight: 600`、中性 muted，不使用全大写过度强调。 |
| Row | 默认高度稳定，hover 不改变行高。 |
| Cell | 默认 `text-sm`；长文本截断并在详情中可见。 |
| Numeric cell | 右对齐，mono 或 tabular numbers。 |
| Status cell | 使用 StatusPill，保持紧凑。 |

### 9.2 状态

| 状态 | 规格 |
| --- | --- |
| Default | clear header、row divider、surface 背景。 |
| Hover row | `--color-surface-subtle`，不改变尺寸。 |
| Focus | 行内按钮/链接可聚焦；可选 row focus 使用 outline inset。 |
| Active/selected | selected row 使用 primary subtle + left indicator 或 outline。 |
| Disabled row/action | 行内操作 disabled；行文本降低对比但仍可读。 |
| Loading | 3-5 行 table skeleton，列宽近似真实内容。 |
| Empty | 表格 wrapper 内显示 EmptyState，不显示空白表体。 |
| Error | 表格上方或表体内显示 Alert + retry。 |
| Expanded | 展开行使用 surface inset，JSON/详情默认折叠。 |

验收要点：

- 审计和 RAG 表格优先结构化字段，原始 payload 进入展开详情。
- 小屏不得压缩列到不可读；使用横向滚动或卡片化。

## 10. Tabs

涉及文件：`frontend/src/components/ui/Tabs.tsx`

### 10.1 形态

| 类型 | 用途 |
| --- | --- |
| Segmented tabs | 页面内小范围切换，如设置分区 |
| Underline tabs | Inspector Tabs、数据详情、宽内容区 |
| Overflow tabs | 小屏或 tab 数量多时横向滚动 |

### 10.2 状态

| 状态 | 规格 |
| --- | --- |
| Default | muted text，容器 border 或 underline。 |
| Hover | 文本进入 foreground，背景轻微 subtle。 |
| Focus | Radix trigger focus ring 可见，左右键可切换。 |
| Active | primary indicator + foreground text，不能只靠背景。 |
| Disabled | `data-disabled`，不可点击，文案仍可读。 |
| Loading content | tab 内容区显示 Skeleton，不切换回空白。 |
| Empty content | tab 内容区显示 EmptyState。 |
| Error content | tab 内容区显示 Alert + retry。 |
| Mobile overflow | 横向滚动，trigger 不换行挤压。 |

验收要点：

- Inspector Tabs 至少能承载产物、证据、记忆、工具。
- 切换 tab 不丢失用户当前输入。

## 11. Alert

涉及文件：`frontend/src/components/ui/Alert.tsx`

### 11.1 Tone

| Tone | 语义 | Role |
| --- | --- | --- |
| `info` | 普通提示、说明 | `status` |
| `success` | 操作成功、连接成功 | `status` |
| `warning` | 风险、配置缺失、可恢复异常 | `status` |
| `error` | 请求失败、权限失败、保存失败 | `alert` |

### 11.2 状态

| 状态 | 规格 |
| --- | --- |
| Default | icon + title/message 可选；边框和 soft 背景来自状态 token。 |
| Error | 说明原因和恢复动作，不能只显示“失败”。 |
| With action | action 使用 Button/Link，支持 hover/focus/active。 |
| Dismissible | 关闭按钮必须有 aria-label；关闭后不影响表单输入。 |

验收要点：

- Error Alert 使用 `role=alert`。
- Success 不使用感叹号式文案，保持克制。

## 12. EmptyState

涉及文件：`frontend/src/components/ui/EmptyState.tsx`

### 12.1 类型

| 类型 | 用途 |
| --- | --- |
| `plain` | 普通无数据 |
| `with action` | 可创建、上传、重新检索、返回工作台 |
| `permission denied` | 无权限访问管理或资源 |
| `no results` | 筛选/搜索无结果 |
| `first run` | 工作台、图片、知识库首次使用引导 |

### 12.2 状态

| 状态 | 规格 |
| --- | --- |
| Default | 居中或就地展示，标题清楚，说明不超过两行。 |
| With action | 主动作最多一个，次动作使用 link/secondary。 |
| Permission denied | 说明权限限制，提供返回可访问页面。 |
| No results | 显示当前筛选条件，提供清除筛选。 |
| Mobile | padding 收紧，按钮换行，不溢出。 |

验收要点：

- 空态不能写产品功能说明文，不占据过多屏幕。
- 空态 action 必须是真实可用动作。

## 13. Skeleton

涉及文件：`frontend/src/components/ui/Skeleton.tsx`

### 13.1 类型

| 类型 | 用途 |
| --- | --- |
| `list` | 会话列表、历史列表 |
| `table` | 审计、RAG、文档表格 |
| `card` | 管理总览指标、图片历史卡片 |
| `feed item` | Agent feed、工具调用、证据卡 |
| `form` | Auth、模型配置、MCP 表单 |

### 13.2 状态

| 状态 | 规格 |
| --- | --- |
| Default | 使用 muted surface，radius 匹配真实组件。 |
| Compact | 用于表格、meta 行。 |
| Loading | `aria-busy=true`，必要时提供 `aria-label=正在加载`。 |
| Reduced motion | pulse 动效禁用或降为静态。 |

验收要点：

- Skeleton 尺寸要接近真实内容，减少加载完成后的 CLS。
- 不使用全屏 spinner 作为页面默认加载态。

## 14. Dialog

涉及文件：`frontend/src/components/ui/Dialog.tsx`

### 14.1 类型

| 类型 | 用途 |
| --- | --- |
| `default` | 表单、详情、确认轻量动作 |
| `danger confirm` | 删除、停用、清除配置 |
| `loading action` | 保存、测试连接、下载集合 |
| `mobile` | 小屏全宽或底部 sheet 化 |

### 14.2 状态

| 状态 | 规格 |
| --- | --- |
| Default | overlay 使用 `--color-overlay`；content 使用 raised surface、radius-lg、shadow-lg。 |
| Focus | 打开后 focus 首个可操作元素；关闭后回到触发器。 |
| Active | Footer action 使用 Button active 规则。 |
| Disabled | 提交条件不足时禁用主按钮，并说明原因。 |
| Loading | 提交按钮 loading；关闭按钮是否禁用按破坏程度决定。 |
| Error | 表单错误就近展示；全局错误放 footer 上方 Alert。 |
| Danger confirm | danger 标题/按钮 + 明确后果；必要时要求二次输入。 |
| Mobile | 宽度 `calc(100vw - 2rem)`；内容过高时内部滚动，footer 固定可达。 |

验收要点：

- Dialog 必须有 title；description 缺省时提供 sr-only 描述。
- Escape 和 overlay click 的行为要符合当前业务风险。

## 15. DropdownMenu

涉及文件：`frontend/src/components/ui/DropdownMenu.tsx`

### 15.1 Item 类型

| 类型 | 用途 |
| --- | --- |
| `default` | 普通命令 |
| `selected` | 当前选项或当前排序 |
| `disabled` | 暂不可用命令 |
| `danger item` | 删除、移除、停用 |
| `separator/group` | 分组大量操作 |

### 15.2 状态

| 状态 | 规格 |
| --- | --- |
| Default | popover surface、border-default、shadow-md。 |
| Hover / highlighted | `data-highlighted` 使用 surface subtle；danger 使用 danger soft。 |
| Focus | Radix keyboard highlight 可见。 |
| Active / selected | selected item 有 check icon 或 leading indicator，不只靠颜色。 |
| Disabled | `data-disabled`，不可选，opacity 降低但文案可读。 |
| Empty | 无命令时不打开菜单或显示 disabled empty item。 |
| Danger | 与普通项分隔，避免误触。 |

验收要点：

- 菜单项高度不小于 `32px`，移动端触控菜单不小于 `40px`。
- 命令超过 7 项时考虑分组或 CommandPalette。

## 16. CommandPalette

涉及文件：`frontend/src/components/command/CommandPalette.tsx`

### 16.1 区域

| 区域 | 规格 |
| --- | --- |
| Overlay | 使用 `--color-overlay`，点击外部关闭。 |
| Input | 自动 focus，placeholder 简短。 |
| Group | 工作区、账户、系统分组清晰。 |
| Item | 标题 + 简短描述；支持关键字搜索。 |
| Empty | 无匹配命令时显示空态。 |

### 16.2 状态

| 状态 | 规格 |
| --- | --- |
| Default | 居中浮层，最大宽度约 `560px`，列表最大高度可滚动。 |
| Searching | 输入时保持结果区域稳定，不跳动。 |
| Hover / selected | `data-selected=true` 使用 primary subtle 或 surface subtle。 |
| Focus | `Cmd/Ctrl+K` 打开后 input focus；方向键移动选择。 |
| Active | Enter 执行当前命令，执行后关闭。 |
| Empty | 显示“没有匹配的命令”并保留搜索词。 |
| Admin-only | 普通用户不显示 admin 命令，不显示不可达入口。 |
| Error | logout 或导航异常时可显示 Alert，不吞掉错误。 |

验收要点：

- `Escape` 关闭；关闭后回到触发上下文。
- CommandPalette 不替代主导航，只作为快捷入口。

## 17. JsonBlock / Details

涉及文件：`frontend/src/features/workspace/JsonBlock.tsx`

### 17.1 状态

| 状态 | 规格 |
| --- | --- |
| Collapsed default | 默认折叠，summary 显示摘要标签和可展开 affordance。 |
| Hover | summary 文本进入 foreground，背景轻微变化。 |
| Focus | summary 可键盘 focus，focus ring 可见。 |
| Expanded | content 使用 mono、surface inset、max-height + overflow auto。 |
| Long payload | 自动换行，保留缩进，最大高度不超过 `320px`。 |
| Empty payload | 显示“暂无详情数据”，不展示空 pre。 |
| Parse error | 显示原始字符串，同时标注“结构化解析失败”。 |

验收要点：

- 原始 JSON 和 payload 永远不是默认首屏主体。
- 审计/RAG/工具调用先展示结构化摘要，再提供展开详情。

## 18. 组件实现映射

| 后续任务 | 组件 | 实现重点 |
| --- | --- | --- |
| C01 | Button、IconButton | 统一 hover/focus/active/loading/disabled；补 `lg` 尺寸和 loading icon button。 |
| C02 | Badge、StatusPill | Badge 改紧凑矩形；StatusPill 增补 running/unknown 语义和中文映射。 |
| C03 | Panel | 减少 raised 默认；补 empty/error/loading 组合规范。 |
| C04 | Table | 增强 loading/empty/error/expanded/numeric column；保留横向 overflow。 |
| C05 | Tabs | 支持 Inspector Tabs、overflow/mobile、loading/empty/error content。 |
| C06 | Alert、EmptyState、Skeleton | 增加 warning、dismissible/with action、table/card/feed skeleton。 |
| C07 | JsonBlock/Details | 摘要优先、默认折叠、长 payload 滚动、parse error。 |
| C08 | DropdownMenu、CommandPalette | 分组、selected、danger item、empty/searching、keyboard focus。 |

## 19. 验收清单

- Button、IconButton 覆盖 default、hover、focus、active、disabled、loading、danger。
- Badge 覆盖 neutral、primary、success、warning、danger、info，默认紧凑矩形。
- StatusPill 覆盖 idle、running、paused、completed、failed、cancelled、unknown。
- Panel 覆盖 default、subtle、raised、empty、with action、with footer、loading、error。
- Table 覆盖 loading、empty、error、hover row、selected/active row、expanded row、numeric column。
- Tabs 覆盖 default、hover、focus、active、disabled、overflow/mobile、loading/empty/error content。
- Alert 覆盖 info、success、warning、error、with action、dismissible。
- EmptyState 覆盖 plain、with action、permission denied、no results。
- Skeleton 覆盖 list、table、card、feed item、form，并尊重 reduced motion。
- Dialog 覆盖 default、danger confirm、loading action、mobile、error。
- DropdownMenu 覆盖 default、selected、disabled、danger item、keyboard highlight。
- CommandPalette 覆盖 default、searching、empty、keyboard focus、admin-only items、error。
- JsonBlock/Details 覆盖 collapsed、expanded、long payload、empty payload、parse error。
- 所有 icon-only 交互均有 `aria-label`。
- 所有 keyboard focus 均可见。
- 所有状态色均配合文字或图标，不只靠颜色。

## 20. 当前状态

D03 已完成。下一项任务是 D04 “产出第一轮页面高保真”。
