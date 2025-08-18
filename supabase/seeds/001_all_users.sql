-- SEED: cria usuários direto no Auth e popula perfis + tabelas específicas

-- ======================
-- 1. Admin
-- ======================
WITH new_admin AS (
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at, aud, role
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'admin@prolineauto.com.br',
    crypt('123qwe', gen_salt('bf')),
    now(),
    '{"full_name": "Administrador Principal", "role": "admin"}',
    now(),
    now(),
    'authenticated',
    'authenticated'
  )
  RETURNING id
)
INSERT INTO public.profiles (id, full_name, role, status)
SELECT id, 'Administrador Principal', 'admin', 'active'
FROM new_admin;

INSERT INTO public.admins (profile_id)
SELECT id
FROM auth.users
WHERE email = 'admin@prolineauto.com.br';


-- ======================
-- 2. Client
-- ======================
WITH new_client AS (
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at, aud, role
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'cliente@prolineauto.com.br',
    crypt('123qwe', gen_salt('bf')),
    now(),
    '{"full_name": "Cliente Teste", "role": "client"}',
    now(),
    now(),
    'authenticated',
    'authenticated'
  )
  RETURNING id
)
INSERT INTO public.profiles (id, full_name, role, status)
SELECT id, 'Cliente Teste', 'client', 'active'
FROM new_client;

INSERT INTO public.clients (profile_id, document_type, document_number, company_name)
SELECT id, 'CPF', '111.111.111-00', 'Empresa Cliente Seed'
FROM auth.users
WHERE email = 'cliente@prolineauto.com.br';


-- ======================
-- 3. Partner
-- ======================
WITH new_partner AS (
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at, aud, role
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'parceiro@prolineauto.com.br',
    crypt('123qwe', gen_salt('bf')),
    now(),
    '{"full_name": "Parceiro Teste", "role": "partner"}',
    now(),
    now(),
    'authenticated',
    'authenticated'
  )
  RETURNING id
)
INSERT INTO public.profiles (id, full_name, role, status)
SELECT id, 'Parceiro Teste', 'partner', 'active'
FROM new_partner;

INSERT INTO public.partners (profile_id, cnpj, company_name, is_active)
SELECT id, '00.000.000/0001-00', 'Oficina Parceira Seed', true
FROM auth.users
WHERE email = 'parceiro@prolineauto.com.br';


-- ======================
-- 4. Specialist
-- ======================
WITH new_specialist AS (
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at, aud, role
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'especialista@prolineauto.com.br',
    crypt('123qwe', gen_salt('bf')),
    now(),
    '{"full_name": "Especialista Teste", "role": "specialist"}',
    now(),
    now(),
    'authenticated',
    'authenticated'
  )
  RETURNING id
)
INSERT INTO public.profiles (id, full_name, role, status)
SELECT id, 'Especialista Teste', 'specialist', 'active'
FROM new_specialist;

INSERT INTO public.specialists (profile_id)
SELECT id
FROM auth.users
WHERE email = 'especialista@prolineauto.com.br';
