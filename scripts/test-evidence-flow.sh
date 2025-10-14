#!/bin/bash
# Script de teste completo: Upload e Recuperação de Evidências

echo "=========================================="
echo "🧪 TESTE COMPLETO: EVIDÊNCIAS"
echo "=========================================="
echo ""

QUOTE_ID="4d7d160a-1c8e-47e4-853e-efa9da78bdc9"
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

echo "📋 Passo 1: Limpar dados anteriores"
psql "$DB_URL" <<EOF
DELETE FROM mechanics_checklist_items WHERE quote_id = '$QUOTE_ID';
DELETE FROM mechanics_checklist_evidences WHERE quote_id = '$QUOTE_ID';
EOF

echo ""
echo "✅ Dados limpos!"
echo ""
echo "=========================================="
echo "📝 Passo 2: AÇÃO MANUAL NECESSÁRIA"
echo "=========================================="
echo ""
echo "Por favor, execute os seguintes passos:"
echo ""
echo "1. Acesse: http://localhost:3000/dashboard/partner/checklist?quoteId=$QUOTE_ID"
echo "2. Login: mecanica@parceiro.com / 123qwe"
echo "3. Marque 'Velas de ignição' como NOK"
echo "4. Clique em 'Adicionar evidência'"
echo "5. Faça upload de UMA imagem"
echo "6. Clique em 'Salvar Checklist'"
echo ""
echo "Após completar, pressione ENTER para continuar..."
read -r

echo ""
echo "=========================================="
echo "🔍 Passo 3: Verificar dados salvos"
echo "=========================================="
echo ""

echo "📊 3.1 - Verificar items salvos:"
psql "$DB_URL" -c "
SELECT 
  item_key,
  item_status,
  CASE WHEN part_request IS NOT NULL THEN '✅ SIM' ELSE '❌ NÃO' END as tem_part_request
FROM mechanics_checklist_items
WHERE quote_id = '$QUOTE_ID'
ORDER BY item_key;
"

echo ""
echo "📸 3.2 - Verificar evidências salvas:"
psql "$DB_URL" -c "
SELECT 
  item_key,
  SUBSTRING(media_url, 1, 60) || '...' as caminho_arquivo,
  CASE 
    WHEN media_url LIKE '%/evidences/sparkPlugs/%' THEN '✅ ESTRUTURA CORRETA'
    WHEN media_url LIKE '%/evidences/%' THEN '✅ ESTRUTURA CORRETA (outro item)'
    WHEN media_url LIKE '%/itens/%' THEN '❌ ESTRUTURA ANTIGA'
    ELSE '⚠️  ESTRUTURA DESCONHECIDA'
  END as status_estrutura,
  created_at
FROM mechanics_checklist_evidences
WHERE quote_id = '$QUOTE_ID'
ORDER BY created_at DESC;
"

echo ""
echo "📈 3.3 - Contagem total:"
psql "$DB_URL" -c "
SELECT 
  COUNT(*) as total_evidencias,
  COUNT(DISTINCT item_key) as items_com_evidencias
FROM mechanics_checklist_evidences
WHERE quote_id = '$QUOTE_ID';
"

echo ""
echo "=========================================="
echo "🔄 Passo 4: Testar carregamento"
echo "=========================================="
echo ""
echo "Agora:"
echo "1. Pressione F5 no navegador (recarregar página)"
echo "2. Verifique se a foto aparece no card de 'Velas de ignição'"
echo "3. Clique em 'Visualizar evidências (1)'"
echo "4. Confirme se o lightbox abre com a imagem"
echo ""
echo "Pressione ENTER após verificar..."
read -r

echo ""
echo "=========================================="
echo "✅ TESTE CONCLUÍDO!"
echo "=========================================="
echo ""
echo "Se a evidência apareceu:"
echo "  ✅ Upload está funcionando"
echo "  ✅ Salvamento no banco está funcionando"
echo "  ✅ Recuperação no frontend está funcionando"
echo ""
echo "Se NÃO apareceu, verifique:"
echo "  1. Console do navegador (F12) para erros"
echo "  2. Network tab: requisição /api/partner/checklist/load"
echo "  3. Resposta da API deve conter 'evidences' com URLs"
echo ""
echo "Para debug adicional, execute:"
echo "  cat docs/TEST_GUIDE_EVIDENCE_STRUCTURE.md"
echo ""
