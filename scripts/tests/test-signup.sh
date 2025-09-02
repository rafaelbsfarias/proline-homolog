#!/bin/bash

echo "=== Teste de Cadastro de Cliente ==="

# Configurações
BASE_URL="http://localhost:3000"

# Dados de teste para cadastro
TEST_DATA='{
  "fullName": "João Silva Teste",
  "companyName": "Empresa Teste LTDA",
  "cnpj": "12.345.678/0001-99",
  "email": "joao.teste@exemplo.com",
  "phone": "(11) 99999-9999",
  "password": "senha123456"
}'

echo "1. Testando endpoint de cadastro..."
echo "URL: ${BASE_URL}/api/signup"
echo "Dados: $TEST_DATA"
echo ""

# Teste da API de cadastro
curl -X POST "${BASE_URL}/api/signup" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  -w "\nStatus Code: %{http_code}\n" \
  -s

echo ""
echo "2. Verificando se o usuário foi criado no banco..."

# Verificar se o usuário foi criado no auth.users
USER_EXISTS=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "
  SELECT COUNT(*) FROM auth.users WHERE email = 'joao.teste@exemplo.com';
" 2>/dev/null | xargs)

echo "Usuário no auth.users: $USER_EXISTS"

# Verificar se o profile foi criado
PROFILE_EXISTS=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "
  SELECT COUNT(*) FROM profiles p 
  JOIN auth.users u ON p.id = u.id 
  WHERE u.email = 'joao.teste@exemplo.com';
" 2>/dev/null | xargs)

echo "Profile criado: $PROFILE_EXISTS"

# Verificar se o client foi criado
CLIENT_EXISTS=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "
  SELECT COUNT(*) FROM clients c 
  JOIN profiles p ON c.profile_id = p.id 
  JOIN auth.users u ON p.id = u.id 
  WHERE u.email = 'joao.teste@exemplo.com';
" 2>/dev/null | xargs)

echo "Client criado: $CLIENT_EXISTS"

echo ""
echo "3. Verificando emails enviados no Mailpit..."

# Verificar últimos emails no Mailpit
EMAILS_COUNT=$(curl -s http://localhost:54324/api/v1/messages | jq '.total' 2>/dev/null || echo "0")
echo "Total de emails no Mailpit: $EMAILS_COUNT"

echo ""
echo "4. Testando cadastro duplicado (deve falhar)..."

# Testar cadastro com mesmo email (deve retornar erro)
curl -X POST "${BASE_URL}/api/signup" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  -w "\nStatus Code: %{http_code}\n" \
  -s

echo ""
echo "=== Fim do teste ==="
