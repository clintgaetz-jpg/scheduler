-- Add prefer_wo_lines column to appointments table
-- This column stores the user's preference for viewing workorder lines vs appointment lines

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS prefer_wo_lines BOOLEAN DEFAULT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN appointments.prefer_wo_lines IS 'User preference: true = show workorder lines, false = show appointment lines, NULL = use default logic';

