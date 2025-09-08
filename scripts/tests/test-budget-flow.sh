#!/bin/bash

echo "=== Teste do Fluxo de Finalização de Análise ==="
echo "Testando se service orders e quotes são criados automaticamente"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL base da API
BASE_URL="http://localhost:3000"

# Função para fazer query no banco
query_db() {
    local query="$1"
    psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "$query" 2>/dev/null
}

# Verificar se o servidor está rodando
echo -e "${BLUE}🔍 Verificando servidor...${NC}"
server_check=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}")

if [ "$server_check" != "200" ]; then
    echo -e "${RED}❌ Servidor não está rodando em ${BASE_URL}${NC}"
    echo -e "${YELLOW}💡 Execute 'npm run dev' primeiro${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Servidor está rodando!${NC}"
echo ""

# Verificar dados existentes
echo -e "${BLUE}📊 VERIFICANDO DADOS EXISTENTES${NC}"
echo "==================================="

# Verificar inspeções finalizadas
FINALIZED_INSPECTIONS=$(query_db "SELECT COUNT(*) FROM public.inspections WHERE finalized = true;")
echo -e "🔍 Inspeções finalizadas: ${GREEN}$FINALIZED_INSPECTIONS${NC}"

# Verificar service orders
SERVICE_ORDERS=$(query_db "SELECT COUNT(*) FROM public.service_orders;")
echo -e "📋 Service Orders: ${GREEN}$SERVICE_ORDERS${NC}"

# Verificar quotes
QUOTES=$(query_db "SELECT COUNT(*) FROM public.quotes;")
echo -e "💰 Quotes: ${GREEN}$QUOTES${NC}"

# Verificar parceiros com categoria mechanics
MECHANICS_PARTNERS=$(query_db "
SELECT COUNT(DISTINCT psc.partner_id)
FROM public.partners_service_categories psc
JOIN public.service_categories sc ON psc.category_id = sc.id
WHERE sc.key = 'mechanics';
")
echo -e "🔧 Parceiros de mecânica: ${GREEN}$MECHANICS_PARTNERS${NC}"

echo ""

# Verificar se há inspeções finalizadas com serviços marcados
echo -e "${BLUE}🔍 VERIFICANDO INSPEÇÕES FINALIZADAS COM SERVIÇOS${NC}"
echo "====================================================="

INSPECTIONS_WITH_SERVICES=$(query_db "
SELECT
    i.id as inspection_id,
    v.plate,
    COUNT(is2.id) as services_count,
    STRING_AGG(DISTINCT is2.category, ', ') as categories
FROM public.inspections i
JOIN public.vehicles v ON i.vehicle_id = v.id
LEFT JOIN public.inspection_services is2 ON i.id = is2.inspection_id AND is2.required = true
WHERE i.finalized = true
GROUP BY i.id, v.plate
HAVING COUNT(is2.id) > 0
ORDER BY i.created_at DESC
LIMIT 5;
")

if [ -z "$INSPECTIONS_WITH_SERVICES" ]; then
    echo -e "${YELLOW}⚠️  Nenhuma inspeção finalizada com serviços marcados encontrada${NC}"
    echo ""
    echo -e "${BLUE}💡 PARA TESTAR:${NC}"
    echo "1. Faça login como especialista"
    echo "2. Vá para um veículo e inicie uma análise"
    echo "3. Marque alguns serviços como necessários (ex: mechanics)"
    echo "4. Finalize a análise"
    echo "5. Execute este script novamente"
    exit 0
fi

echo -e "${GREEN}✅ Inspeções finalizadas encontradas:${NC}"
echo "$INSPECTIONS_WITH_SERVICES" | while IFS='|' read -r inspection_id plate services_count categories; do
    echo -e "  📋 ID: $inspection_id | Placa: $plate | Serviços: $services_count | Categorias: $categories"

    # Verificar se foi criada service order para esta inspeção
    SERVICE_ORDER_COUNT=$(query_db "SELECT COUNT(*) FROM public.service_orders WHERE source_inspection_id = '$inspection_id';")
    echo -e "    📄 Service Orders criadas: ${SERVICE_ORDER_COUNT}"

    # Verificar quotes criadas
    QUOTES_COUNT=$(query_db "
    SELECT COUNT(*)
    FROM public.quotes q
    JOIN public.service_orders so ON q.service_order_id = so.id
    WHERE so.source_inspection_id = '$inspection_id';
    ")
    echo -e "    💰 Quotes criadas: ${QUOTES_COUNT}"

    echo ""
done

echo -e "${BLUE}🎯 RESULTADO DO TESTE${NC}"
echo "======================="

if [ "$SERVICE_ORDERS" -gt 0 ] && [ "$QUOTES" -gt 0 ]; then
    echo -e "${GREEN}✅ SUCESSO! O fluxo está funcionando:${NC}"
    echo -e "  • Service Orders estão sendo criadas"
    echo -e "  • Quotes estão sendo geradas para parceiros"
    echo -e "  • O contador de solicitações de orçamento deve aparecer no dashboard do parceiro"
else
    echo -e "${RED}❌ PROBLEMA DETECTADO:${NC}"
    echo -e "  • Service Orders não estão sendo criadas automaticamente"
    echo -e "  • Quotes não estão sendo geradas"
    echo -e "  • Verifique os logs do servidor para erros"
fi

echo ""
echo -e "${BLUE}🔧 DEBUGGING${NC}"
echo "=============="
echo -e "${YELLOW}Se o teste falhar, verifique:${NC}"
echo "  • Logs do servidor Next.js (npm run dev)"
echo "  • Tabela inspection_services tem required=true"
echo "  • Parceiros estão associados às categorias corretas"
echo "  • Permissões RLS no Supabase"
