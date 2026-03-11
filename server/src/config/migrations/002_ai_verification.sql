-- AI Verification columns for topic_hour_reports
-- Tracks AI verification results for each submitted hour report

-- Add AI verification fields
ALTER TABLE topic_hour_reports ADD COLUMN IF NOT EXISTS ai_verified BOOLEAN DEFAULT false;
ALTER TABLE topic_hour_reports ADD COLUMN IF NOT EXISTS ai_score INTEGER;
ALTER TABLE topic_hour_reports ADD COLUMN IF NOT EXISTS ai_flagged BOOLEAN DEFAULT false;
ALTER TABLE topic_hour_reports ADD COLUMN IF NOT EXISTS ai_low_confidence BOOLEAN DEFAULT false;
ALTER TABLE topic_hour_reports ADD COLUMN IF NOT EXISTS ai_reason TEXT;
ALTER TABLE topic_hour_reports ADD COLUMN IF NOT EXISTS ai_layer_scores JSONB;
ALTER TABLE topic_hour_reports ADD COLUMN IF NOT EXISTS staff_confirmed_flag BOOLEAN DEFAULT false;
ALTER TABLE topic_hour_reports ADD COLUMN IF NOT EXISTS ai_manually_reviewed BOOLEAN DEFAULT false;

-- Add teaching aids and methods columns
ALTER TABLE topic_hour_reports ADD COLUMN IF NOT EXISTS teaching_aids TEXT;
ALTER TABLE topic_hour_reports ADD COLUMN IF NOT EXISTS teaching_methods TEXT;

-- Index for fast filtering by AI status
CREATE INDEX IF NOT EXISTS idx_thr_ai_flagged ON topic_hour_reports(ai_flagged) WHERE ai_flagged = true;
CREATE INDEX IF NOT EXISTS idx_thr_ai_low_confidence ON topic_hour_reports(ai_low_confidence) WHERE ai_low_confidence = true;
CREATE INDEX IF NOT EXISTS idx_thr_ai_verified ON topic_hour_reports(ai_verified);
CREATE INDEX IF NOT EXISTS idx_thr_ai_score ON topic_hour_reports(ai_score);
