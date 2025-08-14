#!/bin/bash

# Script para simular confirmação de email via API
# Usuário alvo: rafael2@serejo.tech

BASE_URL="http://localhost:3000"
EMAIL="rafael2@serejo.tech"

# 1. Buscar o token de confirmação no banco (ajuste a query conforme seu schema)
CONFIRM_TOKEN=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "
  SELECT confirmation_token FROM auth.users WHERE email = '$EMAIL';
" 2>/dev/null | xargs)

if [ -z "$CONFIRM_TOKEN" ]; then
  echo "Token de confirmação não encontrado para $EMAIL."
  exit 1
fi

echo "Token de confirmação encontrado: $CONFIRM_TOKEN"

# 2. Simular requisição de confirmação de email
CONFIRM_URL="${BASE_URL}/api/confirm-email?token=${CONFIRM_TOKEN}"
echo "Enviando requisição para: $CONFIRM_URL"

curl -X POST "$CONFIRM_URL" \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n" \
  -s

echo "\nConfirmação de email simulada para $EMAIL."
