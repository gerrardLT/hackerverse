# Pinata 最新SDK配置指南

## 🎯 **基于最新Pinata文档的配置**

根据Pinata最新文档，我们已经更新了所有的API调用方法。

### 📋 **环境变量配置**

您可以选择以下两种认证方式之一：

#### 方式1：JWT认证（推荐）
```bash
# .env.local
PINATA_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_jwt_token_here"
PINATA_GATEWAY="your-gateway.mypinata.cloud"
```

#### 方式2：API Key认证
```bash
# .env.local
PINATA_API_KEY="your_api_key_here"
PINATA_API_SECRET="your_api_secret_here"
PINATA_GATEWAY="your-gateway.mypinata.cloud"
```

### 🔑 **获取认证信息**

1. **访问Pinata**: https://pinata.cloud
2. **登录/注册账户**
3. **获取API密钥**:
   - 导航至 Dashboard → API Keys
   - 点击 "New Key"
   - 选择权限（推荐Admin权限用于开发）
   - **重要**: 复制完整的JWT token（通常很长，以`eyJ`开头）

### 🔧 **更新内容**

我们已经根据最新文档更新了以下内容：

#### 1. SDK初始化方式
```typescript
// 旧方式
this.pinata = new PinataSDK({
  pinataJwt,
  pinataGateway,
})

// 新方式（支持多种认证）
const config = pinataJwt ? 
  { pinataJwt, pinataGateway } : 
  { pinataApiKey, pinataSecretApiKey: pinataApiSecret, pinataGateway }

this.pinata = new PinataSDK(config)
```

#### 2. 上传方法更新
```typescript
// 旧方式
const result = await pinata.upload.public.json(data, options)

// 新方式
const result = await pinata.upload.json(data, {
  metadata: { name: filename, description: description }
})
```

#### 3. 返回字段兼容
```typescript
// 兼容不同版本的返回字段
const cid = result.IpfsHash || result.cid || result.hash
```

### 🧪 **测试配置**

系统会在初始化时自动测试认证：

```
🔍 检查Pinata配置:
- JWT存在: true
- API Key存在: false  
- Gateway: your-gateway.mypinata.cloud
🔐 使用JWT认证方式
✅ Pinata认证测试成功
✅ Pinata客户端初始化成功
```

### 📊 **调试信息**

如果遇到问题，系统会输出详细的调试信息：

```
📤 准备上传JSON到Pinata: user-profile-user_abc123.json
✅ Pinata JSON上传成功: QmYourActualIPFSHashHere
📦 email用户资料IPFS上传成功: QmYourActualIPFSHashHere
```

### ⚠️ **常见问题**

#### 1. 认证失败
```
AuthenticationError: Authentication failed: {"error":{"code":401,"message":"Not Authorized"}}
```
**解决方案**: 
- 确保JWT token完整且有效
- 检查API权限设置
- 重新生成API密钥

#### 2. 网关配置错误
```
Error: Gateway not found
```
**解决方案**: 
- 检查PINATA_GATEWAY配置
- 确保网关域名正确（格式：`your-gateway.mypinata.cloud`）

#### 3. 上传失败
```
Error: Upload failed
```
**解决方案**: 
- 检查网络连接
- 验证文件大小限制
- 查看详细错误日志

### 🎯 **验证步骤**

1. **检查环境变量**:
   ```bash
   # 在后端目录
   cat .env.local | grep PINATA
   ```

2. **重启服务**:
   ```bash
   # 确保环境变量生效
   npm run dev
   ```

3. **观察日志输出**:
   - 寻找 `✅ Pinata客户端初始化成功`
   - 或者 `❌ Pinata客户端初始化失败`

4. **测试上传功能**:
   - 尝试注册新用户
   - 观察IPFS上传日志

### 📈 **性能优化**

- 使用专用网关提高访问速度
- 实现多网关回退机制
- 添加缓存层减少重复请求

---

**最后更新**: 2024年12月25日  
**基于**: Pinata SDK 最新版本  
**维护者**: HackX 开发团队
