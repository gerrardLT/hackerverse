# HackX 去中心化架构开发任务清单

## 📋 项目概览

**项目名称**: HackX Buildathon 去中心化改造  
**目标**: 从混合架构迁移到完全去中心化架构  
**预计完成时间**: 8-12周  
**当前状态**: 规划阶段  

---

## 🎯 第一阶段：智能合约开发 (优先级：高)

### 1.1 核心智能合约设计
- [x] **创建项目基础结构**
  - [x] 创建 `contracts/` 目录
  - [x] 初始化 Hardhat 项目
  - [x] 配置 `hardhat.config.js`
  - [x] 安装 Solidity 开发依赖

- [x] **设计数据结构映射**
  - [x] 定义用户资料CID映射 `mapping(address => string)`
  - [x] 定义黑客松数据CID映射 `mapping(uint256 => string)`
  - [x] 定义项目数据CID映射 `mapping(uint256 => string)`
  - [x] 定义项目提交关系映射 `mapping(uint256 => mapping(address => string))`
  - [x] 定义黑客松参与者映射 `mapping(uint256 => address[])`
  - [x] 定义用户参与的黑客松映射 `mapping(address => uint256[])`

- [x] **实现核心功能函数**
  - [x] 添加合约状态变量
  - [x] 实现访问控制修饰符
  - [x] 添加事件定义
  - [x] 实现基础查询函数

### 1.2 用户管理合约
- [x] **用户注册功能**
  - [x] 实现 `registerUser(string memory profileCID)` 函数
  - [x] 添加用户存在性检查
  - [x] 实现用户注册事件 `UserRegistered`
  - [x] 添加权限验证逻辑

- [x] **用户资料更新功能**
  - [x] 实现 `updateUserProfile(string memory newProfileCID)` 函数
  - [x] 添加用户权限验证
  - [x] 实现资料更新事件 `ProfileUpdated`
  - [x] 添加版本控制逻辑

- [x] **用户查询功能**
  - [x] 实现 `getUserProfile(address user)` 函数
  - [x] 添加用户存在性验证
  - [x] 实现批量用户查询功能
  - [x] 添加用户统计功能

### 1.3 黑客松管理合约
- [x] **黑客松创建功能**
  - [x] 实现 `createHackathon(string memory hackathonDataCID)` 函数
  - [x] 添加组织者权限验证
  - [x] 实现黑客松创建事件 `HackathonCreated`
  - [x] 添加黑客松ID自增逻辑

- [x] **黑客松更新功能**
  - [x] 实现 `updateHackathon(uint256 hackathonId, string memory newDataCID)` 函数
  - [x] 添加组织者权限验证
  - [x] 实现黑客松更新事件 `HackathonUpdated`
  - [x] 添加状态变更验证

- [x] **参与者管理功能**
  - [x] 实现 `joinHackathon(uint256 hackathonId)` 函数
  - [x] 实现 `leaveHackathon(uint256 hackathonId)` 函数
  - [x] 添加参与者数量限制
  - [x] 实现参与者管理事件

- [x] **黑客松查询功能**
  - [x] 实现 `getHackathonData(uint256 hackathonId)` 函数
  - [x] 实现 `getHackathonParticipants(uint256 hackathonId)` 函数
  - [x] 添加黑客松列表查询功能
  - [x] 实现分页查询支持

### 1.4 项目管理合约
- [x] **项目提交功能**
  - [x] 实现 `submitProject(uint256 hackathonId, string memory projectDataCID)` 函数
  - [x] 添加参与者权限验证
  - [x] 实现项目提交事件 `ProjectSubmitted`
  - [x] 添加项目数量限制

- [x] **项目更新功能**
  - [x] 实现 `updateProject(uint256 projectId, string memory newDataCID)` 函数
  - [x] 添加项目所有者权限验证
  - [x] 实现项目更新事件 `ProjectUpdated`
  - [x] 添加更新截止时间验证

- [x] **项目查询功能**
  - [x] 实现 `getProjectData(uint256 projectId)` 函数
  - [x] 实现 `getHackathonProjects(uint256 hackathonId)` 函数
  - [x] 添加项目搜索功能
  - [x] 实现项目统计功能

- [x] **评分系统功能**
  - [x] 实现 `submitScore(uint256 projectId, uint256 score)` 函数
  - [x] 添加评委权限验证
  - [x] 实现评分事件 `ScoreSubmitted`
  - [x] 添加评分计算逻辑

### 1.5 事件定义与优化
- [x] **事件定义**
  - [x] 定义 `UserRegistered(address indexed user, string profileCID)` 事件
  - [x] 定义 `ProfileUpdated(address indexed user, string newProfileCID)` 事件
  - [x] 定义 `HackathonCreated(uint256 indexed hackathonId, address indexed organizer, string dataCID)` 事件
  - [x] 定义 `ProjectSubmitted(uint256 indexed hackathonId, address indexed participant, string projectCID)` 事件
  - [x] 定义 `ScoreSubmitted(uint256 indexed projectId, address indexed judge, uint256 score)` 事件

- [ ] **Gas优化**
  - [ ] 优化数据结构以减少Gas消耗
  - [ ] 实现批量操作功能
  - [ ] 添加Gas估算功能
  - [ ] 优化事件参数索引

---

## 🔄 第二阶段：IPFS集成优化 (优先级：高)

### 2.1 IPFS服务重构
- [x] **重构现有IPFS服务**
  - [x] 修改 `backend/lib/ipfs.ts` 文件
  - [x] 优化文件上传逻辑
  - [x] 添加CID验证功能
  - [x] 实现重试机制

- [x] **新增IPFS功能函数**
  - [x] 实现 `uploadUserProfile(profileData: UserProfile): Promise<string>` 函数
  - [x] 实现 `uploadHackathonData(hackathonData: HackathonData): Promise<string>` 函数
  - [x] 实现 `uploadProjectData(projectData: ProjectData): Promise<string>` 函数
  - [x] 实现 `validateCID(cid: string): Promise<boolean>` 函数

- [ ] **IPFS网关优化**
  - [ ] 配置多个IPFS网关
  - [ ] 实现网关故障转移
  - [ ] 添加网关性能监控
  - [ ] 优化网关选择策略

### 2.2 数据结构标准化
- [x] **用户资料数据结构**
  - [x] 定义 `IPFSUserProfile` 接口
  - [x] 添加版本控制字段
  - [x] 添加时间戳字段
  - [x] 添加元数据字段

- [x] **黑客松数据结构**
  - [x] 定义 `IPFSHackathonData` 接口
  - [x] 添加组织者信息
  - [x] 添加状态管理字段
  - [x] 添加版本链字段

- [x] **项目数据结构**
  - [x] 定义 `IPFSProjectData` 接口
  - [x] 添加创建者信息
  - [x] 添加技术栈字段
  - [x] 添加演示链接字段

- [ ] **数据验证与转换**
  - [ ] 实现数据格式验证
  - [ ] 添加数据转换函数
  - [ ] 实现数据迁移工具
  - [ ] 添加数据完整性检查

### 2.3 文件上传组件优化
- [x] **前端上传组件**
  - [x] 修改 `frontend/components/ui/file-upload.tsx`
  - [x] 添加进度显示功能
  - [x] 实现分块上传
  - [x] 添加文件类型验证

- [x] **上传功能增强**
  - [x] 支持大文件分块上传
  - [x] 添加上传进度条
  - [x] 实现断点续传
  - [x] 添加文件预览功能

- [x] **错误处理优化**
  - [x] 添加上传失败重试
  - [x] 实现错误提示优化
  - [x] 添加网络异常处理
  - [x] 实现上传状态管理

---

## 🌐 第三阶段：The Graph集成 (优先级：中)

### 3.1 The Graph子图开发
- [x] **子图项目初始化**
  - [x] 创建 `subgraph/` 目录
  - [x] 初始化Graph CLI
  - [x] 配置 `subgraph.yaml`
  - [x] 安装Graph开发依赖

- [x] **数据源配置**
  - [x] 配置以太坊数据源
  - [x] 设置智能合约地址
  - [x] 配置网络参数
  - [x] 添加ABI文件

- [x] **事件处理器配置**
  - [x] 配置 `UserRegistered` 事件处理器
  - [x] 配置 `HackathonCreated` 事件处理器
  - [x] 配置 `ProjectSubmitted` 事件处理器
  - [x] 配置 `ScoreSubmitted` 事件处理器

### 3.2 GraphQL Schema设计
- [x] **实体定义**
  - [x] 定义 `User` 实体
  - [x] 定义 `Hackathon` 实体
  - [x] 定义 `Project` 实体
  - [x] 定义 `Score` 实体

- [x] **关系定义**
  - [x] 定义用户与黑客松关系
  - [x] 定义黑客松与项目关系
  - [x] 定义项目与评分关系
  - [x] 定义用户与项目关系

- [x] **查询接口设计**
  - [x] 设计用户查询接口
  - [x] 设计黑客松查询接口
  - [x] 设计项目查询接口
  - [x] 设计统计查询接口

### 3.3 事件处理器实现
- [x] **用户事件处理**
  - [x] 实现 `handleUserRegistered` 函数
  - [x] 实现 `handleProfileUpdated` 函数
  - [x] 添加IPFS数据获取
  - [x] 实现数据验证

- [x] **黑客松事件处理**
  - [x] 实现 `handleHackathonCreated` 函数
  - [x] 实现 `handleHackathonUpdated` 函数
  - [x] 实现参与者管理处理
  - [x] 添加状态更新逻辑

- [x] **项目事件处理**
  - [x] 实现 `handleProjectSubmitted` 函数
  - [x] 实现 `handleProjectUpdated` 函数
  - [x] 实现评分处理逻辑
  - [x] 添加项目统计更新

- [ ] **IPFS集成**
  - [ ] 实现IPFS数据获取函数
  - [ ] 添加数据缓存机制
  - [ ] 实现数据同步逻辑
  - [ ] 添加错误处理机制

---

## 🎨 第四阶段：前端重构 (优先级：中)

### 4.1 Web3集成
- [x] **Web3依赖安装**
  - [x] 安装 `ethers` 库
  - [x] 安装 `wagmi` 库
  - [x] 安装 `viem` 库
  - [x] 配置Web3提供者

- [x] **钱包连接功能**
  - [x] 修改 `frontend/hooks/use-auth.tsx`
  - [x] 实现MetaMask连接
  - [x] 添加钱包状态管理
  - [x] 实现连接状态持久化

- [x] **智能合约调用**
  - [x] 实现合约实例化
  - [x] 添加合约方法调用
  - [x] 实现交易状态管理
  - [x] 添加Gas估算功能

### 4.2 API服务重构
- [x] **GraphQL客户端配置**
  - [x] 修改 `frontend/lib/api.ts`
  - [x] 配置Apollo Client
  - [x] 添加GraphQL查询
  - [x] 实现数据缓存策略

- [x] **API服务更新**
  - [x] 替换REST API为GraphQL
  - [x] 添加智能合约调用
  - [x] 实现数据同步逻辑
  - [x] 添加错误处理机制

- [x] **数据获取优化**
  - [x] 实现实时数据更新
  - [x] 添加数据预加载
  - [x] 实现分页查询
  - [x] 添加搜索功能

### 4.3 组件更新
- [x] **用户组件更新**
  - [x] 更新用户资料组件
  - [x] 添加钱包连接组件
  - [x] 实现用户状态显示
  - [x] 添加交易状态提示

- [x] **黑客松组件更新**
  - [x] 更新黑客松创建组件
  - [x] 更新黑客松列表组件
  - [x] 添加参与功能
  - [x] 实现状态管理

- [x] **项目组件更新**
  - [x] 更新项目提交组件
  - [x] 更新项目展示组件
  - [x] 添加评分功能
  - [x] 实现项目管理

---

## 🔧 第五阶段：后端API重构 (优先级：低)

### 5.1 API路由简化
- [x] **API路由清理**
  - [x] 修改 `backend/app/api/` 下的路由
  - [x] 移除数据库依赖
  - [x] 保留必要的辅助功能
  - [x] 简化路由结构

- [x] **功能保留**
  - [x] 保留文件上传功能
  - [x] 保留IPFS网关功能
  - [x] 保留用户认证功能
  - [x] 保留数据验证功能

- [x] **中间件更新**
  - [x] 更新认证中间件
  - [x] 简化错误处理
  - [x] 优化响应格式
  - [x] 添加日志记录

### 5.2 数据库迁移策略
- [x] **数据导出**
  - [x] 创建数据导出脚本
  - [x] 导出用户数据
  - [x] 导出黑客松数据
  - [x] 导出项目数据

- [x] **数据转换**
  - [x] 转换为IPFS格式
  - [x] 生成CID映射
  - [x] 验证数据完整性
  - [x] 创建迁移报告

- [x] **数据上传**
  - [x] 上传数据到IPFS
  - [x] 调用智能合约注册
  - [x] 验证注册结果
  - [x] 更新索引数据

---

## 🧪 第六阶段：测试与部署 (优先级：中)

### 6.1 智能合约测试
- [ ] **测试环境搭建**
  - [ ] 新增 `test/` 目录
  - [ ] 配置Hardhat测试环境
  - [ ] 设置测试网络
  - [ ] 配置测试账户

- [ ] **单元测试**
  - [ ] 测试用户注册功能
  - [ ] 测试黑客松创建功能
  - [ ] 测试项目提交功能
  - [ ] 测试权限控制

- [ ] **集成测试**
  - [ ] 测试完整业务流程
  - [ ] 测试事件触发
  - [ ] 测试Gas消耗
  - [ ] 测试异常情况

### 6.2 前端集成测试
- [ ] **Web3集成测试**
  - [ ] 测试钱包连接
  - [ ] 测试合约调用
  - [ ] 测试交易处理
  - [ ] 测试状态管理

- [ ] **GraphQL集成测试**
  - [ ] 测试数据查询
  - [ ] 测试实时更新
  - [ ] 测试缓存机制
  - [ ] 测试错误处理

- [ ] **端到端测试**
  - [ ] 测试用户注册流程
  - [ ] 测试黑客松创建流程
  - [ ] 测试项目提交流程
  - [ ] 测试评分流程

### 6.3 部署配置
- [ ] **智能合约部署**
  - [ ] 配置生产网络
  - [ ] 部署智能合约
  - [ ] 验证合约地址
  - [ ] 更新配置文件

- [ ] **The Graph部署**
  - [ ] 部署子图到The Graph
  - [ ] 配置索引器
  - [ ] 验证查询功能
  - [ ] 监控索引状态

- [ ] **前端部署**
  - [ ] 配置生产环境
  - [ ] 更新环境变量
  - [ ] 部署到Vercel
  - [ ] 配置域名和SSL

---

## 📊 进度跟踪

### 总体进度
- [ ] **第一阶段完成** (0/15 任务)
- [ ] **第二阶段完成** (0/12 任务)
- [ ] **第三阶段完成** (0/12 任务)
- [ ] **第四阶段完成** (0/12 任务)
- [ ] **第五阶段完成** (0/9 任务)
- [ ] **第六阶段完成** (0/12 任务)

### 关键里程碑
- [ ] **智能合约开发完成** (预计第2周)
- [ ] **IPFS集成完成** (预计第4周)
- [ ] **The Graph集成完成** (预计第6周)
- [ ] **前端重构完成** (预计第8周)
- [ ] **测试完成** (预计第10周)
- [ ] **生产部署完成** (预计第12周)

---

## 🚨 风险与问题跟踪

### 技术风险
- [ ] **智能合约安全风险**
  - [ ] 安排安全审计
  - [ ] 实施安全最佳实践
  - [ ] 添加紧急暂停功能
  - [ ] 制定应急响应计划

- [ ] **Gas费用风险**
  - [ ] 优化合约设计
  - [ ] 考虑Layer 2解决方案
  - [ ] 实施批量操作
  - [ ] 监控Gas价格趋势

- [ ] **IPFS可用性风险**
  - [ ] 实施冗余存储策略
  - [ ] 配置多个网关
  - [ ] 监控数据可用性
  - [ ] 制定数据恢复计划

### 开发风险
- [ ] **学习曲线风险**
  - [ ] 安排团队培训
  - [ ] 准备技术文档
  - [ ] 建立知识分享机制
  - [ ] 寻求外部专家支持

- [ ] **工具链风险**
  - [ ] 评估工具稳定性
  - [ ] 准备备选方案
  - [ ] 建立工具使用规范
  - [ ] 监控工具更新

---

## ✅ 完成标准

### 技术标准
- [ ] 智能合约通过安全审计
- [ ] The Graph查询响应时间 < 1秒
- [ ] IPFS数据可用性 > 99%
- [ ] Gas费用在可接受范围内
- [ ] 前端性能不降低
- [ ] 所有功能正常工作

### 业务标准
- [ ] 用户迁移成功率 > 95%
- [ ] 功能完整性保持 100%
- [ ] 用户体验不降低
- [ ] 数据完整性保持 100%
- [ ] 系统稳定性 > 99.9%

---

## 📝 备注

**最后更新**: 2024年12月19日  
**负责人**: 开发团队  
**审核人**: 项目经理  

**注意事项**:
1. 每个任务完成后请及时更新状态
2. 遇到问题请及时记录在风险跟踪部分
3. 定期更新进度跟踪
4. 重要决策需要团队讨论确认

---

*此任务清单将根据项目进展持续更新* 