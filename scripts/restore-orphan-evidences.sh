#!/bin/bash

# Script para restaurar evidências órfãs (no storage mas sem referência no banco)
# Usage: ./scripts/restore-orphan-evidences.sh

set -e

DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
QUOTE_ID="4d7d160a-1c8e-47e4-853e-efa9da78bdc9"

echo "🔧 Restaurando evidências órfãs"
echo "=================================================================="
echo ""

# Buscar IDs necessários
VEHICLE_ID=$(psql "$DB_URL" -t -c "SELECT vehicle_id FROM service_orders WHERE id = (SELECT service_order_id FROM quotes WHERE id = '$QUOTE_ID');" | xargs)
PARTNER_ID=$(psql "$DB_URL" -t -c "SELECT partner_id FROM quotes WHERE id = '$QUOTE_ID';" | xargs)

echo "📋 Contexto:"
echo "  Vehicle ID: $VEHICLE_ID"
echo "  Partner ID: $PARTNER_ID"
echo "  Quote ID: $QUOTE_ID"
echo ""

# Buscar todas as imagens clutch no storage
echo "🔍 Buscando imagens clutch no storage..."
STORAGE_PATHS=$(psql "$DB_URL" -t -c "
SELECT name 
FROM storage.objects 
WHERE bucket_id = 'vehicle-media' 
  AND name LIKE '$VEHICLE_ID/$PARTNER_ID/evidences/clutch/%'
ORDER BY created_at ASC;
" | sed 's/^[ \t]*//;s/[ \t]*$//')

echo "Imagens encontradas no storage:"
echo "$STORAGE_PATHS"
echo ""

# Para cada path, verificar se existe no banco e inserir se não existir
echo "🔧 Restaurando referências..."
echo ""

while IFS= read -r storage_path; do
    if [ -n "$storage_path" ]; then
        # Extrair apenas o filename para display
        filename=$(basename "$storage_path")
        
        # Verificar se já existe
        exists=$(psql "$DB_URL" -t -c "
        SELECT COUNT(*) 
        FROM mechanics_checklist_evidences 
        WHERE media_url LIKE '%$filename%' 
          AND vehicle_id = '$VEHICLE_ID';
        " | xargs)
        
        if [ "$exists" -eq "0" ]; then
            echo "  ➕ Inserindo: $filename"
            
            # Inserir referência
            psql "$DB_URL" -c "
            INSERT INTO mechanics_checklist_evidences (
                vehicle_id,
                partner_id,
                quote_id,
                item_key,
                media_url,
                media_type,
                created_at
            ) VALUES (
                '$VEHICLE_ID',
                '$PARTNER_ID',
                '$QUOTE_ID',
                'clutch',
                '$storage_path',
                'image',
                NOW()
            );
            " > /dev/null
            
            echo "     ✅ Inserido com sucesso"
        else
            echo "  ⏭️  Já existe: $filename"
        fi
    fi
done <<< "$STORAGE_PATHS"

echo ""
echo "=================================================================="
echo "📊 Resultado final:"
echo ""

STORAGE_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'vehicle-media' AND name LIKE '$VEHICLE_ID/$PARTNER_ID/evidences/clutch/%';" | xargs)
DB_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM mechanics_checklist_evidences WHERE item_key = 'clutch' AND vehicle_id = '$VEHICLE_ID';" | xargs)

echo "Total no storage: $STORAGE_COUNT imagens"
echo "Total no banco:   $DB_COUNT referências"
echo ""

if [ "$STORAGE_COUNT" -eq "$DB_COUNT" ]; then
    echo "✅ SUCESSO! Todas as evidências foram restauradas!"
else
    echo "⚠️  Ainda há discrepância. Execute novamente ou verifique manualmente."
fi

echo ""
