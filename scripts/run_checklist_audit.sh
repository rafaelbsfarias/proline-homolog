#!/usr/bin/env bash
set -euo pipefail

# Orquestrador de auditorias de checklist
# Requer psql e acesso ao banco via $DB_URL (ex.: postgresql://postgres:postgres@127.0.0.1:54322/postgres)

if [ -z "${DB_URL:-}" ]; then
  echo "Defina DB_URL, ex: export DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres"
  exit 1
fi

echo "🚀 Rodando auditorias de checklist..."
echo ""

run_sql() {
  local file="$1"
  echo "=========================================="
  echo "📄 Executando: $file"
  echo "=========================================="
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$file" || true
  echo ""
}

# Núcleo de auditorias
run_sql scripts/checklist/audit-checklist-relations.sql
run_sql scripts/checklist/audit-evidence-integrity.sql

# Complementares já existentes
if [ -f scripts/verify_schema.sql ]; then run_sql scripts/verify_schema.sql; fi
if [ -f scripts/verify-part-requests.sql ]; then run_sql scripts/verify-part-requests.sql; fi
if [ -f scripts/test-evidence-loading.sql ]; then run_sql scripts/test-evidence-loading.sql; fi

echo "✅ Auditorias concluídas. Veja saídas acima."

