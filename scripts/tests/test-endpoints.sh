#!/bin/bash

echo "=== Teste de Endpoints Seguros ==="
echo "Script que testa endpoints sem modificar dados"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL base do servidor
BASE_URL="http://localhost:3000"

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3

    echo -e "${BLUE}Testando: ${description}${NC}"
    echo -e "${YELLOW}${method} ${endpoint}${NC}"

    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${endpoint}")
    else
        echo -e "${RED}Método ${method} não suportado neste script seguro${NC}"
        return 1
    fi

    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ Sucesso (HTTP ${response})${NC}"
    elif [ "$response" = "401" ]; then
        echo -e "${YELLOW}⚠️  Autenticação necessária (HTTP ${response})${NC}"
    elif [ "$response" = "404" ]; then
        echo -e "${RED}❌ Endpoint não encontrado (HTTP ${response})${NC}"
    else
        echo -e "${RED}❌ Erro (HTTP ${response})${NC}"
    fi

    echo ""
}

# Verificar se o servidor está rodando
echo -e "${BLUE}🔍 Verificando se o servidor está rodando...${NC}"
server_check=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}")

if [ "$server_check" != "200" ]; then
    echo -e "${RED}❌ Servidor não está respondendo em ${BASE_URL}${NC}"
    echo -e "${YELLOW}💡 Execute 'npm run dev' para iniciar o servidor${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Servidor está rodando!${NC}"
echo ""

# Testes de endpoints públicos (sem autenticação)
echo -e "${BLUE}🌐 TESTANDO ENDPOINTS PÚBLICOS${NC}"
echo "=================================="

test_endpoint "GET" "/" "Página inicial"
test_endpoint "GET" "/login" "Página de login"
test_endpoint "GET" "/cadastro" "Página de cadastro"

# Testes de endpoints que requerem autenticação
echo -e "${BLUE}🔐 TESTANDO ENDPOINTS PROTEGIDOS${NC}"
echo "===================================="

echo -e "${YELLOW}⚠️  Estes endpoints requerem autenticação JWT${NC}"
echo -e "${YELLOW}💡 Use um token válido no header Authorization${NC}"
echo ""

test_endpoint "GET" "/api/auth/callback" "Callback de autenticação"
test_endpoint "GET" "/api/users-count" "Contagem de usuários"

# Testes específicos do fluxo
echo -e "${BLUE}🚗 TESTANDO ENDPOINTS DO FLUXO${NC}"
echo "================================="

echo -e "${YELLOW}Endpoints relacionados ao fluxo de análise/orçamento:${NC}"
echo ""

# Cliente
test_endpoint "GET" "/api/client/vehicles" "Lista de veículos do cliente"
test_endpoint "GET" "/api/client/vehicle-inspection?vehicleId=1" "Inspeção de veículo"

# Especialista
test_endpoint "GET" "/api/specialist/get-checklist?vehicleId=1" "Checklist do especialista"

# Parceiro
test_endpoint "GET" "/api/partner/dashboard" "Dashboard do parceiro"
test_endpoint "GET" "/api/partner/services" "Serviços do parceiro"

# Admin
test_endpoint "GET" "/api/admin/pendentes" "Pendências do admin"
test_endpoint "GET" "/api/admin/usuarios" "Usuários do admin"

echo -e "${GREEN}✅ TESTES CONCLUÍDOS!${NC}"
echo ""
echo -e "${YELLOW}💡 Para testar endpoints que modificam dados:${NC}"
echo -e "${YELLOW}   Use o guia em test-guide.sh para testes manuais${NC}"
echo ""
echo -e "${BLUE}📊 RESUMO${NC}"
echo "=========="
echo -e "${CYAN}Este script testou apenas endpoints GET seguros${NC}"
echo -e "${CYAN}Nenhum dado foi modificado no banco de dados${NC}"
echo -e "${CYAN}Para testes completos, siga o guia manual${NC}"
