# HackX API 测试示例

本文档提供了 HackX 平台 API 的测试示例，包括使用 curl、Postman 和 JavaScript 的测试方法。

## 环境准备

### 1. 启动后端服务

```bash
cd backend
npm run dev
```

服务将在 `http://localhost:3000` 启动。

### 2. 测试账户

使用以下测试账户：

| 角色 | 邮箱 | 密码 | 说明 |
|------|------|------|------|
| 管理员 | admin@hackx.com | password123 | 平台管理员 |
| 开发者 | alice@example.com | password123 | 全栈开发者 |
| Web3开发者 | bob@example.com | password123 | Web3专家 |
| 设计师 | carol@example.com | password123 | UI/UX设计师 |

## 使用 curl 测试

### 1. 用户认证

#### 用户注册
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "testuser",
    "walletAddress": "0x1234567890123456789012345678901234567890"
  }'
```

#### 用户登录
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hackx.com",
    "password": "password123"
  }'
```

保存返回的 token：
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. 用户管理

#### 获取当前用户信息
```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

#### 更新用户信息
```bash
curl -X PUT http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "updated_username",
    "bio": "这是更新后的用户简介",
    "avatarUrl": "https://example.com/avatar.jpg"
  }'
```

### 3. 黑客松管理

#### 获取黑客松列表
```bash
curl -X GET "http://localhost:3000/api/hackathons?page=1&limit=10&featured=true"
```

#### 创建黑客松
```bash
curl -X POST http://localhost:3000/api/hackathons \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试黑客松 2024",
    "description": "这是一个测试黑客松，用于验证API功能。",
    "startDate": "2024-06-01T09:00:00.000Z",
    "endDate": "2024-06-03T18:00:00.000Z",
    "registrationDeadline": "2024-05-25T23:59:59.000Z",
    "maxParticipants": 50,
    "prizePool": 10000,
    "categories": ["AI", "区块链", "Web3"],
    "tags": ["测试", "创新", "技术"],
    "isPublic": true,
    "featured": false
  }'
```

### 4. 团队管理

#### 获取团队列表
```bash
curl -X GET "http://localhost:3000/api/teams?hackathonId=$HACKATHON_ID"
```

#### 创建团队
```bash
curl -X POST http://localhost:3000/api/teams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试团队",
    "description": "这是一个测试团队。",
    "hackathonId": "'$HACKATHON_ID'",
    "maxMembers": 4,
    "skills": ["React", "Node.js", "Solidity"],
    "tags": ["Web3", "DeFi", "前端开发"],
    "isPublic": true
  }'
```

### 5. 项目管理

#### 获取项目列表
```bash
curl -X GET "http://localhost:3000/api/projects?hackathonId=$HACKATHON_ID"
```

#### 创建项目
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试项目",
    "description": "这是一个测试项目。",
    "hackathonId": "'$HACKATHON_ID'",
    "teamId": "'$TEAM_ID'",
    "technologies": ["React", "Node.js", "Solidity"],
    "tags": ["Web3", "DeFi", "创新"],
    "githubUrl": "https://github.com/example/test-project",
    "demoUrl": "https://demo.example.com/test-project",
    "isPublic": true
  }'
```

### 6. IPFS 文件管理

#### 上传文件到 IPFS
```bash
curl -X POST http://localhost:3000/api/ipfs/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your/file.pdf"
```

#### 上传 JSON 数据到 IPFS
```bash
curl -X PUT http://localhost:3000/api/ipfs/upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "title": "项目数据",
      "description": "项目详细描述",
      "features": ["功能1", "功能2", "功能3"]
    },
    "metadata": {
      "name": "project-data.json",
      "description": "项目数据文件",
      "tags": ["project", "data", "json"]
    }
  }'
```

## 使用 Postman 测试

### 1. 环境变量设置

```json
{
  "baseUrl": "http://localhost:3000",
  "token": "",
  "hackathonId": "",
  "teamId": "",
  "projectId": ""
}
```

### 2. 测试集合

创建以下请求集合：

- **认证**: 注册、登录
- **用户管理**: 获取用户信息、更新用户信息
- **黑客松管理**: 列表、创建、详情、报名
- **团队管理**: 列表、创建
- **项目管理**: 列表、创建
- **IPFS**: 文件上传、JSON上传

## 使用 JavaScript 测试

### 测试脚本示例

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let token = '';

async function testAPI() {
    try {
        // 登录
        const loginResponse = await axios.post(`${BASE_URL}/auth/signin`, {
            email: 'admin@hackx.com',
            password: 'password123'
        });
        
        token = loginResponse.data.token;
        console.log('✅ 登录成功');
        
        // 获取用户信息
        const userResponse = await axios.get(`${BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ 获取用户信息成功');
        
        // 获取黑客松列表
        const hackathonsResponse = await axios.get(`${BASE_URL}/hackathons?limit=5`);
        console.log('✅ 获取黑客松列表成功');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.response?.data?.error || error.message);
    }
}

testAPI();
```

## 测试检查清单

- [ ] 用户认证功能正常
- [ ] 用户管理功能正常
- [ ] 黑客松管理功能正常
- [ ] 团队管理功能正常
- [ ] 项目管理功能正常
- [ ] IPFS上传功能正常
- [ ] 错误处理正确
- [ ] 数据验证有效
- [ ] 权限控制正确
- [ ] 性能满足要求

## 故障排除

### 常见问题

1. **CORS 错误**: 检查前端域名是否在允许列表中
2. **认证失败**: 检查 JWT_SECRET 配置和 token 格式
3. **数据库连接失败**: 检查 DATABASE_URL 配置
4. **IPFS 上传失败**: 检查 IPFS 配置和网络连接

### 调试技巧

1. 启用详细日志：`DEBUG=* npm run dev`
2. 使用 Postman Console 查看请求详情
3. 检查浏览器开发者工具的 Network 标签
4. 查看服务器日志：`npm run dev 2>&1 | tee server.log` 