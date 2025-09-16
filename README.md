# Hackerverse - 去中心化黑客松平台

<div align="center">

![Hackerverse Logo](./frontend/public/placeholder-logo.png)

**首个完全基于区块链和IPFS的去中心化黑客松平台**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?logo=ethereum&logoColor=white)](https://ethereum.org/)
[![i18n](https://img.shields.io/badge/i18n-Ready-green)](https://next-intl.dev/)

[🚀 在线演示](#) | [📖 English README](./README-EN.md) | [🐛 问题反馈](../../issues) | [💬 讨论区](../../discussions)

</div>

## ✨ 项目概述

Hackerverse 是一个革命性的去中心化黑客松平台，集成智能合约自动化管理、IPFS永久存储、多钱包支持和社区治理功能，为全球开发者提供公平、透明、高效的创新竞赛生态系统。

### 🎯 核心特性

- 🔗 **完全去中心化**: 基于智能合约的自动化管理，无需中心化机构
- 📦 **永久存储**: 所有数据存储在IPFS，确保数据永久性和可访问性  
- 🔐 **Web3原生**: 纯钱包登录，支持 MetaMask、WalletConnect 等主流钱包
- 🏛️ **智能合约**: 自动化黑客松管理、项目提交、评分系统
- 🎨 **现代UI**: 基于 Next.js 15 + Tailwind CSS + 57个自定义组件，支持暗黑模式
- 🌍 **国际化支持**: 完整的中英文国际化，支持多语言扩展
- 👥 **团队协作**: 完整的团队管理和智能匹配系统
- 💬 **社区讨论**: 分类讨论、实时通知、内容审核
- 🔔 **智能通知**: 15+种通知类型，多渠道推送系统
- 🏆 **DAO治理**: 去中心化治理，社区投票决策

## 🏗️ 技术架构

### 核心技术栈

#### 前端 (Frontend)
- **框架**: Next.js 15.2.4 (App Router)
- **语言**: TypeScript 5+
- **UI框架**: React 19 + Tailwind CSS 3.4+
- **组件库**: Radix UI + 57个自定义组件 (shadcn/ui)
- **国际化**: next-intl (支持中英文)
- **Web3集成**: wagmi 2.0 + viem 2.0 + ethers.js
- **状态管理**: React Hooks + Context API
- **动画**: Framer Motion 12+
- **表单**: React Hook Form + Zod 验证
- **图表**: Recharts 2.15+

#### 后端 (Backend)  
- **框架**: Next.js API Routes
- **数据库**: PostgreSQL + Prisma ORM 5.7.1
- **认证**: JWT + 钱包签名验证 + bcryptjs
- **存储**: IPFS + 本地文件系统
- **通知系统**: 统一通知服务 + 邮件推送
- **安全**: Helmet + CORS + 内容审核

#### 区块链 (Blockchain)
- **智能合约**: Solidity ^0.8.20
- **开发框架**: Hardhat
- **部署网络**: BSC Testnet
- **子图索引**: The Graph Protocol
- **合约功能**: 黑客松管理、DAO治理、NFT证书、代币质押

### 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端应用层 (Next.js 15)                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │   用户界面      │ │   Web3集成      │ │   状态管理      │    │
│  │ - React组件     │ │ - 钱包连接      │ │ - Zustand       │    │
│  │ - Tailwind CSS  │ │ - 合约交互      │ │ - 实时更新      │    │
│  │ - Radix UI      │ │ - 签名验证      │ │ - 路由管理      │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      后端API层 (Next.js API Routes)               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │   业务逻辑      │ │   数据管理      │ │   服务集成      │    │
│  │ - RESTful API   │ │ - Prisma ORM    │ │ - IPFS服务      │    │
│  │ - 权限管理      │ │ - PostgreSQL    │ │ - 智能合约      │    │
│  │ - 通知服务      │ │ - Redis缓存     │ │ - 邮件服务      │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                          区块链层                                │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │   智能合约      │ │   IPFS存储      │ │   事件监听      │    │
│  │ - HackXCore     │ │ - 用户数据      │ │ - 事件同步      │    │
│  │ - 用户管理      │ │ - 项目文件      │ │ - 状态更新      │    │
│  │ - 项目管理      │ │ - 活动信息      │ │ - 数据验证      │    │
│  │ - 评分系统      │ │ - 元数据        │ │ - 错误处理      │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 快速开始

### 环境要求

- Node.js 18.0+
- npm/yarn/pnpm
- PostgreSQL 14+
- Redis 6+
- MetaMask 或其他Web3钱包

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/Hackerverse.git
cd Hackerverse
```

2. **安装依赖**
```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖  
cd ../backend
npm install

# 安装智能合约依赖
cd ../contracts
npm install

# 安装子图依赖 (可选)
cd ../subgraph
npm install
```

3. **环境配置**
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 配置必要的环境变量
# Backend (.env):
# - DATABASE_URL (PostgreSQL)
# - JWT_SECRET
# - IPFS_PROJECT_ID
# - IPFS_PROJECT_SECRET

# Frontend (.env.local):
# - NEXT_PUBLIC_API_URL
# - NEXT_PUBLIC_CONTRACT_ADDRESS
# - NEXT_PUBLIC_CHAIN_ID
```

4. **数据库初始化**
```bash
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
```

5. **启动服务**
```bash
# 启动后端服务 (端口 3002)
cd backend
npm run dev

# 启动前端服务 (端口 3000)
cd frontend  
npm run dev
```

6. **部署智能合约** (可选)
```bash
cd contracts
npm run deploy:sepolia  # 或其他网络
```

### 🌐 访问应用

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:3002
- **数据库管理**: npx prisma studio (在backend目录下运行)

## 📱 功能模块

> **📋 功能状态说明**: 以下标记基于实际代码验证 (2025年9月16日)
> - ✅ **已完整实现**: 前后端完整，可正常使用，支持中英文国际化
> - ⚠️ **部分缺失**: 核心功能存在但有重要组件缺失
> - 🔄 **API就绪**: 后端API完整，前端集成待完善

### ✅ 已实现功能

#### 1. 用户认证与权限管理 ✅
- 🔐 **Web3钱包认证**: 支持 MetaMask、WalletConnect 等主流钱包登录
- 📧 **传统认证**: 邮箱/密码注册登录（备用方案）
- 👤 **用户资料管理**: 头像、用户名、邮箱、技能栈、个人简介编辑
- 🛡️ **角色权限系统**: USER/ADMIN/MODERATOR/JUDGE 四级权限
- 📊 **用户统计**: 参与次数、获奖记录、声誉分数展示
- 🌍 **完整国际化**: 所有用户界面支持中英文切换

#### 2. 黑客松管理 ✅
- 📝 **黑客松创建**: 完整的创建向导，包含基本信息、时间设置、奖项配置
- 🔍 **搜索与筛选**: 关键词搜索、状态筛选、技术栈筛选、奖金范围筛选
- 📋 **详细信息管理**: 活动描述、规则设置、评审标准、赞助商信息
- ⏰ **状态管理**: DRAFT/ACTIVE/COMPLETED/CANCELLED 生命周期
- 🎯 **参与管理**: 用户报名、参与状态跟踪、统计数据展示
- 🔗 **智能合约集成**: 链上数据存储、IPFS元数据管理
- 🏠 **首页展示**: 特色黑客松、平台统计、搜索推荐功能

#### 3. 项目提交与展示 ⚠️ **部分功能缺失**
- 📤 **项目提交**: 在黑客松中提交项目 (hackathons/[id]/submit)
- 📁 **文件管理**: 代码仓库链接、演示视频、项目截图、文档上传
- 📦 **IPFS存储**: 分布式文件存储、多网关支持、数据完整性验证
- 👍 **互动功能**: 项目点赞、评论反馈、收藏分享 (后端API支持)
- 📊 **项目状态**: DRAFT/SUBMITTED/REVIEWED/WINNER/REJECTED 流程管理
- ❌ **缺失功能**: 独立的项目创建页面、项目列表页面

#### 4. 团队协作 ✅
- 👥 **团队创建**: 团队基本信息、技能需求、成员上限设置
- 📝 **申请系统**: 加入申请表单、技能展示、申请理由填写
- ✅ **申请审核**: 队长审核申请、批准/拒绝成员加入
- 📨 **邀请功能**: 队长主动邀请用户加入团队，通知系统集成
- 🔍 **团队搜索**: 按黑客松、技能、状态等条件筛选团队
- 📋 **成员管理**: 团队成员列表、角色分配、加入时间记录
- 🎯 **智能匹配**: 基于技能和黑客松匹配推荐团队

#### 5. 社区讨论 ✅
- 💬 **分类讨论**: general/technical/showcase/help/announcement 五大分类
- 📝 **发帖功能**: Markdown富文本编辑、图片上传、话题标签
- 👍 **社交互动**: 点赞、收藏、多级回复、用户关注
- 🔍 **内容搜索**: 关键词搜索、分类筛选、排序功能（最新/最热/回复多/浏览多）
- 📊 **社区统计**: 活跃度统计、优秀贡献者排行、热门内容推荐
- 📚 **个人收藏夹**: 用户可收藏感兴趣的帖子

#### 6. 评审系统
- ⭐ **多维度评分**: 创新性、技术复杂度、用户体验、商业潜力、展示质量
- 👨‍⚖️ **评委管理**: 评委角色分配、评审权限控制
- 📊 **评分统计**: 自动计算平均分、排名生成、结果公布
- 💬 **评审反馈**: 评分理由记录、项目反馈意见

#### 7. Web3集成
- 🔗 **智能合约**: HackXCore 主合约部署、用户注册、黑客松创建
- 📦 **IPFS存储**: 用户数据、项目文件、活动信息永久存储
- 🌐 **多链支持**: BSC Testnet 部署，支持网络切换
- 💰 **交易管理**: Gas费估算、交易状态跟踪、重试机制

#### 8. 通知系统 ✅
- 🔔 **多类型通知**: 团队邀请、申请状态、活动提醒、系统公告等15+种
- 📱 **多渠道推送**: 站内信、邮件通知、浏览器推送
- ⚙️ **个性化设置**: 通知偏好配置、推送时间设置、通知类型开关
- 📋 **通知管理**: 批量操作、分类筛选、已读/未读状态管理
- 🎯 **智能通知**: 基于用户行为的通知优先级和频率控制
- 📨 **社区通知**: 单独的社区消息页面，支持帖子回复、点赞等通知

#### 9. 个人仪表板 ✅
- 📊 **数据概览**: 参与黑客松数量、项目统计、团队情况、声誉分数
- 📈 **统计图表**: 活动参与趋势、技能雷达图、成就进度展示
- 🔄 **最近活动**: 时间线展示用户最近的操作和参与记录
- 🎯 **个性化推荐**: 基于用户兴趣推荐相关黑客松和团队
- ✏️ **资料编辑**: 在线编辑个人信息、技能栈、头像上传
- 📋 **多标签管理**: 黑客松、项目、团队、社区等分类展示



### 🔄 高级功能（优化功能）

#### 已有基础框架但未完全实现
- 🏛️ **DAO治理系统**: 后端API完整 (proposals/vote/execute)，前端集成待验证
- 🎨 **NFT证书系统**: 后端API完整 (mint/query)，前端集成待验证  
- 💎 **代币质押系统**: 后端API完整 (stake/unstake/claim)，前端集成待验证
- 🔍 **The Graph索引**: 子图配置已创建，事件索引待优化

#### 管理后台功能 ⚠️ **API完整但前端严重缺失**
- 👥 **用户管理**: ✅ 后端API完整，❌ 前端管理界面缺失
- 📝 **内容审核**: ✅ 后端API完整，❌ 前端审核界面缺失
- 📊 **数据统计**: ✅ 后端API完整，❌ 前端数据面板缺失
- ⚙️ **系统配置**: ✅ 后端API完整，❌ 前端配置界面缺失
- 🛡️ **安全管理**: ✅ 前端页面存在 (admin/security)

### 📋 计划功能

#### 🚨 急需补充的核心功能
- 📤 **独立项目管理**: 项目列表页面、创建项目页面
- 👨‍💼 **完整管理后台前端**: 用户管理、内容审核、数据统计界面
- 🔗 **Web3功能前端集成**: DAO/NFT/质押功能的用户界面
- 📊 **项目展示优化**: 项目筛选、排序、分类展示

#### 高级团队协作功能
- 💬 团队内部聊天室
- 📋 任务分配与进度跟踪
- 📅 团队日程安排  
- 📁 团队文件共享空间
- 🗳️ 团队决策投票系统

#### 智能化功能
- 🤖 基于技能的智能团队匹配
- 📊 项目成功率预测
- 🎯 个性化黑客松推荐
- 📈 AI驱动的项目评分辅助

#### 性能与体验优化
- 🚀 CDN全球加速
- 📱 PWA移动应用
- 🌍 多语言国际化
- ⚡ 实时协作功能
- 📊 高级数据分析面板

### 💡 未来规划

#### 生态扩展
- 🤖 AI智能推荐引擎
- 🔍 The Graph数据索引
- 🌐 跨链黑客松支持
- 🏢 企业级黑客松管理
- 🎓 教育机构合作功能
- 💼 人才招聘对接平台

## 📚 文档

- [📖 产品设计文档](./docs/产品设计文档.md)
- [🏗️ 技术架构设计](./docs/技术方案与架构设计.md)
- [🗄️ 数据库设计](./docs/数据库设计文档.md)
- [📋 开发任务清单](./docs/开发任务清单.md)
- [🔧 API接口文档](./docs/API接口完整文档.md)
- [📦 IPFS集成指南](./docs/ipfs/)
- [🔐 智能合约文档](./docs/contracts/)

## 🤝 贡献指南

我们欢迎各种形式的贡献！请参考以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 代码规范
- 编写单元测试覆盖新功能
- 更新相关文档

## 🚀 部署

### 测试环境
- **前端**: Vercel 部署
- **后端**: Railway/Render 部署
- **智能合约**: BSC Testnet
- **IPFS**: Pinata 服务

### 生产环境
- **前端**: Vercel Pro
- **后端**: AWS/阿里云
- **数据库**: PostgreSQL RDS
- **缓存**: Redis Cloud
- **CDN**: Cloudflare

## 📄 开源协议

本项目采用 [MIT License](./LICENSE) 开源协议。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 全栈框架
- [Ethereum](https://ethereum.org/) - 区块链平台
- [IPFS](https://ipfs.io/) - 分布式存储网络
- [Prisma](https://www.prisma.io/) - 数据库工具
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Radix UI](https://www.radix-ui.com/) - 无障碍组件库

## 📞 联系我们

- **项目主页**: [Hackerverse Platform](#)
- **问题反馈**: [GitHub Issues](../../issues)
- **功能建议**: [GitHub Discussions](../../discussions)
- **邮箱**: contact@Hackerverse.dev

---

<div align="center">

**用代码改变世界，用区块链构建未来** 🚀

Made with ❤️ by Hackerverse Team

</div>
