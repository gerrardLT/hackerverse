# HackX IPFS 硬性要求分析

## HackX Solution 硬性要求

根据HackX Solution的要求，以下所有数据**必须**存储在IPFS上：

1. **Project submissions and code repositories** - 项目提交和代码存储库
2. **Developer profiles and verified credentials** - 开发人员配置文件和经过验证的凭据
3. **Team formation data** - 团队组建数据
4. **Hackathon event details and prize structures** - 黑客松活动详情及奖品结构
5. **Demo videos, decks, and pitch materials** - 演示视频、演示文稿和推介材料
6. **Judge feedback and scores** - 评判反馈和分数

**关键特性要求**：
- Permanent public records for every project - 每个项目的永久公开记录
- Developer reputation & history system - 开发者声誉和历史系统
- Team matching & builder network - 团队匹配和构建者网络
- Simple organizer tools with decentralized storage - 具有去中心化存储的简单组织者工具
- Fully open-sourced and extensible infrastructure - 完全开源和可扩展的基础设施

## 当前项目实现分析

### 1. 项目提交和代码存储库

#### 当前实现状态
```typescript
// 当前数据库结构
model Project {
  id            String   @id @default(cuid())
  title         String
  description   String?
  hackathonId   String
  teamId        String?
  creatorId     String
  technologies  Json     @default("[]")  // 存储在数据库
  tags          Json     @default("[]")  // 存储在数据库
  githubUrl     String?                  // 外部链接
  demoUrl       String?                  // 外部链接
  videoUrl      String?                  // 外部链接
  presentationUrl String?                // 外部链接
  ipfsHash      String?                  // 部分IPFS存储
  status        String   @default("draft")
  isPublic      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### 问题分析
- ❌ **基本信息存储在数据库**：title, description, technologies, tags等
- ❌ **代码仓库未镜像到IPFS**：githubUrl只是外部链接
- ❌ **演示材料未完全IPFS化**：demoUrl, videoUrl, presentationUrl是外部链接
- ⚠️ **部分IPFS存储**：只有ipfsHash字段，但实际数据仍在数据库

#### 需要调整
```typescript
// 新要求：全部IPFS存储
interface IPFSProject {
  // 基本信息存储在IPFS
  basicInfo: {
    title: string
    description: string
    technologies: string[]
    tags: string[]
    status: string
  }
  
  // 代码仓库镜像到IPFS
  codeRepository: {
    githubUrl: string
    ipfsMirror: string  // GitHub仓库的IPFS镜像
    codeFiles: string[] // 代码文件的IPFS哈希列表
  }
  
  // 演示材料存储在IPFS
  demoMaterials: {
    demoUrl: string
    videoUrl: string
    presentationUrl: string
    pitchDeck: string
    screenshots: string[]
  }
  
  // 元数据存储在IPFS
  metadata: {
    createdAt: string
    updatedAt: string
    version: string
    contributors: string[]
  }
}
```

### 2. 开发人员配置文件和经过验证的凭据

#### 当前实现状态
```typescript
// 当前数据库结构
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String?  @unique
  password  String?
  avatarUrl String?                  // 可能是IPFS链接
  bio       String?                  // 存储在数据库
  walletAddress String? @unique
  reputationScore Int @default(0)    // 存储在数据库
  ipfsProfileHash String?            // 部分IPFS存储
  socialLinks Json?                  // 存储在数据库
  privacySettings Json @default("{}") // 存储在数据库
  notificationSettings Json @default("{}") // 存储在数据库
  preferences Json @default("{}")    // 存储在数据库
  emailVerified Boolean @default(false)
  role      String   @default("user")
  status    String   @default("active")
  lastLoginAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 问题分析
- ❌ **基本资料存储在数据库**：bio, reputationScore, socialLinks等
- ❌ **凭据信息未IPFS化**：emailVerified, role, status等
- ❌ **设置信息存储在数据库**：privacySettings, notificationSettings, preferences
- ⚠️ **部分IPFS存储**：只有ipfsProfileHash字段

#### 需要调整
```typescript
// 新要求：全部IPFS存储
interface IPFSUserProfile {
  // 基本资料存储在IPFS
  basicInfo: {
    username: string
    bio: string
    avatarUrl: string
    walletAddress: string
  }
  
  // 凭据信息存储在IPFS
  credentials: {
    verifiedSkills: string[]
    certifications: string[]
    achievements: string[]
    reputationHistory: ReputationEntry[]
  }
  
  // 社交信息存储在IPFS
  socialInfo: {
    socialLinks: SocialLink[]
    connections: string[]
    endorsements: Endorsement[]
  }
  
  // 设置信息存储在IPFS
  settings: {
    privacySettings: PrivacySettings
    notificationSettings: NotificationSettings
    preferences: UserPreferences
  }
}
```

### 3. 团队组建数据

#### 当前实现状态
```typescript
// 当前数据库结构
model Team {
  id          String   @id @default(cuid())
  name        String
  description String?
  hackathonId String
  leaderId    String
  maxMembers  Int      @default(5)
  skills      Json     @default("[]")  // 存储在数据库
  tags        Json     @default("[]")  // 存储在数据库
  isPublic    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model TeamMember {
  id        String   @id @default(cuid())
  teamId    String
  userId    String
  role      String   @default("member")  // 存储在数据库
  joinedAt  DateTime @default(now())
}
```

#### 问题分析
- ❌ **团队信息完全存储在数据库**：name, description, skills, tags等
- ❌ **成员关系存储在数据库**：TeamMember表完全在数据库中
- ❌ **角色分配存储在数据库**：role字段在数据库中
- ❌ **无IPFS存储**：完全没有IPFS相关字段

#### 需要调整
```typescript
// 新要求：全部IPFS存储
interface IPFSTeam {
  // 团队基本信息存储在IPFS
  basicInfo: {
    name: string
    description: string
    skills: string[]
    tags: string[]
    maxMembers: number
    isPublic: boolean
  }
  
  // 成员关系存储在IPFS
  members: {
    leader: string
    members: TeamMember[]
    roles: RoleAssignment[]
    invitations: Invitation[]
  }
  
  // 协作数据存储在IPFS
  collaboration: {
    communicationHistory: Message[]
    sharedResources: string[]
    meetingNotes: Note[]
  }
}
```

### 4. 黑客松活动详情及奖品结构

#### 当前实现状态
```typescript
// 当前数据库结构
model Hackathon {
  id                  String   @id @default(cuid())
  title               String
  description         String?
  startDate           DateTime
  endDate             DateTime
  registrationDeadline DateTime?
  maxParticipants     Int?
  prizePool           Decimal? @db.Decimal(15,2)
  categories          Json     @default("[]")  // 存储在数据库
  tags                Json     @default("[]")  // 存储在数据库
  requirements        String?
  rules               String?
  isPublic            Boolean  @default(true)
  featured            Boolean  @default(false)
  status              String   @default("draft")
  organizerId         String
  ipfsHash            String?                  // 部分IPFS存储
  metadata            Json?                    // 存储在数据库
  prizes              Json?                    // 存储在数据库
  tracks              Json?                    // 存储在数据库
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

#### 问题分析
- ❌ **基本信息存储在数据库**：title, description, startDate, endDate等
- ❌ **奖品结构存储在数据库**：prizes字段在数据库中
- ❌ **规则和要求存储在数据库**：requirements, rules在数据库中
- ❌ **元数据存储在数据库**：metadata字段在数据库中
- ⚠️ **部分IPFS存储**：只有ipfsHash字段

#### 需要调整
```typescript
// 新要求：全部IPFS存储
interface IPFSHackathon {
  // 基本信息存储在IPFS
  basicInfo: {
    title: string
    description: string
    startDate: string
    endDate: string
    registrationDeadline: string
    maxParticipants: number
  }
  
  // 奖品结构存储在IPFS
  prizeStructure: {
    prizePool: number
    prizes: Prize[]
    tracks: Track[]
    judgingCriteria: JudgingCriteria[]
  }
  
  // 规则和要求存储在IPFS
  rules: {
    requirements: string
    rules: string
    categories: string[]
    tags: string[]
  }
  
  // 完整元数据存储在IPFS
  metadata: {
    organizer: OrganizerInfo
    sponsors: Sponsor[]
    schedule: ScheduleItem[]
    faq: FAQItem[]
  }
}
```

### 5. 演示视频、演示文稿和推介材料

#### 当前实现状态
```typescript
// 当前项目模型中的演示材料字段
model Project {
  // ... 其他字段
  demoUrl       String?      // 外部链接
  videoUrl      String?      // 外部链接
  presentationUrl String?    // 外部链接
  ipfsHash      String?      // 部分IPFS存储
}
```

#### 问题分析
- ❌ **演示材料使用外部链接**：demoUrl, videoUrl, presentationUrl
- ❌ **未完全IPFS化**：没有专门的IPFS存储结构
- ❌ **缺少推介材料**：没有pitch materials的专门存储
- ⚠️ **部分IPFS存储**：只有通用的ipfsHash字段

#### 需要调整
```typescript
// 新要求：全部IPFS存储
interface IPFSDemoMaterials {
  // 演示视频存储在IPFS
  videos: {
    demoVideo: string      // IPFS哈希
    pitchVideo: string     // IPFS哈希
    walkthroughVideo: string // IPFS哈希
  }
  
  // 演示文稿存储在IPFS
  presentations: {
    pitchDeck: string      // IPFS哈希
    technicalPresentation: string // IPFS哈希
    businessPresentation: string  // IPFS哈希
  }
  
  // 推介材料存储在IPFS
  pitchMaterials: {
    executiveSummary: string // IPFS哈希
    businessPlan: string     // IPFS哈希
    technicalDocumentation: string // IPFS哈希
    marketingMaterials: string[]   // IPFS哈希数组
  }
  
  // 缩略图和预览图存储在IPFS
  thumbnails: {
    videoThumbnails: string[]
    presentationThumbnails: string[]
    projectScreenshots: string[]
  }
}
```

### 6. 评判反馈和分数

#### 当前实现状态
```typescript
// 当前数据库结构
model Score {
  id                  String   @id @default(cuid())
  projectId           String
  judgeId             String
  innovation          Decimal? @db.Decimal(3,1)  // 存储在数据库
  technicalComplexity Decimal? @db.Decimal(3,1)  // 存储在数据库
  userExperience      Decimal? @db.Decimal(3,1)  // 存储在数据库
  businessPotential   Decimal? @db.Decimal(3,1)  // 存储在数据库
  presentation        Decimal? @db.Decimal(3,1)  // 存储在数据库
  totalScore          Decimal? @db.Decimal(4,1)  // 存储在数据库
  comments            String?                    // 存储在数据库
  ipfsHash            String?                    // 部分IPFS存储
  createdAt           DateTime @default(now())
}

model Feedback {
  id        String   @id @default(cuid())
  projectId String
  userId    String
  rating    Int                              // 存储在数据库
  comment   String?                          // 存储在数据库
  ipfsHash  String?                          // 部分IPFS存储
  createdAt DateTime @default(now())
}
```

#### 问题分析
- ❌ **评分数据存储在数据库**：所有评分字段都在数据库中
- ❌ **反馈内容存储在数据库**：comments, rating在数据库中
- ❌ **评判历史未IPFS化**：没有评判历史的完整记录
- ⚠️ **部分IPFS存储**：只有ipfsHash字段

#### 需要调整
```typescript
// 新要求：全部IPFS存储
interface IPFSJudging {
  // 评分数据存储在IPFS
  scores: {
    innovation: number
    technicalComplexity: number
    userExperience: number
    businessPotential: number
    presentation: number
    totalScore: number
    weightedScores: WeightedScore[]
  }
  
  // 反馈内容存储在IPFS
  feedback: {
    comments: string
    detailedFeedback: string
    suggestions: string[]
    strengths: string[]
    weaknesses: string[]
  }
  
  // 评判历史存储在IPFS
  judgingHistory: {
    previousScores: Score[]
    scoreChanges: ScoreChange[]
    feedbackEvolution: FeedbackEntry[]
  }
  
  // 评判标准存储在IPFS
  criteria: {
    judgingCriteria: JudgingCriteria[]
    weightDistribution: WeightDistribution
    rubric: Rubric
  }
}
```

## 当前IPFS实现分析

### IPFS服务实现
```typescript
// 当前IPFS服务功能
class IPFSService {
  // ✅ 基础功能完整
  static async uploadFile(file: Buffer, filename: string): Promise<IPFSFile>
  static async uploadJSON(data: any, metadata?: Partial<IPFSMetadata>): Promise<string>
  static async getFromIPFS(hash: string): Promise<any>
  static isValidHash(hash: string): boolean
  static getGatewayURL(hash: string): string
  static async checkStatus(): Promise<boolean>
}
```

### 问题分析
- ✅ **基础IPFS功能完整**：上传、下载、验证等功能都有
- ❌ **使用率低**：大部分数据仍存储在数据库中
- ❌ **缺少批量操作**：没有批量上传和同步功能
- ❌ **缺少数据验证**：没有IPFS数据完整性验证
- ❌ **缺少索引机制**：没有IPFS数据的查询索引

## 需要调整的具体内容

### 1. 数据库架构调整

#### 当前问题
- 所有核心数据都存储在PostgreSQL数据库中
- 只有少量字段（如ipfsHash）用于IPFS引用
- 缺少IPFS数据的索引和查询机制

#### 调整方案
```sql
-- 新的数据库结构（只保留索引信息）
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,  -- 用于登录
  username VARCHAR(50) UNIQUE, -- 用于显示
  ipfs_hash TEXT,             -- IPFS数据哈希
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- 项目表
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  title VARCHAR(255),         -- 用于搜索
  hackathon_id UUID,          -- 关联关系
  team_id UUID,               -- 关联关系
  ipfs_hash TEXT,             -- IPFS数据哈希
  status VARCHAR(20),         -- 状态索引
  created_at TIMESTAMP
);

-- 黑客松表
CREATE TABLE hackathons (
  id UUID PRIMARY KEY,
  title VARCHAR(255),         -- 用于搜索
  status VARCHAR(20),         -- 状态索引
  ipfs_hash TEXT,             -- IPFS数据哈希
  start_date TIMESTAMP,       -- 时间索引
  end_date TIMESTAMP,         -- 时间索引
  created_at TIMESTAMP
);
```

### 2. API接口调整

#### 当前问题
- API直接操作数据库数据
- IPFS只是可选的元数据存储
- 缺少IPFS数据的查询和索引机制

#### 调整方案
```typescript
// 新的API流程
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // 1. 生成唯一ID
    const id = generateUUID();
    
    // 2. 上传完整数据到IPFS
    const ipfsData = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const ipfsHash = await ipfsService.uploadJSON(ipfsData);
    
    // 3. 存储索引信息到数据库
    const dbRecord = await prisma.hackathon.create({
      data: {
        id,
        title: data.title,
        status: data.status,
        ipfsHash,
        startDate: data.startDate,
        endDate: data.endDate
      }
    });
    
    // 4. 索引到TheGraph（用于查询）
    await graphService.indexHackathon(ipfsHash, ipfsData);
    
    return NextResponse.json({
      success: true,
      data: { hackathon: dbRecord, ipfsHash }
    });
  } catch (error) {
    // 错误处理
  }
}
```

### 3. 前端组件调整

#### 当前问题
- 前端直接使用数据库数据
- 没有IPFS数据的获取和显示机制
- 缺少IPFS文件上传组件

#### 调整方案
```typescript
// 新的数据获取Hook
export function useIPFSData<T>(type: string, id: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // 从API获取数据（API内部处理IPFS查询）
        const response = await apiService.get(`${type}/${id}`);
        
        if (response.success) {
          setData(response.data);
        } else {
          setError(response.error);
        }
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [type, id]);
  
  return { data, loading, error };
}

// 新的文件上传组件
export function IPFSUploader({ onUpload }: { onUpload: (hash: string) => void }) {
  const [uploading, setUploading] = useState(false);
  
  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      
      // 直接上传到IPFS
      const hash = await ipfsService.uploadFile(file);
      
      onUpload(hash);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
        disabled={uploading}
      />
      {uploading && <span>Uploading to IPFS...</span>}
    </div>
  );
}
```

### 4. 索引和查询机制

#### 当前问题
- 没有IPFS数据的索引机制
- 查询性能依赖于数据库
- 缺少去中心化的查询方案

#### 调整方案
```typescript
// TheGraph集成
interface GraphQLSchema {
  projects: {
    id: string
    title: string
    description: string
    ipfsHash: string
    team: Team
    hackathon: Hackathon
    scores: Score[]
  }
  
  users: {
    id: string
    username: string
    ipfsHash: string
    skills: Skill[]
    projects: Project[]
  }
  
  hackathons: {
    id: string
    title: string
    ipfsHash: string
    projects: Project[]
    judges: Judge[]
  }
}

// IPFS网关优化
class IPFSGatewayService {
  private gateways = [
    'https://gateway.pinata.cloud',
    'https://ipfs.io',
    'https://cloudflare-ipfs.com',
    'https://dweb.link'
  ];
  
  async getFromIPFS(hash: string) {
    for (const gateway of this.gateways) {
      try {
        const response = await fetch(`${gateway}/ipfs/${hash}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.warn(`Gateway ${gateway} failed:`, error);
      }
    }
    throw new Error('All gateways failed');
  }
}
```

## 实施优先级

### 高优先级（必须立即调整）
1. **项目提交和代码存储库** - 核心功能
2. **黑客松活动详情及奖品结构** - 核心功能
3. **评判反馈和分数** - 核心功能

### 中优先级（重要功能）
4. **开发人员配置文件和凭据** - 用户系统
5. **团队组建数据** - 协作功能

### 低优先级（增强功能）
6. **演示视频、演示文稿和推介材料** - 展示功能

## 总结

### 主要差距
1. **存储策略**: 当前是混合存储，需要升级为纯IPFS存储
2. **数据完整性**: 大部分数据仍在数据库中，需要迁移到IPFS
3. **查询机制**: 缺少IPFS数据的索引和查询机制
4. **架构设计**: 需要重新设计为IPFS优先的架构

### 技术挑战
1. **性能优化**: IPFS查询性能需要优化
2. **数据一致性**: 需要保证IPFS数据的可靠性
3. **用户体验**: 需要平衡去中心化与用户体验
4. **成本控制**: IPFS存储成本需要控制

### 建议
1. **渐进式迁移**: 采用分阶段迁移策略
2. **技术选型**: 选择成熟稳定的IPFS技术栈
3. **性能监控**: 建立完善的性能监控体系
4. **用户反馈**: 收集用户反馈并持续优化 