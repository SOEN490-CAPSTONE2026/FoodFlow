ALTER TABLE user_donation_stats ADD COLUMN show_badge_publicly BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_donation_stats ADD COLUMN show_donation_history BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE user_donation_stats ADD COLUMN show_on_leaderboard BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_donation_stats ADD COLUMN anonymous_by_default BOOLEAN NOT NULL DEFAULT false;
