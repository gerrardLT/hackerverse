# IPFS CID 版本使用指南

## 📋 CID 版本概述

### CIDv0 (传统格式)
- **前缀**: `Qm`
- **长度**: 46个字符
- **格式**: `Qm[1-9A-HJ-NP-Za-km-z]{44}`
- **示例**: `QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG`
- **特点**: 
  - 向后兼容性好
  - 广泛支持
  - 较短的标识符

### CIDv1 (现代格式)
- **前缀**: `bafy`
- **长度**: 59个字符
- **格式**: `bafy[1-9A-HJ-NP-Za-km-z]{55}`
- **示例**: `bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi`
- **特点**:
  - 更安全
  - 更好的多哈希支持
  - 未来标准

## 🔧 HackX 项目中的 CID 使用

### 当前实现
我们的项目**同时支持 CIDv0 和 CIDv1**，确保最大的兼容性。

### Pinata 服务
- **上传**: Pinata 自动生成 CIDv1
- **获取**: 支持两种格式的数据获取
- **网关**: 所有网关都支持两种格式

### 验证逻辑
```typescript
// 后端验证 (backend/lib/ipfs.ts)
static isValidHash(hash: string): boolean {
  // CIDv0: Qm开头，46个字符
  const cidv0Pattern = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/
  // CIDv1: bafy开头，59个字符
  const cidv1Pattern = /^bafy[1-9A-HJ-NP-Za-km-z]{55}$/
  
  return cidv0Pattern.test(hash) || cidv1Pattern.test(hash)
}

// 前端验证 (frontend/lib/ipfs.ts)
isValidHash(hash: string): boolean {
  const cidv0Pattern = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/
  const cidv1Pattern = /^bafy[1-9A-HJ-NP-Za-km-z]{55}$/
  const otherPattern = /^k2k4r8[a-z0-9]{50}$/
  
  return cidv0Pattern.test(hash) || cidv1Pattern.test(hash) || otherPattern.test(hash)
}
```

## 📊 数据流程中的 CID 使用

### 上传流程
1. **用户操作** → 后端API
2. **Pinata上传** → 自动生成 CIDv1
3. **存储CID** → 数据库保存完整CID
4. **返回响应** → 前端接收CID

### 获取流程
1. **前端请求** → 使用存储的CID
2. **网关访问** → 支持两种格式
3. **数据解析** → 验证CID格式
4. **返回数据** → 用户界面显示

## 🎯 最佳实践

### 1. 存储策略
- **数据库**: 存储完整的CID字符串
- **验证**: 上传前验证CID格式
- **兼容性**: 支持两种格式的读取

### 2. 网关访问
- **优先**: Pinata专用网关
- **备用**: 公共网关
- **格式**: 自动处理CID格式

### 3. 错误处理
- **格式错误**: 提供清晰的错误信息
- **网关失败**: 自动切换到备用网关
- **数据验证**: 确保获取的数据完整性

## 🔍 CID 格式检测

### 检测方法
```typescript
function detectCIDVersion(cid: string): 'v0' | 'v1' | 'unknown' {
  if (/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid)) {
    return 'v0'
  }
  if (/^bafy[1-9A-HJ-NP-Za-km-z]{55}$/.test(cid)) {
    return 'v1'
  }
  return 'unknown'
}
```

### 使用示例
```typescript
const cid = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
const version = detectCIDVersion(cid) // 返回 'v1'
```

## 📈 性能考虑

### CIDv0 优势
- 更短的标识符
- 更快的字符串处理
- 更少的存储空间

### CIDv1 优势
- 更好的安全性
- 多哈希支持
- 未来兼容性

### 推荐策略
- **新项目**: 优先使用 CIDv1
- **现有项目**: 保持向后兼容
- **混合环境**: 支持两种格式

## 🚨 注意事项

1. **格式验证**: 始终验证CID格式
2. **网关兼容**: 确保网关支持目标格式
3. **错误处理**: 提供友好的错误信息
4. **文档记录**: 记录使用的CID格式

## 📞 总结

HackX 项目采用**双重兼容策略**：
- ✅ 支持 CIDv0 (传统格式)
- ✅ 支持 CIDv1 (现代格式)
- ✅ 自动格式检测
- ✅ 多网关冗余访问
- ✅ 完善的错误处理

这确保了最大的兼容性和未来的可扩展性。
