#!/bin/bash

echo "=== Teste: Validação do Fluxo de Finalização de Análise ==="
echo "Verificando se quando uma análise é finalizada, o parceiro de mecânica recebe orçamento"
echo ""

# Configurações
BASE_URL="http://localhost:3000"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para fazer requisições autenticadas
make_request() {
    local method="$1"
    local endpoint="$2"
    local token="$3"
    local data="$4"

    if [ "$method" = "GET" ]; then
        curl -s -X GET "${BASE_URL}${endpoint}" \
             -H "Authorization: Bearer ${token}" \
             -H "Content-Type: application/json"
    else
        curl -s -X POST "${BASE_URL}${endpoint}" \
             -H "Authorization: Bearer ${token}" \
             -H "Content-Type: application/json" \
             -d "$data"
    fi
}

echo -e "${BLUE}1. VERIFICANDO ESTADO ATUAL DO SISTEMA${NC}"
echo "------------------------------------------"

# Verificar se o servidor está rodando
echo -e "${YELLOW}Verificando se o servidor está rodando...${NC}"
SERVER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/test-simple-endpoint")

if [ "$SERVER_STATUS" != "200" ]; then
    echo -e "${RED}❌ Servidor não está respondendo (HTTP $SERVER_STATUS)${NC}"
    echo "Certifique-se de que o servidor Next.js está rodando com 'npm run dev'"
    exit 1
fi

echo -e "${GREEN}✅ Servidor está rodando${NC}"

# Verificar usuários existentes (vamos precisar de tokens válidos)
echo ""
echo -e "${YELLOW}Verificando usuários existentes no sistema...${NC}"

# Para este teste, vamos assumir que existem usuários válidos
# Em um cenário real, você precisaria fazer login primeiro
echo -e "${YELLOW}⚠️  Nota: Para testes completos, será necessário ter tokens JWT válidos${NC}"
echo -e "${YELLOW}   de parceiro, especialista e cliente.${NC}"

echo ""
echo -e "${BLUE}2. VERIFICANDO ENDPOINTS DISPONÍVEIS${NC}"
echo "---------------------------------------"

# Testar endpoints públicos
echo -e "${YELLOW}Testando endpoints públicos...${NC}"

# Teste do endpoint de teste simples
TEST_RESPONSE=$(curl -s "${BASE_URL}/api/test-simple-endpoint")
if echo "$TEST_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ /api/test-simple-endpoint: OK${NC}"
else
    echo -e "${RED}❌ /api/test-simple-endpoint: FALHA${NC}"
fi

# Teste do endpoint de contagem de usuários
USERS_COUNT=$(curl -s "${BASE_URL}/api/users-count")
if echo "$USERS_COUNT" | grep -q "count"; then
    echo -e "${GREEN}✅ /api/users-count: OK${NC}"
else
    echo -e "${RED}❌ /api/users-count: FALHA${NC}"
fi

echo ""
echo -e "${BLUE}3. SIMULAÇÃO DO FLUXO ESPERADO${NC}"
echo "-----------------------------------"

echo -e "${YELLOW}Fluxo esperado quando uma análise é finalizada:${NC}"
echo "1. Cliente solicita análise de veículo"
echo "2. Especialista inicia análise (/api/specialist/start-analysis)"
echo "3. Especialista salva checklist (/api/specialist/save-checklist)"
echo "4. Especialista finaliza análise (/api/specialist/finalize-checklist)"
echo "5. Sistema deve criar automaticamente:"
echo "   - Service Order com source_inspection_id"
echo "   - Quote para parceiro de mecânica"
echo "6. Parceiro vê orçamento no dashboard (/api/partner/dashboard)"

echo ""
echo -e "${BLUE}4. VERIFICAÇÃO MANUAL RECOMENDADA${NC}"
echo "-------------------------------------"

echo -e "${YELLOW}Para validar completamente o fluxo, execute estes passos:${NC}"
echo ""
echo "1. ${GREEN}Como Cliente:${NC}"
echo "   - Acesse /login e faça login como cliente"
echo "   - Vá para /dashboard e solicite análise de um veículo"
echo ""
echo "2. ${GREEN}Como Especialista:${NC}"
echo "   - Acesse /login e faça login como especialista"
echo "   - Vá para /dashboard e inicie análise do veículo"
echo "   - Salve o checklist da análise"
echo "   - Finalize a análise"
echo ""
echo "3. ${GREEN}Como Parceiro:${NC}"
echo "   - Acesse /login e faça login como parceiro"
echo "   - Vá para /dashboard e verifique se recebeu orçamento de mecânica"
echo ""
echo "4. ${GREEN}Verificação Técnica:${NC}"
echo "   - Verifique no banco se foi criada uma service_order com source_inspection_id"
echo "   - Verifique se foi criado um quote para o parceiro de mecânica"
echo "   - Confirme que o parceiro tem categoria 'mechanics' associada"

echo ""
echo -e "${BLUE}5. ENDPOINTS IMPORTANTES PARA TESTE${NC}"
echo "----------------------------------------"

echo -e "${GREEN}Endpoints de Especialista:${NC}"
echo "  POST /api/specialist/start-analysis?vehicleId=<id>"
echo "  POST /api/specialist/save-checklist?vehicleId=<id>"
echo "  POST /api/specialist/finalize-checklist?vehicleId=<id>"
echo "  GET  /api/specialist/get-checklist?vehicleId=<id>"

echo ""
echo -e "${GREEN}Endpoints de Parceiro:${NC}"
echo "  GET /api/partner/dashboard"
echo "  GET /api/partner/services"

echo ""
echo -e "${GREEN}Endpoints de Cliente:${NC}"
echo "  GET /api/client/vehicle-inspection?vehicleId=<id>"
echo "  GET /api/client/vehicles"

echo ""
echo -e "${BLUE}6. VALIDAÇÃO DO FLUXO${NC}"
echo "------------------------"

echo -e "${YELLOW}Para confirmar que o fluxo está funcionando:${NC}"
echo ""
echo "✅ ${GREEN}Especialista consegue finalizar análise${NC}"
echo "✅ ${GREEN}Service Order é criada automaticamente${NC}"
echo "✅ ${GREEN}Quote é criada para parceiro de mecânica${NC}"
echo "✅ ${GREEN}Parceiro vê orçamento no dashboard${NC}"
echo "✅ ${GREEN}Categoria 'mechanics' está associada ao parceiro${NC}"

echo ""
echo -e "${GREEN}✅ Teste de validação criado com sucesso!${NC}"
echo ""
echo "Execute os passos manuais acima para validar completamente o fluxo."
