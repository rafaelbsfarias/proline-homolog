-- SQL para tornar o usuário com UID 5e5c27fb-c4fe-4e6e-940c-9b481e73924c admin

-- Atualizar a role na tabela profiles
UPDATE profiles 
SET role = 'admin' 
WHERE id = '5e5c27fb-c4fe-4e6e-940c-9b481e73924c';

-- Inserir registro na tabela admins (se não existir)
INSERT INTO admins (profile_id) 
VALUES ('5e5c27fb-c4fe-4e6e-940c-9b481e73924c')
ON CONFLICT (profile_id) DO NOTHING;

-- Verificar se as alterações foram aplicadas
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    CASE 
        WHEN a.profile_id IS NOT NULL THEN 'Sim'
        ELSE 'Não'
    END as "É Admin"
FROM profiles p
LEFT JOIN admins a ON p.id = a.profile_id
WHERE p.id = '5e5c27fb-c4fe-4e6e-940c-9b481e73924c';
