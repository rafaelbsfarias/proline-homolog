#!/bin/bash

# Script para testar atualização do status do veículo após salvar checklist
# Usage: ./scripts/test-vehicle-status-update.sh

set -e

DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
QUOTE_ID="4d7d160a-1c8e-47e4-853e-efa9da78bdc9"

echo "🔍 Testando atualização de status do veículo após salvar checklist"
echo "=================================================================="
echo ""

# 1. Verificar veículo atual
echo "📋 1. Status atual do veículo:"
psql "$DB_URL" -c "
SELECT 
  v.id,
  v.status,
  v.created_at
FROM vehicles v
JOIN service_orders so ON v.id = so.vehicle_id
JOIN quotes q ON so.id = q.service_order_id
WHERE q.id = '$QUOTE_ID'
" | head -20

echo ""
echo "📋 2. Verificar última entrada na timeline do veículo:"
psql "$DB_URL" -c "
SELECT 
  vh.status,
  vh.created_at
FROM vehicle_history vh
JOIN service_orders so ON vh.vehicle_id = so.vehicle_id
JOIN quotes q ON so.id = q.service_order_id
WHERE q.id = '$QUOTE_ID'
ORDER BY vh.created_at DESC
LIMIT 5;
"

echo ""
echo "📋 3. Verificar se há checklist salvo:"
psql "$DB_URL" -c "
SELECT 
  mc.id,
  mc.status,
  mc.created_at,
  mc.updated_at
FROM mechanics_checklist mc
WHERE mc.quote_id = '$QUOTE_ID'
ORDER BY mc.created_at DESC
LIMIT 1;
"

echo ""
echo "=================================================================="
echo "✅ Teste concluído!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Acesse: http://localhost:3000/dashboard/partner/checklist?quoteId=$QUOTE_ID"
echo "   2. Preencha o checklist e clique em 'Salvar Checklist'"
echo "   3. Execute este script novamente para verificar se o status mudou para 'FASE ORÇAMENTÁRIA'"
echo ""
