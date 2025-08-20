# HackX 黑客松平台 API 文档

## 概述

HackX 黑客松平台提供完整的 RESTful API，支持用户认证、黑客松管理、项目提交、团队管理等功能。

- **基础URL**: `http://localhost:3000/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证

所有需要认证的API都需要在请求头中包含JWT Token：

```
Authorization: Bearer <your-jwt-token>
```

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "message": "操作成功",
  "data": { ... }
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误描述",
  "details": { ... } // 可选，详细错误信息
}
```

## API 端点

### 1. 用户认证

#### 1.1 用户注册- **POST** `/api/auth/signup`- **描述**: 创建新用户账户- **请求体**:```json{  "email": "user@example.com",  "password": "password123",  "username": "username", // 可选  "walletAddress": "0x..." // 可选}```- **响应**:```json{  "success": true,  "message": "注册成功",  "data": {    "user": {      "id": "clx1234567890abcdef",      "email": "user@example.com",      "username": "username",      "walletAddress": "0x...",      "avatarUrl": null,      "bio": null,      "reputationScore": 0,      "createdAt": "2024-01-01T00:00:00.000Z"    },    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  }}```

#### 1.2 用户登录- **POST** `/api/auth/signin`- **描述**: 用户登录获取访问令牌- **请求体**:```json{  "email": "user@example.com",  "password": "password123"}```- **响应**:```json{  "success": true,  "message": "登录成功",  "data": {    "user": {      "id": "clx1234567890abcdef",      "email": "user@example.com",      "username": "username",      "walletAddress": "0x...",      "avatarUrl": "https://...",      "bio": "用户简介",      "reputationScore": 85,      "emailVerified": true,      "notificationSettings": { ... },      "privacySettings": { ... },      "createdAt": "2024-01-01T00:00:00.000Z"    },    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  }}```

### 2. 用户管理

#### 2.1 获取当前用户信息- **GET** `/api/users/me`- **描述**: 获取当前登录用户的详细信息- **认证**: 需要- **响应**:```json{  "success": true,  "data": {    "user": {      "id": "clx1234567890abcdef",      "email": "user@example.com",      "username": "username",      "walletAddress": "0x...",      "avatarUrl": "https://...",      "bio": "用户简介",      "reputationScore": 85,      "emailVerified": true,      "notificationSettings": {        "email": true,        "push": true,        "sms": true      },      "privacySettings": {        "profileVisibility": "public",        "showEmail": false,        "showWalletAddress": true      },      "ipfsProfileHash": "QmExampleHash123456789",      "ipfsUrl": "https://ipfs.io/ipfs/QmExampleHash123456789",      "createdAt": "2024-01-01T00:00:00.000Z",      "updatedAt": "2024-01-01T00:00:00.000Z"    }  }}```

#### 2.2 更新用户信息
- **PUT** `/api/users/me`
- **描述**: 更新当前用户的信息
- **认证**: 需要
- **请求体**:
```json
{
  "username": "new_username",
  "bio": "新的用户简介",
  "avatarUrl": "https://new-avatar.com/image.jpg",
  "notificationSettings": {
    "emailNotifications": false,
    "pushNotifications": true
  },
  "privacySettings": {
    "profileVisibility": "private",
    "showEmail": false,
    "showWalletAddress": true
  }
}
```

#### 2.3 获取用户偏好设置
- **GET** `/api/users/preferences`
- **描述**: 获取用户的偏好设置
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "preferences": {
    "theme": "dark",
    "language": "zh-CN",
    "timezone": "Asia/Shanghai",
    "notificationSettings": {
      "emailNotifications": true,
      "pushNotifications": true,
      "teamInvites": true,
      "projectUpdates": true,
      "hackathonReminders": true
    },
    "privacySettings": {
      "profileVisibility": "public",
      "showEmail": false,
      "showWalletAddress": true
    }
  }
}
```

#### 2.4 更新用户偏好设置
- **PUT** `/api/users/preferences`
- **描述**: 更新用户的偏好设置
- **认证**: 需要
- **请求体**:
```json
{
  "theme": "system",
  "language": "en-US",
  "timezone": "UTC",
  "notificationSettings": {
    "emailNotifications": false,
    "pushNotifications": true
  },
  "privacySettings": {
    "profileVisibility": "friends",
    "showEmail": false,
    "showWalletAddress": false
  }
}
```

### 3. 黑客松管理

#### 3.1 获取黑客松列表
- **GET** `/api/hackathons`
- **描述**: 获取黑客松列表，支持搜索、筛选和分页
- **查询参数**:
  - `page`: 页码 (默认: 1)
  - `limit`: 每页数量 (默认: 12, 最大: 100)
  - `search`: 搜索关键词
  - `category`: 类别筛选
  - `status`: 状态筛选 (upcoming/ongoing/completed)
  - `featured`: 是否精选 (true/false)
  - `sortBy`: 排序字段 (createdAt/startDate/prizePool/participants)
  - `sortOrder`: 排序方向 (asc/desc)
- **响应**:
```json
{
  "success": true,
  "hackathons": [
    {
      "id": "clx1234567890abcdef",
      "title": "Web3 创新黑客松 2024",
      "description": "探索Web3技术的无限可能...",
      "startDate": "2024-03-15T09:00:00.000Z",
      "endDate": "2024-03-17T18:00:00.000Z",
      "registrationDeadline": "2024-03-10T23:59:59.000Z",
      "maxParticipants": 200,
      "prizePool": 50000,
      "categories": ["DeFi", "NFT", "DAO", "GameFi"],
      "tags": ["Web3", "区块链", "智能合约"],
      "featured": true,
      "isPublic": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "organizer": {
        "id": "clx1234567890abcdef",
        "username": "admin",
        "avatarUrl": "https://..."
      },
      "_count": {
        "participations": 150,
        "projects": 45
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 25,
    "totalPages": 3
  }
}
```

#### 3.2 创建黑客松
- **POST** `/api/hackathons`
- **描述**: 创建新的黑客松
- **认证**: 需要
- **请求体**:
```json
{
  "title": "新黑客松标题",
  "description": "黑客松详细描述...",
  "startDate": "2024-06-01T09:00:00.000Z",
  "endDate": "2024-06-03T18:00:00.000Z",
  "registrationDeadline": "2024-05-25T23:59:59.000Z",
  "maxParticipants": 100,
  "prizePool": 25000,
  "categories": ["AI", "区块链", "Web3"],
  "tags": ["创新", "技术", "竞赛"],
  "requirements": "参赛要求...",
  "rules": "比赛规则...",
  "isPublic": true,
  "featured": false
}
```

#### 3.3 获取黑客松详情
- **GET** `/api/hackathons/{id}`
- **描述**: 获取指定黑客松的详细信息
- **响应**:
```json
{
  "success": true,
  "hackathon": {
    "id": "clx1234567890abcdef",
    "title": "Web3 创新黑客松 2024",
    "description": "详细描述...",
    "startDate": "2024-03-15T09:00:00.000Z",
    "endDate": "2024-03-17T18:00:00.000Z",
    "registrationDeadline": "2024-03-10T23:59:59.000Z",
    "maxParticipants": 200,
    "prizePool": 50000,
    "categories": ["DeFi", "NFT", "DAO", "GameFi"],
    "tags": ["Web3", "区块链", "智能合约"],
    "requirements": "参赛要求...",
    "rules": "比赛规则...",
    "isPublic": true,
    "featured": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "organizer": {
      "id": "clx1234567890abcdef",
      "username": "admin",
      "avatarUrl": "https://...",
      "bio": "组织者简介"
    },
    "participations": [
      {
        "id": "clx1234567890abcdef",
        "status": "registered",
        "joinedAt": "2024-02-15T10:00:00.000Z",
        "user": {
          "id": "clx1234567890abcdef",
          "username": "alice_dev",
          "avatarUrl": "https://..."
        }
      }
    ],
    "projects": [
      {
        "id": "clx1234567890abcdef",
        "title": "DeFi Yield Optimizer",
        "description": "项目描述...",
        "status": "submitted",
        "createdAt": "2024-03-16T10:00:00.000Z",
        "team": {
          "id": "clx1234567890abcdef",
          "name": "Web3 Warriors",
          "members": [
            {
              "user": {
                "id": "clx1234567890abcdef",
                "username": "alice_dev",
                "avatarUrl": "https://..."
              }
            }
          ]
        }
      }
    ],
    "_count": {
      "participations": 150,
      "projects": 45
    }
  }
}
```

#### 3.4 报名参加黑客松
- **POST** `/api/hackathons/{id}/register`
- **描述**: 报名参加指定的黑客松
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "message": "报名成功",
  "participation": {
    "id": "clx1234567890abcdef",
    "status": "registered",
    "joinedAt": "2024-02-15T10:00:00.000Z",
    "hackathon": {
      "id": "clx1234567890abcdef",
      "title": "Web3 创新黑客松 2024",
      "startDate": "2024-03-15T09:00:00.000Z",
      "endDate": "2024-03-17T18:00:00.000Z"
    },
    "user": {
      "id": "clx1234567890abcdef",
      "username": "alice_dev",
      "email": "alice@example.com"
    }
  }
}
```

#### 3.5 取消报名
- **DELETE** `/api/hackathons/{id}/register`
- **描述**: 取消参加指定的黑客松
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "message": "取消报名成功"
}
```

### 4. 项目管理

#### 4.1 获取项目列表
- **GET** `/api/projects`
- **描述**: 获取项目列表，支持搜索、筛选和分页
- **查询参数**:
  - `page`: 页码 (默认: 1)
  - `limit`: 每页数量 (默认: 12, 最大: 100)
  - `search`: 搜索关键词
  - `hackathonId`: 黑客松ID筛选
  - `teamId`: 团队ID筛选
  - `technology`: 技术栈筛选
  - `status`: 状态筛选 (draft/submitted/reviewed/winner)
  - `sortBy`: 排序字段 (createdAt/updatedAt/title)
  - `sortOrder`: 排序方向 (asc/desc)
- **响应**:
```json
{
  "success": true,
  "projects": [
    {
      "id": "clx1234567890abcdef",
      "title": "DeFi Yield Optimizer",
      "description": "项目描述...",
      "technologies": ["Solidity", "React", "Node.js"],
      "tags": ["DeFi", "收益优化", "智能合约"],
      "githubUrl": "https://github.com/...",
      "demoUrl": "https://demo.example.com",
      "videoUrl": "https://youtube.com/...",
      "presentationUrl": "https://slides.example.com",
      "ipfsHash": "QmExampleHash123456789",
      "status": "submitted",
      "isPublic": true,
      "createdAt": "2024-03-16T10:00:00.000Z",
      "hackathon": {
        "id": "clx1234567890abcdef",
        "title": "Web3 创新黑客松 2024"
      },
      "team": {
        "id": "clx1234567890abcdef",
        "name": "Web3 Warriors",
        "members": [
          {
            "user": {
              "id": "clx1234567890abcdef",
              "username": "alice_dev",
              "avatarUrl": "https://..."
            }
          }
        ]
      },
      "_count": {
        "scores": 3,
        "feedbacks": 5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 45,
    "totalPages": 4
  }
}
```

#### 4.2 创建项目
- **POST** `/api/projects`
- **描述**: 创建新项目
- **认证**: 需要
- **请求体**:
```json
{
  "title": "项目标题",
  "description": "项目详细描述...",
  "hackathonId": "clx1234567890abcdef",
  "teamId": "clx1234567890abcdef", // 可选
  "technologies": ["React", "Node.js", "Solidity"],
  "tags": ["Web3", "DeFi", "创新"],
  "githubUrl": "https://github.com/...",
  "demoUrl": "https://demo.example.com",
  "videoUrl": "https://youtube.com/...",
  "presentationUrl": "https://slides.example.com",
  "ipfsHash": "QmExampleHash123456789",
  "isPublic": true
}
```

### 5. 团队管理

#### 5.1 获取团队列表
- **GET** `/api/teams`
- **描述**: 获取团队列表，支持搜索、筛选和分页
- **查询参数**:
  - `page`: 页码 (默认: 1)
  - `limit`: 每页数量 (默认: 12, 最大: 100)
  - `search`: 搜索关键词
  - `hackathonId`: 黑客松ID筛选
  - `skill`: 技能筛选
  - `hasOpenings`: 是否有空位 (true/false)
  - `sortBy`: 排序字段 (createdAt/name/memberCount)
  - `sortOrder`: 排序方向 (asc/desc)
- **响应**:
```json
{
  "success": true,
  "teams": [
    {
      "id": "clx1234567890abcdef",
      "name": "Web3 Warriors",
      "description": "团队描述...",
      "maxMembers": 5,
      "skills": ["Solidity", "React", "Node.js"],
      "tags": ["DeFi", "NFT", "前端开发"],
      "isPublic": true,
      "createdAt": "2024-02-20T10:00:00.000Z",
      "hackathon": {
        "id": "clx1234567890abcdef",
        "title": "Web3 创新黑客松 2024"
      },
      "leader": {
        "id": "clx1234567890abcdef",
        "username": "alice_dev",
        "avatarUrl": "https://..."
      },
      "members": [
        {
          "id": "clx1234567890abcdef",
          "role": "leader",
          "joinedAt": "2024-02-20T10:00:00.000Z",
          "user": {
            "id": "clx1234567890abcdef",
            "username": "alice_dev",
            "avatarUrl": "https://..."
          }
        }
      ],
      "_count": {
        "members": 3,
        "projects": 1
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 15,
    "totalPages": 2
  }
}
```

#### 5.2 创建团队
- **POST** `/api/teams`
- **描述**: 创建新团队
- **认证**: 需要
- **请求体**:
```json
{
  "name": "团队名称",
  "description": "团队描述...",
  "hackathonId": "clx1234567890abcdef",
  "maxMembers": 5,
  "skills": ["React", "Node.js", "Solidity"],
  "tags": ["Web3", "DeFi", "创新"],
  "isPublic": true
}
```

### 6. IPFS 文件管理

#### 6.1 上传文件到 IPFS- **POST** `/api/ipfs/upload`- **描述**: 上传文件到 IPFS 网络- **认证**: 需要- **请求体**: `multipart/form-data`  - `file`: 要上传的文件- **响应**:```json{  "success": true,  "message": "文件上传成功",  "file": {    "name": "document.pdf",    "type": "file",    "size": 1024000,    "hash": "QmExampleHash123456789",    "url": "https://ipfs.io/ipfs/QmExampleHash123456789"  }}```

#### 6.2 上传 JSON 数据到 IPFS
- **PUT** `/api/ipfs/upload`
- **描述**: 上传 JSON 数据到 IPFS 网络
- **认证**: 需要
- **请求体**:
```json
{
  "data": {
    "title": "项目数据",
    "description": "项目描述",
    "metadata": { ... }
  },
  "metadata": {
    "name": "project-data.json",
    "description": "项目数据文件",
    "tags": ["project", "data"],
    "version": "1.0.0",
    "author": "alice_dev"
  }
}
```
- **响应**:
```json
{
  "success": true,
  "message": "数据上传成功",
  "hash": "QmExampleHash123456789",
  "url": "https://ipfs.io/ipfs/QmExampleHash123456789"
}
```

## 7. 项目评分和反馈 API

### 7.1 提交项目评分
- **POST** `/api/projects/[id]/scores`
- **描述**: 评委对项目进行评分，评分数据将同时存储在数据库和IPFS中
- **认证**: 需要
- **请求体**:
```json
{
  "innovation": 8.5,
  "technicalComplexity": 9.0,
  "userExperience": 7.5,
  "businessPotential": 8.0,
  "presentation": 8.5,
  "comments": "这是一个非常创新的项目，技术实现很出色...",
  "isPublic": true
}
```
- **响应**:
```json
{
  "success": true,
  "message": "评分提交成功",
  "score": {
    "id": "score_123",
    "projectId": "project_456",
    "judgeId": "user_789",
    "innovation": 8.5,
    "technicalComplexity": 9.0,
    "userExperience": 7.5,
    "businessPotential": 8.0,
    "presentation": 8.5,
    "totalScore": 8.3,
    "comments": "这是一个非常创新的项目...",
    "ipfsHash": "QmExampleHash123456789",
    "ipfsUrl": "https://ipfs.io/ipfs/QmExampleHash123456789",
    "createdAt": "2024-01-01T12:00:00Z",
    "judge": {
      "id": "user_789",
      "username": "judge_alice",
      "avatarUrl": "https://example.com/avatar.jpg"
    }
  }
}
```

### 7.2 获取项目评分
- **GET** `/api/projects/[id]/scores`
- **描述**: 获取项目的所有评分，包含IPFS数据链接
- **认证**: 不需要
- **响应**:
```json
{
  "success": true,
  "scores": [
    {
      "id": "score_123",
      "innovation": 8.5,
      "technicalComplexity": 9.0,
      "userExperience": 7.5,
      "businessPotential": 8.0,
      "presentation": 8.5,
      "totalScore": 8.3,
      "comments": "这是一个非常创新的项目...",
      "ipfsHash": "QmExampleHash123456789",
      "ipfsUrl": "https://ipfs.io/ipfs/QmExampleHash123456789",
      "createdAt": "2024-01-01T12:00:00Z",
      "judge": {
        "id": "user_789",
        "username": "judge_alice",
        "avatarUrl": "https://example.com/avatar.jpg"
      }
    }
  ],
  "averageScore": 8.3,
  "totalScores": 1
}
```

### 7.3 提交项目反馈
- **POST** `/api/projects/[id]/feedback`
- **描述**: 用户对项目提交反馈，反馈数据将同时存储在数据库和IPFS中
- **认证**: 需要
- **请求体**:
```json
{
  "rating": 5,
  "comment": "这个项目很棒，UI设计很出色！",
  "type": "general"
}
```
- **响应**:
```json
{
  "success": true,
  "message": "反馈提交成功",
  "feedback": {
    "id": "feedback_123",
    "projectId": "project_456",
    "userId": "user_789",
    "rating": 5,
    "comment": "这个项目很棒，UI设计很出色！",
    "ipfsHash": "QmExampleHash123456789",
    "ipfsUrl": "https://ipfs.io/ipfs/QmExampleHash123456789",
    "createdAt": "2024-01-01T12:00:00Z",
    "user": {
      "id": "user_789",
      "username": "user_alice",
      "avatarUrl": "https://example.com/avatar.jpg"
    }
  }
}
```

### 7.4 获取项目反馈
- **GET** `/api/projects/[id]/feedback`
- **描述**: 获取项目的所有反馈，包含IPFS数据链接和统计信息
- **认证**: 不需要
- **响应**:
```json
{
  "success": true,
  "feedbacks": [
    {
      "id": "feedback_123",
      "rating": 5,
      "comment": "这个项目很棒，UI设计很出色！",
      "ipfsHash": "QmExampleHash123456789",
      "ipfsUrl": "https://ipfs.io/ipfs/QmExampleHash123456789",
      "createdAt": "2024-01-01T12:00:00Z",
      "user": {
        "id": "user_789",
        "username": "user_alice",
        "avatarUrl": "https://example.com/avatar.jpg"
      }
    }
  ],
  "averageRating": 5.0,
  "totalFeedbacks": 1,
  "ratingStats": {
    "5": 1,
    "4": 0,
    "3": 0,
    "2": 0,
    "1": 0
  }
}
```

## 8. 项目互动 API

### 8.1 点赞项目
- **POST** `/api/projects/[id]/likes`
- **描述**: 用户点赞项目，点赞数据将同时存储在数据库和IPFS中
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "message": "点赞成功",
  "like": {
    "id": "like_123",
    "projectId": "project_456",
    "userId": "user_789",
    "ipfsHash": "QmExampleHash123456789",
    "ipfsUrl": "https://ipfs.io/ipfs/QmExampleHash123456789",
    "createdAt": "2024-01-01T12:00:00Z",
    "user": {
      "id": "user_789",
      "username": "user_alice",
      "avatarUrl": "https://example.com/avatar.jpg"
    }
  }
}
```

### 8.2 取消点赞
- **DELETE** `/api/projects/[id]/likes`
- **描述**: 用户取消点赞项目
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "message": "取消点赞成功"
}
```

### 8.3 获取项目点赞
- **GET** `/api/projects/[id]/likes`
- **描述**: 获取项目的所有点赞，包含IPFS数据链接
- **认证**: 不需要
- **响应**:
```json
{
  "success": true,
  "likes": [
    {
      "id": "like_123",
      "userId": "user_789",
      "ipfsHash": "QmExampleHash123456789",
      "ipfsUrl": "https://ipfs.io/ipfs/QmExampleHash123456789",
      "createdAt": "2024-01-01T12:00:00Z",
      "user": {
        "id": "user_789",
        "username": "user_alice",
        "avatarUrl": "https://example.com/avatar.jpg"
      }
    }
  ],
  "totalLikes": 1
}
```

## 9. IPFS 数据存储说明

### 9.1 IPFS 存储策略
HackX 平台采用混合存储架构，结合 PostgreSQL 和 IPFS 的优势：

- **PostgreSQL**: 存储结构化数据、关系数据、快速查询数据
- **IPFS**: 存储完整数据、不可篡改数据、大文件数据

### 9.2 IPFS 存储的数据类型

#### 黑客松详情 (Hackathon Details)
```json
{
  "version": "1.0",
  "type": "hackathon",
  "timestamp": "2024-01-01T12:00:00Z",
  "hackathon": {
    "title": "Web3 创新挑战赛",
    "description": "构建下一代去中心化应用",
    "organizer": { ... },
    "prizes": [ ... ],
    "tracks": [ ... ],
    "schedule": [ ... ],
    "sponsors": [ ... ],
    "judgingCriteria": [ ... ]
  }
}
```

#### 用户资料 (User Profile)
```json
{
  "version": "1.0",
  "type": "user-profile",
  "timestamp": "2024-01-01T12:00:00Z",
  "profile": {
    "id": "user_123",
    "email": "alice@example.com",
    "username": "alice_dev",
    "bio": "全栈开发者...",
    "socialLinks": { ... },
    "notificationSettings": { ... },
    "privacySettings": { ... }
  }
}
```

#### 项目评分 (Project Score)
```json
{
  "version": "1.0",
  "type": "project-score",
  "timestamp": "2024-01-01T12:00:00Z",
  "score": {
    "projectId": "project_123",
    "projectTitle": "DeFi Yield Optimizer",
    "judge": { ... },
    "scores": {
      "innovation": 8.5,
      "technicalComplexity": 9.0,
      "userExperience": 7.5,
      "businessPotential": 8.0,
      "presentation": 8.5,
      "totalScore": 8.3
    },
    "comments": "这是一个非常创新的项目...",
    "isPublic": true
  }
}
```

#### 项目反馈 (Project Feedback)
```json
{
  "version": "1.0",
  "type": "project-feedback",
  "timestamp": "2024-01-01T12:00:00Z",
  "feedback": {
    "projectId": "project_123",
    "projectTitle": "AI-Powered NFT Marketplace",
    "user": { ... },
    "rating": 5,
    "comment": "这个项目很棒，UI设计很出色！",
    "type": "general"
  }
}
```

#### 项目点赞 (Project Like)
```json
{
  "version": "1.0",
  "type": "project-like",
  "timestamp": "2024-01-01T12:00:00Z",
  "like": {
    "projectId": "project_123",
    "projectTitle": "DeFi Yield Optimizer",
    "user": { ... }
  }
}
```

### 9.3 IPFS 数据访问
所有存储在 IPFS 的数据都可以通过以下方式访问：
- **直接访问**: `https://ipfs.io/ipfs/{hash}`
- **网关访问**: `https://gateway.pinata.cloud/ipfs/{hash}`
- **API 返回**: 所有相关 API 都会返回 `ipfsUrl` 字段

### 9.4 数据一致性
- 数据库操作优先，IPFS 作为补充存储
- IPFS 上传失败不影响基本功能
- 支持从 IPFS 恢复数据到数据库

## 10. 错误代码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或认证失败 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如重复注册） |
| 422 | 数据验证失败 |
| 500 | 服务器内部错误 |

## 11. 速率限制

- **认证接口**: 5次/分钟
- **其他接口**: 100次/分钟
- **文件上传**: 10次/分钟

## 12. 环境变量

```bash
# 数据库
DATABASE_URL="postgresql://username:password@localhost:5432/hackx_platform"

# JWT
JWT_SECRET="your-jwt-secret-key"

# IPFS
IPFS_PROJECT_ID="your-ipfs-project-id"
IPFS_PROJECT_SECRET="your-ipfs-project-secret"
IPFS_GATEWAY="https://ipfs.io"

# Web3
WEB3_PROVIDER_URL="https://mainnet.infura.io/v3/your-project-id"

# 邮件服务
EMAIL_SERVER="smtp://username:password@smtp.example.com:587"

# Redis
REDIS_URL="redis://localhost:6379"
```

## 13. 测试账户

可以使用以下测试账户进行API测试：

- **管理员**: `admin@hackx.com` / `password123`
- **开发者**: `alice@example.com` / `password123`
- **Web3开发者**: `bob@example.com` / `password123`
- **设计师**: `carol@example.com` / `password123`

## 14. 更新日志

### v1.0.3 (2024-01-01)
- 新增完整的Web3功能API
  - DAO治理：提案创建、投票、执行
  - NFT管理：铸造、查询用户NFT
  - 质押功能：质押、解除质押、领取奖励
- 新增管理员功能API
  - 系统统计和监控
  - 用户管理和权限控制
  - 内容审核和管理
- 完善用户角色和状态管理
- 更新数据库schema支持Web3功能
- 新增完整的API文档和示例

### v1.0.2 (2024-01-01)
- 新增项目评分和反馈 IPFS 存储功能
- 新增项目点赞 IPFS 存储功能
- 更新数据库 schema，添加 IPFS 相关字段
- 完善 API 文档，添加 IPFS 数据存储说明
- 实现完全基于 IPFS 的数据持久化架构

### v1.0.1 (2024-01-01)
- 修正数据库模型字段不一致问题
- 更新Project模型字段名从name改为title
- 修正Team模型缺少hackathonId等字段
- 修正Score和Feedback模型字段结构
- 确保API文档与实际实现完全一致

### v1.0.0 (2024-01-01)
- 初始版本发布
- 支持用户认证、黑客松管理、项目提交、团队管理
- 集成 IPFS 文件存储
- 完整的 RESTful API 