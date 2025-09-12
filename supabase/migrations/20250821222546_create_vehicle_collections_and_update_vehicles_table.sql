
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.vehicle_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    collection_address TEXT NOT NULL,
    collection_fee_per_vehicle NUMERIC,
    status TEXT DEFAULT 'requested' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add RLS policies for vehicle_collections
ALTER TABLE public.vehicle_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for admins" ON public.vehicle_collections
FOR SELECT USING (auth.role() = 'admin');

CREATE POLICY "Enable insert for admins" ON public.vehicle_collections
FOR INSERT WITH CHECK (auth.role() = 'admin');

CREATE POLICY "Enable update for admins" ON public.vehicle_collections
FOR UPDATE USING (auth.role() = 'admin');

ALTER TABLE public.vehicles
ADD COLUMN collection_id UUID REFERENCES public.vehicle_collections(id) ON DELETE SET NULL;

-- Add RLS policy for vehicles table to allow admins to update collection_id
-- This policy is broad, consider refining if other roles update vehicles
CREATE POLICY "Enable update for admins on collection_id" ON public.vehicles
FOR UPDATE USING (auth.role() = 'admin') WITH CHECK (auth.role() = 'admin');
