-- V35__Expand_Achievement_Tiers.sql
-- Expand gamification achievements to 64 total with progressive tiers
-- Provides 25+ achievements for both donors and receivers

-- Remove old achievements to prevent conflicts
DELETE FROM achievements WHERE id > 0;

-- Reset sequence (PostgreSQL syntax)
ALTER SEQUENCE achievements_id_seq RESTART WITH 1;

-- ============================================================================
-- DONOR ACHIEVEMENTS (27 total)
-- ============================================================================

-- DONATION_COUNT Achievements (13 tiers)
INSERT INTO achievements (name, description, icon_name, points_value, category, criteria_type, criteria_value, rarity, is_active) VALUES
('First Steps', 'Create your first surplus food donation', 'first_donation', 10, 'BEGINNER', 'DONATION_COUNT', 1, 'COMMON', true),
('Generous Starter', 'Create 5 successful food donations', 'generous_starter', 25, 'DONATION', 'DONATION_COUNT', 5, 'COMMON', true),
('Food Hero', 'Create 10 successful food donations', 'food_hero', 50, 'DONATION', 'DONATION_COUNT', 10, 'COMMON', true),
('Dedicated Donor', 'Create 20 successful food donations', 'dedicated_donor', 75, 'DONATION', 'DONATION_COUNT', 20, 'RARE', true),
('Community Champion', 'Create 50 successful food donations', 'community_champion', 150, 'DONATION', 'DONATION_COUNT', 50, 'RARE', true),
('Century Donor', 'Create 100 successful food donations', 'century_donor', 300, 'DONATION', 'DONATION_COUNT', 100, 'EPIC', true),
('Unstoppable Force', 'Create 150 successful food donations', 'unstoppable_force', 500, 'DONATION', 'DONATION_COUNT', 150, 'EPIC', true),
('Donation Master', 'Create 200 successful food donations', 'donation_master', 750, 'DONATION', 'DONATION_COUNT', 200, 'EPIC', true),
('Elite Contributor', 'Create 300 successful food donations', 'elite_contributor', 1000, 'DONATION', 'DONATION_COUNT', 300, 'LEGENDARY', true),
('Legendary Donor', 'Create 500 successful food donations', 'legendary_donor', 1500, 'DONATION', 'DONATION_COUNT', 500, 'LEGENDARY', true),
('Donation Titan', 'Create 750 successful food donations', 'donation_titan', 2000, 'DONATION', 'DONATION_COUNT', 750, 'LEGENDARY', true),
('Thousand Strong', 'Create 1000 successful food donations', 'thousand_strong', 3000, 'DONATION', 'DONATION_COUNT', 1000, 'LEGENDARY', true),
('Ultimate Benefactor', 'Create 1500 successful food donations', 'ultimate_benefactor', 5000, 'DONATION', 'DONATION_COUNT', 1500, 'LEGENDARY', true);

-- WEEKLY_STREAK Achievements (7 tiers)
INSERT INTO achievements (name, description, icon_name, points_value, category, criteria_type, criteria_value, rarity, is_active) VALUES
('Steady Start', 'Donate at least once per week for 2 consecutive weeks', 'steady_start', 20, 'DONATION', 'WEEKLY_STREAK', 2, 'COMMON', true),
('Monthly Commitment', 'Donate at least once per week for 4 consecutive weeks', 'monthly_commitment', 50, 'DONATION', 'WEEKLY_STREAK', 4, 'COMMON', true),
('Two Month Streak', 'Donate at least once per week for 8 consecutive weeks', 'two_month_streak', 100, 'DONATION', 'WEEKLY_STREAK', 8, 'RARE', true),
('Quarterly Dedication', 'Donate at least once per week for 12 consecutive weeks', 'quarterly_dedication', 200, 'DONATION', 'WEEKLY_STREAK', 12, 'RARE', true),
('Half Year Hero', 'Donate at least once per week for 26 consecutive weeks', 'half_year_hero', 500, 'DONATION', 'WEEKLY_STREAK', 26, 'EPIC', true),
('Year-Round Giver', 'Donate at least once per week for 52 consecutive weeks', 'year_round_giver', 1000, 'DONATION', 'WEEKLY_STREAK', 52, 'LEGENDARY', true),
('Two Year Legend', 'Donate at least once per week for 104 consecutive weeks', 'two_year_legend', 2500, 'DONATION', 'WEEKLY_STREAK', 104, 'LEGENDARY', true);

-- ============================================================================
-- RECEIVER ACHIEVEMENTS (29 total)
-- ============================================================================

-- CLAIM_COUNT Achievements (13 tiers)
INSERT INTO achievements (name, description, icon_name, points_value, category, criteria_type, criteria_value, rarity, is_active) VALUES
('Welcome Aboard', 'Complete your first food claim', 'first_claim', 10, 'BEGINNER', 'CLAIM_COUNT', 1, 'COMMON', true),
('Claiming Starter', 'Complete 5 food claims', 'claiming_starter', 25, 'CLAIMING', 'CLAIM_COUNT', 5, 'COMMON', true),
('Active Claimer', 'Complete 10 food claims', 'active_claimer', 50, 'CLAIMING', 'CLAIM_COUNT', 10, 'COMMON', true),
('Dedicated Receiver', 'Complete 20 food claims', 'dedicated_receiver', 75, 'CLAIMING', 'CLAIM_COUNT', 20, 'RARE', true),
('Community Partner', 'Complete 50 food claims', 'community_partner', 150, 'CLAIMING', 'CLAIM_COUNT', 50, 'RARE', true),
('Century Claimer', 'Complete 100 food claims', 'century_claimer', 300, 'CLAIMING', 'CLAIM_COUNT', 100, 'EPIC', true),
('Relentless Rescuer', 'Complete 150 food claims', 'relentless_rescuer', 500, 'CLAIMING', 'CLAIM_COUNT', 150, 'EPIC', true),
('Claiming Master', 'Complete 200 food claims', 'claiming_master', 750, 'CLAIMING', 'CLAIM_COUNT', 200, 'EPIC', true),
('Elite Receiver', 'Complete 300 food claims', 'elite_receiver', 1000, 'CLAIMING', 'CLAIM_COUNT', 300, 'LEGENDARY', true),
('Legendary Claimer', 'Complete 500 food claims', 'legendary_claimer', 1500, 'CLAIMING', 'CLAIM_COUNT', 500, 'LEGENDARY', true),
('Claiming Titan', 'Complete 750 food claims', 'claiming_titan', 2000, 'CLAIMING', 'CLAIM_COUNT', 750, 'LEGENDARY', true),
('Thousand Claims', 'Complete 1000 food claims', 'thousand_claims', 3000, 'CLAIMING', 'CLAIM_COUNT', 1000, 'LEGENDARY', true),
('Ultimate Rescuer', 'Complete 1500 food claims', 'ultimate_rescuer', 5000, 'CLAIMING', 'CLAIM_COUNT', 1500, 'LEGENDARY', true);

-- PICKUP_COUNT Achievements (9 tiers)
INSERT INTO achievements (name, description, icon_name, points_value, category, criteria_type, criteria_value, rarity, is_active) VALUES
('Mission Complete', 'Complete your first successful pickup', 'first_pickup', 15, 'BEGINNER', 'PICKUP_COUNT', 1, 'COMMON', true),
('Reliable Starter', 'Complete 5 successful pickups', 'reliable_starter', 30, 'CLAIMING', 'PICKUP_COUNT', 5, 'COMMON', true),
('Reliable Partner', 'Complete 10 successful pickups', 'reliable_partner', 75, 'CLAIMING', 'PICKUP_COUNT', 10, 'RARE', true),
('Pickup Pro', 'Complete 25 successful pickups', 'pickup_pro', 150, 'CLAIMING', 'PICKUP_COUNT', 25, 'RARE', true),
('Completion Expert', 'Complete 50 successful pickups', 'completion_expert', 300, 'CLAIMING', 'PICKUP_COUNT', 50, 'EPIC', true),
('Century Completist', 'Complete 100 successful pickups', 'century_completist', 600, 'CLAIMING', 'PICKUP_COUNT', 100, 'EPIC', true),
('Pickup Master', 'Complete 200 successful pickups', 'pickup_master', 1200, 'CLAIMING', 'PICKUP_COUNT', 200, 'LEGENDARY', true),
('Legendary Retriever', 'Complete 500 successful pickups', 'legendary_retriever', 2500, 'CLAIMING', 'PICKUP_COUNT', 500, 'LEGENDARY', true),
('Ultimate Completionist', 'Complete 1000 successful pickups', 'ultimate_completionist', 5000, 'CLAIMING', 'PICKUP_COUNT', 1000, 'LEGENDARY', true);

-- QUICK_CLAIM_COUNT Achievements (7 tiers)
INSERT INTO achievements (name, description, icon_name, points_value, category, criteria_type, criteria_value, rarity, is_active) VALUES
('Quick Responder', 'Claim food within 1 hour of posting for the first time', 'quick_responder', 15, 'CLAIMING', 'QUICK_CLAIM_COUNT', 1, 'COMMON', true),
('Early Bird', 'Claim food within 1 hour of posting 5 times', 'early_bird', 50, 'CLAIMING', 'QUICK_CLAIM_COUNT', 5, 'COMMON', true),
('Speed Claimer', 'Claim food within 1 hour of posting 10 times', 'speed_claimer', 100, 'CLAIMING', 'QUICK_CLAIM_COUNT', 10, 'RARE', true),
('Lightning Fast', 'Claim food within 1 hour of posting 25 times', 'lightning_fast', 200, 'CLAIMING', 'QUICK_CLAIM_COUNT', 25, 'RARE', true),
('Instant Rescuer', 'Claim food within 1 hour of posting 50 times', 'instant_rescuer', 400, 'CLAIMING', 'QUICK_CLAIM_COUNT', 50, 'EPIC', true),
('Quick Draw Champion', 'Claim food within 1 hour of posting 100 times', 'quick_draw_champion', 800, 'CLAIMING', 'QUICK_CLAIM_COUNT', 100, 'EPIC', true),
('Speed Demon', 'Claim food within 1 hour of posting 250 times', 'speed_demon', 1500, 'CLAIMING', 'QUICK_CLAIM_COUNT', 250, 'LEGENDARY', true);

-- ============================================================================
-- SOCIAL ACHIEVEMENTS (Shared by Both Roles - 8 total)
-- ============================================================================

-- MESSAGE_COUNT Achievements (7 tiers)
INSERT INTO achievements (name, description, icon_name, points_value, category, criteria_type, criteria_value, rarity, is_active) VALUES
('Chatty Starter', 'Send 10 messages in donation conversations', 'chatty_starter', 10, 'SOCIAL', 'MESSAGE_COUNT', 10, 'COMMON', true),
('Conversationalist', 'Send 50 messages in donation conversations', 'conversationalist', 25, 'SOCIAL', 'MESSAGE_COUNT', 50, 'COMMON', true),
('Active Communicator', 'Send 100 messages in donation conversations', 'active_communicator', 50, 'SOCIAL', 'MESSAGE_COUNT', 100, 'RARE', true),
('Communication Expert', 'Send 250 messages in donation conversations', 'communication_expert', 100, 'SOCIAL', 'MESSAGE_COUNT', 250, 'RARE', true),
('Message Master', 'Send 500 messages in donation conversations', 'message_master', 200, 'SOCIAL', 'MESSAGE_COUNT', 500, 'EPIC', true),
('Communication Guru', 'Send 1000 messages in donation conversations', 'communication_guru', 400, 'SOCIAL', 'MESSAGE_COUNT', 1000, 'EPIC', true),
('Ultimate Networker', 'Send 2500 messages in donation conversations', 'ultimate_networker', 1000, 'SOCIAL', 'MESSAGE_COUNT', 2500, 'LEGENDARY', true);

-- UNIQUE_PARTNER_COUNT Achievements (8 tiers)
INSERT INTO achievements (name, description, icon_name, points_value, category, criteria_type, criteria_value, rarity, is_active) VALUES
('Making Connections', 'Successfully interact with 2 different organizations', 'making_connections', 15, 'SOCIAL', 'UNIQUE_PARTNER_COUNT', 2, 'COMMON', true),
('Community Builder', 'Successfully interact with 5 different organizations', 'community_builder', 50, 'SOCIAL', 'UNIQUE_PARTNER_COUNT', 5, 'COMMON', true),
('Network Grower', 'Successfully interact with 10 different organizations', 'network_grower', 100, 'SOCIAL', 'UNIQUE_PARTNER_COUNT', 10, 'RARE', true),
('Relationship Expert', 'Successfully interact with 20 different organizations', 'relationship_expert', 200, 'SOCIAL', 'UNIQUE_PARTNER_COUNT', 20, 'RARE', true),
('Community Leader', 'Successfully interact with 50 different organizations', 'community_leader', 500, 'SOCIAL', 'UNIQUE_PARTNER_COUNT', 50, 'EPIC', true),
('Connection Master', 'Successfully interact with 100 different organizations', 'connection_master', 1000, 'SOCIAL', 'UNIQUE_PARTNER_COUNT', 100, 'EPIC', true),
('Network Titan', 'Successfully interact with 200 different organizations', 'network_titan', 2000, 'SOCIAL', 'UNIQUE_PARTNER_COUNT', 200, 'LEGENDARY', true),
('Ultimate Connector', 'Successfully interact with 500 different organizations', 'ultimate_connector', 5000, 'SOCIAL', 'UNIQUE_PARTNER_COUNT', 500, 'LEGENDARY', true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify total achievement count
SELECT COUNT(*) as total_achievements FROM achievements;

-- Verify achievements by criteria type
SELECT 
    criteria_type, 
    COUNT(*) as count,
    SUM(CASE WHEN rarity = 'COMMON' THEN 1 ELSE 0 END) as common,
    SUM(CASE WHEN rarity = 'RARE' THEN 1 ELSE 0 END) as rare,
    SUM(CASE WHEN rarity = 'EPIC' THEN 1 ELSE 0 END) as epic,
    SUM(CASE WHEN rarity = 'LEGENDARY' THEN 1 ELSE 0 END) as legendary
FROM achievements 
GROUP BY criteria_type 
ORDER BY criteria_type;

-- Verify achievements by category
SELECT 
    category,
    COUNT(*) as count
FROM achievements 
GROUP BY category 
ORDER BY category;
