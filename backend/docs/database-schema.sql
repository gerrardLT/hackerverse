-- HackX 黑客松平台数据库结构
-- 基于 Prisma Schema 生成的 PostgreSQL SQL 文件
-- 创建时间: 2024年
-- 版本: 1.0.3 (支持Web3功能和完整用户管理)

-- 创建数据库
-- CREATE DATABASE hackx_platform;

-- 使用数据库
-- USE hackx_platform;
-- ========================================
-- 用户表 (users)
-- ========================================
CREATE TABLE hackathon_schema.users (
    id VARCHAR(25) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    wallet_address VARCHAR(42) UNIQUE,
    reputation_score INTEGER DEFAULT 0,
    ipfs_profile_hash TEXT,
    social_links JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    email_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'user', -- 用户角色: admin, moderator, user
    status VARCHAR(20) DEFAULT 'active', -- 用户状态: active, suspended, banned
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 用户表索引
CREATE INDEX idx_users_email ON hackathon_schema.users(email);
CREATE INDEX idx_users_username ON hackathon_schema.users(username);
CREATE INDEX idx_users_wallet_address ON hackathon_schema.users(wallet_address);
CREATE INDEX idx_users_reputation_score ON hackathon_schema.users(reputation_score);
CREATE INDEX idx_users_role ON hackathon_schema.users(role);
CREATE INDEX idx_users_status ON hackathon_schema.users(status);
CREATE INDEX idx_users_created_at ON hackathon_schema.users(created_at);

-- ========================================
-- 黑客松表 (hackathons)
-- ========================================
CREATE TABLE hackathon_schema.hackathons (
    id VARCHAR(25) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    max_participants INTEGER,
    prize_pool DECIMAL(15,2),
    categories JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    requirements TEXT,
    rules TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'draft',
    organizer_id VARCHAR(25) NOT NULL,
    ipfs_hash TEXT,
    metadata JSONB DEFAULT '{}',
    prizes JSONB DEFAULT '{}',
    tracks JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organizer_id) REFERENCES hackathon_schema.users(id) ON DELETE CASCADE
);

-- 黑客松表索引
CREATE INDEX idx_hackathons_organizer_id ON hackathon_schema.hackathons(organizer_id);
CREATE INDEX idx_hackathons_start_date ON hackathon_schema.hackathons(start_date);
CREATE INDEX idx_hackathons_end_date ON hackathon_schema.hackathons(end_date);
CREATE INDEX idx_hackathons_status ON hackathon_schema.hackathons(status);
CREATE INDEX idx_hackathons_is_public ON hackathon_schema.hackathons(is_public);
CREATE INDEX idx_hackathons_featured ON hackathon_schema.hackathons(featured);
CREATE INDEX idx_hackathons_created_at ON hackathon_schema.hackathons(created_at);
CREATE INDEX idx_hackathons_categories ON hackathon_schema.hackathons USING GIN(categories);
CREATE INDEX idx_hackathons_tags ON hackathon_schema.hackathons USING GIN(tags);

-- ========================================
-- 团队表 (teams)
-- ========================================
CREATE TABLE hackathon_schema.teams (
    id VARCHAR(25) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    hackathon_id VARCHAR(25) NOT NULL,
    leader_id VARCHAR(25) NOT NULL,
    max_members INTEGER DEFAULT 5,
    skills JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hackathon_id) REFERENCES hackathon_schema.hackathons(id) ON DELETE CASCADE,
    FOREIGN KEY (leader_id) REFERENCES hackathon_schema.users(id) ON DELETE CASCADE
);

-- 团队表索引
CREATE INDEX idx_teams_hackathon_id ON hackathon_schema.teams(hackathon_id);
CREATE INDEX idx_teams_leader_id ON hackathon_schema.teams(leader_id);
CREATE INDEX idx_teams_name ON hackathon_schema.teams(name);
CREATE INDEX idx_teams_is_public ON hackathon_schema.teams(is_public);
CREATE INDEX idx_teams_created_at ON hackathon_schema.teams(created_at);
CREATE INDEX idx_teams_skills ON hackathon_schema.teams USING GIN(skills);
CREATE INDEX idx_teams_tags ON hackathon_schema.teams USING GIN(tags);

-- ========================================
-- 团队成员表 (team_members)
-- ========================================
CREATE TABLE hackathon_schema.team_members (
    id VARCHAR(25) PRIMARY KEY,
    team_id VARCHAR(25) NOT NULL,
    user_id VARCHAR(25) NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (team_id) REFERENCES hackathon_schema.teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES hackathon_schema.users(id) ON DELETE CASCADE,
    UNIQUE(team_id, user_id)
);

-- 团队成员表索引
CREATE INDEX idx_team_members_team_id ON hackathon_schema.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON hackathon_schema.team_members(user_id);
CREATE INDEX idx_team_members_role ON hackathon_schema.team_members(role);

-- ========================================
-- 参与记录表 (participations)
-- ========================================
CREATE TABLE hackathon_schema.participations (
    id VARCHAR(25) PRIMARY KEY,
    hackathon_id VARCHAR(25) NOT NULL,
    user_id VARCHAR(25) NOT NULL,
    status VARCHAR(50) DEFAULT 'registered',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hackathon_id) REFERENCES hackathon_schema.hackathons(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES hackathon_schema.users(id) ON DELETE CASCADE,
    UNIQUE(hackathon_id, user_id)
);

-- 参与记录表索引
CREATE INDEX idx_participations_hackathon_id ON hackathon_schema.participations(hackathon_id);
CREATE INDEX idx_participations_user_id ON hackathon_schema.participations(user_id);
CREATE INDEX idx_participations_status ON hackathon_schema.participations(status);
CREATE INDEX idx_participations_joined_at ON hackathon_schema.participations(joined_at);

-- ========================================
-- 项目表 (projects)
-- ========================================
CREATE TABLE hackathon_schema.projects (
    id VARCHAR(25) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    hackathon_id VARCHAR(25) NOT NULL,
    team_id VARCHAR(25),
    creator_id VARCHAR(25) NOT NULL,
    technologies JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    github_url TEXT,
    demo_url TEXT,
    video_url TEXT,
    presentation_url TEXT,
    ipfs_hash TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hackathon_id) REFERENCES hackathon_schema.hackathons(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES hackathon_schema.teams(id) ON DELETE SET NULL,
    FOREIGN KEY (creator_id) REFERENCES hackathon_schema.users(id) ON DELETE CASCADE
);

-- 项目表索引
CREATE INDEX idx_projects_hackathon_id ON hackathon_schema.projects(hackathon_id);
CREATE INDEX idx_projects_team_id ON hackathon_schema.projects(team_id);
CREATE INDEX idx_projects_creator_id ON hackathon_schema.projects(creator_id);
CREATE INDEX idx_projects_status ON hackathon_schema.projects(status);
CREATE INDEX idx_projects_is_public ON hackathon_schema.projects(is_public);
CREATE INDEX idx_projects_created_at ON hackathon_schema.projects(created_at);
CREATE INDEX idx_projects_technologies ON hackathon_schema.projects USING GIN(technologies);
CREATE INDEX idx_projects_tags ON hackathon_schema.projects USING GIN(tags);

-- ========================================
-- 评委表 (judges)
-- ========================================
CREATE TABLE hackathon_schema.judges (
    id VARCHAR(25) PRIMARY KEY,
    hackathon_id VARCHAR(25) NOT NULL,
    user_id VARCHAR(25) NOT NULL,
    role VARCHAR(50) DEFAULT 'main',
    expertise JSONB DEFAULT '[]',
    assigned_projects JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hackathon_id) REFERENCES hackathon_schema.hackathons(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES hackathon_schema.users(id) ON DELETE CASCADE
);

-- 评委表索引
CREATE INDEX idx_judges_hackathon_id ON hackathon_schema.judges(hackathon_id);
CREATE INDEX idx_judges_user_id ON hackathon_schema.judges(user_id);
CREATE INDEX idx_judges_role ON hackathon_schema.judges(role);

-- ========================================
-- 评分表 (scores)
-- ========================================
CREATE TABLE hackathon_schema.scores (
    id VARCHAR(25) PRIMARY KEY,
    project_id VARCHAR(25) NOT NULL,
    judge_id VARCHAR(25) NOT NULL,
    innovation DECIMAL(3,1),
    technical_complexity DECIMAL(3,1),
    user_experience DECIMAL(3,1),
    business_potential DECIMAL(3,1),
    presentation DECIMAL(3,1),
    total_score DECIMAL(4,1),
    comments TEXT,
    ipfs_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES hackathon_schema.projects(id) ON DELETE CASCADE,
    FOREIGN KEY (judge_id) REFERENCES hackathon_schema.judges(id) ON DELETE CASCADE
);

-- 评分表索引
CREATE INDEX idx_scores_project_id ON hackathon_schema.scores(project_id);
CREATE INDEX idx_scores_judge_id ON hackathon_schema.scores(judge_id);
CREATE INDEX idx_scores_total_score ON hackathon_schema.scores(total_score);
CREATE INDEX idx_scores_created_at ON hackathon_schema.scores(created_at);
CREATE INDEX idx_scores_ipfs_hash ON hackathon_schema.scores(ipfs_hash);

-- ========================================
-- 反馈表 (feedback)
-- ========================================
CREATE TABLE hackathon_schema.feedback (
    id VARCHAR(25) PRIMARY KEY,
    project_id VARCHAR(25) NOT NULL,
    user_id VARCHAR(25) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    ipfs_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES hackathon_schema.projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES hackathon_schema.users(id) ON DELETE CASCADE
);

-- 反馈表索引
CREATE INDEX idx_feedback_project_id ON hackathon_schema.feedback(project_id);
CREATE INDEX idx_feedback_user_id ON hackathon_schema.feedback(user_id);
CREATE INDEX idx_feedback_rating ON hackathon_schema.feedback(rating);
CREATE INDEX idx_feedback_created_at ON hackathon_schema.feedback(created_at);
CREATE INDEX idx_feedback_ipfs_hash ON hackathon_schema.feedback(ipfs_hash);

-- ========================================
-- 项目点赞表 (project_likes)
-- ========================================
CREATE TABLE hackathon_schema.project_likes (
    id VARCHAR(25) PRIMARY KEY,
    project_id VARCHAR(25) NOT NULL,
    user_id VARCHAR(25) NOT NULL,
    ipfs_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES hackathon_schema.projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES hackathon_schema.users(id) ON DELETE CASCADE,
    UNIQUE(project_id, user_id)
);

-- 项目点赞表索引
CREATE INDEX idx_project_likes_project_id ON hackathon_schema.project_likes(project_id);
CREATE INDEX idx_project_likes_user_id ON hackathon_schema.project_likes(user_id);
CREATE INDEX idx_project_likes_created_at ON hackathon_schema.project_likes(created_at);
CREATE INDEX idx_project_likes_ipfs_hash ON hackathon_schema.project_likes(ipfs_hash);

-- ========================================
-- 通知表 (notifications)
-- ========================================
CREATE TABLE hackathon_schema.notifications (
    id VARCHAR(25) PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    user_id VARCHAR(25) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES hackathon_schema.users(id) ON DELETE CASCADE
);

-- 通知表索引
CREATE INDEX idx_notifications_user_id ON hackathon_schema.notifications(user_id);
CREATE INDEX idx_notifications_type ON hackathon_schema.notifications(type);
CREATE INDEX idx_notifications_read ON hackathon_schema.notifications(read);
CREATE INDEX idx_notifications_created_at ON hackathon_schema.notifications(created_at);

-- ========================================
-- 社区帖子表 (community_posts)
-- ========================================
CREATE TABLE hackathon_schema.community_posts (
    id VARCHAR(25) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category VARCHAR(50) DEFAULT 'general',
    tags JSONB DEFAULT '[]',
    author_id VARCHAR(25) NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    replies INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    last_reply_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (author_id) REFERENCES hackathon_schema.users(id) ON DELETE CASCADE
);

-- 社区帖子表索引
CREATE INDEX idx_community_posts_author_id ON hackathon_schema.community_posts(author_id);
CREATE INDEX idx_community_posts_category ON hackathon_schema.community_posts(category);
CREATE INDEX idx_community_posts_created_at ON hackathon_schema.community_posts(created_at);
CREATE INDEX idx_community_posts_tags ON hackathon_schema.community_posts USING GIN(tags);

-- ========================================
-- 社区回复表 (community_replies)
-- ========================================
CREATE TABLE hackathon_schema.community_replies (
    id VARCHAR(25) PRIMARY KEY,
    post_id VARCHAR(25) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(25) NOT NULL,
    parent_id VARCHAR(25),
    likes INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (post_id) REFERENCES hackathon_schema.community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES hackathon_schema.users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES hackathon_schema.community_replies(id) ON DELETE CASCADE
);

-- 社区回复表索引
CREATE INDEX idx_community_replies_post_id ON hackathon_schema.community_replies(post_id);
CREATE INDEX idx_community_replies_author_id ON hackathon_schema.community_replies(author_id);
CREATE INDEX idx_community_replies_parent_id ON hackathon_schema.community_replies(parent_id);
CREATE INDEX idx_community_replies_created_at ON hackathon_schema.community_replies(created_at);

-- ========================================
-- Web3 相关表
-- ========================================

-- ========================================
-- DAO提案表 (dao_proposals)
-- ========================================
CREATE TABLE hackathon_schema.dao_proposals (
    id VARCHAR(25) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    proposal_type VARCHAR(50) NOT NULL, -- governance, funding, technical, community
    target_amount DECIMAL(15,2),
    execution_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, passed, rejected, executed
    for_votes INTEGER DEFAULT 0,
    against_votes INTEGER DEFAULT 0,
    creator_id VARCHAR(25) NOT NULL,
    ipfs_hash TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (creator_id) REFERENCES hackathon_schema.users(id) ON DELETE CASCADE
);

-- DAO提案表索引
CREATE INDEX idx_dao_proposals_creator_id ON hackathon_schema.dao_proposals(creator_id);
CREATE INDEX idx_dao_proposals_status ON hackathon_schema.dao_proposals(status);
CREATE INDEX idx_dao_proposals_type ON hackathon_schema.dao_proposals(proposal_type);
CREATE INDEX idx_dao_proposals_execution_time ON hackathon_schema.dao_proposals(execution_time);
CREATE INDEX idx_dao_proposals_created_at ON hackathon_schema.dao_proposals(created_at);

-- ========================================
-- DAO投票表 (dao_votes)
-- ========================================
CREATE TABLE hackathon_schema.dao_votes (
    id VARCHAR(25) PRIMARY KEY,
    proposal_id VARCHAR(25) NOT NULL,
    user_id VARCHAR(25) NOT NULL,
    vote VARCHAR(10) NOT NULL, -- for, against
    voting_power INTEGER NOT NULL,
    ipfs_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (proposal_id) REFERENCES hackathon_schema.dao_proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES hackathon_schema.users(id) ON DELETE CASCADE,
    UNIQUE(proposal_id, user_id)
);

-- DAO投票表索引
CREATE INDEX idx_dao_votes_proposal_id ON hackathon_schema.dao_votes(proposal_id);
CREATE INDEX idx_dao_votes_user_id ON hackathon_schema.dao_votes(user_id);
CREATE INDEX idx_dao_votes_vote ON hackathon_schema.dao_votes(vote);
CREATE INDEX idx_dao_votes_created_at ON hackathon_schema.dao_votes(created_at);

-- ========================================
-- NFT表 (nfts)
-- ========================================
CREATE TABLE hackathon_schema.nfts (
    id VARCHAR(25) PRIMARY KEY,
    token_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- certificate, achievement, collectible
    metadata JSONB DEFAULT '{}',
    owner_id VARCHAR(25) NOT NULL,
    ipfs_hash TEXT,
    mint_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (owner_id) REFERENCES hackathon_schema.users(id) ON DELETE CASCADE
);

-- NFT表索引
CREATE INDEX idx_nfts_owner_id ON hackathon_schema.nfts(owner_id);
CREATE INDEX idx_nfts_token_id ON hackathon_schema.nfts(token_id);
CREATE INDEX idx_nfts_category ON hackathon_schema.nfts(category);
CREATE INDEX idx_nfts_mint_time ON hackathon_schema.nfts(mint_time);
CREATE INDEX idx_nfts_created_at ON hackathon_schema.nfts(created_at);

-- ========================================
-- 质押表 (staking)
-- ========================================
CREATE TABLE hackathon_schema.staking (
    id VARCHAR(25) PRIMARY KEY,
    user_id VARCHAR(25) UNIQUE NOT NULL,
    staked_amount DECIMAL(15,2) DEFAULT 0,
    rewards DECIMAL(15,2) DEFAULT 0,
    apy DECIMAL(5,2) DEFAULT 12.5,
    last_reward_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES hackathon_schema.users(id) ON DELETE CASCADE
);

-- 质押表索引
CREATE INDEX idx_staking_user_id ON hackathon_schema.staking(user_id);
CREATE INDEX idx_staking_staked_amount ON hackathon_schema.staking(staked_amount);
CREATE INDEX idx_staking_rewards ON hackathon_schema.staking(rewards);
CREATE INDEX idx_staking_created_at ON hackathon_schema.staking(created_at);

-- ========================================
-- 质押交易表 (staking_transactions)
-- ========================================
CREATE TABLE hackathon_schema.staking_transactions (
    id VARCHAR(25) PRIMARY KEY,
    staking_id VARCHAR(25) NOT NULL,
    user_id VARCHAR(25) NOT NULL,
    type VARCHAR(20) NOT NULL, -- stake, unstake, claim_rewards
    amount DECIMAL(15,2) NOT NULL,
    tx_hash TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (staking_id) REFERENCES hackathon_schema.staking(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES hackathon_schema.users(id) ON DELETE CASCADE
);

-- 质押交易表索引
CREATE INDEX idx_staking_transactions_staking_id ON hackathon_schema.staking_transactions(staking_id);
CREATE INDEX idx_staking_transactions_user_id ON hackathon_schema.staking_transactions(user_id);
CREATE INDEX idx_staking_transactions_type ON hackathon_schema.staking_transactions(type);
CREATE INDEX idx_staking_transactions_status ON hackathon_schema.staking_transactions(status);
CREATE INDEX idx_staking_transactions_created_at ON hackathon_schema.staking_transactions(created_at);

-- ========================================
-- 更新时间触发器函数
-- ========================================
CREATE OR REPLACE FUNCTION hackathon_schema.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要自动更新updated_at的表创建触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON hackathon_schema.users FOR EACH ROW EXECUTE FUNCTION hackathon_schema.update_updated_at_column();
CREATE TRIGGER update_hackathons_updated_at BEFORE UPDATE ON hackathon_schema.hackathons FOR EACH ROW EXECUTE FUNCTION hackathon_schema.update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON hackathon_schema.teams FOR EACH ROW EXECUTE FUNCTION hackathon_schema.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON hackathon_schema.projects FOR EACH ROW EXECUTE FUNCTION hackathon_schema.update_updated_at_column();
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON hackathon_schema.community_posts FOR EACH ROW EXECUTE FUNCTION hackathon_schema.update_updated_at_column();
CREATE TRIGGER update_community_replies_updated_at BEFORE UPDATE ON hackathon_schema.community_replies FOR EACH ROW EXECUTE FUNCTION hackathon_schema.update_updated_at_column();
CREATE TRIGGER update_dao_proposals_updated_at BEFORE UPDATE ON hackathon_schema.dao_proposals FOR EACH ROW EXECUTE FUNCTION hackathon_schema.update_updated_at_column();
CREATE TRIGGER update_nfts_updated_at BEFORE UPDATE ON hackathon_schema.nfts FOR EACH ROW EXECUTE FUNCTION hackathon_schema.update_updated_at_column();
CREATE TRIGGER update_staking_updated_at BEFORE UPDATE ON hackathon_schema.staking FOR EACH ROW EXECUTE FUNCTION hackathon_schema.update_updated_at_column();

-- ========================================
-- 视图定义
-- ========================================

-- 黑客松统计视图
CREATE VIEW hackathon_schema.hackathon_stats AS
SELECT 
    h.id,
    h.title,
    h.start_date,
    h.end_date,
    h.max_participants,
    COUNT(DISTINCT p.user_id) as participant_count,
    COUNT(DISTINCT pr.id) as project_count,
    COUNT(DISTINCT t.id) as team_count
FROM hackathon_schema.hackathons h
LEFT JOIN hackathon_schema.participations p ON h.id = p.hackathon_id
LEFT JOIN hackathon_schema.projects pr ON h.id = pr.hackathon_id
LEFT JOIN hackathon_schema.teams t ON h.id = t.hackathon_id
GROUP BY h.id, h.title, h.start_date, h.end_date, h.max_participants;

-- 用户活跃度视图
CREATE VIEW hackathon_schema.user_activity AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.role,
    u.status,
    COUNT(DISTINCT p.hackathon_id) as hackathons_joined,
    COUNT(DISTINCT pr.id) as projects_created,
    COUNT(DISTINCT tm.team_id) as teams_joined,
    u.reputation_score
FROM hackathon_schema.users u
LEFT JOIN hackathon_schema.participations p ON u.id = p.user_id
LEFT JOIN hackathon_schema.projects pr ON u.id = pr.creator_id
LEFT JOIN hackathon_schema.team_members tm ON u.id = tm.user_id
GROUP BY u.id, u.username, u.email, u.role, u.status, u.reputation_score;

-- Web3统计视图
CREATE VIEW hackathon_schema.web3_stats AS
SELECT 
    COUNT(DISTINCT s.user_id) as total_stakers,
    COALESCE(SUM(s.staked_amount), 0) as total_staked_amount,
    COALESCE(SUM(s.rewards), 0) as total_rewards,
    COUNT(DISTINCT n.owner_id) as total_nft_owners,
    COUNT(DISTINCT n.id) as total_nfts,
    COUNT(DISTINCT dp.creator_id) as total_proposal_creators,
    COUNT(DISTINCT dp.id) as total_proposals
FROM hackathon_schema.staking s
FULL OUTER JOIN hackathon_schema.nfts n ON s.user_id = n.owner_id
FULL OUTER JOIN hackathon_schema.dao_proposals dp ON s.user_id = dp.creator_id;

-- ========================================
-- 示例数据插入
-- ========================================

-- 插入示例用户
INSERT INTO hackathon_schema.users (id, email, username, password, wallet_address, bio, reputation_score, role, email_verified) VALUES
('clx1234567890abcdef', 'admin@hackx.com', 'admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK2', '0x1234567890123456789012345678901234567890', 'HackX平台管理员，专注于区块链和Web3技术', 100, 'admin', true),
('clx1234567890abcdef1', 'alice@example.com', 'alice_dev', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK2', '0x2345678901234567890123456789012345678901', '全栈开发者，热爱开源项目', 85, 'user', true),
('clx1234567890abcdef2', 'bob@example.com', 'bob_web3', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK2', '0x3456789012345678901234567890123456789012', 'Web3开发者，专注于DeFi和NFT项目', 92, 'user', true);

-- 插入示例黑客松
INSERT INTO hackathon_schema.hackathons (id, title, description, start_date, end_date, registration_deadline, max_participants, prize_pool, categories, tags, organizer_id, is_public, featured) VALUES
('clx1234567890abcdef3', 'Web3 创新黑客松 2024', '探索Web3技术的无限可能，构建下一代去中心化应用。', '2024-03-15 09:00:00+00', '2024-03-17 18:00:00+00', '2024-03-10 23:59:59+00', 200, 50000.00, '["DeFi", "NFT", "DAO", "GameFi"]', '["Web3", "区块链", "智能合约", "去中心化"]', 'clx1234567890abcdef', true, true),
('clx1234567890abcdef4', 'AI + 区块链融合挑战赛', '将人工智能与区块链技术相结合，创造具有实际应用价值的创新项目。', '2024-04-20 09:00:00+00', '2024-04-22 18:00:00+00', '2024-04-15 23:59:59+00', 150, 30000.00, '["AI", "区块链", "机器学习", "数据科学"]', '["人工智能", "机器学习", "区块链", "数据隐私"]', 'clx1234567890abcdef', true, true);

-- 插入示例参与记录
INSERT INTO hackathon_schema.participations (id, hackathon_id, user_id, status) VALUES
('clx1234567890abcdef5', 'clx1234567890abcdef3', 'clx1234567890abcdef1', 'registered'),
('clx1234567890abcdef6', 'clx1234567890abcdef3', 'clx1234567890abcdef2', 'registered'),
('clx1234567890abcdef7', 'clx1234567890abcdef4', 'clx1234567890abcdef1', 'registered');

-- 插入示例团队
INSERT INTO hackathon_schema.teams (id, name, description, hackathon_id, leader_id, max_members, skills, tags) VALUES
('clx1234567890abcdef8', 'Web3 Warriors', '专注于Web3技术开发的精英团队，拥有丰富的DeFi和NFT项目经验。', 'clx1234567890abcdef3', 'clx1234567890abcdef1', 5, '["Solidity", "React", "Node.js", "Web3.js"]', '["DeFi", "NFT", "前端开发", "智能合约"]'),
('clx1234567890abcdef9', 'AI Blockchain Pioneers', '探索AI与区块链融合的前沿团队，致力于构建智能化的去中心化应用。', 'clx1234567890abcdef4', 'clx1234567890abcdef2', 4, '["Python", "TensorFlow", "Solidity", "Machine Learning"]', '["AI", "区块链", "机器学习", "数据科学"]');

-- 插入示例团队成员
INSERT INTO hackathon_schema.team_members (id, team_id, user_id, role) VALUES
('clx1234567890abcdef10', 'clx1234567890abcdef8', 'clx1234567890abcdef1', 'leader'),
('clx1234567890abcdef11', 'clx1234567890abcdef8', 'clx1234567890abcdef2', 'member'),
('clx1234567890abcdef12', 'clx1234567890abcdef9', 'clx1234567890abcdef2', 'leader'),
('clx1234567890abcdef13', 'clx1234567890abcdef9', 'clx1234567890abcdef1', 'member');

-- 插入示例项目
INSERT INTO hackathon_schema.projects (id, title, description, hackathon_id, team_id, creator_id, technologies, tags, github_url, demo_url, status, is_public) VALUES
('clx1234567890abcdef14', 'DeFi Yield Optimizer', '一个智能的DeFi收益优化平台，自动分析各种DeFi协议的风险和收益，为用户提供最优的投资策略。', 'clx1234567890abcdef3', 'clx1234567890abcdef8', 'clx1234567890abcdef1', '["Solidity", "React", "Node.js", "Web3.js"]', '["DeFi", "收益优化", "智能合约", "风险管理"]', 'https://github.com/example/defi-yield-optimizer', 'https://demo.example.com/defi-yield-optimizer', 'submitted', true),
('clx1234567890abcdef15', 'AI-Powered NFT Marketplace', '基于AI技术的NFT交易平台，提供智能推荐、价格预测和内容审核功能。', 'clx1234567890abcdef4', 'clx1234567890abcdef9', 'clx1234567890abcdef2', '["Python", "TensorFlow", "Solidity", "React"]', '["AI", "NFT", "机器学习", "推荐系统"]', 'https://github.com/example/ai-nft-marketplace', 'https://demo.example.com/ai-nft-marketplace', 'submitted', true);

-- 插入示例质押数据
INSERT INTO hackathon_schema.staking (id, user_id, staked_amount, rewards, apy) VALUES
('clx1234567890abcdef16', 'clx1234567890abcdef1', 5000.00, 125.00, 12.5),
('clx1234567890abcdef17', 'clx1234567890abcdef2', 3000.00, 75.00, 12.5);

-- 插入示例NFT
INSERT INTO hackathon_schema.nfts (id, token_id, name, description, image_url, category, owner_id, metadata) VALUES
('clx1234567890abcdef18', 1, 'HackX 冠军证书', 'Web3 创新黑客松 2024 冠军证书', 'https://example.com/certificate1.png', 'certificate', 'clx1234567890abcdef1', '{"rank": 1, "hackathon": "Web3 创新黑客松 2024", "prize": 10000}'),
('clx1234567890abcdef19', 2, 'AI 创新成就', 'AI + 区块链融合挑战赛 亚军证书', 'https://example.com/certificate2.png', 'achievement', 'clx1234567890abcdef2', '{"rank": 2, "hackathon": "AI + 区块链融合挑战赛", "prize": 5000}');

-- 插入示例DAO提案
INSERT INTO hackathon_schema.dao_proposals (id, title, description, proposal_type, target_amount, execution_time, status, creator_id) VALUES
('clx1234567890abcdef20', '增加平台质押奖励', '建议将平台质押APY从12.5%提升到15%，以吸引更多用户参与质押。', 'governance', 50000.00, '2024-06-01 00:00:00+00', 'active', 'clx1234567890abcdef1'),
('clx1234567890abcdef21', '开发移动端应用', '为HackX平台开发移动端应用，提升用户体验和参与度。', 'technical', 100000.00, '2024-07-01 00:00:00+00', 'active', 'clx1234567890abcdef2');

-- ========================================
-- 数据库权限设置
-- ========================================

-- 给 hackathon 用户授予模式权限
GRANT ALL ON SCHEMA hackathon_schema TO hackathon;
ALTER SCHEMA hackathon_schema OWNER TO hackathon;

-- 设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA hackathon_schema GRANT ALL ON TABLES TO hackathon;
ALTER DEFAULT PRIVILEGES IN SCHEMA hackathon_schema GRANT ALL ON SEQUENCES TO hackathon;
ALTER DEFAULT PRIVILEGES IN SCHEMA hackathon_schema GRANT ALL ON FUNCTIONS TO hackathon;

-- ========================================
-- 数据库维护脚本
-- ========================================

-- 清理过期通知（保留30天）
-- DELETE FROM hackathon_schema.notifications WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';

-- 更新用户声誉分数
-- UPDATE hackathon_schema.users SET reputation_score = (
--     SELECT COALESCE(SUM(total_score), 0) 
--     FROM hackathon_schema.scores s 
--     JOIN hackathon_schema.projects p ON s.project_id = p.id 
--     WHERE p.creator_id = hackathon_schema.users.id
-- );

-- 统计信息查询
-- SELECT 
--     (SELECT COUNT(*) FROM hackathon_schema.users) as total_users,
--     (SELECT COUNT(*) FROM hackathon_schema.hackathons) as total_hackathons,
--     (SELECT COUNT(*) FROM hackathon_schema.projects) as total_projects,
--     (SELECT COUNT(*) FROM hackathon_schema.teams) as total_teams,
--     (SELECT COUNT(*) FROM hackathon_schema.staking) as total_stakers,
--     (SELECT COUNT(*) FROM hackathon_schema.nfts) as total_nfts,
--     (SELECT COUNT(*) FROM hackathon_schema.dao_proposals) as total_proposals; 