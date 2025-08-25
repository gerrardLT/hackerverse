# IPFS 架构修正说明

## 🚨 问题发现

用户正确指出了架构问题：**前端不应该直接调用Pinata**，而应该通过后端API进行交互。

## 🔧 正确的架构

### **数据流程**

```
┌─────────┐    ┌──────────┐    ┌─────────┐    ┌─────────┐
│  前端   │───▶│  后端API │───▶│ Pinata  │───▶│  IPFS   │
│         │    │          │    │         │    │         │
│ 读取数据│◀───│ 返回Hash │◀───│ 返回CID │◀───│ 存储数据│
└─────────┘    └──────────┘    └─────────┘    └─────────┘
     │              │
     │              │
     ▼              ▼
┌─────────┐    ┌──────────┐
│ IPFS网关│    │ 数据库   │
│ 读取数据│    │ 存储CID  │
└─────────┘    └──────────┘
```

### **职责分工**

#### **前端职责**
- ✅ **读取数据**: 从IPFS网关获取数据
- ✅ **准备数据**: 创建元数据对象
- ✅ **网关管理**: 多网关故障切换
- ❌ **上传数据**: 不直接调用Pinata

#### **后端职责**
- ✅ **上传数据**: 调用Pinata API上传到IPFS
- ✅ **密钥管理**: 安全存储Pinata API密钥
- ✅ **数据验证**: 验证上传结果
- ✅ **返回Hash**: 将IPFS Hash返回给前端

## 🔄 修正后的实现

### **前端IPFS服务** (`frontend/lib/ipfs.ts`)

```typescript
class IPFSService {
  // 只负责数据获取，不负责上传
  async getJSON(hash: string): Promise<any> {
    // 从多个网关获取数据
  }
  
  async getFile(hash: string): Promise<any> {
    // 从多个网关获取文件
  }
  
  // 元数据创建（实际上传由后端处理）
  createProjectMetadata(project: any): any {
    return { /* 准备数据 */ }
  }
}
```

### **后端API** (`backend/app/api/ipfs/upload/route.ts`)

```typescript
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // 调用Pinata上传
    const hash = await IPFSService.uploadJSON(data)
    
    // 存储到数据库
    await db.save({ ipfsHash: hash })
    
    return Response.json({ success: true, hash })
  } catch (error) {
    return Response.json({ success: false, error: error.message })
  }
}
```

### **前端上传流程**

```typescript
// 错误的方式（已移除）
// const hash = await ipfsService.uploadJSON(data)

// 正确的方式
async function uploadData(data: any) {
  const response = await fetch('/api/ipfs/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  const result = await response.json()
  if (result.success) {
    return result.hash // IPFS Hash
  } else {
    throw new Error(result.error)
  }
}
```

## 🎯 优势

### **安全性**
- ✅ API密钥只在后端存储
- ✅ 前端无法直接访问Pinata API
- ✅ 统一的权限控制

### **可维护性**
- ✅ 清晰的职责分离
- ✅ 统一的错误处理
- ✅ 便于监控和日志

### **性能**
- ✅ 后端可以缓存和优化
- ✅ 前端专注于数据展示
- ✅ 减少前端代码复杂度

## 📊 数据流程示例

### **用户注册流程**
1. 前端收集用户数据
2. 前端调用 `/api/auth/signup`
3. 后端创建用户资料元数据
4. 后端调用Pinata上传到IPFS
5. 后端存储用户信息和IPFS Hash
6. 后端返回成功响应
7. 前端显示注册成功

### **数据读取流程**
1. 前端需要显示用户资料
2. 前端从数据库获取IPFS Hash
3. 前端通过网关获取IPFS数据
4. 前端解析和显示数据

## 🚨 注意事项

### **前端配置**
- 只需要配置网关域名（用于读取）
- 不需要API密钥
- 环境变量：`NEXT_PUBLIC_PINATA_GATEWAY`

### **后端配置**
- 需要完整的Pinata配置
- 环境变量：`PINATA_JWT`, `PINATA_GATEWAY`
- 负责所有上传操作

## 🎉 总结

修正后的架构更加：
- **安全**: API密钥保护
- **清晰**: 职责分离明确
- **可维护**: 代码结构合理
- **可扩展**: 便于功能扩展

感谢用户的指正！这个架构修正确保了项目的安全性和可维护性。
