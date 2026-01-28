-- V32__Seed_Initial_Achievements.sql
-- Seed initial 10 achievements for gamification system

INSERT INTO achievements (name, description, icon_name, points_value, category, criteria_type, criteria_value, rarity) VALUES
-- Beginner Achievements (COMMON)
('First Steps', 'Create your first surplus food donation', 'first_donation', 10, 'BEGINNER', 'DONATION_COUNT', 1, 'COMMON'),
('Welcome Aboard', 'Complete your first food claim', 'first_claim', 10, 'BEGINNER', 'CLAIM_COUNT', 1, 'COMMON'),
('Mission Complete', 'Complete your first successful pickup', 'first_pickup', 15, 'BEGINNER', 'PICKUP_COUNT', 1, 'COMMON'),

-- Donor Achievements
('Generous Giver', 'Create 5 successful food donations', 'generous_donor', 50, 'DONATION', 'DONATION_COUNT', 5, 'RARE'),
('Food Hero', 'Create 10 successful food donations', 'food_hero', 100, 'DONATION', 'DONATION_COUNT', 10, 'EPIC'),
('Consistency Champion', 'Donate at least once per week for 4 consecutive weeks', 'consistency', 150, 'DONATION', 'WEEKLY_STREAK', 4, 'EPIC'),

-- Receiver Achievements
('Reliable Partner', 'Complete 10 successful pickups', 'reliable_receiver', 75, 'CLAIMING', 'PICKUP_COUNT', 10, 'RARE'),
('Early Bird', 'Claim food within 1 hour of posting 5 times', 'early_bird', 50, 'CLAIMING', 'QUICK_CLAIM_COUNT', 5, 'RARE'),

-- Social Achievements
('Conversationalist', 'Send 50 messages in donation conversations', 'conversationalist', 25, 'SOCIAL', 'MESSAGE_COUNT', 50, 'COMMON'),
('Community Builder', 'Successfully interact with 5 different organizations', 'community', 100, 'SOCIAL', 'UNIQUE_PARTNER_COUNT', 5, 'EPIC');

-- Verify seed data
SELECT COUNT(*) as total_achievements FROM achievements;
