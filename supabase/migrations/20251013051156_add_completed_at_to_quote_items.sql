-- Migration: Add completed_at to quote_items for tracking individual service completion
-- Context: Partner needs to mark individual services as completed
-- The vehicle status should only change to 'Finalizado' when ALL services are completed

-- 1. Add completed_at column to track when each service was completed
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'quote_items' 
        AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE public.quote_items 
        ADD COLUMN completed_at TIMESTAMPTZ;
        
        COMMENT ON COLUMN public.quote_items.completed_at IS 'Data e hora em que o serviço foi marcado como concluído pelo parceiro';
    END IF;
END $$;

-- 2. Create index for performance when checking if all services are completed
CREATE INDEX IF NOT EXISTS idx_quote_items_completed_at 
ON public.quote_items(quote_id, completed_at);

-- 3. Create function to check if all services in a quote are completed
CREATE OR REPLACE FUNCTION public.all_services_completed(p_quote_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_services integer;
    v_completed_services integer;
BEGIN
    -- Count total services
    SELECT COUNT(*) INTO v_total_services
    FROM quote_items
    WHERE quote_id = p_quote_id;
    
    -- Count completed services
    SELECT COUNT(*) INTO v_completed_services
    FROM quote_items
    WHERE quote_id = p_quote_id
    AND completed_at IS NOT NULL;
    
    -- Return true only if all services are completed
    RETURN v_total_services > 0 AND v_total_services = v_completed_services;
END;
$$;

COMMENT ON FUNCTION public.all_services_completed(uuid) IS 'Verifica se todos os serviços de um orçamento foram concluídos';
