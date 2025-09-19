# Hackerverse - Decentralized Hackathon Platform

<div align="center">

![Hackerverse Logo](./frontend/public/placeholder-logo.png)

**The first fully blockchain and IPFS-based decentralized hackathon platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?logo=ethereum&logoColor=white)](https://ethereum.org/)
[![i18n](https://img.shields.io/badge/i18n-Ready-green)](https://next-intl.dev/)

[🚀 Live Demo](#) | [📖 中文 README](./README.md) | [🐛 Issues](../../issues) | [💬 Discussions](../../discussions)

</div>

## ✨ Project Overview

Hackerverse is a revolutionary decentralized hackathon platform that integrates smart contract automation, IPFS permanent storage, multi-wallet support, and community governance features, providing developers worldwide with a fair, transparent, and efficient innovation competition ecosystem.

### 🎯 Core Features

- 🔗 **Fully Decentralized**: Smart contract-based automated management, no centralized institutions required
- 📦 **Permanent Storage**: All data stored on IPFS, ensuring data permanence and accessibility
- 🔐 **Web3 Native**: Pure wallet login, supporting MetaMask, WalletConnect and other mainstream wallets
- 🏛️ **Smart Contracts**: Automated hackathon management, project submission, scoring system
- 🎨 **Modern UI**: Based on Next.js 15 + Tailwind CSS + 57 custom components, dark mode support
- 🌍 **Internationalization**: Complete Chinese-English internationalization, multi-language extensible
- 👥 **Team Collaboration**: Complete team management and intelligent matching system
- 💬 **Community Discussion**: Categorized discussions, real-time notifications, content moderation
- 🔔 **Smart Notifications**: 15+ notification types, multi-channel push system
- 🏆 **DAO Governance**: Decentralized governance, community voting decisions

## 🏗️ Technical Architecture

### Core Technology Stack

#### Frontend
- **Framework**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript 5+
- **UI Framework**: React 19 + Tailwind CSS 3.4+
- **Component Library**: Radix UI + 57 custom components (shadcn/ui)
- **Internationalization**: next-intl (Chinese-English support)
- **Web3 Integration**: wagmi 2.0 + viem 2.0 + ethers.js
- **State Management**: React Hooks + Context API
- **Animation**: Framer Motion 12+
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts 2.15+

#### Backend
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM 5.7.1
- **Authentication**: JWT + wallet signature verification + bcryptjs
- **Storage**: IPFS + local file system
- **Notification System**: Unified notification service + email push
- **Security**: Helmet + CORS + content moderation

#### Blockchain
- **Smart Contracts**: Solidity ^0.8.20
- **Development Framework**: Hardhat
- **Deployment Network**: BSC Testnet
- **Subgraph Indexing**: The Graph Protocol
- **Contract Features**: Hackathon management, DAO governance, NFT certificates, token staking

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   Frontend Application Layer (Next.js 15)       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │   User Interface│ │   Web3 Integration│ │  State Management│    │
│  │ - React Components│ │ - Wallet Connection│ │ - Zustand       │    │
│  │ - Tailwind CSS  │ │ - Contract Interaction│ │ - Real-time Updates│    │
│  │ - Radix UI      │ │ - Signature Verification│ │ - Route Management│    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API Layer (Next.js API Routes)       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │  Business Logic │ │   Data Management│ │ Service Integration│    │
│  │ - RESTful API   │ │ - Prisma ORM    │ │ - IPFS Service  │    │
│  │ - Permission Management│ │ - PostgreSQL    │ │ - Smart Contracts│    │
│  │ - Notification Service│ │ - Redis Cache     │ │ - Email Service │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Blockchain Layer                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │  Smart Contracts│ │   IPFS Storage  │ │  Event Listening │    │
│  │ - HackXCore     │ │ - User Data     │ │ - Event Sync    │    │
│  │ - User Management│ │ - Project Files │ │ - State Updates │    │
│  │ - Project Management│ │ - Activity Info │ │ - Data Verification│    │
│  │ - Scoring System│ │ - Metadata      │ │ - Error Handling│    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Environment Requirements

- Node.js 18.0+
- npm/yarn/pnpm
- PostgreSQL 14+
- MetaMask or other Web3 wallets

### Installation Steps

1. **Clone Project**
```bash
git clone https://github.com/your-username/Hackerverse.git
cd Hackerverse
```

2. **Install Dependencies**
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Install smart contract dependencies
cd ../contracts
npm install

# Install subgraph dependencies (optional)
cd ../subgraph
npm install
```

3. **Environment Configuration**
```bash
# Copy environment variable templates
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Configure necessary environment variables
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

4. **Database Initialization**
```bash
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
```

5. **Start Services**
```bash
# Start backend service (port 3002)
cd backend
npm run dev

# Start frontend service (port 3000)
cd frontend  
npm run dev
```

6. **Deploy Smart Contracts** (Optional)
```bash
cd contracts
npm run deploy:sepolia  # or other networks
```

### 🌐 Access Application

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:3002
- **Database Management**: npx prisma studio (run in backend directory)

## 📱 Feature Modules

> **📋 Feature Status Description**: The following markers are based on actual code verification (September 16, 2025)
> - ✅ **Fully Implemented**: Complete frontend and backend, fully functional, supports Chinese-English internationalization
> - ⚠️ **Partially Missing**: Core functionality exists but important components are missing
> - 🔄 **API Ready**: Complete backend API, frontend integration pending

### ✅ Implemented Features

#### 1. User Authentication & Permission Management ✅
- 🔐 **Web3 Wallet Authentication**: Support for MetaMask, WalletConnect and other mainstream wallet logins
- 📧 **Traditional Authentication**: Email/password registration login (backup solution)
- 👤 **User Profile Management**: Avatar, username, email, skills, bio editing
- 🛡️ **Role Permission System**: Four-level permissions: USER/ADMIN/MODERATOR/JUDGE
- 📊 **User Statistics**: Participation count, award records, reputation score display
- 🌍 **Complete Internationalization**: All user interfaces support Chinese-English switching

#### 2. Hackathon Management ✅
- 📝 **Hackathon Creation**: Complete creation wizard with basic info, time settings, award configuration
- 🔍 **Search & Filtering**: Keyword search, status filtering, tech stack filtering, prize range filtering
- 📋 **Detailed Information Management**: Activity description, rule settings, review criteria, sponsor information
- ⏰ **Status Management**: DRAFT/ACTIVE/COMPLETED/CANCELLED lifecycle
- 🎯 **Participation Management**: User registration, participation status tracking, statistics display
- 🔗 **Smart Contract Integration**: On-chain data storage, IPFS metadata management
- 🏠 **Homepage Display**: Featured hackathons, platform statistics, search recommendation features

#### 3. Project Submission & Display ⚠️ **Partially Missing**
- 📤 **Project Submission**: Submit projects in hackathons (hackathons/[id]/submit)
- 📁 **File Management**: Code repository links, demo videos, project screenshots, document uploads
- 📦 **IPFS Storage**: Distributed file storage, multi-gateway support, data integrity verification
- 👍 **Interactive Features**: Project likes, comment feedback, bookmarking and sharing (backend API support)
- 📊 **Project Status**: DRAFT/SUBMITTED/REVIEWED/WINNER/REJECTED process management
- ❌ **Missing Features**: Independent project creation page, project list page

#### 4. Team Collaboration ✅
- 👥 **Team Creation**: Team basic information, skill requirements, member limit settings
- 📝 **Application System**: Join application form, skill showcase, application reason filling
- ✅ **Application Review**: Team leader reviews applications, approves/rejects member joining
- 📨 **Invitation Feature**: Team leader actively invites users to join team, notification system integration
- 🔍 **Team Search**: Filter teams by hackathon, skills, status and other conditions
- 📋 **Member Management**: Team member list, role assignment, join time records
- 🎯 **Smart Matching**: Team recommendation based on skills and hackathon matching

#### 5. Community Discussion ✅
- 💬 **Categorized Discussion**: Five major categories: general/technical/showcase/help/announcement
- 📝 **Posting Features**: Markdown rich text editing, image upload, topic tags
- 👍 **Social Interaction**: Likes, bookmarks, multi-level replies, user following
- 🔍 **Content Search**: Keyword search, category filtering, sorting functions (latest/hottest/most replies/most views)
- 📊 **Community Statistics**: Activity statistics, top contributor rankings, hot content recommendations
- 📚 **Personal Bookmarks**: Users can bookmark posts of interest

#### 6. Review System ✅
- ⭐ **Multi-dimensional Scoring**: Innovation, technical complexity, user experience, business potential, presentation quality
- 👨‍⚖️ **Judge Management**: Judge role assignment, review permission control
- 📊 **Score Statistics**: Automatic average calculation, ranking generation, result announcement
- 💬 **Review Feedback**: Scoring reason records, project feedback comments

#### 7. Web3 Integration ✅
- 🔗 **Smart Contracts**: HackXCore main contract deployment, user registration, hackathon creation
- 📦 **IPFS Storage**: User data, project files, activity information permanent storage
- 🌐 **Multi-chain Support**: BSC Testnet deployment, network switching support
- 💰 **Transaction Management**: Gas fee estimation, transaction status tracking, retry mechanism

#### 8. Notification System ✅
- 🔔 **Multi-type Notifications**: Team invitations, application status, activity reminders, system announcements, 15+ types
- 📱 **Multi-channel Push**: In-site messages, email notifications, browser push
- ⚙️ **Personalized Settings**: Notification preference configuration, push time settings, notification type toggles
- 📋 **Notification Management**: Batch operations, category filtering, read/unread status management
- 🎯 **Smart Notifications**: User behavior-based notification priority and frequency control
- 📨 **Community Notifications**: Separate community message page, supporting post replies, likes and other notifications

#### 9. Personal Dashboard ✅
- 📊 **Data Overview**: Number of hackathons participated, project statistics, team situation, reputation score
- 📈 **Statistical Charts**: Activity participation trends, skill radar charts, achievement progress display
- 🔄 **Recent Activity**: Timeline display of user's recent operations and participation records
- 🎯 **Personalized Recommendations**: Recommend relevant hackathons and teams based on user interests
- ✏️ **Profile Editing**: Online editing of personal information, skill stack, avatar upload
- 📋 **Multi-tab Management**: Categorized display of hackathons, projects, teams, community, etc.

### 🔄 Advanced Features (Optimization Features)

#### Framework exists but not fully implemented
- 🏛️ **DAO Governance System**: Complete backend API (proposals/vote/execute), frontend integration pending verification
- 🎨 **NFT Certificate System**: Complete backend API (mint/query), frontend integration pending verification
- 💎 **Token Staking System**: Complete backend API (stake/unstake/claim), frontend integration pending verification
- 🔍 **The Graph Indexing**: Subgraph configuration created, event indexing pending optimization

#### Admin Backend Features ⚠️ **Complete API but Frontend Severely Missing**
- 👥 **User Management**: ✅ Complete backend API, ❌ Frontend management interface missing
- 📝 **Content Moderation**: ✅ Complete backend API, ❌ Frontend moderation interface missing
- 📊 **Data Statistics**: ✅ Complete backend API, ❌ Frontend data dashboard missing
- ⚙️ **System Configuration**: ✅ Complete backend API, ❌ Frontend configuration interface missing
- 🛡️ **Security Management**: ✅ Frontend page exists (admin/security)

### 📋 Planned Features

#### 🚨 Core Features Urgently Needed
- 📤 **Independent Project Management**: Project list page, create project page
- 👨‍💼 **Complete Admin Frontend**: User management, content moderation, data statistics interfaces
- 🔗 **Web3 Feature Frontend Integration**: DAO/NFT/staking feature user interfaces
- 📊 **Project Display Optimization**: Project filtering, sorting, categorized display

#### Advanced Team Collaboration Features
- 💬 Team internal chat rooms
- 📋 Task assignment and progress tracking
- 📅 Team schedule planning
- 📁 Team file sharing space
- 🗳️ Team decision voting system

#### Intelligent Features
- 🤖 AI-powered intelligent team matching based on skills
- 📊 Project success rate prediction
- 🎯 Personalized hackathon recommendations
- 📈 AI-driven project scoring assistance

#### Performance & Experience Optimization
- 🚀 CDN global acceleration
- 📱 PWA mobile application
- 🌍 Multi-language internationalization expansion
- ⚡ Real-time collaboration features
- 📊 Advanced data analysis dashboard

### 💡 Future Plans

#### Ecosystem Expansion
- 🤖 AI intelligent recommendation engine
- 🔍 The Graph data indexing optimization
- 🌐 Cross-chain hackathon support
- 🏢 Enterprise hackathon management
- 🎓 Educational institution collaboration features
- 💼 Talent recruitment platform integration


## 🤝 Contributing

We welcome all forms of contributions! Please follow these steps:

1. Fork this repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Development Standards

- Use TypeScript for type-safe development
- Follow ESLint and Prettier code standards
- Write unit tests covering new features
- Update relevant documentation

## 🚀 Deployment

### Test Environment
- **Frontend**: Vercel deployment
- **Backend**: Railway/Render deployment
- **Smart Contracts**: BSC Testnet
- **IPFS**: Pinata service

### Production Environment
- **Frontend**: Vercel Pro
- **Backend**: AWS/Alibaba Cloud
- **Database**: PostgreSQL RDS
- **Cache**: Redis Cloud
- **CDN**: Cloudflare

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React full-stack framework
- [Ethereum](https://ethereum.org/) - Blockchain platform
- [IPFS](https://ipfs.io/) - Distributed storage network
- [Prisma](https://www.prisma.io/) - Database toolkit
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://www.radix-ui.com/) - Accessible component library

## 📞 Contact Us

- **Project Homepage**: [Hackerverse Platform](#)
- **Issue Reports**: [GitHub Issues](../../issues)
- **Feature Suggestions**: [GitHub Discussions](../../discussions)
- **Email**: traderluotao@gmail.com

---

<div align="center">

**Change the world with code, build the future with blockchain** 🚀

Made with ❤️ by Hackerverse Team

</div>
