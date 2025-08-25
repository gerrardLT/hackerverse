# Pinata IPFS 配置指南

## 🚀 快速开始

### 1. 注册Pinata账号
1. 访问：https://app.pinata.cloud/
2. 点击"Sign Up"注册
3. 验证邮箱

### 2. 获取API密钥和网关
1. 登录Pinata控制台
2. 进入"API Keys"页面
3. 点击"New Key"创建新的API密钥（建议管理员权限）
4. 复制以下信息：
   - `pinataJwt`（JWT令牌）
5. 进入"Gateways"页面
6. 复制您的专用网关域名（格式：`fun-llama-300.mypinata.cloud`）

### 3. 环境变量配置

在 `backend/.env` 文件中添加：

```env
# Pinata IPFS配置
PINATA_JWT="your-pinata-jwt-here"
PINATA_GATEWAY="your-gateway-domain.mypinata.cloud"
```

### 4. 免费额度
- **存储空间**：1GB
- **上传次数**：1000次/月
- **自动固定**：文件会自动固定在IPFS网络
- **CDN加速**：提供全球CDN访问

## 📁 项目更新状态

### ✅ 已完成更新
- [x] 后端IPFS服务 (`backend/lib/ipfs.ts`)
- [x] 前端IPFS服务 (`frontend/lib/ipfs.ts`)
- [x] 前端IPFS数据服务 (`frontend/lib/ipfs-data-service.ts`)
- [x] 安装Pinata SDK依赖
- [x] 安装form-data依赖

### 🔄 需要配置
- [ ] 设置环境变量
- [ ] 测试Pinata连接
- [ ] 验证上传功能

## 🧪 测试步骤

### 1. 测试Pinata连接
```bash
cd backend
npm run dev
```

### 2. 测试文件上传
访问：http://localhost:3001/ipfs
尝试上传文件或JSON数据

### 3. 测试用户注册
注册新用户，检查IPFS上传是否成功

## 🔧 技术细节

### 后端更新
- 使用最新的 `pinata` SDK
- 支持文件上传和JSON数据上传
- 优先使用专用网关，备用公共网关

### 前端更新
- 优先使用Pinata网关
- 多网关冗余访问
- 改进的错误处理

### 数据流程
1. 用户操作 → 后端API
2. 后端上传到Pinata → 获取IPFS Hash
3. 存储Hash到数据库
4. 前端通过网关获取数据

## 🚨 注意事项

1. **API密钥安全**：不要将API密钥提交到Git
2. **免费额度**：注意使用量，避免超出免费额度
3. **网络连接**：确保服务器能访问Pinata API
4. **错误处理**：已实现多网关冗余和错误重试

## 📞 支持

如果遇到问题：
1. 检查环境变量配置
2. 验证Pinata API密钥
3. 查看控制台错误日志
4. 确认网络连接正常
