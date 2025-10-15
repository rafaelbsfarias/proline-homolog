-- Fix service_role permissions for admins table
-- This is needed for database setup scripts that create test users

-- Grant permissions to service_role
GRANT ALL ON public.admins TO service_role;
GRANT ALL ON public.clients TO service_role;
GRANT ALL ON public.partners TO service_role;
GRANT ALL ON public.specialists TO service_role;

-- Also ensure service_role can use sequences if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'admins_id_seq') THEN
        GRANT USAGE, SELECT ON SEQUENCE public.admins_id_seq TO service_role;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'clients_id_seq') THEN
        GRANT USAGE, SELECT ON SEQUENCE public.clients_id_seq TO service_role;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'partners_id_seq') THEN
        GRANT USAGE, SELECT ON SEQUENCE public.partners_id_seq TO service_role;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'specialists_id_seq') THEN
        GRANT USAGE, SELECT ON SEQUENCE public.specialists_id_seq TO service_role;
    END IF;
END $$;

-- Add comment explaining why this is needed
COMMENT ON TABLE public.admins IS 'Admin users table. Service role has full access for setup scripts.';
COMMENT ON TABLE public.clients IS 'Client users table. Service role has full access for setup scripts.';
COMMENT ON TABLE public.partners IS 'Partner users table. Service role has full access for setup scripts.';
COMMENT ON TABLE public.specialists IS 'Specialist users table. Service role has full access for setup scripts.';
