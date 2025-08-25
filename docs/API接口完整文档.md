# HackX 去中心化黑客松平台 - API接口完整文档

## 📋 文档概述

本文档是HackX去中心化黑客松平台的完整API接口文档，涵盖所有后端API端点、Web3集成接口、IPFS存储接口等。作为开发者和产品经理的技术参考文档。

### 版本信息
- **API版本**: v2.0.0
- **文档版本**: 2024.12.25
- **协议**: HTTP/HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8

### 基础信息
- **开发环境**: `http://localhost:3000/api`
- **生产环境**: `https://hackx.io/api`
- **认证方式**: JWT Bearer Token + Web3签名
- **请求限制**: 详见[速率限制](#速率限制)章节

## 🔐 认证体系

### 传统认证
```http
Authorization: Bearer <jwt-token>
```

### Web3认证
```http
Authorization: Bearer <jwt-token>
X-Wallet-Address: <wallet-address>
X-Wallet-Signature: <signature>
```

## 📊 通用响应格式

### 成功响应
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 具体数据
  },
  "timestamp": "2024-12-25T10:00:00.000Z",
  "requestId": "req_1234567890"
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误描述",
  "errorCode": "ERROR_CODE",
  "details": {
    // 错误详情
  },
  "timestamp": "2024-12-25T10:00:00.000Z",
  "requestId": "req_1234567890"
}
```

### 分页响应
```json
{
  "success": true,
  "data": [
    // 数据数组
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 👤 用户认证模块

### 1.1 用户注册
```http
POST /api/auth/signup
```

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username",
  "walletAddress": "0x...", // 可选
  "ipfsProfile": {
    "bio": "开发者简介",
    "skills": ["React", "Solidity"],
    "socialLinks": {
      "github": "https://github.com/username",
      "twitter": "https://twitter.com/username"
    }
  }
}
```

**响应**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "usr_1234567890",
      "email": "user@example.com",
      "username": "username",
      "walletAddress": "0x...",
      "ipfsProfileHash": "QmHash123...",
      "reputation": 0,
      "nftCount": 1,
      "createdAt": "2024-12-25T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "nftCertificate": {
      "tokenId": "1",
      "type": "welcome",
      "transactionHash": "0x..."
    }
  }
}
```

### 1.2 Web3钱包登录
```http
POST /api/auth/wallet-signin
```

**请求体**:
```json
{
  "walletAddress": "0x1234567890abcdef...",
  "signature": "0xabcdef...",
  "message": "Sign in to HackX Platform",
  "chainId": 137
}
```

**响应**:
```json
{
  "success": true,
  "message": "钱包登录成功",
  "data": {
    "user": {
      "id": "usr_1234567890",
      "walletAddress": "0x...",
      "username": "crypto_dev",
      "reputation": 85,
      "web3Assets": {
        "hackxTokens": 1000,
        "nftCertificates": 15,
        "stakingBalance": 500
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "session": {
      "chainId": 137,
      "networkName": "Polygon",
      "blockNumber": 45123456
    }
  }
}
```

### 1.3 多因素认证
```http
POST /api/auth/mfa/enable
```

**请求体**:
```json
{
  "method": "totp", // 'totp' | 'sms' | 'email'
  "secret": "MFASECRET123456", // TOTP密钥
  "verificationCode": "123456"
}
```

### 1.4 刷新令牌
```http
POST /api/auth/refresh
```

**请求体**:
```json
{
  "refreshToken": "refresh_token_here"
}
```

## 👥 用户管理模块

### 2.1 获取用户资料
```http
GET /api/users/me
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_1234567890",
      "email": "user@example.com",
      "username": "crypto_dev",
      "walletAddress": "0x...",
      "ipfsProfileHash": "QmHash123...",
      "reputation": 85,
      "level": "expert",
      "badges": ["early_adopter", "top_contributor"],
      "statistics": {
        "hackathonsParticipated": 12,
        "projectsSubmitted": 8,
        "prizesWon": 3,
        "nftCertificates": 15
      },
      "web3Assets": {
        "hackxTokens": 1000,
        "stakedTokens": 500,
        "votingPower": 750,
        "nftCollection": [
          {
            "tokenId": "1",
            "type": "achievement",
            "name": "First Place Winner",
            "imageUrl": "https://ipfs.io/ipfs/QmImage...",
            "attributes": {
              "rarity": "legendary",
              "event": "Web3 Innovation Hackathon 2024"
            }
          }
        ]
      },
      "settings": {
        "privacy": {
          "profileVisibility": "public",
          "showWalletAddress": true,
          "showEmail": false
        },
        "notifications": {
          "email": true,
          "push": true,
          "sms": false,
          "web3Events": true
        },
        "preferences": {
          "theme": "dark",
          "language": "zh-CN",
          "timezone": "Asia/Shanghai"
        }
      }
    }
  }
}
```

### 2.2 更新用户资料
```http
PUT /api/users/me
```

**请求体**:
```json
{
  "username": "new_username",
  "bio": "Updated bio",
  "skills": ["React", "Solidity", "Web3"],
  "socialLinks": {
    "github": "https://github.com/newusername",
    "twitter": "https://twitter.com/newusername",
    "linkedin": "https://linkedin.com/in/newusername"
  },
  "ipfsUpdate": true // 是否更新IPFS上的资料
}
```

### 2.3 获取用户NFT收藏
```http
GET /api/users/me/nfts
```

**查询参数**:
- `type`: NFT类型筛选
- `rarity`: 稀有度筛选
- `page`: 页码
- `limit`: 每页数量

**响应**:
```json
{
  "success": true,
  "data": {
    "nfts": [
      {
        "tokenId": "1",
        "contractAddress": "0x...",
        "type": "achievement",
        "name": "First Place Winner",
        "description": "Winner of Web3 Innovation Hackathon 2024",
        "imageUrl": "https://ipfs.io/ipfs/QmImage...",
        "metadataUrl": "https://ipfs.io/ipfs/QmMetadata...",
        "attributes": {
          "rarity": "legendary",
          "event": "Web3 Innovation Hackathon 2024",
          "rank": 1,
          "participants": 200
        },
        "mintedAt": "2024-03-15T18:00:00.000Z",
        "transactionHash": "0x..."
      }
    ],
    "statistics": {
      "total": 15,
      "byType": {
        "achievement": 8,
        "participation": 5,
        "special": 2
      },
      "byRarity": {
        "common": 10,
        "rare": 3,
        "epic": 1,
        "legendary": 1
      }
    }
  }
}
```

## 🏆 黑客松管理模块

### 3.1 获取黑客松列表
```http
GET /api/hackathons
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 12, 最大: 100)
- `search`: 搜索关键词
- `status`: 状态筛选 ('upcoming', 'ongoing', 'ended')
- `category`: 类别筛选
- `prizeMin`: 最小奖金
- `prizeMax`: 最大奖金
- `featured`: 是否精选
- `chainId`: 区块链网络ID
- `sortBy`: 排序字段
- `sortOrder`: 排序方向

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "hck_1234567890",
      "contractId": 1,
      "title": "Web3 Innovation Hackathon 2024",
      "description": "Build the future of decentralized web",
      "status": "ongoing",
      "startDate": "2024-03-15T09:00:00.000Z",
      "endDate": "2024-03-17T18:00:00.000Z",
      "registrationDeadline": "2024-03-10T23:59:59.000Z",
      "prizePool": {
        "total": 50000,
        "currency": "USDC",
        "distribution": [
          { "rank": 1, "amount": 20000 },
          { "rank": 2, "amount": 15000 },
          { "rank": 3, "amount": 10000 }
        ]
      },
      "blockchain": {
        "chainId": 137,
        "networkName": "Polygon",
        "contractAddress": "0x...",
        "ipfsHash": "QmHackathon..."
      },
      "organizer": {
        "id": "usr_1234567890",
        "username": "web3_foundation",
        "walletAddress": "0x...",
        "reputation": 95
      },
      "statistics": {
        "participants": 150,
        "teams": 45,
        "projects": 38,
        "totalPrizePool": 50000
      },
      "tracks": [
        {
          "id": "defi",
          "name": "DeFi Innovation",
          "description": "Build the next generation of DeFi protocols",
          "prizes": [10000, 5000, 2500]
        }
      ],
      "sponsors": [
        {
          "name": "Polygon",
          "logo": "https://polygon.technology/logo.png",
          "tier": "platinum"
        }
      ]
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

### 3.2 创建黑客松
```http
POST /api/hackathons
```

**请求体**:
```json
{
  "title": "New Hackathon 2024",
  "description": "Build amazing Web3 applications",
  "startDate": "2024-06-01T09:00:00.000Z",
  "endDate": "2024-06-03T18:00:00.000Z",
  "registrationDeadline": "2024-05-25T23:59:59.000Z",
  "maxParticipants": 200,
  "prizePool": {
    "total": 30000,
    "currency": "USDC",
    "distribution": [
      { "rank": 1, "amount": 15000 },
      { "rank": 2, "amount": 10000 },
      { "rank": 3, "amount": 5000 }
    ]
  },
  "tracks": [
    {
      "name": "DeFi Track",
      "description": "Build DeFi applications",
      "prizes": [8000, 5000, 2000]
    }
  ],
  "requirements": {
    "minTeamSize": 1,
    "maxTeamSize": 5,
    "eligibility": ["Students", "Professionals"],
    "technologies": ["Solidity", "Web3"]
  },
  "judges": [
    {
      "walletAddress": "0x...",
      "name": "Vitalik Buterin",
      "bio": "Ethereum Founder"
    }
  ],
  "blockchain": {
    "chainId": 137,
    "createOnChain": true
  }
}
```

**响应**:
```json
{
  "success": true,
  "message": "黑客松创建成功",
  "data": {
    "hackathon": {
      "id": "hck_1234567890",
      "contractId": 15,
      "title": "New Hackathon 2024",
      "ipfsHash": "QmNewHackathon...",
      "blockchain": {
        "transactionHash": "0x...",
        "blockNumber": 45123456,
        "gasUsed": 150000,
        "contractAddress": "0x..."
      },
      "createdAt": "2024-12-25T10:00:00.000Z"
    }
  }
}
```

### 3.3 参与黑客松
```http
POST /api/hackathons/{id}/register
```

**请求体**:
```json
{
  "teamId": "team_1234567890", // 可选，如果有团队
  "walletAddress": "0x...",
  "signatureData": {
    "message": "Register for hackathon",
    "signature": "0x...",
    "chainId": 137
  }
}
```

### 3.4 获取黑客松链上数据
```http
GET /api/hackathons/{id}/chain-data
```

**响应**:
```json
{
  "success": true,
  "data": {
    "contractId": 1,
    "contractAddress": "0x...",
    "ipfsHash": "QmHackathon...",
    "organizer": "0x...",
    "blockchain": {
      "chainId": 137,
      "blockNumber": 45123456,
      "transactionHash": "0x...",
      "gasUsed": 150000
    },
    "participants": [
      {
        "walletAddress": "0x...",
        "registeredAt": "2024-03-10T10:00:00.000Z",
        "transactionHash": "0x..."
      }
    ],
    "projects": [
      {
        "contractId": 1,
        "ipfsHash": "QmProject...",
        "submitter": "0x...",
        "submittedAt": "2024-03-16T15:30:00.000Z"
      }
    ]
  }
}
```

## 💼 项目管理模块

### 4.1 获取项目列表
```http
GET /api/projects
```

**查询参数**:
- `hackathonId`: 黑客松ID筛选
- `technology`: 技术栈筛选
- `status`: 项目状态
- `search`: 搜索关键词
- `sortBy`: 排序字段 ('createdAt', 'likes', 'score')

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "prj_1234567890",
      "contractId": 1,
      "title": "DeFi Yield Optimizer",
      "description": "AI-powered yield optimization for DeFi protocols",
      "status": "submitted",
      "technologies": ["Solidity", "React", "Python", "TensorFlow"],
      "tags": ["DeFi", "AI", "Yield Farming"],
      "repositories": {
        "github": "https://github.com/team/defi-optimizer",
        "frontend": "https://defi-optimizer.vercel.app",
        "contracts": "0x..."
      },
      "demo": {
        "liveUrl": "https://demo.defi-optimizer.com",
        "videoUrl": "https://youtube.com/watch?v=...",
        "slidesUrl": "https://slides.defi-optimizer.com"
      },
      "blockchain": {
        "ipfsHash": "QmProject...",
        "transactionHash": "0x...",
        "contractAddress": "0x...",
        "chainId": 137
      },
      "team": {
        "id": "team_1234567890",
        "name": "DeFi Innovators",
        "members": [
          {
            "walletAddress": "0x...",
            "username": "alice_dev",
            "role": "team_leader",
            "skills": ["Solidity", "Smart Contracts"]
          }
        ]
      },
      "hackathon": {
        "id": "hck_1234567890",
        "title": "Web3 Innovation Hackathon 2024",
        "track": "DeFi"
      },
      "metrics": {
        "likes": 45,
        "views": 1200,
        "averageScore": 8.5,
        "totalScores": 5,
        "comments": 12
      },
      "awards": [
        {
          "type": "winner",
          "rank": 1,
          "category": "DeFi Track",
          "prize": 8000,
          "nftTokenId": "15"
        }
      ]
    }
  ]
}
```

### 4.2 创建项目
```http
POST /api/projects
```

**请求体**:
```json
{
  "title": "AI-Powered NFT Marketplace",
  "description": "An intelligent NFT marketplace with AI-driven pricing",
  "hackathonId": "hck_1234567890",
  "teamId": "team_1234567890",
  "technologies": ["Solidity", "React", "Python", "OpenAI"],
  "tags": ["NFT", "AI", "Marketplace"],
  "repositories": {
    "github": "https://github.com/team/nft-marketplace",
    "frontend": "https://nft-marketplace.vercel.app"
  },
  "demo": {
    "liveUrl": "https://demo.nft-marketplace.com",
    "videoUrl": "https://youtube.com/watch?v=...",
    "slidesUrl": "https://slides.nft-marketplace.com"
  },
  "blockchain": {
    "contractAddress": "0x...",
    "deployedNetworks": [137, 1],
    "submitToChain": true
  },
  "additionalFiles": [
    {
      "name": "whitepaper.pdf",
      "ipfsHash": "QmWhitepaper...",
      "type": "document"
    }
  ]
}
```

### 4.3 项目评分
```http
POST /api/projects/{id}/scores
```

**请求体**:
```json
{
  "scores": {
    "innovation": 9.0,
    "technicalComplexity": 8.5,
    "userExperience": 8.0,
    "businessPotential": 8.5,
    "presentation": 9.0
  },
  "comments": "Excellent project with innovative AI integration",
  "isPublic": true,
  "judgeSignature": {
    "message": "Score submission for project prj_1234567890",
    "signature": "0x...",
    "walletAddress": "0x..."
  }
}
```

### 4.4 项目点赞
```http
POST /api/projects/{id}/like
```

**请求体**:
```json
{
  "walletSignature": {
    "message": "Like project prj_1234567890",
    "signature": "0x...",
    "walletAddress": "0x..."
  }
}
```

## 👨‍👩‍👧‍👦 团队管理模块

### 5.1 创建团队
```http
POST /api/teams
```

**请求体**:
```json
{
  "name": "Blockchain Innovators",
  "description": "Building the future of Web3",
  "hackathonId": "hck_1234567890",
  "maxMembers": 5,
  "requiredSkills": ["Solidity", "React", "UX Design"],
  "preferences": {
    "workingHours": "Asia/Shanghai",
    "communication": ["Discord", "Telegram"],
    "experience": "intermediate"
  },
  "isOpen": true,
  "inviteCode": "TEAM123"
}
```

### 5.2 邀请团队成员
```http
POST /api/teams/{id}/invite
```

**请求体**:
```json
{
  "inviteeWalletAddress": "0x...",
  "role": "developer",
  "message": "Join our amazing team!",
  "permissions": ["view_project", "edit_project"]
}
```

### 5.3 接受团队邀请
```http
POST /api/teams/invitations/{id}/accept
```

**请求体**:
```json
{
  "walletSignature": {
    "message": "Accept team invitation",
    "signature": "0x...",
    "walletAddress": "0x..."
  }
}
```

## 🏛️ DAO治理模块

### 6.1 获取DAO提案列表
```http
GET /api/web3/dao/proposals
```

**查询参数**:
- `status`: 提案状态 ('pending', 'active', 'succeeded', 'defeated', 'executed')
- `proposer`: 提案者地址
- `category`: 提案类别
- `page`: 页码
- `limit`: 每页数量

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "prop_1234567890",
      "contractProposalId": 5,
      "title": "Increase Platform Fee to 2.5%",
      "description": "Proposal to increase platform fee for sustainability",
      "category": "governance",
      "proposer": {
        "walletAddress": "0x...",
        "username": "dao_member",
        "reputation": 85
      },
      "blockchain": {
        "transactionHash": "0x...",
        "blockNumber": 45123456,
        "chainId": 137
      },
      "voting": {
        "startTime": "2024-12-20T00:00:00.000Z",
        "endTime": "2024-12-27T23:59:59.000Z",
        "forVotes": 150000,
        "againstVotes": 50000,
        "abstainVotes": 10000,
        "totalVotes": 210000,
        "quorum": 100000,
        "votingPowerRequired": 1000
      },
      "status": "active",
      "executionData": {
        "targetContract": "0x...",
        "functionCall": "setFeePercentage(250)",
        "executionTime": null
      },
      "createdAt": "2024-12-20T00:00:00.000Z"
    }
  ]
}
```

### 6.2 创建DAO提案
```http
POST /api/web3/dao/proposals
```

**请求体**:
```json
{
  "title": "Add New Hackathon Track: AI+Blockchain",
  "description": "Proposal to add a new track focusing on AI and blockchain integration",
  "category": "feature",
  "executionData": {
    "targetContract": "0x...",
    "functionCall": "addTrack(string memory _name, uint256 _prizePool)",
    "parameters": ["AI+Blockchain", "10000"]
  },
  "votingDuration": 604800, // 7 days in seconds
  "proposerSignature": {
    "message": "Create DAO proposal",
    "signature": "0x...",
    "walletAddress": "0x..."
  }
}
```

### 6.3 投票
```http
POST /api/web3/dao/proposals/{id}/vote
```

**请求体**:
```json
{
  "support": 1, // 0: against, 1: for, 2: abstain
  "votingPower": 5000,
  "reason": "I support this proposal because...",
  "voterSignature": {
    "message": "Vote on proposal prop_1234567890",
    "signature": "0x...",
    "walletAddress": "0x..."
  }
}
```

### 6.4 获取投票权
```http
GET /api/web3/dao/voting-power
```

**查询参数**:
- `walletAddress`: 钱包地址
- `blockNumber`: 指定区块高度（可选）

**响应**:
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x...",
    "votingPower": 15000,
    "sources": {
      "tokenBalance": 10000,
      "stakedTokens": 5000,
      "delegatedPower": 0,
      "nftBonus": 0
    },
    "delegatedTo": null,
    "delegatedFrom": [
      {
        "delegator": "0x...",
        "power": 2000
      }
    ],
    "blockNumber": 45123456
  }
}
```

## 🎨 NFT证书模块

### 7.1 获取用户NFT
```http
GET /api/web3/nfts
```

**查询参数**:
- `owner`: 拥有者地址
- `type`: NFT类型
- `event`: 相关事件
- `rarity`: 稀有度

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "tokenId": "15",
      "contractAddress": "0x...",
      "owner": "0x...",
      "type": "achievement",
      "name": "First Place Winner",
      "description": "Winner of Web3 Innovation Hackathon 2024",
      "image": "https://ipfs.io/ipfs/QmImage...",
      "metadata": {
        "ipfsHash": "QmMetadata...",
        "attributes": [
          {
            "trait_type": "Event",
            "value": "Web3 Innovation Hackathon 2024"
          },
          {
            "trait_type": "Rank",
            "value": "1st Place"
          },
          {
            "trait_type": "Rarity",
            "value": "Legendary"
          }
        ]
      },
      "blockchain": {
        "mintTransactionHash": "0x...",
        "mintBlockNumber": 45123456,
        "chainId": 137
      },
      "event": {
        "hackathonId": "hck_1234567890",
        "projectId": "prj_1234567890",
        "track": "DeFi"
      },
      "mintedAt": "2024-03-17T18:00:00.000Z"
    }
  ]
}
```

### 7.2 铸造NFT证书
```http
POST /api/web3/nfts/mint
```

**请求体**:
```json
{
  "recipient": "0x...",
  "type": "winner",
  "eventId": "hck_1234567890",
  "projectId": "prj_1234567890",
  "metadata": {
    "name": "First Place Winner",
    "description": "Winner of Web3 Innovation Hackathon 2024",
    "image": "QmImage...",
    "attributes": [
      {
        "trait_type": "Rank",
        "value": "1st Place"
      }
    ]
  },
  "authorizedSigner": {
    "message": "Mint NFT certificate",
    "signature": "0x...",
    "walletAddress": "0x..."
  }
}
```

## 💰 质押奖励模块

### 8.1 获取质押信息
```http
GET /api/web3/staking/info
```

**查询参数**:
- `walletAddress`: 质押者地址

**响应**:
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x...",
    "totalStaked": 5000,
    "availableBalance": 3000,
    "stakingRewards": {
      "earned": 150,
      "claimed": 100,
      "pending": 50
    },
    "stakingPools": [
      {
        "poolId": 1,
        "name": "HACKX Governance Pool",
        "stakedAmount": 3000,
        "apy": 12.5,
        "lockPeriod": 2592000, // 30 days
        "unlockTime": "2024-01-15T00:00:00.000Z",
        "canWithdraw": false
      },
      {
        "poolId": 2,
        "name": "Liquidity Provider Pool",
        "stakedAmount": 2000,
        "apy": 8.0,
        "lockPeriod": 0,
        "canWithdraw": true
      }
    ],
    "votingPower": 5000,
    "multipliers": {
      "timeBonus": 1.2,
      "loyaltyBonus": 1.1,
      "nftBonus": 1.05
    }
  }
}
```

### 8.2 质押代币
```http
POST /api/web3/staking/stake
```

**请求体**:
```json
{
  "amount": 1000,
  "poolId": 1,
  "lockPeriod": 2592000, // 30 days
  "walletSignature": {
    "message": "Stake 1000 HACKX tokens",
    "signature": "0x...",
    "walletAddress": "0x..."
  }
}
```

### 8.3 领取奖励
```http
POST /api/web3/staking/claim
```

**请求体**:
```json
{
  "poolId": 1,
  "amount": 50, // 可选，不指定则领取全部
  "walletSignature": {
    "message": "Claim staking rewards",
    "signature": "0x...",
    "walletAddress": "0x..."
  }
}
```

## 📡 IPFS存储模块

### 9.1 上传文件到IPFS
```http
POST /api/ipfs/upload
```

**请求体**: `multipart/form-data`
- `file`: 文件内容
- `metadata`: 文件元数据（JSON字符串）

**响应**:
```json
{
  "success": true,
  "message": "文件上传成功",
  "file": {
    "name": "whitepaper.pdf",
    "type": "application/pdf",
    "size": 1024000,
    "hash": "QmFile123456789...",
    "url": "https://gateway.pinata.cloud/ipfs/QmFile123456789...",
    "gateway": "pinata",
    "pinned": true
  }
}
```

### 9.2 上传JSON数据
```http
PUT /api/ipfs/upload
```

**请求体**:
```json
{
  "data": {
    "title": "Project Metadata",
    "description": "Complete project information",
    "version": "1.0.0",
    "content": {
      // 实际数据内容
    }
  },
  "metadata": {
    "name": "project-metadata.json",
    "category": "project",
    "tags": ["project", "metadata"],
    "author": "alice_dev"
  }
}
```

**响应**:
```json
{
  "success": true,
  "message": "数据上传成功",
  "hash": "QmData123456789...",
  "url": "https://gateway.pinata.cloud/ipfs/QmData123456789...",
  "size": 2048,
  "pinned": true
}
```

### 9.3 验证IPFS内容
```http
GET /api/ipfs/verify/{hash}
```

**查询参数**:
- `expectedType`: 期望的内容类型
- `checkIntegrity`: 是否检查完整性

**响应**:
```json
{
  "success": true,
  "data": {
    "hash": "QmHash123456789...",
    "exists": true,
    "contentType": "application/json",
    "size": 2048,
    "integrity": "verified",
    "gateways": [
      {
        "url": "https://ipfs.io/ipfs/QmHash123456789...",
        "status": "available",
        "responseTime": 150
      },
      {
        "url": "https://gateway.pinata.cloud/ipfs/QmHash123456789...",
        "status": "available",
        "responseTime": 89
      }
    ],
    "lastChecked": "2024-12-25T10:00:00.000Z"
  }
}
```

## 🔔 通知系统模块

### 10.1 获取通知列表
```http
GET /api/notifications
```

**查询参数**:
- `type`: 通知类型
- `unread`: 是否只显示未读
- `page`: 页码
- `limit`: 每页数量

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_1234567890",
      "type": "hackathon_started",
      "title": "黑客松已开始",
      "message": "Web3 Innovation Hackathon 2024 现在开始接受项目提交",
      "priority": "high",
      "read": false,
      "data": {
        "hackathonId": "hck_1234567890",
        "hackathonTitle": "Web3 Innovation Hackathon 2024",
        "actionUrl": "/hackathons/hck_1234567890"
      },
      "blockchain": {
        "txHash": "0x...",
        "blockNumber": 45123456
      },
      "createdAt": "2024-12-25T09:00:00.000Z"
    },
    {
      "id": "notif_1234567891",
      "type": "nft_received",
      "title": "获得新的NFT证书",
      "message": "恭喜！您获得了参与证书NFT",
      "priority": "normal",
      "read": true,
      "data": {
        "nftTokenId": "15",
        "nftType": "participation",
        "eventName": "Web3 Innovation Hackathon 2024"
      },
      "createdAt": "2024-12-24T15:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "unreadCount": 12
  }
}
```

### 10.2 标记通知已读
```http
PUT /api/notifications/{id}/read
```

### 10.3 获取通知设置
```http
GET /api/notifications/settings
```

**响应**:
```json
{
  "success": true,
  "data": {
    "preferences": {
      "email": {
        "enabled": true,
        "types": ["hackathon_start", "project_judged", "nft_received"]
      },
      "push": {
        "enabled": true,
        "types": ["team_invitation", "dao_proposal", "urgent_updates"]
      },
      "inApp": {
        "enabled": true,
        "types": ["all"]
      },
      "web3Events": {
        "enabled": true,
        "events": ["transaction_confirmed", "contract_interaction"]
      }
    },
    "frequency": {
      "digest": "daily",
      "immediate": ["urgent", "personal"]
    }
  }
}
```

## 📊 管理员模块

### 11.1 系统统计
```http
GET /api/admin/stats
```

**响应**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 10000,
      "activeUsers": 5000,
      "totalHackathons": 150,
      "totalProjects": 1200,
      "totalNFTs": 5000,
      "totalStaked": 500000
    },
    "growth": {
      "newUsersToday": 50,
      "newUsersThisWeek": 300,
      "newUsersThisMonth": 1200
    },
    "blockchain": {
      "totalTransactions": 25000,
      "gasUsed": 15000000,
      "averageGasPrice": 30,
      "contractInteractions": 12000
    },
    "dao": {
      "activeProposals": 5,
      "totalVotes": 150000,
      "participationRate": 65.5
    }
  }
}
```

### 11.2 用户管理
```http
GET /api/admin/users
```

**查询参数**:
- `status`: 用户状态
- `role`: 用户角色
- `search`: 搜索关键词
- `sortBy`: 排序字段

### 11.3 内容审核
```http
POST /api/admin/moderate
```

**请求体**:
```json
{
  "contentType": "project",
  "contentId": "prj_1234567890",
  "action": "approve", // 'approve', 'reject', 'flag'
  "reason": "Content meets guidelines",
  "moderatorNotes": "Reviewed and approved"
}
```

## ⚡ 速率限制

| 端点类型 | 限制 |
|---------|------|
| 认证接口 | 5次/分钟 |
| 查询接口 | 100次/分钟 |
| 创建接口 | 10次/分钟 |
| 上传接口 | 5次/分钟 |
| Web3交互 | 20次/分钟 |

## 🔒 安全措施

### 认证安全
- JWT令牌有效期：1小时
- Refresh令牌有效期：30天
- Web3签名验证：每次敏感操作
- 多因素认证：支持TOTP/SMS

### 请求安全
- CORS配置：限制来源域名
- CSRF保护：状态令牌验证
- 输入验证：严格的数据验证
- SQL注入防护：参数化查询

### Web3安全
- 智能合约审计：专业安全审计
- 签名验证：防止重放攻击
- Gas限制：防止DoS攻击
- 权限控制：基于角色的访问控制

## 🌐 错误代码

| 错误代码 | HTTP状态码 | 描述 |
|---------|-----------|------|
| AUTH_REQUIRED | 401 | 需要认证 |
| INVALID_TOKEN | 401 | 无效令牌 |
| INSUFFICIENT_PERMISSION | 403 | 权限不足 |
| RESOURCE_NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 422 | 数据验证失败 |
| RATE_LIMIT_EXCEEDED | 429 | 请求频率超限 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| WEB3_ERROR | 500 | Web3交互错误 |
| IPFS_ERROR | 500 | IPFS存储错误 |
| CONTRACT_ERROR | 500 | 智能合约错误 |

## 📋 测试数据

### 测试账户
```json
{
  "admin": {
    "email": "admin@hackx.io",
    "password": "Admin123!",
    "walletAddress": "0x742d35Cc6634C0532925a3b8D2C0b6a8C9C0d1C0"
  },
  "developer": {
    "email": "alice@example.com",
    "password": "Dev123!",
    "walletAddress": "0x8ba1f109551bD432803012645Hac136c60c13a3C"
  },
  "judge": {
    "email": "judge@example.com",
    "password": "Judge123!",
    "walletAddress": "0x6c6Ee5e31d828De241282B9606C8e98eA85C78c"
  }
}
```

### 测试网络信息
```json
{
  "networks": {
    "polygon_testnet": {
      "chainId": 80001,
      "rpcUrl": "https://matic-mumbai.chainstacklabs.com",
      "contracts": {
        "hackxCore": "0x...",
        "nftCertificates": "0x...",
        "governance": "0x..."
      }
    },
    "polygon_mainnet": {
      "chainId": 137,
      "rpcUrl": "https://polygon-rpc.com",
      "contracts": {
        "hackxCore": "0x...",
        "nftCertificates": "0x...",
        "governance": "0x..."
      }
    }
  }
}
```

## 📱 SDK支持

### JavaScript SDK
```javascript
import { HackXAPI } from '@hackx/sdk';

const client = new HackXAPI({
  apiUrl: 'https://api.hackx.io',
  apiKey: 'your_api_key',
  network: 'polygon'
});

// 获取黑客松列表
const hackathons = await client.hackathons.list({
  status: 'ongoing',
  page: 1,
  limit: 10
});

// Web3操作
const project = await client.projects.createWithWallet({
  title: 'My Project',
  walletAddress: '0x...',
  signature: '0x...'
});
```

### Python SDK
```python
from hackx import HackXClient

client = HackXClient(
    api_url='https://api.hackx.io',
    api_key='your_api_key'
)

# 获取用户信息
user = client.users.get_profile('usr_1234567890')

# 创建黑客松
hackathon = client.hackathons.create({
    'title': 'New Hackathon',
    'description': 'Build amazing things',
    'start_date': '2024-06-01T09:00:00Z'
})
```

## 🔄 版本历史

### v2.0.0 (2024-12-25) - 当前版本
- ✅ 完整Web3功能集成
- ✅ DAO治理系统
- ✅ NFT证书管理
- ✅ 质押奖励系统
- ✅ IPFS深度集成
- ✅ 智能合约完全集成
- ✅ 多钱包支持
- ✅ 链上数据同步

### v1.5.0 (2024-12-01)
- ✅ Web3基础功能
- ✅ 钱包连接
- ✅ 智能合约交互
- ✅ IPFS文件存储

### v1.0.0 (2024-11-01)
- ✅ 基础RESTful API
- ✅ 用户认证系统
- ✅ 黑客松管理
- ✅ 项目提交功能

---

**API文档维护**: HackX开发团队  
**最后更新**: 2024年12月25日  
**联系方式**: dev@hackx.io
