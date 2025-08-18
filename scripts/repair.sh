#!/usr/bin/env bash
set -euo pipefail

# Uso: ./repair-migrations.sh [STATUS]
# Ex.: ./repair-migrations.sh reverted   (padrão)
#      ./repair-migrations.sh applied

STATUS="${1:-reverted}"

# Verificações básicas
command -v supabase >/dev/null 2>&1 || { echo "Erro: supabase CLI não encontrado no PATH."; exit 1; }
[[ -f "supabase/config.toml" ]] || { echo "Erro: rode no diretório raiz do projeto (onde existe supabase/config.toml)."; exit 1; }

# Lista de versões a reparar
MIGS=(
  20250511000001
  20250511000002
  20250511000003
  20250511000004
  20250511000005
  20250806230849
  20250807060000
  20250807100000
  20250807103000
  20250807120000
  20250807150000
  20250807160000
  20250807160001
  20250807160002
  20250807160003
  20250807160004
)

LOG="repair-$(date +%Y%m%d-%H%M%S).log"
echo "== Supabase migration repair (status: $STATUS) ==" | tee -a "$LOG"

for v in "${MIGS[@]}"; do
  echo "--> $v" | tee -a "$LOG"
  if supabase migration repair --status "$STATUS" "$v" 2>&1 | tee -a "$LOG"; then
    echo "OK: $v" | tee -a "$LOG"
  else
    echo "FALHOU: $v (continuando com as próximas)" | tee -a "$LOG"
  fi
done

echo "Concluído. Log em: $LOG"
