-- Add AI summary column to matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS ai_summary text;
