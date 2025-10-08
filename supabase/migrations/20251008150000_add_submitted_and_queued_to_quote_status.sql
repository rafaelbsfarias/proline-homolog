-- Add submitted and queued statuses to the quote_status enum for parallel/sequential delegation logic

ALTER TYPE public.quote_status ADD VALUE IF NOT EXISTS 'submitted';
ALTER TYPE public.quote_status ADD VALUE IF NOT EXISTS 'queued';
