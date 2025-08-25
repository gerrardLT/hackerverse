# HackX 部署指南

本文档提供了HackX去中心化黑客松平台的完整部署指南。

## 📋 目录

1. [部署前准备](#部署前准备)
2. [环境配置](#环境配置)
3. [智能合约部署](#智能合约部署)
4. [The Graph部署](#the-graph部署)
5. [前端部署](#前端部署)
6. [一键部署](#一键部署)
7. [部署验证](#部署验证)
8. [故障排除](#故障排除)

## 🔧 部署前准备

### 必需工具
- Node.js (v18+)
- npm 或 yarn
- Git
- Hardhat
- Graph CLI

### 账户准备
- 部署钱包（包含足够ETH支付Gas费用）
- Alchemy/Infura API密钥
- The Graph Studio账户
- Vercel账户（可选）

### 环境变量配置

创建以下环境变量文件：

#### `contracts/.env`
```bash
PRIVATE_KEY=your_wallet_private_key
MAINNET_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
POLYGON_RPC_URL=https://polygon-mainnet.alchemyapi.io/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

#### 根目录 `.env`
```bash
DEPLOY_NETWORK=polygon
GRAPH_STUDIO_DEPLOY_KEY=your_graph_studio_key
VERCEL_TOKEN=your_vercel_token
SKIP_STEPS=
```

## 🔗 智能合约部署

### 1. 编译合约
```bash
cd contracts
npm run compile
```

### 2. 运行测试
```bash
npm test
```

### 3. 部署到测试网（推荐）
```bash
# 部署到Sepolia测试网
DEPLOY_NETWORK=sepolia npm run deploy:production

# 部署到Polygon Mumbai
DEPLOY_NETWORK=polygonMumbai npm run deploy:production
```

### 4. 部署到主网
```bash
# 部署到Polygon主网
npm run deploy:polygon

# 部署到以太坊主网
npm run deploy:mainnet
```

### 5. 验证合约
```bash
npm run verify
```

## 📊 The Graph部署

### 1. 安装Graph CLI
```bash
npm install -g @graphprotocol/graph-cli
```

### 2. 认证Graph Studio
```bash
graph auth --studio YOUR_DEPLOY_KEY
```

### 3. 部署子图
```bash
cd subgraph
node scripts/deploy-subgraph.js
```

### 4. 等待同步
子图通常需要10-30分钟完成初始同步。

## 🌐 前端部署

### 1. 安装依赖
```bash
cd frontend
npm install
```

### 2. 构建项目
```bash
npm run build
```

### 3. 部署到Vercel
```bash
node scripts/deploy-frontend.js
```

## 🚀 一键部署

使用根目录的部署脚本进行完整部署：

```bash
# 部署到Polygon主网
DEPLOY_NETWORK=polygon node scripts/deploy-all.js

# 部署到测试网
DEPLOY_NETWORK=sepolia node scripts/deploy-all.js

# 跳过某些步骤
SKIP_STEPS=verify,subgraph node scripts/deploy-all.js
```

### 部署参数
- `--network <network>`: 指定目标网络
- `--skip <steps>`: 跳过指定步骤（contracts,verify,subgraph,frontend）

## ✅ 部署验证

### 1. 验证智能合约
- 检查合约地址在区块浏览器上是否可见
- 验证合约源码是否正确
- 测试合约的基本功能

### 2. 验证子图
- 访问Graph Studio查看同步状态
- 测试GraphQL查询是否正常
- 验证事件数据是否正确索引

### 3. 验证前端
- 访问部署的前端URL
- 测试钱包连接功能
- 验证与智能合约的交互
- 测试数据查询功能

## 🔧 故障排除

### 常见问题

#### 1. Gas费用不足
```
Error: insufficient funds for gas * price + value
```
**解决方案**：
- 检查部署账户余额
- 调整Gas价格设置
- 等待网络拥堵缓解

#### 2. RPC节点错误
```
Error: could not detect network
```
**解决方案**：
- 检查RPC URL是否正确
- 尝试更换RPC提供商
- 验证API密钥是否有效

#### 3. 合约验证失败
```
Error: Verification failed
```
**解决方案**：
- 检查编译器版本是否匹配
- 验证构造函数参数是否正确
- 确认网络配置是否正确

#### 4. 子图同步问题
**解决方案**：
- 检查合约地址是否正确
- 验证ABI文件是否最新
- 确认网络配置是否匹配

#### 5. 前端构建失败
**解决方案**：
- 检查环境变量是否设置正确
- 验证依赖包是否安装完整
- 检查TypeScript类型错误

### 日志查看

#### 合约部署日志
```bash
# 查看Hardhat日志
npx hardhat node --verbose

# 查看部署记录
cat contracts/deployments/polygon.json
```

#### 子图日志
```bash
# 查看Graph Studio日志
# 访问: https://thegraph.com/studio/
```

#### 前端日志
```bash
# 查看Vercel部署日志
# 访问Vercel Dashboard
```

## 📁 部署文件结构

部署完成后，将生成以下文件：

```
hackx/
├── contracts/deployments/
│   ├── polygon.json          # 合约部署信息
│   └── README.md            # 部署说明
├── subgraph/deployments/
│   └── polygon.json         # 子图部署信息
├── frontend/deployments/
│   └── polygon.json         # 前端部署信息
├── deployments/
│   └── polygon-full-deployment.json  # 完整部署记录
└── docs/
    └── deployment-guide.md  # 本文档
```

## 🔐 安全注意事项

1. **私钥安全**
   - 绝不要将私钥提交到代码库
   - 使用环境变量存储敏感信息
   - 定期轮换API密钥

2. **合约安全**
   - 部署前进行完整测试
   - 使用多重签名钱包管理重要合约
   - 考虑实现时间锁和治理机制

3. **基础设施安全**
   - 使用HTTPS和SSL证书
   - 配置适当的CORS策略
   - 实施访问控制和速率限制

## 📞 技术支持

如果在部署过程中遇到问题：

1. 查看本文档的故障排除部分
2. 检查项目GitHub Issues
3. 查看相关技术文档：
   - [Hardhat文档](https://hardhat.org/docs)
   - [The Graph文档](https://thegraph.com/docs)
   - [Next.js文档](https://nextjs.org/docs)

## 📝 部署清单

- [ ] 环境变量配置完成
- [ ] 智能合约编译和测试通过
- [ ] 合约部署到目标网络
- [ ] 合约源码验证完成
- [ ] 子图部署和同步完成
- [ ] 前端构建和部署完成
- [ ] 所有功能测试通过
- [ ] 监控和警报配置完成
- [ ] 文档更新完成
- [ ] 团队通知完成

---

**注意**：部署到主网前，请务必在测试网上进行完整测试，确保所有功能正常工作。
