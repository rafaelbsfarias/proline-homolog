#!/bin/bash

echo "=== Testes Combinados: Parceiros e Análises Finalizadas ==="
echo "Executando todos os testes de verificação..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar se o banco está acessível
check_db_connection() {
    echo -e "${BLUE}🔍 Verificando conexão com o banco de dados...${NC}"

    if psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT 1;" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Conexão com banco estabelecida${NC}"
        return 0
    else
        echo -e "${RED}❌ Erro na conexão com o banco de dados${NC}"
        echo "Verifique se o Supabase está rodando na porta 54322"
        return 1
    fi
}

# Verificar conexão com banco
if ! check_db_connection; then
    exit 1
fi

echo ""
echo "========================================"
echo "1. TESTE: CATEGORIAS DOS PARCEIROS"
echo "========================================"

# Executar teste de categorias dos parceiros
if [ -f "/home/rafael/workspace/proline-homolog/scripts/test-partner-categories.sh" ]; then
    bash /home/rafael/workspace/proline-homolog/scripts/test-partner-categories.sh
else
    echo -e "${RED}❌ Script test-partner-categories.sh não encontrado${NC}"
fi

echo ""
echo "========================================"
echo "2. TESTE: ANÁLISES FINALIZADAS"
echo "========================================"

# Executar teste de inspeções finalizadas
if [ -f "/home/rafael/workspace/proline-homolog/scripts/test-finalized-inspections.sh" ]; then
    bash /home/rafael/workspace/proline-homolog/scripts/test-finalized-inspections.sh
else
    echo -e "${RED}❌ Script test-finalized-inspections.sh não encontrado${NC}"
fi

echo ""
echo "========================================"
echo "3. RESUMO EXECUTIVO"
echo "========================================"

# Função para consultar o banco
query_db() {
    local query="$1"
    psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "$query" 2>/dev/null
}

echo -e "${BLUE}📊 RESUMO DOS DADOS:${NC}"
echo ""

# Contagem de parceiros
PARTNERS_COUNT=$(query_db "SELECT COUNT(*) FROM public.partners;")
echo -e "🏢 Total de Parceiros: ${GREEN}$PARTNERS_COUNT${NC}"

# Contagem de parceiros ativos
ACTIVE_PARTNERS=$(query_db "SELECT COUNT(*) FROM public.partners WHERE is_active = true;")
echo -e "✅ Parceiros Ativos: ${GREEN}$ACTIVE_PARTNERS${NC}"

# Contagem de inspeções finalizadas
FINALIZED_INSPECTIONS=$(query_db "SELECT COUNT(*) FROM public.inspections WHERE finalized = true;")
echo -e "📋 Inspeções Finalizadas: ${GREEN}$FINALIZED_INSPECTIONS${NC}"

# Contagem de ordens de serviço
SERVICE_ORDERS=$(query_db "SELECT COUNT(*) FROM public.service_orders;")
echo -e "🔧 Ordens de Serviço: ${GREEN}$SERVICE_ORDERS${NC}"

# Contagem de orçamentos
QUOTES_COUNT=$(query_db "SELECT COUNT(*) FROM public.quotes;")
echo -e "💰 Orçamentos: ${GREEN}$QUOTES_COUNT${NC}"

# Categorias mais utilizadas
TOP_CATEGORIES=$(query_db "
    SELECT sc.name, COUNT(is2.id) as usage_count
    FROM public.service_categories sc
    LEFT JOIN public.inspection_services is2 ON sc.id = is2.category_id
    GROUP BY sc.id, sc.name
    ORDER BY usage_count DESC
    LIMIT 3;
")

echo ""
echo -e "${BLUE}🏆 Top 3 Categorias de Serviço:${NC}"
echo "$TOP_CATEGORIES" | while IFS='|' read -r name count; do
    echo -e "   • $name: ${GREEN}$count${NC} serviços"
done

echo ""
echo -e "${GREEN}✅ Todos os testes foram executados!${NC}"
echo ""
echo "Para executar testes individuais:"
echo "  ./scripts/test-partner-categories.sh"
echo "  ./scripts/test-finalized-inspections.sh"
