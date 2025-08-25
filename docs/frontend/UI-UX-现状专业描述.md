## 项目 UI/UX 现状（专业描述）

本文件基于当前代码仓库（Next.js App Router + React + TypeScript、Tailwind CSS、Radix/shadcn/ui、next-themes）对 HackX 的界面与交互现状进行“据实描述”，不包含改进建议。

## 设计系统与基础

### 技术与组件基座
- 框架：Next.js（App Router），React + TypeScript。
- 设计体系：Tailwind CSS，`tailwindcss-animate`，Radix UI 基础之上的 shadcn/ui 组件集合（由 `components.json` 配置驱动）。
- 主题：`next-themes` 提供深浅色切换，`ThemeProvider` 注入于 `app/layout.tsx`。
- 图标：`lucide-react` 作为统一图标源。

### 样式与 Token
- Tailwind 已启用暗色模式 `darkMode: ["class"]`，并在 `globals.css` 使用 CSS 变量为主题色、背景、前景等定义基色与状态色。
- `globals.css` 覆盖基础排版、滚动条、容器等通用样式；整体间距采用 Tailwind 工具类在组件内就地声明。

### 响应式
- 页面与组件普遍使用 Tailwind 的栅格与断点（如 `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`）实现响应式布局。
- 列表/卡片在较窄视口下自动换行，表格型信息多采用卡片化分组呈现。

### 交互与动效
- 使用 `tailwindcss-animate` 简化进入/离开动画与过渡；按钮、切换、Tabs 等组件含有 Hover/Active 状态类。
- Toast 与 Dialog 采用 shadcn/ui 模式，统一样式来源于组件库。

### 可访问性（a11y）
- 表单元素配对 `Label` 与 `Input`；大多数交互组件来自 Radix/shadcn（含基础 ARIA 行为）。
- 切换/菜单/对话框等组件遵循无障碍交互规范；页面主要内容区可通过语义标签分区（如 `CardHeader`、`CardContent`）。

## 导航与布局

### 全局布局（`app/layout.tsx`）
- 根布局在 `<html>` 上启用 `suppressHydrationWarning`；`ThemeProvider` 包裹应用树；`Header` 放置于所有页面上方，`Toaster` 全局启用。
- 字体：`Inter` 通过 Next Fonts 注入 `className` 至 `body`。

### 头部（`components/layout/header.tsx`）
- 结构：左侧为站点 Logo/名称与主导航；右侧为主题切换（`ThemeToggle`）与认证入口（登录/注册按钮）。
- 桌面端：主导航以文本链接呈现（如“黑客松”、“项目”、“团队”、“社区”、“Web3”）。
- 移动端：通过 `Sheet` 抽屉呈现移动菜单，含与桌面一致的导航项。

### 底部（`components/layout/footer.tsx`）
- 结构：包含基础链接分组与版权区域；视觉简单，使用栅格进行链接编排。

## 首页与公共组件

### 首页（`app/page.tsx` 与 `components/home/*`）
- 模块组成：
  - Hero 区：标题与描述，强调平台定位；
  - Featured Hackathons：精选黑客松卡片栅格；
  - How It Works：分步说明平台流程；
  - Stats：平台统计数据（项目/黑客松/开发者等）；
  - Community：社区入口与社交链接模块。
- 视觉：使用卡片化区块、图标与简要文案，模块间以垂直留白区分。

### 通用 UI 组件（`components/ui/*`）
- 按钮、输入、选择器、Tabs、Dialog、Dropdown、Card、Badge、Progress、Textarea、Switch、Sheet、Table、Calendar 等组件齐备，风格与 shadcn/ui 一致。
- Toast 与 Toaster 统一管理通知；`use-toast` 提供调用接口。

## 认证（Auth）

### 登录（`app/auth/signin/page.tsx`）
- 结构：
  - 社交登录占位（GitHub、钱包）按钮位于顶部栅格；
  - 分割线中部文案“或使用邮箱登录”；
  - 邮箱/密码表单与提交按钮；
  - 底部辅助链接（忘记密码、跳转注册）。
- 交互：
  - 表单受控，提交过程中按钮显示加载状态；
  - 成功后跳转 Dashboard；失败通过 Toast 展示消息。

### 注册（`app/auth/signup/page.tsx`）
- 结构：
  - 社交注册占位按钮；
  - 分割线“或使用邮箱注册”；
  - 用户名/邮箱/密码/确认密码表单；同意服务条款的 `Checkbox`；
  - 提交按钮与已注册跳转登录入口。
- 交互：
  - 基础一致性校验（密码一致性、是否勾选条款）；
  - 提交加载态、结果 Toast，成功后跳转 Dashboard。

## 黑客松（Hackathons）

### 列表（`app/hackathons/page.tsx`）
- 顶部包含搜索与筛选（如赛道、技术、时间、状态）；
- 内容以卡片栅格呈现黑客松项，展示标题、简介、状态、主办方等。

### 详情（`app/hackathons/[id]/page.tsx`）
- 信息分块：概览、时间点（开始/截止）、赛道与规则、奖池信息、主办方说明；
- 右侧与底部提供关键行动按钮（报名、查看结果或投稿入口）。

### 创建与投稿（`app/hackathons/create/page.tsx`、`app/hackathons/[id]/submit/page.tsx`）
- 采用分组表单布局，含基本信息、时间区间、奖池设置、规则说明等输入项；
- 支持 IPFS 上传组件接入以处理附件/资源链接。

## 项目（Projects）

### 列表（`app/projects/page.tsx` + `components/project/*`）
- 顶部提供项目搜索与排序；
- 项目卡片显示封面图、状态徽章（如“精选”“获奖”）、评分、团队与成员头像、技术栈标签、投票数、查看详情按钮等。

### 详情（`app/projects/[id]/page.tsx`）
- 内容区包含项目简介、技术栈、团队成员与仓库/演示链接；
- 可能含与黑客松关联信息（所属赛道、排名、奖项等）。

## 团队（Teams）

### 列表与详情（`app/teams/page.tsx`、`app/teams/[id]/page.tsx`）
- 列表：卡片包含团队名称、成员数、招募信息等；
- 详情：展示团队简介、成员列表与角色、在研项目或招募职位。

### 创建（`app/teams/create/page.tsx`）
- 表单包含团队名称、简介、招募角色等字段；
- 使用统一表单组件与输入控件呈现。

## 社区（Community）

### 列表（`app/community/page.tsx`）
- 顶部提供搜索/筛选（分类、标签），内容以卡片或列表展示帖子摘要、作者与时间、互动统计。

### 新帖（`app/community/new/page.tsx`）
- 表单包含标题、分类、标签、正文等输入；
- 支持发布/草稿等操作按钮。

### 帖子详情（`app/community/posts/[id]/page.tsx`）
- 帖子正文、作者信息、时间、标签、互动按钮（点赞/评论等）；
- 侧边栏可能包含推荐/分类导航。

## IPFS（`app/ipfs/page.tsx` + `components/ipfs/*`）
- 模块包含文件上传、固定（Pin）、网关链接展示、复制链接按钮；
- 上传/结果/错误状态通过卡片与 Toast 呈现。

## 通知（Notifications）

### 通知中心（`app/notifications/page.tsx`）
- 列表展示通知项（类型图标、标题、正文、时间、动作链接），支持筛选与已读状态标记。

### 通知设置（`app/notifications/settings/page.tsx`）
- 卡片化的开关分组，按“通知方式”“通知类型”等分区；
- 保存/重置操作区在页面底部卡片中呈现。

## Web3 中心（`app/web3/page.tsx` + `components/web3/*`）
- Tab 切换 4 个子模块：
  - 钱包连接（`components/web3/wallet-connect.tsx`）：连接状态、地址复制、网络状态徽章、余额；
  - DAO 治理（`components/web3/dao-governance.tsx`）：提案列表/状态条/投票按钮、统计卡；
  - 代币质押（`components/web3/token-staking.tsx`）：质押/解质押/奖励领取三分区，统计卡与进度；
  - NFT 证书（`components/web3/nft-certificates.tsx`）：证书卡、弹窗详情、分享/下载操作。

## 后台（Admin）

### 管理面板（`app/admin/page.tsx`）
- 顶部统计卡（用户、活跃、帖子、待审核等）；
- 用户管理、内容管理、黑客松管理三大分区，以 Tabs 区分；
- 表格/卡片结合，配有操作菜单（提升、暂停、删除等）与确认对话框。

### 安全与风控（`components/security/*`、`lib/security.ts`）
- 内容审核与安全规则列表、用户安全画像、策略启用状态；
- 管理端按钮与表格样式与全站保持一致。

## 主题与偏好
- 主题切换：`ThemeToggle` 在头部右侧；主题状态通过 `next-themes` 控制，暗黑主题生效于全站。
- 偏好与本地存储：`use-auth`、通知服务等在客户端使用 `localStorage` 记录用户信息与偏好；SSR 与构建阶段通过守卫避免访问浏览器 API。

## 文案与语言
- 站内主要使用中文界面文案，采用简体中文标点；
- 页面模块标题简洁，操作按钮文本以动词为主（如“创建”“提交”“查看详情”）。

## 图标与插画
- 图标统一来自 `lucide-react`，用于模块标题、统计卡、操作按钮与状态标识；
- 插画与图形元素使用较少，页面以卡片与图标为主要视觉元素。 