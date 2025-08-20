# HackX 平台 PostgreSQL 数据库使用指南

## 📋 概述

本指南详细介绍 HackX 黑客松平台的 PostgreSQL 数据库使用方法，包括安装、配置、管理、备份等完整流程。

## 🗄️ 数据库架构

### 核心表结构
```
users (用户表)
├── participations (参与记录)
├── organizedHackathons (组织的黑客松)
├── teamMemberships (团队成员)
├── projects (创建的项目)
├── scores (评委评分)
├── feedback (用户反馈)
└── projectLikes (项目点赞)

hackathons (黑客松表)
├── participations (参与记录)
├── projects (提交的项目)
├── teams (参赛团队)
└── judges (评委)

projects (项目表)
├── scores (评分记录)
├── feedback (反馈记录)
└── projectLikes (点赞记录)
```

## 🚀 快速开始

### 1. 安装 PostgreSQL

#### Windows
```bash
# 下载并安装 PostgreSQL
# 访问: https://www.postgresql.org/download/windows/
# 或使用 Chocolatey
choco install postgresql
```

#### macOS
```bash
# 使用 Homebrew
brew install postgresql
brew services start postgresql
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. 创建数据库

```bash
# 连接到 PostgreSQL
sudo -u postgres psql

# 创建数据库
CREATE DATABASE hackx_platform;

# 创建用户
CREATE USER hackx_user WITH PASSWORD 'your_secure_password';

# 授予权限
GRANT ALL PRIVILEGES ON DATABASE hackx_platform TO hackx_user;
GRANT CONNECT ON DATABASE hackx_platform TO hackx_user;

# 退出
\q
```

### 3. 初始化数据库

```bash
# 进入项目目录
cd backend

# 安装依赖
npm install

# 设置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件，设置数据库连接

# 运行数据库迁移
npx prisma migrate dev

# 生成 Prisma 客户端
npx prisma generate

# 运行种子数据（可选）
npx prisma db seed
```

## ⚙️ 环境配置

### 环境变量设置

```bash
# .env.local
DATABASE_URL="postgresql://hackx_user:your_secure_password@localhost:5432/hackx_platform"
```

### 数据库连接配置

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## 🛠️ 数据库管理

### 1. 使用 Prisma CLI

```bash
# 查看数据库状态
npx prisma studio

# 生成迁移文件
npx prisma migrate dev --name add_ipfs_fields

# 应用迁移到生产环境
npx prisma migrate deploy

# 重置数据库（开发环境）
npx prisma migrate reset

# 查看数据库架构
npx prisma db pull

# 推送架构到数据库
npx prisma db push
```

### 2. 直接使用 psql

```bash
# 连接到数据库
psql -h localhost -U hackx_user -d hackx_platform

# 查看所有表
\dt

# 查看表结构
\d users
\d hackathons
\d projects

# 查看索引
\di

# 查看视图
\dv
```

### 3. 常用 SQL 查询

#### 用户相关查询
```sql
-- 查看所有用户
SELECT id, email, username, reputation_score, created_at 
FROM users 
ORDER BY created_at DESC;

-- 查看用户参与的黑客松
SELECT u.username, h.title, p.status, p.joined_at
FROM users u
JOIN participations p ON u.id = p.user_id
JOIN hackathons h ON p.hackathon_id = h.id
WHERE u.id = 'user_id';

-- 查看用户创建的项目
SELECT p.title, p.status, h.title as hackathon_title
FROM projects p
JOIN hackathons h ON p.hackathon_id = h.id
WHERE p.creator_id = 'user_id';
```

#### 黑客松相关查询
```sql
-- 查看所有黑客松
SELECT id, title, start_date, end_date, 
       (SELECT COUNT(*) FROM participations WHERE hackathon_id = h.id) as participant_count,
       (SELECT COUNT(*) FROM projects WHERE hackathon_id = h.id) as project_count
FROM hackathons h
ORDER BY start_date DESC;

-- 查看黑客松参与者
SELECT u.username, u.email, p.status, p.joined_at
FROM participations p
JOIN users u ON p.user_id = u.id
WHERE p.hackathon_id = 'hackathon_id';

-- 查看黑客松项目
SELECT p.title, p.description, u.username as creator, p.status
FROM projects p
JOIN users u ON p.creator_id = u.id
WHERE p.hackathon_id = 'hackathon_id';
```

#### 评分和反馈查询
```sql
-- 查看项目评分
SELECT s.total_score, s.comments, u.username as judge, s.created_at
FROM scores s
JOIN users u ON s.judge_id = u.id
WHERE s.project_id = 'project_id'
ORDER BY s.created_at DESC;

-- 查看项目反馈
SELECT f.rating, f.comment, u.username, f.created_at
FROM feedback f
JOIN users u ON f.user_id = u.id
WHERE f.project_id = 'project_id'
ORDER BY f.created_at DESC;

-- 查看项目点赞
SELECT u.username, pl.created_at
FROM project_likes pl
JOIN users u ON pl.user_id = u.id
WHERE pl.project_id = 'project_id'
ORDER BY pl.created_at DESC;
```

#### IPFS 相关查询
```sql
-- 查看所有 IPFS 存储的数据
SELECT 'users' as table_name, id, ipfs_profile_hash as ipfs_hash
FROM users 
WHERE ipfs_profile_hash IS NOT NULL
UNION ALL
SELECT 'hackathons' as table_name, id, ipfs_hash
FROM hackathons 
WHERE ipfs_hash IS NOT NULL
UNION ALL
SELECT 'scores' as table_name, id, ipfs_hash
FROM scores 
WHERE ipfs_hash IS NOT NULL
UNION ALL
SELECT 'feedback' as table_name, id, ipfs_hash
FROM feedback 
WHERE ipfs_hash IS NOT NULL
UNION ALL
SELECT 'project_likes' as table_name, id, ipfs_hash
FROM project_likes 
WHERE ipfs_hash IS NOT NULL;

-- 查看特定类型的 IPFS 数据
SELECT p.title, p.ipfs_hash, 
       'https://ipfs.io/ipfs/' || p.ipfs_hash as ipfs_url
FROM projects p
WHERE p.ipfs_hash IS NOT NULL;
```

## 📊 数据统计查询

### 平台统计
```sql
-- 平台总体统计
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM hackathons) as total_hackathons,
    (SELECT COUNT(*) FROM projects) as total_projects,
    (SELECT COUNT(*) FROM teams) as total_teams,
    (SELECT COUNT(*) FROM participations) as total_participations;

-- 用户活跃度统计
SELECT 
    u.username,
    COUNT(DISTINCT p.hackathon_id) as hackathons_joined,
    COUNT(DISTINCT pr.id) as projects_created,
    COUNT(DISTINCT tm.team_id) as teams_joined,
    u.reputation_score
FROM users u
LEFT JOIN participations p ON u.id = p.user_id
LEFT JOIN projects pr ON u.id = pr.creator_id
LEFT JOIN team_members tm ON u.id = tm.user_id
GROUP BY u.id, u.username, u.reputation_score
ORDER BY u.reputation_score DESC;
```

### 黑客松统计
```sql
-- 黑客松参与度统计
SELECT 
    h.title,
    h.start_date,
    h.end_date,
    COUNT(DISTINCT p.user_id) as participant_count,
    COUNT(DISTINCT pr.id) as project_count,
    COUNT(DISTINCT t.id) as team_count,
    AVG(s.total_score) as average_score
FROM hackathons h
LEFT JOIN participations p ON h.id = p.hackathon_id
LEFT JOIN projects pr ON h.id = pr.hackathon_id
LEFT JOIN teams t ON h.id = t.hackathon_id
LEFT JOIN scores s ON pr.id = s.project_id
GROUP BY h.id, h.title, h.start_date, h.end_date
ORDER BY h.start_date DESC;
```

## 🔧 数据库维护

### 1. 备份和恢复

#### 创建备份
```bash
# 完整备份
pg_dump -h localhost -U hackx_user -d hackx_platform > hackx_backup_$(date +%Y%m%d_%H%M%S).sql

# 压缩备份
pg_dump -h localhost -U hackx_user -d hackx_platform | gzip > hackx_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# 仅数据备份（不包含结构）
pg_dump -h localhost -U hackx_user -d hackx_platform --data-only > hackx_data_backup.sql

# 仅结构备份（不包含数据）
pg_dump -h localhost -U hackx_user -d hackx_platform --schema-only > hackx_schema_backup.sql
```

#### 恢复备份
```bash
# 恢复完整备份
psql -h localhost -U hackx_user -d hackx_platform < hackx_backup_20240101_120000.sql

# 恢复压缩备份
gunzip -c hackx_backup_20240101_120000.sql.gz | psql -h localhost -U hackx_user -d hackx_platform
```

### 2. 性能优化

#### 索引优化
```sql
-- 查看慢查询
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 分析表统计信息
ANALYZE users;
ANALYZE hackathons;
ANALYZE projects;

-- 查看索引使用情况
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

#### 查询优化
```sql
-- 启用查询计划分析
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- 查看表大小
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. 数据清理

#### 清理过期数据
```sql
-- 清理30天前的通知
DELETE FROM notifications 
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';

-- 清理未验证的临时用户（7天）
DELETE FROM users 
WHERE email_verified = false 
AND created_at < CURRENT_TIMESTAMP - INTERVAL '7 days';

-- 更新用户声誉分数
UPDATE users 
SET reputation_score = (
    SELECT COALESCE(AVG(s.total_score), 0)
    FROM scores s
    JOIN projects p ON s.project_id = p.id
    WHERE p.creator_id = users.id
);
```

## 🔒 安全配置

### 1. 用户权限管理
```sql
-- 创建只读用户
CREATE USER hackx_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE hackx_platform TO hackx_readonly;
GRANT USAGE ON SCHEMA public TO hackx_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO hackx_readonly;

-- 创建应用用户
CREATE USER hackx_app WITH PASSWORD 'app_password';
GRANT CONNECT ON DATABASE hackx_platform TO hackx_app;
GRANT USAGE ON SCHEMA public TO hackx_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hackx_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hackx_app;
```

### 2. 连接安全
```bash
# 编辑 postgresql.conf
# 设置最大连接数
max_connections = 100

# 设置连接超时
tcp_keepalives_idle = 600
tcp_keepalives_interval = 30
tcp_keepalives_count = 3

# 编辑 pg_hba.conf
# 限制本地连接
local   hackx_platform    hackx_user    md5
host    hackx_platform    hackx_user    127.0.0.1/32    md5
host    hackx_platform    hackx_user    ::1/128         md5
```

## 🚨 故障排除

### 1. 常见问题

#### 连接问题
```bash
# 检查 PostgreSQL 服务状态
sudo systemctl status postgresql

# 重启服务
sudo systemctl restart postgresql

# 检查端口
netstat -tlnp | grep 5432
```

#### 权限问题
```sql
-- 检查用户权限
SELECT usename, usecreatedb, usesuper 
FROM pg_user 
WHERE usename = 'hackx_user';

-- 重新授权
GRANT ALL PRIVILEGES ON DATABASE hackx_platform TO hackx_user;
```

#### 性能问题
```sql
-- 查看当前连接数
SELECT count(*) FROM pg_stat_activity;

-- 查看锁等待
SELECT * FROM pg_locks WHERE NOT granted;

-- 查看长时间运行的查询
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

### 2. 日志分析
```bash
# 查看 PostgreSQL 日志
sudo tail -f /var/log/postgresql/postgresql-*.log

# 查看慢查询日志
sudo grep "duration:" /var/log/postgresql/postgresql-*.log | tail -20
```

## 📈 监控和维护

### 1. 定期维护任务
```bash
# 创建维护脚本
#!/bin/bash
# maintenance.sh

# 备份数据库
pg_dump -h localhost -U hackx_user -d hackx_platform | gzip > /backups/hackx_$(date +%Y%m%d).sql.gz

# 清理旧备份（保留30天）
find /backups -name "hackx_*.sql.gz" -mtime +30 -delete

# 更新统计信息
psql -h localhost -U hackx_user -d hackx_platform -c "ANALYZE;"

# 清理日志
sudo find /var/log/postgresql -name "*.log" -mtime +7 -delete
```

### 2. 监控指标
```sql
-- 数据库大小监控
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'hackx_platform';

-- 表大小监控
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 连接数监控
SELECT 
    state,
    count(*) as count
FROM pg_stat_activity
GROUP BY state;
```

## 📚 参考资源

- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [Prisma 文档](https://www.prisma.io/docs/)
- [PostgreSQL 性能调优指南](https://www.postgresql.org/docs/current/performance-tips.html)
- [数据库备份和恢复最佳实践](https://www.postgresql.org/docs/current/backup.html)

## 🔄 版本更新

### 数据库迁移
```bash
# 开发环境迁移
npx prisma migrate dev

# 生产环境迁移
npx prisma migrate deploy

# 回滚迁移（谨慎使用）
npx prisma migrate reset
```

### 架构更新
```bash
# 更新 Prisma 客户端
npx prisma generate

# 推送架构变更
npx prisma db push

# 查看迁移历史
npx prisma migrate status
```

---

**注意**: 在生产环境中执行任何数据库操作前，请务必备份数据并测试操作的安全性。 