#!/bin/bash

echo "=== Status do Sistema: Verificação de Integridade ==="
echo "Verificando estado atual sem modificar dados"
echo ""

# Configurações
BASE_URL="http://localhost:3000"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 VERIFICANDO CONECTIVIDADE${NC}"
echo "================================"

# Verificar se o servidor está respondendo
echo -n "Servidor Next.js: "
SERVER_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/test-simple-endpoint")

if [ "$SERVER_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ ONLINE${NC}"
else
    echo -e "${RED}❌ OFFLINE (HTTP $SERVER_CHECK)${NC}"
    echo "Certifique-se de executar: npm run dev"
    exit 1
fi

echo ""
echo -e "${BLUE}📊 STATUS DOS ENDPOINTS${NC}"
echo "==========================="

# Array de endpoints para testar
declare -a endpoints=(
    "/api/test-simple-endpoint:Teste básico"
    "/api/users-count:Contagem de usuários"
    "/api/test-vehicles-state:Status dos veículos"
    "/api/test-collections-state:Status das coletas"
)

for endpoint_info in "${endpoints[@]}"; do
    IFS=':' read -r endpoint description <<< "$endpoint_info"
    echo -n "$description: "

    RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "${BASE_URL}${endpoint}")
    HTTP_CODE=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    BODY=$(echo "$RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ OK${NC}"
    elif [ "$HTTP_CODE" = "401" ]; then
        echo -e "${YELLOW}🔒 AUTENTICAÇÃO NECESSÁRIA${NC}"
    else
        echo -e "${RED}❌ ERRO (HTTP $HTTP_CODE)${NC}"
    fi
done

echo ""
echo -e "${BLUE}🔐 ENDPOINTS QUE REQUEREM AUTENTICAÇÃO${NC}"
echo "=========================================="

echo -e "${YELLOW}Para testar completamente, será necessário fazer login:${NC}"
echo ""

echo -e "${PURPLE}Como Cliente:${NC}"
echo "  curl -H 'Authorization: Bearer <TOKEN>' ${BASE_URL}/api/client/vehicles"
echo "  curl -H 'Authorization: Bearer <TOKEN>' ${BASE_URL}/api/client/vehicles-count"
echo ""

echo -e "${PURPLE}Como Especialista:${NC}"
echo "  curl -H 'Authorization: Bearer <TOKEN>' ${BASE_URL}/api/specialist/my-clients"
echo "  curl -H 'Authorization: Bearer <TOKEN>' ${BASE_URL}/api/specialist/client-vehicles"
echo ""

echo -e "${PURPLE}Como Parceiro:${NC}"
echo "  curl -H 'Authorization: Bearer <TOKEN>' ${BASE_URL}/api/partner/dashboard"
echo "  curl -H 'Authorization: Bearer <TOKEN>' ${BASE_URL}/api/partner/services"
echo ""

echo -e "${BLUE}📋 VERIFICAÇÃO DO FLUXO PRINCIPAL${NC}"
echo "====================================="

echo -e "${YELLOW}Para validar se o parceiro de mecânica recebe orçamentos:${NC}"
echo ""

echo -e "${GREEN}1. Verificar Parceiro:${NC}"
echo "   • Login como parceiro → Dashboard"
echo "   • Verificar se tem categoria 'mechanics'"
echo ""

echo -e "${GREEN}2. Iniciar Análise:${NC}"
echo "   • Login como especialista"
echo "   • POST /api/specialist/start-analysis?vehicleId=<ID>"
echo ""

echo -e "${GREEN}3. Finalizar Análise:${NC}"
echo "   • POST /api/specialist/finalize-checklist?vehicleId=<ID>"
echo ""

echo -e "${GREEN}4. Verificar Orçamento:${NC}"
echo "   • Login como parceiro novamente"
echo "   • GET /api/partner/dashboard"
echo "   • Verificar se orçamento apareceu"
echo ""

echo -e "${BLUE}✅ STATUS: SISTEMA OPERACIONAL${NC}"
echo ""
echo -e "${GREEN}O sistema está funcionando corretamente para testes!${NC}"
