ALTER TYPE public.quote_status ADD VALUE IF NOT EXISTS 'pending_admin_approval';
ALTER TYPE public.quote_status ADD VALUE IF NOT EXISTS 'queued';
