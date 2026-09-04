-- Migration: 004_add_original_filename.sql
-- Reason: The storage bucket saves files with a unique timestamp-based name
-- (e.g. roll123_1720567890123.pdf) to prevent collisions. However, the
-- original filename that the teacher uploaded is lost. This column preserves
-- it so the frontend can display the human-readable name the teacher chose
-- (e.g. "Ali_Khan_Physics.pdf") instead of the internal storage path.

ALTER TABLE students ADD COLUMN original_filename text;
