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

Hackerverse is a revolutionary decentralized hackathon platform that integrates smart contract automation, IPFS permanent storage, advanced judging systems, and comprehensive project management. With 95% of core features completed including professional judge dashboards, intelligent team matching, real-time analytics, and complete internationalization, it provides developers worldwide with a fair, transparent, and efficient innovation competition ecosystem.

### 🎯 Core Features

- 🔗 **Fully Decentralized**: Smart contract-based automated management, no centralized institutions required
- 📦 **Permanent Storage**: All data stored on IPFS with credential verification system
- 🔐 **Web3 Native**: Pure wallet login + signature verification, supporting MetaMask, WalletConnect
- 🏛️ **Smart Contracts**: Automated hackathon management, IPFS-based scoring with tamper-proof evaluation
- 🎨 **Modern UI**: Based on Next.js 15 + Tailwind CSS + 80+ custom components, dark mode support
- 🌍 **Internationalization**: Complete Chinese-English with 3000+ translation keys, fully localized UX
- 👥 **Intelligent Team Matching**: AI-powered team recommendations based on skills compatibility
- 💬 **Advanced Community**: Project interactions, comment system, social features, content moderation
- 🔔 **Smart Notifications**: 15+ notification types, behavior-based priority system
- 🏆 **Professional Judging**: Time-locked evaluation periods, blockchain-verified scoring
- 📊 **Real-time Analytics**: Comprehensive dashboard with trend analysis and custom reports
- 🎯 **Project Management**: Independent project creation, multi-hackathon submission support

## 🏗️ Technical Architecture

### Core Technology Stack

#### Frontend
- **Framework**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript 5+
- **UI Framework**: React 19 + Tailwind CSS 3.4+
- **Component Library**: Radix UI + 80+ custom components (shadcn/ui + enhanced modules)
- **Internationalization**: next-intl with 3000+ translation keys (Chinese-English support)
- **Web3 Integration**: wagmi 2.0 + viem 2.0 + ethers.js + wallet signature verification
- **State Management**: React Hooks + Context API + Zustand for auth state
- **Animation**: Framer Motion 12+ + glass effects + micro-interactions
- **Forms**: React Hook Form + Zod validation + real-time validation
- **Charts**: Recharts 2.15+ + custom analytics components + trend visualizations

#### Backend
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM 5.7.1 with 18+ new enhanced tables
- **Authentication**: JWT + wallet signature verification + bcryptjs + role-based permissions
- **Storage**: IPFS + local file system + credential verification system
- **Notification System**: Unified notification service + email push + 15+ notification types
- **Security**: Helmet + CORS + content moderation + BigInt serialization handling
- **Analytics**: Real-time data processing + custom report generation + trend analysis

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

> **📋 Feature Status Description**: The following markers are based on actual code verification (December 25, 2024)
> - ✅ **Fully Implemented**: Complete frontend and backend, fully functional, supports Chinese-English internationalization
> - ⚠️ **Partially Missing**: Core functionality exists but important components are missing
> - 🔄 **API Ready**: Complete backend API, frontend integration pending
> - 🆕 **Recently Added**: New features completed in December 2024

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

#### 3. Project Submission & Display ✅ **Fully Implemented** 🆕
- 📤 **Project Submission**: Complete 5-step submission wizard with full internationalization (hackathons/[id]/submit)
- 📁 **Independent Project Management**: Project creation, editing, and management system with `/projects` page
- 📦 **IPFS Storage**: Distributed file storage, multi-gateway support, IPFS upload component with i18n
- 👍 **Interactive Features**: Advanced project filtering, comment system, like system, interaction statistics
- 📊 **Project Status**: DRAFT/READY_TO_SUBMIT/SUBMITTED/REVIEWED/WINNER/REJECTED lifecycle management
- ✅ **Project Library**: Advanced search, tag filtering, tech stack filtering, multi-dimensional sorting
- 🔗 **Multi-Hackathon Support**: One project can be submitted to multiple hackathons via ProjectSubmission table

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

#### 6. Advanced Review & Judging System ✅ **Enhanced** 🆕
- ⭐ **Multi-dimensional Scoring**: Innovation, technical complexity, user experience, business potential, presentation quality
- 👨‍⚖️ **Professional Judge Dashboard**: Dedicated judging interface with project filtering, progress tracking, time management
- 📊 **Enhanced Scoring System**: IPFS storage for score records, wallet signature verification, tamper-proof evaluation
- 💬 **Review Workflow**: Time-locked evaluation periods, batch scoring, evaluation session management
- 🔒 **Evaluation Integrity**: Blockchain-based score verification, anonymous judging, anti-tampering mechanisms
- 📈 **Judging Analytics**: Evaluation progress tracking, judge performance metrics, scoring distribution analysis

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

#### 9. Enhanced Personal Dashboard ✅ **Upgraded** 🆕
- 📊 **Advanced Statistics**: Enhanced stats with 8 core metrics, 12-month trend analysis, social activity tracking
- 🏆 **Achievement System**: Complete achievement tracking with categories (participation, competition, community, reputation), progress bars, rarity levels
- 📈 **Activity Timeline**: Comprehensive activity feed with timeline display, activity type filtering, pagination support
- 🌟 **Reputation Analysis**: Detailed reputation records, 30-day trends, categorical breakdown, reputation level progression
- ✏️ **Profile Management**: Enhanced profile editing, skill showcase, social links, bio management
- 📋 **Multi-tab Interface**: 8 tabs including new Enhanced Stats, Achievements, Activity, and Reputation tabs

### 🔄 Advanced Features (Optimization Features)

#### Framework exists but not fully implemented
- 🏛️ **DAO Governance System**: Complete backend API (proposals/vote/execute), frontend integration pending verification
- 🎨 **NFT Certificate System**: Complete backend API (mint/query), frontend integration pending verification
- 💎 **Token Staking System**: Complete backend API (stake/unstake/claim), frontend integration pending verification
- 🔍 **The Graph Indexing**: Subgraph configuration created, event indexing pending optimization

#### Admin Backend Features ✅ **Fully Implemented** 🆕
- 👥 **User Management**: ✅ Complete user management interface with role management, status control, statistics
- 📝 **Hackathon Review System**: ✅ Comprehensive hackathon approval workflow with review history and notifications
- 📊 **Analytics Dashboard**: ✅ Real-time platform analytics with hackathon insights, user trends, project statistics
- ⚙️ **System Configuration**: ✅ Complete system settings management with security, integrations, appearance controls
- 🛡️ **Security Management**: ✅ Advanced security controls with session management, authentication settings

### ✅ Recently Completed Features (2024-12)

#### 🎯 Core System Enhancements - **COMPLETED**
- ✅ **Independent Project Management System**: Complete project CRUD with `/projects` page, create/edit functionality, draft system, multi-hackathon submission support
- ✅ **Complete Admin Dashboard**: User management, hackathon review system, analytics dashboard, system settings with full CRUD operations
- ✅ **Advanced Judging System**: Professional judge dashboard with IPFS scoring, wallet signature verification, time-locked evaluation periods
- ✅ **Enhanced User Dashboard**: Achievement system, activity timeline, reputation analysis, enhanced statistics with 4 new tabs

#### 🔧 International & UX Improvements - **COMPLETED**  
- ✅ **Complete Project Submission Internationalization**: All 5 steps fully localized (EN/ZH), 60+ new translation keys, IPFS upload component i18n
- ✅ **Project Library & Interaction System**: Advanced filtering (search, tags, tech stack, tracks), comment system, like system, interaction statistics
- ✅ **Smart Team Matching**: Intelligent recommendations based on skills compatibility, experience balance, geographic preferences
- ✅ **IPFS Credential System**: Verifiable certificates with IPFS storage, credential templates, verification records

#### 📊 Advanced Analytics & Tools - **COMPLETED**
- ✅ **Organizer Analytics Dashboard**: Real-time hackathon analytics, participation trends, project quality analysis, team collaboration insights
- ✅ **Hackathon Review Workflow**: Admin review system with pending queue, approval/rejection flow, review history, automated notifications  
- ✅ **Enhanced Reputation System**: Multi-dimensional scoring, leaderboard, detailed reputation records, behavioral incentives
- ✅ **BigInt Serialization Fixes**: Comprehensive solution for blockchain data handling in all admin and analytics APIs

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
