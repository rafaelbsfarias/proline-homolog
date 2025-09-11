#!/bin/bash

echo "=== Teste de Reset de Senha ==="

# Configurações
EMAIL_TESTE="rafaelbsfarias@gmail.com"
SUPABASE_URL="http://localhost:54321"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

echo "1. Testando reset de senha via Supabase Auth..."

# Teste direto com Supabase
curl -X POST "${SUPABASE_URL}/auth/v1/recover" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -d "{\"email\":\"${EMAIL_TESTE}\"}" \
  -w "\nStatus Code: %{http_code}\n" \
  -s

echo ""
echo "2. Verificando logs do Supabase local..."

# Verificar logs do docker se estiver rodando
if command -v docker &> /dev/null; then
    echo "Logs recentes do container Supabase:"
    docker logs supabase_auth_temp-vercel 2>/dev/null | tail -10 || echo "Container não encontrado"
fi

echo ""
echo "3. Testando com email de usuário existente..."

# Buscar um email real do banco
REAL_EMAIL=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT email FROM auth.users LIMIT 1;" 2>/dev/null | xargs)

if [ ! -z "$REAL_EMAIL" ]; then
    echo "Testando com email real: $REAL_EMAIL"
    curl -X POST "${SUPABASE_URL}/auth/v1/recover" \
      -H "Content-Type: application/json" \
      -H "apikey: ${SUPABASE_ANON_KEY}" \
      -d "{\"email\":\"${REAL_EMAIL}\"}" \
      -w "\nStatus Code: %{http_code}\n" \
      -s
else
    echo "Nenhum usuário encontrado no banco"
fi

echo ""
echo "=== Fim do teste ==="
