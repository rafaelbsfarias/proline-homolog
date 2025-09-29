#!/usr/bin/env bash
# Script para exibir o schema da tabela mechanics_checklist no banco PostgreSQL do Supabase

# Variáveis de ambiente necessárias:
#   SUPABASE_DB_URL (ex: postgres://user:pass@host:port/dbname)
#
# Uso: bash show_mechanics_checklist_schema.sh

if [ -z "$SUPABASE_DB_URL" ]; then
  echo "Defina a variável de ambiente SUPABASE_DB_URL com a URL de conexão do banco."
  exit 1
fi

# Extrai o nome do banco da URL
DB_NAME=$(echo "$SUPABASE_DB_URL" | sed -E 's#.*/([^/?]+).*#\1#')

# Executa o comando para mostrar o schema da tabela
PGPASSWORD=$(echo "$SUPABASE_DB_URL" | sed -E 's#.*:([^:@/]+)@.*#\1#') \
psql "$SUPABASE_DB_URL" -c "\d+ mechanics_checklist"
