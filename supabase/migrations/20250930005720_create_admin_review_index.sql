-- Create index for admin review queries (separated from enum creation to avoid transaction issues)

-- Create index for better performance on admin review queries
CREATE INDEX IF NOT EXISTS idx_quotes_admin_review 
ON public.quotes(status, sent_to_admin_at) 
WHERE status = 'admin_review';

-- Create index for quotes sent to admin (regardless of current status)
CREATE INDEX IF NOT EXISTS idx_quotes_sent_to_admin 
ON public.quotes(sent_to_admin_at) 
WHERE sent_to_admin_at IS NOT NULL;
