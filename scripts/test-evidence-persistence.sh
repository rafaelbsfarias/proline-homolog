#!/bin/bash
echo "🧪 TESTE: Persistência de Evidências"
echo "===================================="
echo ""
echo "📊 Evidências no storage (clutch):"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'vehicle-media' AND name LIKE '%clutch%';"

echo ""
echo "📊 Referências no banco:"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT item_key, COUNT(*) as quantidade FROM mechanics_checklist_evidences GROUP BY item_key;"

echo ""
echo "===================================="
echo "📝 AÇÃO NECESSÁRIA:"
echo "1. Acesse: http://localhost:3000/dashboard/partner/checklist?quoteId=4d7d160a-1c8e-47e4-853e-efa9da78bdc9"
echo "2. Login: mecanica@parceiro.com / 123qwe"
echo "3. Apenas clique em 'Salvar Checklist' (NÃO adicione novas fotos)"
echo ""
echo "Pressione ENTER após salvar..."
read

echo ""
echo "📊 Referências no banco APÓS salvar:"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT item_key, storage_path FROM mechanics_checklist_evidences;"

echo ""
REFS=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT COUNT(*) FROM mechanics_checklist_evidences WHERE item_key = 'clutch';")

if [ "$REFS" -ge 2 ]; then
  echo "✅ SUCESSO! $REFS referências salvas!"
  echo ""
  echo "Agora recarregue a página (F5) e verifique se as fotos aparecem."
else
  echo "❌ PROBLEMA! Apenas $REFS referências salvas."
  echo ""
  echo "Verifique os logs do terminal onde 'npm run dev' está rodando."
  echo "Procure por: 'evidences_processing_start'"
fi
