ALTER TABLE answers ADD COLUMN key_points_covered jsonb DEFAULT '[]'::jsonb;
ALTER TABLE answers ADD COLUMN key_points_missed jsonb DEFAULT '[]'::jsonb;
