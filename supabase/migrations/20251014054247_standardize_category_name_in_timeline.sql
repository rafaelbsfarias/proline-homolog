-- Migration: standardize_category_name_in_timeline
-- Purpose: Fix inconsistent category naming in vehicle_history timeline
-- Issue: Category appears as both "Pintura/Funilaria" and "Funilaria/Pintura"
-- Solution: Standardize all occurrences to "Funilaria/Pintura" (matches service_categories.name)

-- Update all occurrences of "Pintura/Funilaria" to "Funilaria/Pintura"
UPDATE vehicle_history
SET status = REPLACE(status, 'Pintura/Funilaria', 'Funilaria/Pintura')
WHERE status LIKE '%Pintura/Funilaria%';

-- Update partner_service column as well
UPDATE vehicle_history
SET partner_service = 'Funilaria/Pintura'
WHERE partner_service = 'Pintura/Funilaria';

-- Add a comment explaining the standardization
COMMENT ON TABLE vehicle_history IS 'Vehicle status history timeline. Category names must match service_categories.name exactly (e.g., "Funilaria/Pintura" not "Pintura/Funilaria").';
