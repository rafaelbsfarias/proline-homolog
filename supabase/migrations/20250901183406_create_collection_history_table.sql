-- Create collection history table for immutable records
-- This table stores finalized collection data that should never be modified

CREATE TABLE public.collection_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES public.vehicle_collections(id) ON DELETE CASCADE,
    collection_address TEXT NOT NULL,
    collection_fee_per_vehicle NUMERIC NOT NULL CHECK (collection_fee_per_vehicle > 0),
    collection_date DATE NOT NULL,
    finalized_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    payment_received BOOLEAN DEFAULT false,
    payment_received_at TIMESTAMPTZ NULL,
    vehicle_count INTEGER NOT NULL DEFAULT 1 CHECK (vehicle_count > 0),
    total_amount NUMERIC GENERATED ALWAYS AS (collection_fee_per_vehicle * vehicle_count) STORED,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Ensure one history record per collection per date
    UNIQUE(collection_id, collection_date)
);

-- Add RLS policies for collection_history
ALTER TABLE public.collection_history ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all history records
CREATE POLICY "Enable read access for admins on collection_history" ON public.collection_history
FOR SELECT USING (auth.role() = 'admin');

-- Allow clients to read their own history records
CREATE POLICY "Enable read access for clients on their collection_history" ON public.collection_history
FOR SELECT USING (auth.uid() = client_id);

-- Only allow inserts through the system (no direct inserts from clients/admins)
-- This ensures immutability - records can only be created, never modified
CREATE POLICY "Enable insert for service role only on collection_history" ON public.collection_history
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX idx_collection_history_client_id ON public.collection_history(client_id);
CREATE INDEX idx_collection_history_collection_date ON public.collection_history(collection_date);
CREATE INDEX idx_collection_history_finalized_at ON public.collection_history(finalized_at);

-- Create a function to automatically create history records when collections are finalized
CREATE OR REPLACE FUNCTION create_collection_history_record()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create history record when status changes to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Check if history record already exists for this collection and date
        IF EXISTS (
            SELECT 1 FROM public.collection_history
            WHERE collection_id = NEW.id AND collection_date = NEW.collection_date
        ) THEN
            -- Log that we're skipping duplicate creation
            RAISE NOTICE 'History record already exists for collection % on date %, skipping creation', NEW.id, NEW.collection_date;
            RETURN NEW;
        END IF;

        -- Count vehicles for this collection
        DECLARE
            vehicle_count_val INTEGER;
        BEGIN
            SELECT COUNT(*) INTO vehicle_count_val
            FROM public.vehicles
            WHERE collection_id = NEW.id;

            -- Ensure we have at least 1 vehicle
            IF vehicle_count_val < 1 THEN
                vehicle_count_val := 1;
            END IF;

            -- Insert immutable history record
            INSERT INTO public.collection_history (
                client_id,
                collection_id,
                collection_address,
                collection_fee_per_vehicle,
                collection_date,
                payment_received,
                payment_received_at,
                vehicle_count
            ) VALUES (
                NEW.client_id,
                NEW.id,
                NEW.collection_address,
                COALESCE(NEW.collection_fee_per_vehicle, 0),
                NEW.collection_date,
                COALESCE(NEW.payment_received, false),
                NEW.payment_received_at,
                vehicle_count_val
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create history records
CREATE TRIGGER trigger_create_collection_history
    AFTER UPDATE ON public.vehicle_collections
    FOR EACH ROW
    EXECUTE FUNCTION create_collection_history_record();

-- Create a view for easy access to collection history with client and vehicle details
CREATE VIEW public.collection_history_detailed AS
SELECT
    ch.*,
    p.full_name as client_name,
    au.email as client_email,
    vc.status as current_status,
    json_agg(
        json_build_object(
            'plate', v.plate,
            'status', v.status,
            'estimated_arrival_date', v.estimated_arrival_date
        )
    ) FILTER (WHERE v.id IS NOT NULL) as vehicles
FROM public.collection_history ch
JOIN public.profiles p ON p.id = ch.client_id
LEFT JOIN auth.users au ON au.id = ch.client_id
LEFT JOIN public.vehicle_collections vc ON vc.id = ch.collection_id
LEFT JOIN public.vehicles v ON v.collection_id = ch.collection_id
GROUP BY ch.id, p.full_name, au.email, vc.status;

-- Grant access to the view
GRANT SELECT ON public.collection_history_detailed TO authenticated;