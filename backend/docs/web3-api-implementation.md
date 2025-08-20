# Web3 API 实现总结

## 概述

本文档总结了HackX平台Web3功能的API实现情况，包括DAO治理、NFT管理、质押功能等。

## 已实现的API端点

### 1. DAO 治理系统

#### 1.1 提案管理
- **GET** `/api/web3/dao/proposals` - 获取DAO提案列表
- **POST** `/api/web3/dao/proposals` - 创建新的DAO提案

#### 1.2 投票功能
- **POST** `/api/web3/dao/proposals/[id]/vote` - 对提案进行投票
- **POST** `/api/web3/dao/proposals/[id]/execute` - 执行已通过的提案
- **GET** `/api/web3/dao/voting-power` - 获取用户投票权

### 2. NFT 管理系统

#### 2.1 NFT 操作
- **GET** `/api/web3/nfts` - 获取用户NFT列表
- **POST** `/api/web3/nfts` - 铸造新的NFT

### 3. 质押功能

#### 3.1 质押操作
- **GET** `/api/web3/staking/info` - 获取质押信息
- **POST** `/api/web3/staking/stake` - 质押代币
- **POST** `/api/web3/staking/unstake` - 解除质押
- **POST** `/api/web3/staking/claim` - 领取奖励

### 4. 管理员功能

#### 4.1 用户管理
- **GET** `/api/admin/users` - 获取用户列表
- **PUT** `/api/admin/users/[id]/role` - 更新用户角色
- **PUT** `/api/admin/users/[id]/status` - 更新用户状态

#### 4.2 内容管理
- **GET** `/api/admin/posts` - 获取社区帖子列表
- **PUT** `/api/admin/posts/[id]/status` - 更新帖子状态
- **GET** `/api/admin/hackathons` - 获取黑客松列表
- **PUT** `/api/admin/hackathons/[id]/status` - 更新黑客松状态

#### 4.3 系统监控
- **GET** `/api/admin/stats` - 获取系统统计
- **GET** `/api/admin/system-status` - 获取系统状态

## 数据库模型

### 1. DAO 相关模型

#### DAOProposal
```typescript
{
  id: string
  title: string
  description: string
  proposalType: 'governance' | 'funding' | 'technical' | 'community'
  targetAmount?: Decimal
  executionTime: DateTime
  status: 'active' | 'passed' | 'rejected' | 'executed'
  forVotes: number
  againstVotes: number
  creatorId: string
  ipfsHash?: string
  metadata?: Json
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### DAOVote
```typescript
{
  id: string
  proposalId: string
  userId: string
  vote: 'for' | 'against'
  votingPower: number
  ipfsHash?: string
  createdAt: DateTime
}
```

### 2. NFT 模型

#### NFT
```typescript
{
  id: string
  tokenId: number
  name: string
  description: string
  imageUrl: string
  category: 'certificate' | 'achievement' | 'collectible'
  metadata?: Json
  ownerId: string
  ipfsHash?: string
  mintTime: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 3. 质押相关模型

#### Staking
```typescript
{
  id: string
  userId: string
  stakedAmount: Decimal
  rewards: Decimal
  apy: Decimal
  lastRewardTime: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### StakingTransaction
```typescript
{
  id: string
  stakingId: string
  userId: string
  type: 'stake' | 'unstake' | 'claim_rewards'
  amount: Decimal
  txHash?: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: DateTime
}
```

## 权限控制

### 1. 用户角色
- **admin**: 管理员，拥有所有权限
- **moderator**: 版主，拥有内容管理权限
- **user**: 普通用户，基础权限

### 2. 权限验证
- 所有API都需要JWT认证
- 管理员功能需要admin角色
- 内容管理需要admin或moderator角色
- 质押功能需要用户身份验证

## 业务逻辑

### 1. DAO 治理
- 用户需要质押至少1000代币才能创建提案
- 投票权基于质押金额和声誉分数计算
- 提案需要达到执行时间才能执行
- 支持多种提案类型：治理、资金、技术、社区

### 2. NFT 系统
- 自动生成递增的tokenId
- 支持证书、成就、收藏品三种类型
- 每个用户只能查看自己的NFT
- 支持元数据存储

### 3. 质押系统
- 固定12.5%年化收益率
- 支持质押、解除质押、领取奖励
- 记录所有交易历史
- 提供总体统计信息

## 错误处理

### 1. 常见错误码
- **401**: 未认证
- **403**: 权限不足
- **404**: 资源不存在
- **409**: 资源冲突（如重复投票）
- **422**: 数据验证失败
- **500**: 服务器内部错误

### 2. 错误响应格式
```json
{
  "success": false,
  "error": "错误描述",
  "details": {} // 可选，详细错误信息
}
```

## 数据验证

### 1. 使用Zod进行数据验证
- 所有输入数据都经过Zod验证
- 支持自定义验证规则
- 提供详细的错误信息

### 2. 验证示例
```typescript
const proposalSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  proposalType: z.enum(['governance', 'funding', 'technical', 'community']),
  targetAmount: z.number().optional(),
  executionTime: z.string().datetime()
});
```

## 性能优化

### 1. 数据库查询优化
- 使用Prisma的include进行关联查询
- 合理使用分页减少数据传输
- 使用索引优化查询性能

### 2. 并发处理
- 使用数据库事务确保数据一致性
- 避免竞态条件
- 合理的错误重试机制

## 安全考虑

### 1. 认证安全
- JWT token验证
- 用户权限检查
- 防止越权访问

### 2. 数据安全
- 输入数据验证
- SQL注入防护（Prisma自动处理）
- XSS防护

### 3. 业务安全
- 防止重复操作
- 状态检查
- 金额验证

## 测试建议

### 1. 单元测试
- API端点测试
- 业务逻辑测试
- 错误处理测试

### 2. 集成测试
- 数据库操作测试
- 权限验证测试
- 端到端测试

### 3. 性能测试
- 并发测试
- 负载测试
- 压力测试

## 部署注意事项

### 1. 环境变量
```bash
# 数据库
DATABASE_URL="postgresql://..."

# JWT
JWT_SECRET="your-jwt-secret"

# Web3
WEB3_PROVIDER_URL="https://mainnet.infura.io/v3/..."

# IPFS
IPFS_GATEWAY="https://ipfs.io"
```

### 2. 数据库迁移
- 运行Prisma迁移
- 创建必要的索引
- 插入初始数据

### 3. 监控告警
- API响应时间监控
- 错误率监控
- 数据库性能监控

## 后续开发计划

### 1. 智能合约集成
- 开发实际的智能合约
- 集成以太坊网络
- 实现真正的链上操作

### 2. 高级功能
- 实时通知系统
- 数据分析功能
- 移动端优化

### 3. 性能优化
- 缓存策略
- CDN集成
- 数据库优化

## 总结

Web3 API的实现为HackX平台提供了完整的去中心化功能支持，包括DAO治理、NFT管理和质押系统。所有API都经过精心设计，具有良好的安全性、可扩展性和可维护性。

通过合理的权限控制、数据验证和错误处理，确保了系统的稳定性和安全性。后续可以在此基础上继续开发更高级的Web3功能。 