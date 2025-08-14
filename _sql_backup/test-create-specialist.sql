-- Script para testar criação manual de usuário especialista
-- Execute no SQL Editor do Supabase Studio (http://127.0.0.1:54323)

BEGIN;

-- 1. Criar usuário no auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'joao.especialista@test.com',
  crypt('senha123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Dr. João Especialista", "role": "specialist"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) RETURNING id;

-- 2. Armazenar o ID gerado para usar nas próximas queries
\set user_id (SELECT id FROM auth.users WHERE email = 'joao.especialista@test.com')

-- 3. Criar perfil na tabela profiles
INSERT INTO profiles (id, full_name, role, created_at, updated_at) 
VALUES (
  (SELECT id FROM auth.users WHERE email = 'joao.especialista@test.com'),
  'Dr. João Especialista',
  'specialist',
  NOW(),
  NOW()
);

-- 4. Criar registro na tabela specialists
INSERT INTO specialists (profile_id, created_at, updated_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'joao.especialista@test.com'),
  NOW(),
  NOW()
);

COMMIT;
