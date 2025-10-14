#!/bin/bash

# Script para debugar problema de evidências não sendo carregadas
# Usage: ./scripts/debug-evidences-issue.sh

set -e

DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
QUOTE_ID="4d7d160a-1c8e-47e4-853e-efa9da78bdc9"

echo "🔍 DEBUG: Evidências não sendo carregadas"
echo "=================================================================="
echo ""

# 1. Verificar imagens no storage
echo "📦 1. Imagens no storage (clutch):"
psql "$DB_URL" -c "
SELECT 
  name,
  created_at
FROM storage.objects 
WHERE bucket_id = 'vehicle-media' 
  AND name LIKE '%clutch%'
ORDER BY created_at DESC;
"

echo ""
echo "📊 Total de imagens clutch no storage:"
psql "$DB_URL" -t -c "
SELECT COUNT(*) 
FROM storage.objects 
WHERE bucket_id = 'vehicle-media' 
  AND name LIKE '%clutch%';
"

# 2. Verificar referências no banco
echo ""
echo "💾 2. Referências no banco (mechanics_checklist_evidences):"
psql "$DB_URL" -c "
SELECT 
  item_key,
  LEFT(media_url, 100) as media_url_preview,
  created_at
FROM mechanics_checklist_evidences
WHERE item_key = 'clutch'
ORDER BY created_at DESC;
"

echo ""
echo "📊 Total de referências clutch no banco:"
psql "$DB_URL" -t -c "
SELECT COUNT(*) 
FROM mechanics_checklist_evidences
WHERE item_key = 'clutch';
"

# 3. Verificar quote_id e partner_id
echo ""
echo "🔑 3. Verificar IDs do quote e parceiro:"
psql "$DB_URL" -c "
SELECT 
  q.id as quote_id,
  q.partner_id,
  so.vehicle_id
FROM quotes q
JOIN service_orders so ON q.service_order_id = so.id
WHERE q.id = '$QUOTE_ID';
"

# 4. Verificar todas as evidências deste quote
echo ""
echo "📋 4. Todas as evidências deste quote:"
psql "$DB_URL" -c "
SELECT 
  mce.item_key,
  COUNT(*) as count,
  MAX(mce.created_at) as last_created
FROM mechanics_checklist_evidences mce
WHERE mce.quote_id = '$QUOTE_ID'
GROUP BY mce.item_key
ORDER BY mce.item_key;
"

# 5. Verificar se há evidências órfãs (sem quote_id)
echo ""
echo "⚠️  5. Evidências sem quote_id (órfãs):"
psql "$DB_URL" -c "
SELECT 
  item_key,
  LEFT(media_url, 80) as media_url_preview,
  created_at
FROM mechanics_checklist_evidences
WHERE quote_id IS NULL
  AND vehicle_id IN (
    SELECT vehicle_id 
    FROM service_orders 
    WHERE id = (SELECT service_order_id FROM quotes WHERE id = '$QUOTE_ID')
  )
ORDER BY created_at DESC;
"

echo ""
echo "=================================================================="
echo "📝 DIAGNÓSTICO"
echo "=================================================================="
echo ""

STORAGE_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'vehicle-media' AND name LIKE '%clutch%';" | xargs)
DB_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM mechanics_checklist_evidences WHERE item_key = 'clutch';" | xargs)

echo "Total no storage: $STORAGE_COUNT imagens"
echo "Total no banco:   $DB_COUNT referências"
echo ""

if [ "$STORAGE_COUNT" -gt "$DB_COUNT" ]; then
    echo "❌ PROBLEMA IDENTIFICADO:"
    echo "   Existem $((STORAGE_COUNT - DB_COUNT)) imagens no storage sem referência no banco!"
    echo ""
    echo "   Possíveis causas:"
    echo "   1. O backend está deletando referências antigas ao salvar novas"
    echo "   2. O frontend não está enviando todas as URLs no payload"
    echo "   3. Erro no processo de salvamento"
    echo ""
    echo "   Próximos passos:"
    echo "   1. Verificar logs do servidor durante salvamento"
    echo "   2. Verificar payload enviado pelo frontend"
    echo "   3. Verificar se hook preserva evidências existentes corretamente"
else
    echo "✅ Quantidades batem! O problema pode estar no carregamento."
fi

echo ""
