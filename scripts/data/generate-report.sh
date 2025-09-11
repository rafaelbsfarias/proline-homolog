#!/bin/bash

echo "=== Relatório Consolidado: Parceiros e Análises ==="
echo "Gerando relatório completo dos dados do sistema..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para consultar o banco
query_db() {
    local query="$1"
    psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "$query" 2>/dev/null
}

# Verificar conexão com banco
if ! psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${RED}❌ Erro na conexão com o banco de dados${NC}"
    exit 1
fi

echo -e "${BLUE}📊 RELATÓRIO CONSOLIDADO${NC}"
echo "========================================"
echo ""

# 1. RESUMO GERAL
echo -e "${CYAN}1. RESUMO GERAL${NC}"
echo "----------------"

TOTAL_PARTNERS=$(query_db "SELECT COUNT(*) FROM public.partners;")
ACTIVE_PARTNERS=$(query_db "SELECT COUNT(*) FROM public.partners WHERE is_active = true;")
TOTAL_CLIENTS=$(query_db "SELECT COUNT(*) FROM public.clients;")
TOTAL_VEHICLES=$(query_db "SELECT COUNT(*) FROM public.vehicles;")
TOTAL_INSPECTIONS=$(query_db "SELECT COUNT(*) FROM public.inspections;")
FINALIZED_INSPECTIONS=$(query_db "SELECT COUNT(*) FROM public.inspections WHERE finalized = true;")
TOTAL_SERVICE_ORDERS=$(query_db "SELECT COUNT(*) FROM public.service_orders;")
TOTAL_QUOTES=$(query_db "SELECT COUNT(*) FROM public.quotes;")

echo -e "🏢 Parceiros: ${GREEN}$TOTAL_PARTNERS${NC} (${GREEN}$ACTIVE_PARTNERS${NC} ativos)"
echo -e "👥 Clientes: ${GREEN}$TOTAL_CLIENTS${NC}"
echo -e "🚗 Veículos: ${GREEN}$TOTAL_VEHICLES${NC}"
echo -e "📋 Inspeções: ${GREEN}$TOTAL_INSPECTIONS${NC} (${GREEN}$FINALIZED_INSPECTIONS${NC} finalizadas)"
echo -e "🔧 Ordens de Serviço: ${GREEN}$TOTAL_SERVICE_ORDERS${NC}"
echo -e "💰 Orçamentos: ${GREEN}$TOTAL_QUOTES${NC}"
echo ""

# 2. ANÁLISE DE PARCEIROS
echo -e "${CYAN}2. ANÁLISE DE PARCEIROS${NC}"
echo "----------------------"

if [ "$TOTAL_PARTNERS" -gt 0 ]; then
    PARTNER_DETAILS=$(query_db "
        SELECT
            p.company_name,
            pr.full_name,
            p.cnpj,
            p.is_active,
            COUNT(DISTINCT psc.category_id) as categorias,
            COUNT(DISTINCT q.id) as orcamentos,
            COALESCE(SUM(q.total_value), 0) as valor_total
        FROM public.partners p
        JOIN public.profiles pr ON p.profile_id = pr.id
        LEFT JOIN public.partners_service_categories psc ON p.profile_id = psc.partner_id
        LEFT JOIN public.quotes q ON p.profile_id = q.partner_id
        GROUP BY p.profile_id, p.company_name, pr.full_name, p.cnpj, p.is_active
        ORDER BY valor_total DESC;
    ")

    echo "$PARTNER_DETAILS" | while IFS='|' read -r company name cnpj active categorias orcamentos valor; do
        echo -e "🏢 ${PURPLE}$company${NC}"
        echo -e "   👤 Responsável: $name"
        echo -e "   📄 CNPJ: $cnpj"
        echo -e "   ✅ Ativo: $active"
        echo -e "   📂 Categorias: ${GREEN}$categorias${NC}"
        echo -e "   💰 Orçamentos: ${GREEN}$orcamentos${NC}"
        echo -e "   💵 Valor Total: R$ ${GREEN}$valor${NC}"
        echo ""
    done
else
    echo -e "${YELLOW}⚠️  Nenhum parceiro cadastrado${NC}"
    echo ""
fi

# 3. CATEGORIAS DE SERVIÇO
echo -e "${CYAN}3. CATEGORIAS DE SERVIÇO${NC}"
echo "------------------------"

CATEGORY_ANALYSIS=$(query_db "
    SELECT
        sc.name as categoria,
        sc.key,
        COUNT(DISTINCT psc.partner_id) as parceiros,
        COUNT(DISTINCT i.id) as inspections_finalizadas,
        COUNT(DISTINCT is2.id) as servicos_identificados,
        COUNT(DISTINCT so.id) as ordens_servico,
        COUNT(DISTINCT q.id) as orcamentos
    FROM public.service_categories sc
    LEFT JOIN public.partners_service_categories psc ON sc.id = psc.category_id
    LEFT JOIN public.inspection_services is2 ON sc.id = is2.category_id
    LEFT JOIN public.inspections i ON is2.inspection_id = i.id AND i.finalized = true
    LEFT JOIN public.service_orders so ON sc.id = so.category_id
    LEFT JOIN public.quotes q ON so.id = q.service_order_id
    GROUP BY sc.id, sc.name, sc.key
    ORDER BY servicos_identificados DESC;
")

echo "$CATEGORY_ANALYSIS" | while IFS='|' read -r categoria key parceiros inspections servicos ordens orcamentos; do
    echo -e "📂 ${PURPLE}$categoria${NC} (${key})"
    echo -e "   🏢 Parceiros: ${GREEN}$parceiros${NC}"
    echo -e "   📋 Inspeções: ${GREEN}$inspections${NC}"
    echo -e "   🔧 Serviços: ${GREEN}$servicos${NC}"
    echo -e "   📝 Ordens: ${GREEN}$ordens${NC}"
    echo -e "   💰 Orçamentos: ${GREEN}$orcamentos${NC}"
    echo ""
done

# 4. STATUS DOS ORÇAMENTOS
echo -e "${CYAN}4. STATUS DOS ORÇAMENTOS${NC}"
echo "-----------------------"

QUOTE_STATUS=$(query_db "
    SELECT
        status,
        COUNT(*) as quantidade,
        COALESCE(SUM(total_value), 0) as valor_total,
        ROUND(AVG(total_value), 2) as valor_medio
    FROM public.quotes
    GROUP BY status
    ORDER BY quantidade DESC;
")

if [ -n "$QUOTE_STATUS" ]; then
    echo "$QUOTE_STATUS" | while IFS='|' read -r status quantidade valor_total valor_medio; do
        echo -e "📊 ${PURPLE}$status${NC}: ${GREEN}$quantidade${NC} orçamentos"
        echo -e "   💵 Valor Total: R$ ${GREEN}$valor_total${NC}"
        echo -e "   📈 Valor Médio: R$ ${GREEN}$valor_medio${NC}"
        echo ""
    done
else
    echo -e "${YELLOW}⚠️  Nenhum orçamento encontrado${NC}"
    echo ""
fi

# 5. ANÁLISES FINALIZADAS RECENTES
echo -e "${CYAN}5. ANÁLISES FINALIZADAS RECENTES${NC}"
echo "---------------------------------"

RECENT_INSPECTIONS=$(query_db "
    SELECT
        i.id,
        v.plate,
        v.brand || ' ' || v.model as vehicle,
        pr.full_name as client,
        i.created_at,
        i.updated_at,
        COUNT(is2.id) as servicos_identificados
    FROM public.inspections i
    JOIN public.vehicles v ON i.vehicle_id = v.id
    JOIN public.profiles pr ON v.client_id = pr.id
    LEFT JOIN public.inspection_services is2 ON i.id = is2.inspection_id
    WHERE i.finalized = true
    GROUP BY i.id, v.plate, v.brand, v.model, pr.full_name, i.created_at, i.updated_at
    ORDER BY i.updated_at DESC
    LIMIT 5;
")

if [ -n "$RECENT_INSPECTIONS" ]; then
    echo "$RECENT_INSPECTIONS" | while IFS='|' read -r id plate vehicle client created updated servicos; do
        echo -e "📋 ${PURPLE}$plate${NC} - $vehicle"
        echo -e "   👤 Cliente: $client"
        echo -e "   🔧 Serviços: ${GREEN}$servicos${NC}"
        echo -e "   📅 Criada: $created"
        echo -e "   ✅ Finalizada: $updated"
        echo ""
    done
else
    echo -e "${YELLOW}⚠️  Nenhuma inspeção finalizada encontrada${NC}"
    echo ""
fi

# 6. TOP PARCEIROS POR PERFORMANCE
echo -e "${CYAN}6. TOP PARCEIROS POR PERFORMANCE${NC}"
echo "---------------------------------"

TOP_PARTNERS=$(query_db "
    SELECT
        p.company_name,
        COUNT(DISTINCT q.id) as orcamentos_aprovados,
        COALESCE(SUM(q.total_value), 0) as valor_total,
        COUNT(DISTINCT so.id) as ordens_concluidas,
        ROUND(AVG(q.total_value), 2) as ticket_medio
    FROM public.partners part
    JOIN public.profiles p ON part.profile_id = p.id
    LEFT JOIN public.quotes q ON part.profile_id = q.partner_id AND q.status = 'approved'
    LEFT JOIN public.service_orders so ON q.service_order_id = so.id AND so.status = 'completed'
    WHERE part.is_active = true
    GROUP BY part.profile_id, p.company_name
    HAVING COUNT(DISTINCT q.id) > 0
    ORDER BY valor_total DESC
    LIMIT 5;
")

if [ -n "$TOP_PARTNERS" ]; then
    echo "$TOP_PARTNERS" | while IFS='|' read -r company orcamentos_aprovados valor_total ordens_concluidas ticket_medio; do
        echo -e "🏆 ${PURPLE}$company${NC}"
        echo -e "   ✅ Orçamentos Aprovados: ${GREEN}$orcamentos_aprovados${NC}"
        echo -e "   💵 Valor Total: R$ ${GREEN}$valor_total${NC}"
        echo -e "   🔧 Ordens Concluídas: ${GREEN}$ordens_concluidas${NC}"
        echo -e "   📈 Ticket Médio: R$ ${GREEN}$ticket_medio${NC}"
        echo ""
    done
else
    echo -e "${YELLOW}⚠️  Nenhum dado de performance encontrado${NC}"
    echo ""
fi

# 7. RECOMENDAÇÕES
echo -e "${CYAN}7. RECOMENDAÇÕES${NC}"
echo "----------------"

# Verificar parceiros sem categorias
PARTNERS_WITHOUT_CATEGORIES=$(query_db "
    SELECT COUNT(*)
    FROM public.partners p
    WHERE NOT EXISTS (
        SELECT 1 FROM public.partners_service_categories psc
        WHERE psc.partner_id = p.profile_id
    );
")

if [ "$PARTNERS_WITHOUT_CATEGORIES" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $PARTNERS_WITHOUT_CATEGORIES parceiro(s) sem categorias associadas${NC}"
fi

# Verificar inspeções não finalizadas antigas
OLD_PENDING_INSPECTIONS=$(query_db "
    SELECT COUNT(*)
    FROM public.inspections
    WHERE finalized = false
    AND created_at < NOW() - INTERVAL '7 days';
")

if [ "$OLD_PENDING_INSPECTIONS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $OLD_PENDING_INSPECTIONS inspeção(ões) pendente(s) há mais de 7 dias${NC}"
fi

# Verificar orçamentos pendentes
PENDING_QUOTES=$(query_db "
    SELECT COUNT(*)
    FROM public.quotes
    WHERE status IN ('pending_admin_approval', 'pending_client_approval');
")

if [ "$PENDING_QUOTES" -gt 0 ]; then
    echo -e "${BLUE}ℹ️  $PENDING_QUOTES orçamento(s) aguardando aprovação${NC}"
fi

echo ""
echo -e "${GREEN}✅ Relatório gerado com sucesso!${NC}"
echo ""
echo "Para executar testes específicos:"
echo "  ./scripts/test-partner-categories.sh"
echo "  ./scripts/test-finalized-inspections.sh"
echo "  ./scripts/test-all.sh"
echo ""
echo "Para criar dados de teste:"
echo "  ./scripts/create-test-data.sh"
