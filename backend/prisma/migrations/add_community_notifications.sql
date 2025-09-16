-- 为hackathon_schema添加社区通知功能
-- 这个迁移只影响hackathon_schema，不会修改public模式

-- 创建通知类型枚举
CREATE TYPE "hackathon_schema"."CommunityNotificationType" AS ENUM (
    'REPLY',
    'REPLY_MENTION', 
    'POST_LIKE',
    'REPLY_LIKE',
    'NEW_FOLLOWER',
    'FOLLOWER_POST',
    'SYSTEM_ANNOUNCEMENT',
    'WELCOME'
);

-- 创建社区通知表
CREATE TABLE "hackathon_schema"."community_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "hackathon_schema"."CommunityNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "triggerUserId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "community_notifications_pkey" PRIMARY KEY ("id")
);

-- 添加外键约束
ALTER TABLE "hackathon_schema"."community_notifications" 
ADD CONSTRAINT "community_notifications_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "hackathon_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hackathon_schema"."community_notifications" 
ADD CONSTRAINT "community_notifications_triggerUserId_fkey" 
FOREIGN KEY ("triggerUserId") REFERENCES "hackathon_schema"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 创建索引以优化查询性能
CREATE INDEX "community_notifications_userId_idx" ON "hackathon_schema"."community_notifications"("userId");
CREATE INDEX "community_notifications_isRead_idx" ON "hackathon_schema"."community_notifications"("isRead");
CREATE INDEX "community_notifications_createdAt_idx" ON "hackathon_schema"."community_notifications"("createdAt");
CREATE INDEX "community_notifications_type_idx" ON "hackathon_schema"."community_notifications"("type");
