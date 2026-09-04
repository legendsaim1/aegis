-- Add JSON column to cache AI topic recommendations
ALTER TABLE exams ADD COLUMN IF NOT EXISTS ai_topic_insights jsonb DEFAULT NULL;
