-- Paimon Bond Oracle Database Schema
-- PostgreSQL Schema for Social Task Verification

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Task Completions Table
CREATE TABLE task_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id INTEGER NOT NULL,
    task_id VARCHAR(64) NOT NULL,
    user_address VARCHAR(42) NOT NULL,
    task_type VARCHAR(32) NOT NULL CHECK (task_type IN ('TWITTER_FOLLOW', 'TWITTER_RETWEET', 'TWITTER_LIKE', 'TWITTER_MENTION', 'DISCORD_JOIN', 'DISCORD_ROLE', 'DISCORD_MESSAGE', 'REFERRAL')),
    proof_data JSONB NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    signature VARCHAR(132),
    nonce INTEGER NOT NULL,
    verified BOOLEAN DEFAULT TRUE,

    UNIQUE(token_id, task_id),
    INDEX idx_token_id (token_id),
    INDEX idx_user_address (user_address),
    INDEX idx_task_type (task_type),
    INDEX idx_completed_at (completed_at)
);

-- Referral Codes Table
CREATE TABLE referral_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(16) UNIQUE NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    token_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,

    INDEX idx_code (code),
    INDEX idx_owner_address (owner_address)
);

-- Referral Clicks Table (for analytics)
CREATE TABLE referral_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_code VARCHAR(16) NOT NULL REFERENCES referral_codes(code),
    ip_address VARCHAR(45),
    user_agent TEXT,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    converted BOOLEAN DEFAULT FALSE,
    converted_at TIMESTAMP WITH TIME ZONE,

    INDEX idx_referral_code (referral_code),
    INDEX idx_clicked_at (clicked_at)
);

-- Twitter Verifications Table
CREATE TABLE twitter_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id INTEGER NOT NULL,
    twitter_user_id VARCHAR(32) NOT NULL,
    twitter_username VARCHAR(64) NOT NULL,
    verification_type VARCHAR(32) NOT NULL CHECK (verification_type IN ('FOLLOW', 'RETWEET', 'LIKE', 'MENTION')),
    target_tweet_id VARCHAR(32),
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    INDEX idx_token_id (token_id),
    INDEX idx_twitter_user_id (twitter_user_id)
);

-- Discord Verifications Table
CREATE TABLE discord_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id INTEGER NOT NULL,
    discord_user_id VARCHAR(32) NOT NULL,
    discord_username VARCHAR(64) NOT NULL,
    verification_type VARCHAR(32) NOT NULL CHECK (verification_type IN ('JOIN', 'ROLE', 'MESSAGE')),
    guild_id VARCHAR(32),
    role_id VARCHAR(32),
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    INDEX idx_token_id (token_id),
    INDEX idx_discord_user_id (discord_user_id)
);

-- API Rate Limiting Table
CREATE TABLE api_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address VARCHAR(45) NOT NULL,
    endpoint VARCHAR(128) NOT NULL,
    requests_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(ip_address, endpoint),
    INDEX idx_window_start (window_start)
);

-- Oracle Signatures Log (for audit trail)
CREATE TABLE oracle_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id INTEGER NOT NULL,
    task_id VARCHAR(64) NOT NULL,
    message_hash VARCHAR(66) NOT NULL,
    signature VARCHAR(132) NOT NULL,
    nonce INTEGER NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    INDEX idx_token_id (token_id),
    INDEX idx_signed_at (signed_at)
);

-- Create views for analytics
CREATE VIEW task_completion_stats AS
SELECT
    task_type,
    COUNT(*) as total_completions,
    COUNT(DISTINCT user_address) as unique_users,
    DATE(completed_at) as completion_date
FROM task_completions
GROUP BY task_type, DATE(completed_at);

CREATE VIEW referral_leaderboard AS
SELECT
    r.owner_address,
    r.code,
    r.clicks,
    r.conversions,
    ROUND(CAST(r.conversions AS DECIMAL) / NULLIF(r.clicks, 0) * 100, 2) as conversion_rate
FROM referral_codes r
ORDER BY r.conversions DESC, r.clicks DESC
LIMIT 100;

-- Cleanup old rate limit records (for scheduled job)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits() RETURNS void AS $$
BEGIN
    DELETE FROM api_rate_limits
    WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
