#!/bin/bash

echo "=== Diagnóstico: Problemas no Contador de Orçamentos ==="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# URL base da API
BASE_URL="http://localhost:3001"

echo -e "${BLUE}🔍 VERIFICANDO CATEGORIAS NO BANCO${NC}"
echo "====================================="

echo -e "${YELLOW}1. Categorias de serviço definidas:${NC}"
curl -s "${BASE_URL}/api/test/check-categories" | jq '.' 2>/dev/null || echo "Endpoint não encontrado"

echo ""
echo -e "${YELLOW}2. Relacionamentos parceiro-categoria:${NC}"
curl -s "${BASE_URL}/api/test/check-partner-categories" | jq '.' 2>/dev/null || echo "Endpoint não encontrado"

echo ""
echo -e "${BLUE}🔍 VERIFICANDO DADOS DE TESTE${NC}"
echo "==============================="

echo -e "${YELLOW}3. Inspeções finalizadas:${NC}"
curl -s "${BASE_URL}/api/test/check-finalized-inspections" | jq '.' 2>/dev/null || echo "Endpoint não encontrado"

echo ""
echo -e "${YELLOW}4. Serviços marcados nas inspeções:${NC}"
curl -s "${BASE_URL}/api/test/check-inspection-services" | jq '.' 2>/dev/null || echo "Endpoint não encontrado"

echo ""
echo -e "${BLUE}🔍 VERIFICANDO LÓGICA DE MATCHING${NC}"
echo "===================================="

echo -e "${YELLOW}5. Problemas identificados:${NC}"
echo ""
echo -e "${RED}❌ INCONSISTÊNCIA NAS CATEGORIAS:${NC}"
echo "   - Frontend usa: 'mechanics', 'bodyPaint', 'washing', 'tires', 'loja', 'patioAtacado'"
echo "   - Banco usa: 'mechanics', 'body_paint', 'washing', 'tires'"
echo "   - Faltam: 'loja', 'patio_atacado' no banco"
echo ""

echo -e "${RED}❌ RELACIONAMENTO PARCEIRO-CATEGORIA:${NC}"
echo "   - Tabela 'partners' NÃO tem campo 'category'"
echo "   - Relacionamento deve ser via 'partners_service_categories'"
echo "   - Script de população pode não estar populando esta tabela"
echo ""

echo -e "${RED}❌ MATCHING DE CATEGORIAS:${NC}"
echo "   - Sistema salva 'mechanics' no inspection_services.category"
echo "   - Mas busca por 'mechanics' na service_categories.key"
echo "   - Precisa matching correto entre inspection_services e service_categories"
echo ""

echo -e "${BLUE}🛠️ CORREÇÕES NECESSÁRIAS${NC}"
echo "=========================="

echo -e "${GREEN}1. Adicionar categorias faltantes no banco:${NC}"
echo "   INSERT INTO service_categories (key, name) VALUES"
echo "   ('loja', 'Loja'),"
echo "   ('patio_atacado', 'Pátio Atacado');"
echo ""

echo -e "${GREEN}2. Corrigir nomes das categorias no frontend:${NC}"
echo "   - 'bodyPaint' → 'body_paint'"
echo "   - 'patioAtacado' → 'patio_atacado'"
echo ""

echo -e "${GREEN}3. Popular tabela partners_service_categories:${NC}"
echo "   - Associar parceiros às suas categorias"
echo "   - Verificar se script de população está fazendo isso"
echo ""

echo -e "${GREEN}4. Corrigir lógica de matching no finalize-checklist:${NC}"
echo "   - Buscar service_categories por key"
echo "   - Encontrar partners via partners_service_categories"
echo "   - Criar service_orders e quotes corretamente"
echo ""

echo -e "${BLUE}🧪 TESTE MANUAL${NC}"
echo "================="

echo -e "${YELLOW}Para testar manualmente:${NC}"
echo "1. Vá para uma inspeção existente"
echo "2. Marque 'Mecânica' como necessária"
echo "3. Finalize a inspeção"
echo "4. Verifique se parceiro de mecânica recebeu orçamento"
echo "5. Verifique contador no dashboard do parceiro"
echo ""

echo -e "${GREEN}✅ DIAGNÓSTICO CONCLUÍDO${NC}"
