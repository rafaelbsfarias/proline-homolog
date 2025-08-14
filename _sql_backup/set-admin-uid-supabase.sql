-- SQL para adicionar o usuário admin na tabela profiles

-- 1. Inserir o usuário admin na tabela profiles
INSERT INTO profiles (id, created_at, updated_at, full_name, role, status) 
VALUES (
    '5e5c27fb-c4fe-4e6e-940c-9b481e73924c',
    NOW(),
    NOW(),
    'Administrador',
    'admin',
    'active'
)
ON CONFLICT (id) DO UPDATE SET 
    role = 'admin',
    full_name = 'Administrador',
    status = 'active',
    updated_at = NOW();

-- 2. Depois associar à tabela admins
INSERT INTO admins (profile_id) 
VALUES ('5e5c27fb-c4fe-4e6e-940c-9b481e73924c')
ON CONFLICT (profile_id) DO NOTHING;
