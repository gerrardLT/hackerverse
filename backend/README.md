# HackX 后端 API 实现方案

## 项目概述

基于前端已实现的功能模块，提供对应的后端API实现。采用 Next.js API Routes + Prisma + PostgreSQL 技术栈。

## 前端已实现功能对应的后端需求

### 1. 用户认证系统 (已完成前端)
**前端实现**: `frontend/app/auth/signin/page.tsx`, `frontend/app/auth/signup/page.tsx`
**后端需求**:
- 邮箱注册/登录 API
- Web3 钱包连接验证
- 用户偏好设置存储
- 主题偏好持久化

### 2. 黑客松发现模块 (已完成前端)
**前端实现**: `frontend/app/hackathons/page.tsx`, `frontend/components/hackathon/*`
**后端需求**:
- 黑客松列表查询 API
- 搜索和筛选 API
- 分页支持
- 推荐算法

### 3. 黑客松详情模块 (已完成前端)
**前端实现**: `frontend/app/hackathons/[id]/page.tsx`
**后端需求**:
- 黑客松详情查询 API
- 参与注册 API
- 项目列表查询

### 4. 项目提交模块 (已完成前端)
**前端实现**: `frontend/app/hackathons/[id]/submit/page.tsx`, `frontend/components/ipfs/*`
**后端需求**:
- 项目创建/更新 API
- IPFS 文件上传集成
- 团队管理 API
- 表单验证

### 5. 团队管理 (已完成前端)
**前端实现**: `frontend/app/teams/*`, `frontend/components/teams/*`
**后端需求**:
- 团队创建/管理 API
- 成员邀请/管理 API
- 角色权限管理

### 6. 通知系统 (已完成前端)
**前端实现**: `frontend/app/notifications/*`, `frontend/lib/notifications.ts`
**后端需求**:
- 通知创建/查询 API
- 通知设置管理
- 实时通知推送

### 7. Web3 集成 (已完成前端)
**前端实现**: `frontend/app/web3/*`, `frontend/components/web3/*`
**后端需求**:
- 钱包连接验证
- DAO 治理数据 API
- 代币质押状态 API
- NFT 证书管理

## 技术架构

### 目录结构
```
backend/
├── prisma/
│   ├── schema.prisma          # 数据库模型
│   └── migrations/            # 数据库迁移
├── app/
│   ├── api/                   # Next.js API Routes
│   │   ├── auth/              # 认证相关 API
│   │   ├── hackathons/        # 黑客松相关 API
│   │   ├── projects/          # 项目相关 API
│   │   ├── teams/             # 团队相关 API
│   │   ├── notifications/     # 通知相关 API
│   │   └── web3/              # Web3 相关 API
│   └── lib/                   # 工具库
│       ├── prisma.ts          # Prisma 客户端
│       ├── auth.ts            # 认证工具
│       ├── ipfs.ts            # IPFS 集成
│       └── web3.ts            # Web3 工具
├── package.json
└── .env                       # 环境变量
```

### 核心依赖
```json
{
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "next": "^14.0.0",
    "next-auth": "^4.24.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "ethers": "^6.0.0",
    "ipfs-http-client": "^60.0.0",
    "zod": "^3.22.0",
    "redis": "^4.6.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/bcryptjs": "^2.4.0",
    "@types/jsonwebtoken": "^9.0.0"
  }
}
```

## API 设计

### 1. 认证 API

#### 用户注册
```typescript
POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username",
  "walletAddress": "0x..." // 可选
}

Response:
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "walletAddress": "0x...",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### 用户登录
```typescript
POST /api/auth/signin
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "jwt_token",
  "user": { /* 用户信息 */ }
}
```

#### Web3 钱包连接
```typescript
POST /api/auth/wallet
{
  "address": "0x...",
  "signature": "0x...",
  "message": "Login to HackX"
}

Response:
{
  "success": true,
  "user": { /* 用户信息 */ }
}
```

### 2. 黑客松 API

#### 获取黑客松列表
```typescript
GET /api/hackathons?page=1&limit=10&search=web3&status=active

Response:
{
  "hackathons": [
    {
      "id": "uuid",
      "title": "Web3 DeFi 创新挑战赛",
      "description": "构建下一代 DeFi 应用",
      "startDate": "2024-02-01T00:00:00Z",
      "endDate": "2024-02-15T00:00:00Z",
      "status": "active",
      "organizer": {
        "id": "uuid",
        "name": "组织方名称"
      },
      "participantCount": 150,
      "prizePool": "$50,000"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### 获取黑客松详情
```typescript
GET /api/hackathons/:id

Response:
{
  "hackathon": {
    "id": "uuid",
    "title": "Web3 DeFi 创新挑战赛",
    "description": "详细描述...",
    "startDate": "2024-02-01T00:00:00Z",
    "endDate": "2024-02-15T00:00:00Z",
    "registrationDeadline": "2024-01-25T00:00:00Z",
    "status": "active",
    "organizer": { /* 组织方信息 */ },
    "prizes": [
      {
        "rank": 1,
        "amount": "$20,000",
        "description": "冠军奖金"
      }
    ],
    "tracks": [
      {
        "name": "DeFi Protocol",
        "description": "去中心化金融协议"
      }
    ],
    "rules": "参与规则...",
    "requirements": "技术要求...",
    "participantCount": 150,
    "projectCount": 45
  }
}
```

#### 参与黑客松
```typescript
POST /api/hackathons/:id/register
{
  "userId": "uuid"
}

Response:
{
  "success": true,
  "registration": {
    "id": "uuid",
    "hackathonId": "uuid",
    "userId": "uuid",
    "registeredAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3. 项目 API

#### 创建项目
```typescript
POST /api/projects
{
  "name": "项目名称",
  "description": "项目描述",
  "hackathonId": "uuid",
  "teamId": "uuid",
  "track": "DeFi Protocol",
  "githubUrl": "https://github.com/...",
  "demoUrl": "https://demo.com",
  "technologies": ["React", "Solidity", "IPFS"],
  "files": [ /* IPFS 文件哈希 */ ]
}

Response:
{
  "success": true,
  "project": {
    "id": "uuid",
    "name": "项目名称",
    "status": "draft",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### 更新项目
```typescript
PUT /api/projects/:id
{
  "name": "更新后的项目名称",
  "description": "更新后的描述",
  "status": "submitted"
}

Response:
{
  "success": true,
  "project": { /* 更新后的项目信息 */ }
}
```

#### 获取项目列表
```typescript
GET /api/hackathons/:id/projects?status=submitted&track=DeFi

Response:
{
  "projects": [
    {
      "id": "uuid",
      "name": "项目名称",
      "description": "项目描述",
      "team": {
        "id": "uuid",
        "name": "团队名称",
        "members": [ /* 成员信息 */ ]
      },
      "track": "DeFi Protocol",
      "status": "submitted",
      "score": 85,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 4. 团队 API

#### 创建团队
```typescript
POST /api/teams
{
  "name": "团队名称",
  "description": "团队描述",
  "leaderId": "uuid",
  "maxMembers": 4
}

Response:
{
  "success": true,
  "team": {
    "id": "uuid",
    "name": "团队名称",
    "leader": { /* 队长信息 */ },
    "memberCount": 1,
    "maxMembers": 4
  }
}
```

#### 邀请成员
```typescript
POST /api/teams/:id/invite
{
  "email": "member@example.com",
  "role": "developer"
}

Response:
{
  "success": true,
  "invitation": {
    "id": "uuid",
    "teamId": "uuid",
    "email": "member@example.com",
    "role": "developer",
    "status": "pending"
  }
}
```

#### 获取团队详情
```typescript
GET /api/teams/:id

Response:
{
  "team": {
    "id": "uuid",
    "name": "团队名称",
    "description": "团队描述",
    "leader": { /* 队长信息 */ },
    "members": [
      {
        "id": "uuid",
        "user": { /* 用户信息 */ },
        "role": "developer",
        "joinedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "projects": [ /* 团队项目 */ ]
  }
}
```

### 5. 通知 API

#### 获取通知列表
```typescript
GET /api/notifications?page=1&limit=20&unreadOnly=true

Response:
{
  "notifications": [
    {
      "id": "uuid",
      "type": "team_invite",
      "title": "团队邀请",
      "message": "Alice 邀请你加入团队",
      "data": {
        "teamId": "uuid",
        "teamName": "团队名称"
      },
      "read": false,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "unreadCount": 5
}
```

#### 标记通知为已读
```typescript
PUT /api/notifications/:id/read

Response:
{
  "success": true
}
```

#### 获取通知设置
```typescript
GET /api/notifications/settings

Response:
{
  "settings": {
    "emailNotifications": true,
    "pushNotifications": true,
    "teamInvites": true,
    "projectUpdates": true,
    "hackathonReminders": true
  }
}
```

#### 更新通知设置
```typescript
PUT /api/notifications/settings
{
  "emailNotifications": false,
  "pushNotifications": true
}

Response:
{
  "success": true,
  "settings": { /* 更新后的设置 */ }
}
```

### 6. Web3 API

#### 钱包连接状态
```typescript
GET /api/web3/wallet/status

Response:
{
  "connected": true,
  "address": "0x...",
  "network": "ethereum",
  "chainId": 1,
  "balance": "1.5 ETH"
}
```

#### DAO 治理提案
```typescript
GET /api/web3/dao/proposals

Response:
{
  "proposals": [
    {
      "id": 1,
      "title": "增加黑客松奖金池",
      "description": "提议将奖金池从 $100,000 增加到 $150,000",
      "proposer": "0x...",
      "forVotes": 1250,
      "againstVotes": 340,
      "endTime": "2024-02-01T00:00:00Z",
      "status": "active"
    }
  ]
}
```

#### 代币质押信息
```typescript
GET /api/web3/staking/info

Response:
{
  "totalBalance": 10000,
  "stakedAmount": 5000,
  "pendingRewards": 150,
  "apy": 12.5,
  "totalStaked": 2500000
}
```

## 数据库模型 (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String?  @unique
  password  String?
  avatarUrl String?
  bio       String?
  walletAddress String? @unique
  reputationScore Int @default(0)
  ipfsProfileHash String?
  socialLinks Json?
  privacySettings Json @default("{}")
  notificationSettings Json @default("{}")
  emailVerified Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 关系
  organizedHackathons Hackathon[] @relation("Organizer")
  participations      Participation[]
  teamMemberships     TeamMember[]
  projects            Project[]
  notifications       Notification[]
  scores              Score[]
  feedback            Feedback[]

  @@map("users")
}

model Hackathon {
  id                  String   @id @default(cuid())
  title               String
  description         String?
  startDate           DateTime
  endDate             DateTime
  registrationDeadline DateTime?
  status              String   @default("draft")
  organizerId         String
  ipfsHash            String?
  metadata            Json?
  prizes              Json?
  tracks              Json?
  rules               String?
  requirements        Json?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  // 关系
  organizer           User     @relation("Organizer", fields: [organizerId], references: [id])
  participations      Participation[]
  projects            Project[]
  judges              Judge[]

  @@map("hackathons")
}

model Project {
  id            String   @id @default(cuid())
  name          String
  description   String?
  hackathonId   String
  teamId        String?
  track         String?
  githubUrl     String?
  demoUrl       String?
  videoUrl      String?
  presentationUrl String?
  ipfsHash      String?
  status        String   @default("draft")
  tags          Json     @default("[]")
  technologies  Json     @default("[]")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // 关系
  hackathon     Hackathon @relation(fields: [hackathonId], references: [id], onDelete: Cascade)
  team          Team?     @relation(fields: [teamId], references: [id])
  scores        Score[]
  feedback      Feedback[]

  @@map("projects")
}

model Team {
  id          String   @id @default(cuid())
  name        String
  description String?
  leaderId    String
  maxMembers  Int      @default(4)
  createdAt   DateTime @default(now())

  // 关系
  leader      User     @relation(fields: [leaderId], references: [id])
  members     TeamMember[]
  projects    Project[]

  @@map("teams")
}

model TeamMember {
  id        String   @id @default(cuid())
  teamId    String
  userId    String
  role      String   @default("member")
  contribution String?
  joinedAt  DateTime @default(now())

  // 关系
  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@map("team_members")
}

model Participation {
  id           String   @id @default(cuid())
  hackathonId  String
  userId       String
  registeredAt DateTime @default(now())

  // 关系
  hackathon    Hackathon @relation(fields: [hackathonId], references: [id], onDelete: Cascade)
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([hackathonId, userId])
  @@map("participations")
}

model Judge {
  id              String   @id @default(cuid())
  hackathonId     String
  userId          String
  role            String   @default("main")
  expertise       Json     @default("[]")
  assignedProjects Json    @default("[]")
  createdAt       DateTime @default(now())

  // 关系
  hackathon       Hackathon @relation(fields: [hackathonId], references: [id], onDelete: Cascade)
  user            User     @relation(fields: [userId], references: [id])

  @@map("judges")
}

model Score {
  id        String   @id @default(cuid())
  projectId String
  judgeId   String
  criteria  String
  score     Int
  maxScore  Int
  comment   String?
  createdAt DateTime @default(now())

  // 关系
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  judge     Judge    @relation(fields: [judgeId], references: [id], onDelete: Cascade)

  @@map("scores")
}

model Feedback {
  id        String   @id @default(cuid())
  projectId String
  judgeId   String
  type      String
  content   String
  isPublic  Boolean  @default(false)
  createdAt DateTime @default(now())

  // 关系
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  judge     Judge    @relation(fields: [judgeId], references: [id], onDelete: Cascade)

  @@map("feedback")
}

model Notification {
  id        String   @id @default(cuid())
  type      String
  title     String
  message   String
  data      Json?
  read      Boolean  @default(false)
  userId    String
  createdAt DateTime @default(now())

  // 关系
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
}
```

## 环境变量配置

```env
# .env
DATABASE_URL="postgresql://username:password@localhost:5432/hackx"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# IPFS 配置
IPFS_PROJECT_ID="your-pinata-project-id"
IPFS_PROJECT_SECRET="your-pinata-project-secret"
IPFS_GATEWAY="https://gateway.pinata.cloud"

# Web3 配置
WEB3_PROVIDER_URL="https://mainnet.infura.io/v3/your-project-id"
CONTRACT_ADDRESS="0x..."

# 邮件服务
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"

# Redis 缓存
REDIS_URL="redis://localhost:6379"
```

## 部署说明

### 本地开发
```bash
# 安装依赖
npm install

# 设置环境变量
cp .env.example .env

# 数据库迁移
npx prisma migrate dev

# 启动开发服务器
npm run dev
```

### 生产部署
```bash
# 构建项目
npm run build

# 数据库迁移
npx prisma migrate deploy

# 启动生产服务器
npm start
```

## 下一步开发计划

1. **实现核心 API 路由** - 根据前端需求实现对应的 API 端点
2. **数据库迁移** - 创建并运行 Prisma 迁移
3. **认证集成** - 集成 NextAuth.js 和 Web3 认证
4. **IPFS 集成** - 实现文件上传和元数据管理
5. **实时通知** - 集成 WebSocket 或 Server-Sent Events
6. **测试覆盖** - 添加单元测试和集成测试
7. **性能优化** - 添加缓存和数据库优化
8. **安全加固** - 添加输入验证、速率限制等安全措施 