-- 专业评委仪表板与评审工作流程系统 - 数据库扩展
-- 作者：AI Assistant
-- 日期：2024-12-23

-- 首先，为JudgingSession表添加时间锁定和IPFS支持字段
ALTER TABLE hackathon_schema.judging_sessions 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lock_timestamp TIMESTAMP,
ADD COLUMN IF NOT EXISTS final_ipfs_hash TEXT,
ADD COLUMN IF NOT EXISTS signature_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_lock_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS lock_grace_period INTEGER DEFAULT 0; -- 锁定宽限期（分钟）

-- 为Score表添加钱包签名验证字段
ALTER TABLE hackathon_schema.scores 
ADD COLUMN IF NOT EXISTS wallet_signature TEXT, -- 评委钱包签名
ADD COLUMN IF NOT EXISTS signature_timestamp TIMESTAMP, -- 签名时间戳
ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN DEFAULT false, -- 是否最终确认
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP; -- 最终确认时间

-- 创建评审锁定控制表
CREATE TABLE IF NOT EXISTS hackathon_schema.judging_locks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    hackathon_id TEXT NOT NULL,
    session_id TEXT,
    lock_type TEXT NOT NULL DEFAULT 'time_based', -- time_based, manual, emergency
    is_active BOOLEAN DEFAULT true,
    locked_at TIMESTAMP DEFAULT NOW(),
    locked_by TEXT, -- 锁定操作的管理员ID
    unlock_reason TEXT, -- 解锁原因
    unlocked_at TIMESTAMP,
    unlocked_by TEXT, -- 解锁操作的管理员ID
    auto_lock_time TIMESTAMP, -- 自动锁定时间
    grace_period_minutes INTEGER DEFAULT 0,
    affected_judges JSONB DEFAULT '[]'::jsonb, -- 受影响的评委列表
    affected_projects JSONB DEFAULT '[]'::jsonb, -- 受影响的项目列表
    lock_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_judging_locks_hackathon 
        FOREIGN KEY (hackathon_id) REFERENCES hackathon_schema.hackathons(id) ON DELETE CASCADE,
    CONSTRAINT fk_judging_locks_session 
        FOREIGN KEY (session_id) REFERENCES hackathon_schema.judging_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_judging_locks_locked_by 
        FOREIGN KEY (locked_by) REFERENCES hackathon_schema.users(id) ON DELETE SET NULL,
    CONSTRAINT fk_judging_locks_unlocked_by 
        FOREIGN KEY (unlocked_by) REFERENCES hackathon_schema.users(id) ON DELETE SET NULL
);

-- 创建IPFS评分存储记录表
CREATE TABLE IF NOT EXISTS hackathon_schema.judging_ipfs_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    score_id TEXT NOT NULL,
    judge_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    hackathon_id TEXT NOT NULL,
    ipfs_hash TEXT NOT NULL UNIQUE,
    wallet_address TEXT, -- 评委钱包地址
    signature TEXT, -- 钱包签名
    signature_message TEXT, -- 签名消息
    verification_status TEXT DEFAULT 'pending', -- pending, verified, failed
    verified_at TIMESTAMP,
    data_structure JSONB NOT NULL, -- 存储在IPFS中的结构化数据
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_judging_ipfs_score 
        FOREIGN KEY (score_id) REFERENCES hackathon_schema.scores(id) ON DELETE CASCADE,
    CONSTRAINT fk_judging_ipfs_judge 
        FOREIGN KEY (judge_id) REFERENCES hackathon_schema.judges(id) ON DELETE CASCADE,
    CONSTRAINT fk_judging_ipfs_project 
        FOREIGN KEY (project_id) REFERENCES hackathon_schema.projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_judging_ipfs_hackathon 
        FOREIGN KEY (hackathon_id) REFERENCES hackathon_schema.hackathons(id) ON DELETE CASCADE
);

-- 创建评委仪表板过滤器配置表（可选，用于保存评委的个人过滤偏好）
CREATE TABLE IF NOT EXISTS hackathon_schema.judge_dashboard_preferences (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    judge_id TEXT NOT NULL,
    hackathon_id TEXT,
    filter_preferences JSONB DEFAULT '{}'::jsonb, -- 保存过滤器偏好
    view_preferences JSONB DEFAULT '{}'::jsonb, -- 保存视图偏好
    notification_preferences JSONB DEFAULT '{}'::jsonb, -- 保存通知偏好
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_judge_preferences_judge 
        FOREIGN KEY (judge_id) REFERENCES hackathon_schema.judges(id) ON DELETE CASCADE,
    CONSTRAINT fk_judge_preferences_hackathon 
        FOREIGN KEY (hackathon_id) REFERENCES hackathon_schema.hackathons(id) ON DELETE CASCADE,
    
    UNIQUE(judge_id, hackathon_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_judging_sessions_locked ON hackathon_schema.judging_sessions(hackathon_id, is_locked);
CREATE INDEX IF NOT EXISTS idx_judging_sessions_auto_lock ON hackathon_schema.judging_sessions(auto_lock_enabled, end_time) WHERE is_locked = false;

CREATE INDEX IF NOT EXISTS idx_scores_finalized ON hackathon_schema.scores(project_id, is_finalized);
CREATE INDEX IF NOT EXISTS idx_scores_signature ON hackathon_schema.scores(judge_id, signature_timestamp) WHERE wallet_signature IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_judging_locks_active ON hackathon_schema.judging_locks(hackathon_id, is_active);
CREATE INDEX IF NOT EXISTS idx_judging_locks_auto_lock ON hackathon_schema.judging_locks(auto_lock_time) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_judging_ipfs_verification ON hackathon_schema.judging_ipfs_records(verification_status, created_at);
CREATE INDEX IF NOT EXISTS idx_judging_ipfs_hackathon ON hackathon_schema.judging_ipfs_records(hackathon_id, judge_id);

CREATE INDEX IF NOT EXISTS idx_judge_dashboard_prefs ON hackathon_schema.judge_dashboard_preferences(judge_id, hackathon_id);

-- 创建触发器以自动更新updated_at字段
CREATE OR REPLACE FUNCTION hackathon_schema.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_judging_locks_updated_at BEFORE UPDATE ON hackathon_schema.judging_locks 
    FOR EACH ROW EXECUTE FUNCTION hackathon_schema.update_updated_at_column();

CREATE TRIGGER update_judging_ipfs_records_updated_at BEFORE UPDATE ON hackathon_schema.judging_ipfs_records 
    FOR EACH ROW EXECUTE FUNCTION hackathon_schema.update_updated_at_column();

CREATE TRIGGER update_judge_dashboard_preferences_updated_at BEFORE UPDATE ON hackathon_schema.judge_dashboard_preferences 
    FOR EACH ROW EXECUTE FUNCTION hackathon_schema.update_updated_at_column();

-- 添加评论说明
COMMENT ON TABLE hackathon_schema.judging_locks IS '评审期锁定控制表，管理评审时间和访问权限';
COMMENT ON TABLE hackathon_schema.judging_ipfs_records IS 'IPFS评分存储记录表，用于存储最终评分的区块链验证信息';
COMMENT ON TABLE hackathon_schema.judge_dashboard_preferences IS '评委仪表板个人偏好设置表';

COMMENT ON COLUMN hackathon_schema.judging_sessions.is_locked IS '评审会话是否已锁定';
COMMENT ON COLUMN hackathon_schema.judging_sessions.final_ipfs_hash IS '最终评审结果的IPFS哈希';
COMMENT ON COLUMN hackathon_schema.judging_sessions.signature_required IS '是否需要钱包签名';

COMMENT ON COLUMN hackathon_schema.scores.wallet_signature IS '评委钱包对评分数据的数字签名';
COMMENT ON COLUMN hackathon_schema.scores.is_finalized IS '评分是否已最终确认（不可再修改）';
