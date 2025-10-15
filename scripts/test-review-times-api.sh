#!/bin/bash

# Script para testar a API de revisão de tempos do especialista

echo "=== Teste da API de Revisão de Tempos do Especialista ==="
echo ""

# Configurações
BASE_URL="http://localhost:3000"
SPECIALIST_EMAIL="especialista@prolineauto.com.br"
SPECIALIST_PASSWORD="Proline@2024"
QUOTE_ID="1a190673-e368-4a7c-8d54-5918a34c6f9b"

# 1. Login como especialista
echo "1. Fazendo login como especialista..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$SPECIALIST_EMAIL\",\"password\":\"$SPECIALIST_PASSWORD\"}")

echo "Response: $LOGIN_RESPONSE"
echo ""

# Extrair o token (assumindo que vem no formato {"session":{"access_token":"..."}})
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Erro: Não foi possível obter o access_token"
  echo "Login response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtido: ${ACCESS_TOKEN:0:50}..."
echo ""

# 2. Testar aprovação
echo "2. Testando APROVAÇÃO de tempos..."
APPROVAL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/specialist/quotes/$QUOTE_ID/review-times" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"action":"approved","comments":"Tempos aprovados"}')

echo "Response: $APPROVAL_RESPONSE"
echo ""

# 3. Verificar status do quote
echo "3. Verificando novo status do quote..."
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres << EOF
SELECT 
  q.id,
  q.status,
  qtr.action,
  qtr.comments,
  qtr.created_at as reviewed_at
FROM quotes q
LEFT JOIN quote_time_reviews qtr ON qtr.quote_id = q.id
WHERE q.id = '$QUOTE_ID'
ORDER BY qtr.created_at DESC
LIMIT 1;
EOF

echo ""
echo "=== Teste Concluído ==="
