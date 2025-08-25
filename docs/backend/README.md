# HackX 后端文档

本目录包含 HackX 黑客松平台后端的所有技术文档。

## 文档结构

```
docs/
├── README.md                    # 本文档
├── database-schema.sql          # 数据库结构SQL文件
├── api-documentation.md         # API接口文档
├── deployment-guide.md          # 部署指南（待创建）
├── development-guide.md         # 开发指南（待创建）
└── troubleshooting.md           # 故障排除（待创建）
```

## 快速开始

### 1. 数据库设置

1. 确保已安装 PostgreSQL 数据库
2. 创建数据库：
   ```sql
   CREATE DATABASE hackx_platform;
   ```
3. 运行数据库初始化脚本：
   ```bash
   psql -d hackx_platform -f docs/database-schema.sql
   ```

### 2. 环境配置

复制环境变量模板并配置：
```bash
cp env.example .env.local
```

编辑 `.env.local` 文件，配置以下变量：
```bash
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/hackx_platform"

# JWT 密钥
JWT_SECRET="your-super-secret-jwt-key"

# IPFS 配置
IPFS_PROJECT_ID="your-ipfs-project-id"
IPFS_PROJECT_SECRET="your-ipfs-project-secret"
IPFS_GATEWAY="https://ipfs.io"

# Web3 配置
WEB3_PROVIDER_URL="https://mainnet.infura.io/v3/your-project-id"
```

### 3. 安装依赖

```bash
npm install
```

### 4. 数据库迁移

```bash
npx prisma migrate dev
```

### 5. 初始化测试数据

```bash
npx prisma db seed
```

### 6. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3000` 启动。

## API 测试

### 使用测试账户

可以使用以下测试账户进行API测试：

- **管理员**: `admin@hackx.com` / `password123`
- **开发者**: `alice@example.com` / `password123`
- **Web3开发者**: `bob@example.com` / `password123`
- **设计师**: `carol@example.com` / `password123`

### 获取访问令牌

1. 注册新用户或使用现有账户登录：
   ```bash
   curl -X POST http://localhost:3000/api/auth/signin \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@hackx.com",
       "password": "password123"
     }'
   ```

2. 从响应中获取 JWT token

3. 在后续请求中使用 token：
   ```bash
   curl -X GET http://localhost:3000/api/users/me \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## 数据库管理

### 查看数据库状态

```bash
# 查看所有表
npx prisma studio

# 查看数据库连接
npx prisma db pull

# 生成 Prisma 客户端
npx prisma generate
```

### 数据库备份

```bash
# 备份数据库
pg_dump hackx_platform > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
psql hackx_platform < backup_file.sql
```

### 数据库维护

定期运行以下维护脚本：

```sql
-- 清理过期通知（保留30天）
DELETE FROM notifications WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';

-- 更新用户声誉分数
UPDATE users SET reputation_score = (
    SELECT COALESCE(SUM(total_score), 0) 
    FROM scores s 
    JOIN projects p ON s.project_id = p.id 
    WHERE p.creator_id = users.id
);

-- 统计信息查询
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM hackathons) as total_hackathons,
    (SELECT COUNT(*) FROM projects) as total_projects,
    (SELECT COUNT(*) FROM teams) as total_teams;
```

## 开发指南

### 代码结构

```
backend/
├── app/
│   └── api/                    # API 路由
│       ├── auth/               # 认证相关
│       ├── users/              # 用户管理
│       ├── hackathons/         # 黑客松管理
│       ├── projects/           # 项目管理
│       ├── teams/              # 团队管理
│       └── ipfs/               # IPFS 集成
├── lib/                        # 工具库
│   ├── prisma.ts              # 数据库连接
│   ├── auth.ts                # 认证服务
│   └── ipfs.ts                # IPFS 服务
├── prisma/                     # 数据库相关
│   ├── schema.prisma          # 数据模型
│   └── seed.ts                # 种子数据
└── middleware.ts              # 中间件
```

### 添加新的 API 端点

1. 在 `app/api/` 下创建新的路由文件
2. 实现 GET、POST、PUT、DELETE 方法
3. 添加数据验证（使用 Zod）
4. 添加错误处理
5. 更新 API 文档

### 数据库模型修改

1. 修改 `prisma/schema.prisma`
2. 生成迁移文件：
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```
3. 更新数据库：
   ```bash
   npx prisma db push
   ```
4. 更新 SQL 文档

## 部署

### 生产环境部署

1. 设置生产环境变量
2. 构建项目：
   ```bash
   npm run build
   ```
3. 启动生产服务器：
   ```bash
   npm start
   ```

### Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## 监控和日志

### 日志配置

```javascript
// 在 next.config.mjs 中配置
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}
```

### 性能监控

- 使用 Vercel Analytics（如果部署在 Vercel）
- 集成 Sentry 进行错误监控
- 使用 Prisma Studio 监控数据库性能

## 安全考虑

### 认证和授权

- 所有敏感操作都需要 JWT 认证
- 使用 bcrypt 进行密码哈希
- 实现速率限制防止暴力攻击

### 数据验证

- 使用 Zod 进行输入验证
- 验证文件上传类型和大小
- 防止 SQL 注入（使用 Prisma ORM）

### 环境变量

- 不要在代码中硬编码敏感信息
- 使用环境变量管理配置
- 定期轮换密钥

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 DATABASE_URL 配置
   - 确保 PostgreSQL 服务正在运行
   - 检查防火墙设置

2. **JWT 认证失败**
   - 检查 JWT_SECRET 配置
   - 确保 token 格式正确
   - 检查 token 是否过期

3. **IPFS 上传失败**
   - 检查 IPFS 配置
   - 确保网络连接正常
   - 检查文件大小限制

### 调试模式

启用调试模式：
```bash
DEBUG=* npm run dev
```

### 日志查看

```bash
# 查看应用日志
npm run dev 2>&1 | tee app.log

# 查看数据库日志
tail -f /var/log/postgresql/postgresql-*.log
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request
5. 等待代码审查

## 许可证

本项目采用 MIT 许可证。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 项目 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 邮箱: support@hackx.com
- 文档: [项目文档](https://docs.hackx.com) 