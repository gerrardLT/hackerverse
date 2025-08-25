# HackX 去中心化架构开发路线图

## 项目现状分析

### 当前架构
- **前端**: Next.js + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes + Prisma ORM
- **数据库**: PostgreSQL (中心化)
- **存储**: 部分使用IPFS (Pinata API)
- **认证**: JWT Token (中心化)

### 目标架构
- **前端**: Next.js + TypeScript + Tailwind CSS (保持不变)
- **智能合约**: Solidity (以太坊/Layer 2)
- **存储**: IPFS (完全去中心化)
- **索引**: The Graph (GraphQL API)
- **认证**: Web3钱包 (MetaMask等)

## 开发阶段规划

### 第一阶段：智能合约开发 (优先级：高)

#### 1.1 核心智能合约设计
**任务**: 创建 `HackXPlatform.sol` 智能合约
**修改点**:
- 新增 `contracts/` 目录
- 设计数据结构映射
- 实现核心功能函数

**具体任务**:
```solidity
// 需要实现的核心映射
mapping(address => string) public userProfileCIDs;           // 用户资料CID
mapping(uint256 => string) public hackathonDataCIDs;        // 黑客松数据CID
mapping(uint256 => string) public projectDataCIDs;          // 项目数据CID
mapping(uint256 => mapping(address => string)) public projectSubmissions; // 项目提交关系
mapping(uint256 => address[]) public hackathonParticipants; // 黑客松参与者
mapping(address => uint256[]) public userHackathons;        // 用户参与的黑客松
```

#### 1.2 用户管理合约
**任务**: 实现用户注册、资料更新功能
**修改点**:
- 新增用户注册函数
- 实现资料更新机制
- 添加权限控制

**具体任务**:
```solidity
function registerUser(string memory profileCID) external;
function updateUserProfile(string memory newProfileCID) external;
function getUserProfile(address user) external view returns (string memory);
```

#### 1.3 黑客松管理合约
**任务**: 实现黑客松创建、管理功能
**修改点**:
- 新增黑客松创建函数
- 实现状态管理
- 添加参与者管理

**具体任务**:
```solidity
function createHackathon(string memory hackathonDataCID) external returns (uint256);
function updateHackathon(uint256 hackathonId, string memory newDataCID) external;
function joinHackathon(uint256 hackathonId) external;
function getHackathonData(uint256 hackathonId) external view returns (string memory);
```

#### 1.4 项目管理合约
**任务**: 实现项目提交、管理功能
**修改点**:
- 新增项目提交函数
- 实现项目更新机制
- 添加评分系统

**具体任务**:
```solidity
function submitProject(uint256 hackathonId, string memory projectDataCID) external;
function updateProject(uint256 projectId, string memory newDataCID) external;
function getProjectData(uint256 projectId) external view returns (string memory);
```

#### 1.5 事件定义
**任务**: 定义智能合约事件
**修改点**:
- 添加事件声明
- 在函数中发出事件

**具体任务**:
```solidity
event UserRegistered(address indexed user, string profileCID);
event ProfileUpdated(address indexed user, string newProfileCID);
event HackathonCreated(uint256 indexed hackathonId, address indexed organizer, string dataCID);
event ProjectSubmitted(uint256 indexed hackathonId, address indexed participant, string projectCID);
```

### 第二阶段：IPFS集成优化 (优先级：高)

#### 2.1 IPFS服务重构
**任务**: 重构现有IPFS服务
**修改点**:
- 修改 `backend/lib/ipfs.ts`
- 优化文件上传逻辑
- 添加CID验证

**具体任务**:
```typescript
// 需要修改的函数
async function uploadUserProfile(profileData: UserProfile): Promise<string>
async function uploadHackathonData(hackathonData: HackathonData): Promise<string>
async function uploadProjectData(projectData: ProjectData): Promise<string>
async function validateCID(cid: string): Promise<boolean>
```

#### 2.2 数据结构标准化
**任务**: 统一IPFS存储的数据格式
**修改点**:
- 修改 `frontend/lib/api.ts` 中的接口定义
- 更新数据类型结构
- 添加版本控制字段

**具体任务**:
```typescript
// 新的数据结构
interface IPFSUserProfile {
  version: string;
  timestamp: string;
  data: {
    username: string;
    email: string;
    avatar?: string;
    bio?: string;
    skills: string[];
    socialLinks: Record<string, string>;
  };
  metadata: {
    previousVersion?: string;
    updatedBy: string;
  };
}

interface IPFSHackathonData {
  version: string;
  timestamp: string;
  data: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    prizePool: number;
    categories: string[];
    requirements: string;
    rules: string;
  };
  metadata: {
    organizer: string;
    status: 'draft' | 'active' | 'completed';
    previousVersion?: string;
  };
}
```

#### 2.3 文件上传组件优化
**任务**: 优化前端文件上传组件
**修改点**:
- 修改 `frontend/components/ui/file-upload.tsx`
- 添加进度显示
- 实现分块上传

**具体任务**:
- 支持大文件分块上传
- 添加上传进度条
- 实现断点续传
- 添加文件类型验证

### 第三阶段：The Graph集成 (优先级：中)

#### 3.1 The Graph子图开发
**任务**: 创建The Graph子图
**修改点**:
- 新增 `subgraph/` 目录
- 创建子图配置文件
- 实现事件处理逻辑

**具体任务**:
```yaml
# subgraph.yaml
specVersion: 0.0.4
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: HackXPlatform
    network: mainnet
    source:
      address: "0x..."
      abi: HackXPlatform
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - User
        - Hackathon
        - Project
      abis:
        - name: HackXPlatform
          file: ./abis/HackXPlatform.json
      eventHandlers:
        - event: UserRegistered(indexed address,string)
          handler: handleUserRegistered
        - event: HackathonCreated(indexed uint256,indexed address,string)
          handler: handleHackathonCreated
```

#### 3.2 GraphQL Schema设计
**任务**: 设计GraphQL查询模式
**修改点**:
- 创建 `subgraph/schema.graphql`
- 定义实体关系
- 实现查询接口

**具体任务**:
```graphql
type User @entity {
  id: ID!
  address: Bytes!
  profileCID: String!
  profileData: UserProfile
  hackathons: [HackathonParticipant!]! @derivedFrom(field: "user")
  projects: [Project!]! @derivedFrom(field: "creator")
  createdAt: BigInt!
  updatedAt: BigInt!
}

type Hackathon @entity {
  id: ID!
  hackathonId: BigInt!
  organizer: User!
  dataCID: String!
  hackathonData: HackathonData
  participants: [HackathonParticipant!]! @derivedFrom(field: "hackathon")
  projects: [Project!]! @derivedFrom(field: "hackathon")
  createdAt: BigInt!
  updatedAt: BigInt!
}

type Project @entity {
  id: ID!
  projectId: BigInt!
  creator: User!
  hackathon: Hackathon!
  dataCID: String!
  projectData: ProjectData
  createdAt: BigInt!
  updatedAt: BigInt!
}
```

#### 3.3 事件处理器实现
**任务**: 实现The Graph事件处理器
**修改点**:
- 创建 `subgraph/src/mapping.ts`
- 实现事件处理逻辑
- 添加IPFS数据获取

**具体任务**:
```typescript
// mapping.ts
export function handleUserRegistered(event: UserRegistered): void {
  let user = new User(event.params.user.toHexString());
  user.address = event.params.user;
  user.profileCID = event.params.profileCID;
  user.profileData = fetchUserProfileFromIPFS(event.params.profileCID);
  user.createdAt = event.block.timestamp;
  user.updatedAt = event.block.timestamp;
  user.save();
}

export function handleHackathonCreated(event: HackathonCreated): void {
  let hackathon = new Hackathon(event.params.hackathonId.toString());
  hackathon.hackathonId = event.params.hackathonId;
  hackathon.organizer = event.params.organizer.toHexString();
  hackathon.dataCID = event.params.dataCID;
  hackathon.hackathonData = fetchHackathonDataFromIPFS(event.params.dataCID);
  hackathon.createdAt = event.block.timestamp;
  hackathon.updatedAt = event.block.timestamp;
  hackathon.save();
}
```

### 第四阶段：前端重构 (优先级：中)

#### 4.1 Web3集成
**任务**: 集成Web3钱包功能
**修改点**:
- 修改 `frontend/hooks/use-auth.tsx`
- 添加钱包连接逻辑
- 实现智能合约调用

**具体任务**:
```typescript
// 新的认证Hook
export function useWeb3Auth() {
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  
  const connectWallet = async () => {
    // MetaMask连接逻辑
  };
  
  const callContract = async (method: string, params: any[]) => {
    // 智能合约调用逻辑
  };
  
  return { account, contract, connectWallet, callContract };
}
```

#### 4.2 API服务重构
**任务**: 重构前端API服务
**修改点**:
- 修改 `frontend/lib/api.ts`
- 替换REST API为GraphQL
- 添加智能合约调用

**具体任务**:
```typescript
// 新的API服务
class DecentralizedAPIService {
  private graphClient: ApolloClient<any>;
  private contract: Contract;
  
  async getUserProfile(address: string): Promise<UserProfile> {
    // 通过The Graph查询
    const result = await this.graphClient.query({
      query: GET_USER_PROFILE,
      variables: { address }
    });
    
    // 从IPFS获取详细数据
    const profileData = await this.getFromIPFS(result.data.user.profileCID);
    return profileData;
  }
  
  async updateUserProfile(profileData: UserProfile): Promise<string> {
    // 上传到IPFS
    const cid = await this.uploadToIPFS(profileData);
    
    // 调用智能合约
    const tx = await this.contract.updateUserProfile(cid);
    await tx.wait();
    
    return cid;
  }
}
```

#### 4.3 组件更新
**任务**: 更新前端组件以支持去中心化架构
**修改点**:
- 修改用户资料组件
- 更新黑客松创建组件
- 重构项目提交组件

**具体任务**:
- 替换表单提交逻辑
- 添加钱包连接提示
- 实现交易状态显示
- 添加错误处理

### 第五阶段：后端API重构 (优先级：低)

#### 5.1 API路由简化
**任务**: 简化后端API，移除数据库依赖
**修改点**:
- 修改 `backend/app/api/` 下的路由
- 移除Prisma依赖
- 保留必要的辅助功能

**具体任务**:
```typescript
// 简化的API路由
export async function GET(request: NextRequest) {
  // 只保留必要的辅助功能
  // 如文件上传、IPFS网关等
}

export async function POST(request: NextRequest) {
  // 移除数据库操作
  // 只处理文件上传等
}
```

#### 5.2 数据库迁移策略
**任务**: 制定数据库数据迁移策略
**修改点**:
- 创建数据迁移脚本
- 实现数据验证
- 添加回滚机制

**具体任务**:
- 导出现有数据
- 转换为IPFS格式
- 上传到IPFS
- 调用智能合约注册
- 验证数据完整性

### 第六阶段：测试与部署 (优先级：中)

#### 6.1 智能合约测试
**任务**: 编写智能合约测试
**修改点**:
- 新增 `test/` 目录
- 使用Hardhat测试框架
- 实现完整测试覆盖

**具体任务**:
```typescript
// 测试文件结构
describe("HackXPlatform", function () {
  it("Should register user correctly", async function () {
    // 用户注册测试
  });
  
  it("Should create hackathon correctly", async function () {
    // 黑客松创建测试
  });
  
  it("Should submit project correctly", async function () {
    // 项目提交测试
  });
});
```

#### 6.2 前端集成测试
**任务**: 测试前端与智能合约集成
**修改点**:
- 更新现有测试
- 添加Web3测试
- 实现端到端测试

#### 6.3 部署配置
**任务**: 配置生产环境部署
**修改点**:
- 配置智能合约部署
- 设置The Graph子图部署
- 更新前端部署配置

## 开发优先级建议

### 立即开始 (本周)
1. 智能合约开发 (第一阶段)
2. IPFS服务重构 (第二阶段)

### 下周开始
3. The Graph子图开发 (第三阶段)
4. 前端Web3集成 (第四阶段)

### 后续阶段
5. 后端API重构 (第五阶段)
6. 测试与部署 (第六阶段)

## 风险评估

### 技术风险
- **智能合约安全**: 需要专业审计
- **Gas费用**: 需要优化合约设计
- **IPFS可用性**: 需要冗余存储策略

### 开发风险
- **学习曲线**: 团队需要Web3技能
- **工具链**: 需要熟悉新工具
- **调试难度**: 去中心化调试复杂

### 缓解措施
- 分阶段实施，降低风险
- 充分测试每个阶段
- 保留现有功能作为备份
- 建立回滚机制

## 成功指标

### 技术指标
- 智能合约通过安全审计
- The Graph查询响应时间 < 1秒
- IPFS数据可用性 > 99%
- Gas费用优化到可接受范围

### 业务指标
- 用户迁移成功率 > 95%
- 功能完整性保持 100%
- 性能不降低
- 用户体验改善

这个路线图将指导我们从当前的混合架构平滑过渡到完全去中心化的架构。 