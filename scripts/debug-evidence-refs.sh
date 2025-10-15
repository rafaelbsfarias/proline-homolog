#!/bin/bash
# Debug: Por que evidências não estão sendo salvas no banco?

echo "=========================================="
echo "🔍 DEBUG: Evidências não aparecem no frontend"
echo "=========================================="
echo ""

QUOTE_ID="4d7d160a-1c8e-47e4-853e-efa9da78bdc9"
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

echo "📊 1. Verificar estado atual do STORAGE:"
echo "----------------------------------------"
psql "$DB_URL" -c "
SELECT 
  name as arquivo,
  metadata->>'size' as tamanho_bytes,
  created_at
FROM storage.objects 
WHERE bucket_id = 'vehicle-media'
  AND name LIKE '%clutch%'
ORDER BY created_at DESC 
LIMIT 10;
"

echo ""
echo "📊 2. Verificar estado atual do BANCO:"
echo "----------------------------------------"
psql "$DB_URL" -c "
SELECT COUNT(*) as total_refs_no_banco
FROM mechanics_checklist_evidences;
"

echo ""
echo "📊 3. Verificar items do checklist:"
echo "----------------------------------------"
psql "$DB_URL" -c "
SELECT 
  item_key, 
  item_status,
  quote_id
FROM mechanics_checklist_items 
WHERE quote_id = '$QUOTE_ID'
ORDER BY created_at DESC
LIMIT 5;
"

echo ""
echo "=========================================="
echo "🧪 TESTE: Salvar checklist novamente"
echo "=========================================="
echo ""
echo "Por favor:"
echo "1. Acesse: http://localhost:3000/dashboard/partner/checklist?quoteId=$QUOTE_ID"
echo "2. Login: mecanica@parceiro.com / 123qwe"
echo "3. Apenas clique em 'Salvar Checklist' (NÃO adicione novas fotos)"
echo ""
echo "Aguarde salvar e pressione ENTER..."
read -r

echo ""
echo "📊 4. Verificar se referências foram salvas agora:"
echo "------------------------------------------------"
psql "$DB_URL" -c "
SELECT 
  item_key,
  storage_path,
  quote_id,
  created_at
FROM mechanics_checklist_evidences 
WHERE quote_id = '$QUOTE_ID'
ORDER BY created_at DESC;
"

echo ""
echo "=========================================="
echo "📝 ANÁLISE"
echo "=========================================="
echo ""

REFS_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM mechanics_checklist_evidences WHERE quote_id = '$QUOTE_ID';")
STORAGE_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'vehicle-media' AND name LIKE '%clutch%';")

echo "Arquivos no storage: $STORAGE_COUNT"
echo "Referências no banco: $REFS_COUNT"
echo ""

if [ "$REFS_COUNT" -gt 0 ]; then
  echo "✅ SUCESSO! As referências foram salvas!"
  echo ""
  echo "Agora recarregue a página (F5) e verifique se as imagens aparecem."
else
  echo "❌ PROBLEMA! As referências NÃO foram salvas."
  echo ""
  echo "Possíveis causas:"
  echo "1. O payload 'evidences' está vazio ou não está sendo enviado"
  echo "2. O formato do payload está incorreto"
  echo "3. Há um erro silencioso no backend"
  echo ""
  echo "🔍 Próximos passos de debug:"
  echo "1. Abra DevTools (F12)"
  echo "2. Aba Network"
  echo "3. Localize a requisição POST /api/partner/checklist/submit"
  echo "4. Verifique o payload → Request → Payload"
  echo "5. Procure pela chave 'evidences'"
  echo ""
  echo "O payload 'evidences' deve estar assim:"
  echo '{"evidences":{"clutch":["uuid/uuid/evidences/clutch/file1.jpg","uuid/uuid/evidences/clutch/file2.jpg"]}}'
  echo ""
  echo "Também verifique os LOGS do terminal onde 'npm run dev' está rodando."
  echo "Procure por: 'evidences_processing_start' e 'evidence_rows_prepared'"
fi

echo ""
echo "=========================================="
