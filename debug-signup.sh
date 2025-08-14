#!/bin/bash

echo "=== Debug do Cadastro ==="

# Primeiro, vamos limpar o usuário de teste se existir
echo "1. Limpando usuário de teste anterior..."

psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
DELETE FROM clients WHERE profile_id IN (
  SELECT p.id FROM profiles p 
  JOIN auth.users u ON p.id = u.id 
  WHERE u.email = 'joao.teste@exemplo.com'
);

DELETE FROM profiles WHERE id IN (
  SELECT u.id FROM auth.users u 
  WHERE u.email = 'joao.teste@exemplo.com'
);

DELETE FROM auth.users WHERE email = 'joao.teste@exemplo.com';
" 2>/dev/null

echo "2. Testando criação manual do profile..."

# Criar um usuário de teste e tentar criar profile manualmente
TEST_USER_ID=$(uuidgen)
echo "ID de teste: $TEST_USER_ID"

# Tentar inserir profile manualmente
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
INSERT INTO profiles (id, full_name, role, created_at, updated_at) 
VALUES ('$TEST_USER_ID', 'Usuario Teste Manual', 'client', NOW(), NOW());
" 2>&1

echo ""
echo "3. Verificando se foi criado..."

PROFILE_COUNT=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "
SELECT COUNT(*) FROM profiles WHERE id = '$TEST_USER_ID';
" 2>/dev/null | xargs)

echo "Profile criado: $PROFILE_COUNT"

echo ""
echo "=== Fim do debug ==="
