#!/bin/bash

# HackX 数据库初始化脚本
echo "🚀 开始初始化 HackX 数据库..."

# 检查是否安装了必要的工具
if ! command -v npx &> /dev/null; then
    echo "❌ 错误: npx 未安装，请先安装 Node.js"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "❌ 错误: psql 未安装，请先安装 PostgreSQL"
    exit 1
fi

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 错误: DATABASE_URL 环境变量未设置"
    exit 1
fi

echo "✅ 环境检查通过"

# 生成 Prisma 客户端
echo "📦 生成 Prisma 客户端..."
npx prisma generate

# 推送数据库 schema（开发环境）
echo "🗄️ 推送数据库 schema..."
npx prisma db push --accept-data-loss

# 或者运行迁移（生产环境）
# npx prisma migrate deploy

# 执行性能优化 SQL
echo "⚡ 执行性能优化..."
if [ -f "prisma/migrations/performance-optimization.sql" ]; then
    # 从 DATABASE_URL 中提取连接信息
    DB_CONNECTION=$(echo $DATABASE_URL | sed 's/postgresql:\/\///')
    DB_HOST=$(echo $DB_CONNECTION | cut -d'@' -f2 | cut -d':' -f1)
    DB_PORT=$(echo $DB_CONNECTION | cut -d'@' -f2 | cut -d':' -f2 | cut -d'/' -f1)
    DB_NAME=$(echo $DB_CONNECTION | cut -d'/' -f2 | cut -d'?' -f1)
    DB_USER=$(echo $DB_CONNECTION | cut -d'@' -f1 | cut -d':' -f1)
    DB_PASS=$(echo $DB_CONNECTION | cut -d'@' -f1 | cut -d':' -f2)
    
    # 如果有密码环境变量，使用环境变量
    if [ ! -z "$POSTGRES_PASSWORD" ]; then
        PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f prisma/migrations/performance-optimization.sql
    else
        psql $DATABASE_URL -f prisma/migrations/performance-optimization.sql
    fi
    echo "✅ 性能优化 SQL 执行完成"
else
    echo "⚠️ 警告: 性能优化 SQL 文件不存在"
fi

# 运行种子数据（可选）
echo "🌱 是否要运行种子数据? (y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "🌱 运行种子数据..."
    npx prisma db seed
    echo "✅ 种子数据运行完成"
fi

# 打开 Prisma Studio（可选）
echo "🎛️ 是否要打开 Prisma Studio? (y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "🎛️ 打开 Prisma Studio..."
    npx prisma studio
fi

echo "🎉 数据库初始化完成！"
echo ""
echo "📋 后续步骤:"
echo "1. 检查数据库连接: npx prisma db push --preview-feature"
echo "2. 查看数据库: npx prisma studio"
echo "3. 运行应用: npm run dev"