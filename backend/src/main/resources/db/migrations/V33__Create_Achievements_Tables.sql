-- V31__Create_Achievements_Tables.sql
-- Create achievements and user_achievements tables for gamification system

-- Add total_points column to users table
ALTER TABLE users 
ADD COLUMN total_points INTEGER NOT NULL DEFAULT 0;

-- Create index on total_points for leaderboard queries
CREATE INDEX idx_users_total_points ON users(total_points DESC);

-- Create achievements table
CREATE TABLE achievements (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon_name VARCHAR(50) NOT NULL,
    points_value INTEGER NOT NULL CHECK (points_value >= 0),
    category VARCHAR(50) NOT NULL,
    criteria_type VARCHAR(50) NOT NULL,
    criteria_value INTEGER NOT NULL CHECK (criteria_value > 0),
    rarity VARCHAR(20) DEFAULT 'COMMON',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for achievements
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_is_active ON achievements(is_active);

-- Create user_achievements junction table
CREATE TABLE user_achievements (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    achievement_id BIGINT NOT NULL,
    earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notified BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_user_achievement_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_user_achievement_achievement 
        FOREIGN KEY (achievement_id) 
        REFERENCES achievements(id) 
        ON DELETE CASCADE,
    CONSTRAINT uk_user_achievement 
        UNIQUE (user_id, achievement_id)
);

-- Create indexes for user_achievements
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_earned_at ON user_achievements(earned_at DESC);
CREATE INDEX idx_user_achievements_notified ON user_achievements(notified) WHERE notified = FALSE;

-- Add comments for documentation
COMMENT ON TABLE achievements IS 'Defines all available achievements/badges in the gamification system';
COMMENT ON TABLE user_achievements IS 'Tracks which users have earned which achievements';
COMMENT ON COLUMN users.total_points IS 'Cumulative points earned by user through platform activities';
COMMENT ON COLUMN achievements.criteria_type IS 'Type of criteria: DONATION_COUNT, CLAIM_COUNT, PICKUP_COUNT, etc.';
COMMENT ON COLUMN achievements.criteria_value IS 'Threshold value to unlock achievement';
