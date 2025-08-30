-- 性能优化 SQL 脚本
-- 为去中心化黑客松平台添加复合索引和性能优化

-- ===== 复合索引优化 =====

-- 项目相关索引
CREATE INDEX IF NOT EXISTS idx_projects_hackathon_status ON hackathon_schema.projects(hackathon_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_creator_created ON hackathon_schema.projects(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_sync_status ON hackathon_schema.projects(sync_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_projects_public_featured ON hackathon_schema.projects(is_public, created_at DESC) WHERE is_public = true;

-- DAO治理相关索引
CREATE INDEX IF NOT EXISTS idx_dao_votes_proposal_created ON hackathon_schema.dao_votes(proposal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_status_deadline ON hackathon_schema.dao_proposals(status, voting_deadline);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_category_priority ON hackathon_schema.dao_proposals(proposal_category, priority, created_at DESC);

-- 用户声誉和活动索引
CREATE INDEX IF NOT EXISTS idx_users_reputation_active ON hackathon_schema.users(reputation_score DESC, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_users_wallet_status ON hackathon_schema.users(wallet_address, status) WHERE wallet_address IS NOT NULL;

-- 黑客松相关索引
CREATE INDEX IF NOT EXISTS idx_hackathons_dates_status ON hackathon_schema.hackathons(start_date, end_date, status);
CREATE INDEX IF NOT EXISTS idx_hackathons_featured_public ON hackathon_schema.hackathons(featured, is_public, created_at DESC) WHERE featured = true AND is_public = true;
CREATE INDEX IF NOT EXISTS idx_hackathons_organizer_status ON hackathon_schema.hackathons(organizer_id, status);

-- 参与相关索引
CREATE INDEX IF NOT EXISTS idx_participations_user_status ON hackathon_schema.participations(user_id, status, joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_members_user_role ON hackathon_schema.team_members(user_id, role, joined_at DESC);

-- 通知和社区互动索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON hackathon_schema.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON hackathon_schema.community_posts(created_at DESC, is_deleted) WHERE is_deleted = false;

-- 质押相关索引
CREATE INDEX IF NOT EXISTS idx_staking_user_active ON hackathon_schema.staking(user_id, is_locked, staking_tier);
CREATE INDEX IF NOT EXISTS idx_staking_transactions_user_type ON hackathon_schema.staking_transactions(user_id, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staking_transactions_status_created ON hackathon_schema.staking_transactions(status, created_at DESC);

-- NFT相关索引
CREATE INDEX IF NOT EXISTS idx_nfts_owner_category ON hackathon_schema.nfts(owner_id, category, mint_time DESC);
CREATE INDEX IF NOT EXISTS idx_nfts_token_id ON hackathon_schema.nfts(token_id) WHERE token_id IS NOT NULL;

-- 新增模型的索引（根据新的schema定义）

-- 声誉记录索引
CREATE INDEX IF NOT EXISTS idx_reputation_records_user_season ON hackathon_schema.reputation_records(user_id, season, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reputation_records_action_created ON hackathon_schema.reputation_records(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reputation_records_category_valid ON hackathon_schema.reputation_records(category, is_valid) WHERE is_valid = true;

-- 多重签名提案索引
CREATE INDEX IF NOT EXISTS idx_multisig_proposals_executed ON hackathon_schema.multisig_proposals(executed, timelock);
CREATE INDEX IF NOT EXISTS idx_multisig_proposals_emergency ON hackathon_schema.multisig_proposals(is_emergency, created_at DESC) WHERE is_emergency = true;

-- 零知识证明投票索引
CREATE INDEX IF NOT EXISTS idx_private_votes_proposal_created ON hackathon_schema.private_votes(proposal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_votes_nullifier_verified ON hackathon_schema.private_votes(nullifier_hash, is_verified);

-- 跨链支持索引
CREATE INDEX IF NOT EXISTS idx_crosschain_support_active ON hackathon_schema.crosschain_support(is_active, chain_id) WHERE is_active = true;

-- DID凭证索引
CREATE INDEX IF NOT EXISTS idx_did_credentials_user_type ON hackathon_schema.did_credentials(user_id, credential_type, is_verified);
CREATE INDEX IF NOT EXISTS idx_did_credentials_issuer_verified ON hackathon_schema.did_credentials(issuer, is_verified, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_did_credentials_expiry ON hackathon_schema.did_credentials(expiry_date) WHERE expiry_date IS NOT NULL AND revoked = false;

-- 委托投票索引
CREATE INDEX IF NOT EXISTS idx_voting_delegations_delegatee_active ON hackathon_schema.voting_delegations(delegatee_id, is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voting_delegations_delegator_scope ON hackathon_schema.voting_delegations(delegator_id, scope, is_active);

-- 社区激励索引
CREATE INDEX IF NOT EXISTS idx_community_incentives_user_distributed ON hackathon_schema.community_incentives(user_id, distributed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_incentives_action_season ON hackathon_schema.community_incentives(action_type, season, is_valid);

-- ===== 查询性能优化 =====

-- 创建物化视图来优化复杂查询
CREATE MATERIALIZED VIEW IF NOT EXISTS hackathon_schema.user_reputation_summary AS
SELECT 
    u.id as user_id,
    u.username,
    u.reputation_score,
    COUNT(DISTINCT p.id) as projects_count,
    COUNT(DISTINCT part.id) as participations_count,
    COUNT(DISTINCT dv.id) as votes_count,
    COALESCE(SUM(rr.points), 0) as total_reputation_points,
    MAX(p.created_at) as last_project_date,
    MAX(dv.created_at) as last_vote_date
FROM hackathon_schema.users u
LEFT JOIN hackathon_schema.projects p ON u.id = p.creator_id
LEFT JOIN hackathon_schema.participations part ON u.id = part.user_id
LEFT JOIN hackathon_schema.dao_votes dv ON u.id = dv.user_id
LEFT JOIN hackathon_schema.reputation_records rr ON u.id = rr.user_id AND rr.is_valid = true
WHERE u.status = 'active'
GROUP BY u.id, u.username, u.reputation_score;

-- 为物化视图创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_reputation_summary_user_id 
ON hackathon_schema.user_reputation_summary(user_id);

-- 创建黑客松统计物化视图
CREATE MATERIALIZED VIEW IF NOT EXISTS hackathon_schema.hackathon_stats AS
SELECT 
    h.id as hackathon_id,
    h.title,
    h.status,
    h.start_date,
    h.end_date,
    COUNT(DISTINCT part.id) as participants_count,
    COUNT(DISTINCT t.id) as teams_count,
    COUNT(DISTINCT p.id) as projects_count,
    AVG(s.total_score) as avg_score,
    h.prize_pool,
    h.created_at
FROM hackathon_schema.hackathons h
LEFT JOIN hackathon_schema.participations part ON h.id = part.hackathon_id
LEFT JOIN hackathon_schema.teams t ON h.id = t.hackathon_id
LEFT JOIN hackathon_schema.projects p ON h.id = p.hackathon_id
LEFT JOIN hackathon_schema.scores s ON p.id = s.project_id
GROUP BY h.id, h.title, h.status, h.start_date, h.end_date, h.prize_pool, h.created_at;

-- 为黑客松统计视图创建索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_hackathon_stats_hackathon_id 
ON hackathon_schema.hackathon_stats(hackathon_id);

CREATE INDEX IF NOT EXISTS idx_hackathon_stats_status_dates 
ON hackathon_schema.hackathon_stats(status, start_date, end_date);

-- ===== 分区策略 (适用于大数据量场景) =====

-- 为日志表创建按月分区 (示例，需要根据实际情况调整)
-- 这里提供分区策略的模板，实际实施需要根据数据增长情况调整

-- 创建声誉记录分区表模板
-- CREATE TABLE hackathon_schema.reputation_records_2024_01 PARTITION OF hackathon_schema.reputation_records
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- ===== 性能监控和维护 =====

-- 创建性能监控函数
CREATE OR REPLACE FUNCTION hackathon_schema.refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW hackathon_schema.user_reputation_summary;
    REFRESH MATERIALIZED VIEW hackathon_schema.hackathon_stats;
END;
$$ LANGUAGE plpgsql;

-- 创建自动清理过期数据的函数
CREATE OR REPLACE FUNCTION hackathon_schema.cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- 清理过期的DID凭证缓存
    UPDATE hackathon_schema.did_credentials 
    SET revoked = true, revoked_at = NOW()
    WHERE expiry_date < NOW() AND revoked = false;
    
    -- 清理过期的投票委托
    UPDATE hackathon_schema.voting_delegations 
    SET is_active = false
    WHERE valid_until < NOW() AND is_active = true;
    
    -- 清理旧的私有投票记录（保留最近6个月）
    DELETE FROM hackathon_schema.private_votes 
    WHERE created_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

-- ===== 统计信息更新 =====

-- 更新表的统计信息以优化查询计划
ANALYZE hackathon_schema.users;
ANALYZE hackathon_schema.projects;
ANALYZE hackathon_schema.hackathons;
ANALYZE hackathon_schema.dao_proposals;
ANALYZE hackathon_schema.dao_votes;
ANALYZE hackathon_schema.participations;
ANALYZE hackathon_schema.staking;
ANALYZE hackathon_schema.reputation_records;

-- 性能优化完成
-- 建议定期运行以下维护命令：
-- 1. VACUUM ANALYZE; (清理和分析)
-- 2. SELECT hackathon_schema.refresh_materialized_views(); (刷新物化视图)
-- 3. SELECT hackathon_schema.cleanup_expired_data(); (清理过期数据)