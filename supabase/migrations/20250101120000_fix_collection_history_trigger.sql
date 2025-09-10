-- Fix collection history trigger to prevent duplicate records
-- This migration updates the trigger function to check for existing records before insertion

CREATE OR REPLACE FUNCTION create_collection_history_record()
RETURNS TRIGGER AS $$
DECLARE
    vehicle_count_val INTEGER;
BEGIN
    -- Only create history record when status changes to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Check if history record already exists for this collection and date
        IF EXISTS (
            SELECT 1 FROM public.collection_history
            WHERE collection_id = NEW.id AND collection_date = NEW.collection_date
        ) THEN
            RAISE NOTICE 'History record already exists for collection % on date %, skipping creation', NEW.id, NEW.collection_date;
            RETURN NEW;
        END IF;

        -- Count vehicles for this collection
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
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
