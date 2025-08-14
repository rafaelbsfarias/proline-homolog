-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    document_type TEXT,
    document_number TEXT,
    address TEXT,
    cep TEXT,
    parqueamento NUMERIC(10, 2),
    quilometragem TEXT, -- Assuming it might be text like "10.000 km" or numeric
    percentual_fipe NUMERIC(5, 2),
    taxa_operacao NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create partners table
CREATE TABLE IF NOT EXISTS partners (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    cnpj TEXT,
    company_name TEXT,
    company_address TEXT, -- Assuming this might be different from personal address
    company_phone TEXT,   -- Assuming this might be different from personal phone
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create specialists table (empty for now, but good to have the structure)
CREATE TABLE IF NOT EXISTS specialists (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    -- Add specialist-specific fields here if any
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admins table (empty for now, but good to have the structure)
CREATE TABLE IF NOT EXISTS admins (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    -- Add admin-specific fields here if any
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migrate existing data from profiles to new tables
-- Clients
INSERT INTO clients (profile_id, document_type, document_number, address, cep, parqueamento, quilometragem, percentual_fipe, taxa_operacao, created_at, updated_at)
SELECT
    p.id,
    p.document_type,
    p.document, -- Assuming 'document' column in profiles holds the document_number
    p.address,
    p.cep,
    p.parqueamento,
    p.quilometragem,
    p.percentual_fipe,
    p.taxa_operacao,
    p.created_at,
    p.updated_at
FROM profiles p
WHERE p.role = 'client' AND p.document_type IS NOT NULL; -- Only migrate if client-specific data exists

-- Partners
INSERT INTO partners (profile_id, cnpj, company_name, created_at, updated_at)
SELECT
    p.id,
    p.document, -- Assuming 'document' column in profiles holds the cnpj
    p.full_name, -- Assuming full_name might be company_name for partners initially
    p.created_at,
    p.updated_at
FROM profiles p
WHERE p.role = 'partner' AND p.document_type = 'CNPJ'; -- Only migrate if partner-specific data exists

-- Specialists (no specific data to migrate from profiles, just create entry if role exists)
INSERT INTO specialists (profile_id, created_at, updated_at)
SELECT
    p.id,
    p.created_at,
    p.updated_at
FROM profiles p
WHERE p.role = 'specialist';

-- Admins (no specific data to migrate from profiles, just create entry if role exists)
INSERT INTO admins (profile_id, created_at, updated_at)
SELECT
    p.id,
    p.created_at,
    p.updated_at
FROM profiles p
WHERE p.role = 'admin';

-- Alter profiles table: drop columns that were moved
ALTER TABLE profiles
    DROP COLUMN IF EXISTS document_type,
    DROP COLUMN IF EXISTS document,
    DROP COLUMN IF EXISTS address,
    DROP COLUMN IF EXISTS cep,
    DROP COLUMN IF EXISTS parqueamento,
    DROP COLUMN IF EXISTS quilometragem,
    DROP COLUMN IF EXISTS percentual_fipe,
    DROP COLUMN IF EXISTS taxa_operacao,
    DROP COLUMN IF EXISTS company_name, -- Assuming this was also in profiles for partners
    DROP COLUMN IF EXISTS cnpj; -- Assuming this was also in profiles for partners

-- Add a default value for 'status' if it's not already there and is nullable
-- ALTER TABLE profiles ALTER COLUMN status SET DEFAULT 'ativo';
-- Consider adding NOT NULL constraint if appropriate after data cleanup

-- Update updated_at for all profiles that were part of this migration
UPDATE profiles
SET updated_at = NOW()
WHERE id IN (SELECT profile_id FROM clients)
   OR id IN (SELECT profile_id FROM partners)
   OR id IN (SELECT profile_id FROM specialists)
   OR id IN (SELECT profile_id FROM admins);

-- Optional: Add comments to new tables and columns for better documentation
COMMENT ON TABLE clients IS 'Stores client-specific details, linked to profiles.';
COMMENT ON COLUMN clients.profile_id IS 'Foreign key to the profiles table.';
COMMENT ON TABLE partners IS 'Stores partner-specific details, linked to profiles.';
COMMENT ON COLUMN partners.profile_id IS 'Foreign key to the profiles table.';
COMMENT ON TABLE specialists IS 'Stores specialist-specific details, linked to profiles.';
COMMENT ON COLUMN specialists.profile_id IS 'Foreign key to the profiles table.';
COMMENT ON TABLE admins IS 'Stores admin-specific details, linked to profiles.';
COMMENT ON COLUMN admins.profile_id IS 'Foreign key to the profiles table.';
