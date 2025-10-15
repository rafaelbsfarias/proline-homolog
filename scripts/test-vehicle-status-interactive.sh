#!/bin/bash

# Guia Rápido: Como Testar a Atualização de Status do Veículo
# ============================================================

echo "🎯 GUIA RÁPIDO DE TESTE"
echo "================================"
echo ""

DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
QUOTE_ID="4d7d160a-1c8e-47e4-853e-efa9da78bdc9"

# Função para exibir status atual
show_current_status() {
    echo "📊 Status Atual do Veículo:"
    psql "$DB_URL" -t -c "
    SELECT 
      '  Status: ' || COALESCE(v.status, 'NULL'),
      '  Atualizado: ' || v.created_at::text
    FROM vehicles v
    JOIN service_orders so ON v.id = so.vehicle_id
    JOIN quotes q ON so.id = q.service_order_id
    WHERE q.id = '$QUOTE_ID'
    " | grep -v '^$'
    echo ""
}

# Função para exibir timeline
show_timeline() {
    echo "📋 Últimas 3 Entradas da Timeline:"
    psql "$DB_URL" -c "
    SELECT 
      LEFT(status, 50) as status,
      created_at
    FROM vehicle_history vh
    JOIN service_orders so ON vh.vehicle_id = so.vehicle_id
    JOIN quotes q ON so.id = q.service_order_id
    WHERE q.id = '$QUOTE_ID'
    ORDER BY vh.created_at DESC
    LIMIT 3;
    " | head -10
    echo ""
}

# 1. Mostrar estado atual
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  ANTES DE SALVAR O CHECKLIST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
show_current_status
show_timeline

# 2. Instruções
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  AÇÕES NECESSÁRIAS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Agora você deve:"
echo ""
echo "  1. Acessar: http://localhost:3000/dashboard/partner/checklist?quoteId=$QUOTE_ID"
echo "     Login: mecanica@parceiro.com"
echo "     Senha: 123qwe"
echo ""
echo "  2. Preencher o checklist:"
echo "     - Adicionar/verificar fotos (evidências)"
echo "     - Marcar itens como OK ou NOK"
echo "     - Adicionar observações se necessário"
echo ""
echo "  3. Clicar em 'Salvar Checklist'"
echo ""
echo "  4. Aguardar mensagem de sucesso"
echo ""
read -p "Pressione ENTER após salvar o checklist..."
echo ""

# 3. Verificar resultado
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  DEPOIS DE SALVAR O CHECKLIST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
show_current_status
show_timeline

# 4. Verificar se mudou
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  VALIDAÇÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

CURRENT_STATUS=$(psql "$DB_URL" -t -c "
SELECT v.status
FROM vehicles v
JOIN service_orders so ON v.id = so.vehicle_id
JOIN quotes q ON so.id = q.service_order_id
WHERE q.id = '$QUOTE_ID'
" | xargs)

if [ "$CURRENT_STATUS" = "FASE ORÇAMENTÁRIA" ]; then
    echo "✅ SUCESSO! Status atualizado para 'FASE ORÇAMENTÁRIA'"
else
    echo "❌ ATENÇÃO! Status atual: '$CURRENT_STATUS'"
    echo "   Esperado: 'FASE ORÇAMENTÁRIA'"
    echo ""
    echo "   Possíveis causas:"
    echo "   - O checklist não foi salvo corretamente"
    echo "   - Houve erro na atualização (verifique logs)"
    echo "   - O servidor não está rodando a versão atualizada"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Verificar Logs do Servidor"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Procure por:"
echo "  ✅ 'vehicle_status_updated' - Status atualizado com sucesso"
echo "  ❌ 'vehicle_status_update_error' - Erro ao atualizar status"
echo ""
