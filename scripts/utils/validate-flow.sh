#!/bin/bash

echo "=== Validação do Fluxo: Análise Finalizada → Orçamento para Parceiro ==="
echo "Testando endpoints sem modificar o estado do banco de dados"
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

echo -e "${BLUE}🔍 VERIFICANDO ENDPOINTS DISPONÍVEIS${NC}"
echo "========================================"

# Testar endpoints que não requerem autenticação
echo -e "${YELLOW}Testando endpoints públicos...${NC}"

# 1. Teste do endpoint simples
echo -n "  /api/test-simple-endpoint: "
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "${BASE_URL}/api/test-simple-endpoint")
HTTP_CODE=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
BODY=$(echo "$RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')

if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q "success"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FALHA (HTTP $HTTP_CODE)${NC}"
fi

# 2. Teste do endpoint de contagem de usuários
echo -n "  /api/users-count: "
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "${BASE_URL}/api/users-count")
HTTP_CODE=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
BODY=$(echo "$RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')

if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q "count"; then
    USER_COUNT=$(echo "$BODY" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✅ OK (${USER_COUNT} usuários)${NC}"
else
    echo -e "${RED}❌ FALHA (HTTP $HTTP_CODE)${NC}"
fi

echo ""
echo -e "${BLUE}📋 ENDPOINTS QUE REQUEREM AUTENTICAÇÃO${NC}"
echo "=========================================="

echo -e "${YELLOW}Estes endpoints requerem tokens JWT válidos:${NC}"
echo ""

echo -e "${PURPLE}Endpoints de Cliente:${NC}"
echo "  GET  /api/client/vehicles"
echo "  GET  /api/client/vehicle-inspection?vehicleId=<id>"
echo "  GET  /api/client/vehicles-count"
echo ""

echo -e "${PURPLE}Endpoints de Especialista:${NC}"
echo "  POST /api/specialist/start-analysis?vehicleId=<id>"
echo "  GET  /api/specialist/get-checklist?vehicleId=<id>"
echo "  POST /api/specialist/save-checklist?vehicleId=<id>"
echo "  POST /api/specialist/finalize-checklist?vehicleId=<id>"
echo ""

echo -e "${PURPLE}Endpoints de Parceiro:${NC}"
echo "  GET  /api/partner/dashboard"
echo "  GET  /api/partner/services"
echo ""

echo -e "${BLUE}🔄 FLUXO ESPERADO DE VALIDAÇÃO MANUAL${NC}"
echo "=========================================="

echo -e "${YELLOW}Para validar se o parceiro de mecânica recebe orçamentos quando análises são finalizadas:${NC}"
echo ""

echo -e "${GREEN}PASSO 1: Verificar Parceiro de Mecânica${NC}"
echo "  • Faça login como parceiro no sistema"
echo "  • Acesse /api/partner/dashboard"
echo "  • Verifique se o parceiro tem categoria 'mechanics' associada"
echo "  • Anote o ID do parceiro"
echo ""

echo -e "${GREEN}PASSO 2: Verificar Veículos com Análises${NC}"
echo "  • Faça login como cliente no sistema"
echo "  • Acesse /api/client/vehicles"
echo "  • Identifique veículos que precisam de análise"
echo "  • Anote o ID de um veículo"
echo ""

echo -e "${GREEN}PASSO 3: Simular Análise como Especialista${NC}"
echo "  • Faça login como especialista no sistema"
echo "  • Use POST /api/specialist/start-analysis?vehicleId=<VEHICLE_ID>"
echo "  • Use POST /api/specialist/finalize-checklist?vehicleId=<VEHICLE_ID>"
echo ""

echo -e "${GREEN}PASSO 4: Verificar se Orçamento foi Criado${NC}"
echo "  • Faça login novamente como parceiro"
echo "  • Acesse /api/partner/dashboard"
echo "  • Verifique se apareceu um novo orçamento na seção 'budget_counters'"
echo "  • Confirme que o orçamento está relacionado à categoria 'mechanics'"
echo ""

echo -e "${BLUE}✅ VALIDAÇÃO DO SUCESSO${NC}"
echo "=========================="

echo -e "${GREEN}O fluxo está funcionando corretamente se:${NC}"
echo "  ✅ Especialista consegue finalizar análise (sem erros)"
echo "  ✅ Parceiro vê novo orçamento no dashboard após finalização"
echo "  ✅ Orçamento criado tem categoria 'mechanics'"
echo "  ✅ Contadores de orçamento são atualizados corretamente"
echo ""

echo -e "${BLUE}🛠️  FERRAMENTAS DE DEBUG${NC}"
echo "==========================="

echo -e "${YELLOW}Para debugar o fluxo, verifique:${NC}"
echo "  • Logs do servidor Next.js"
echo "  • Tabelas: inspections, inspection_services, service_orders, quotes"
echo "  • Relacionamentos: source_inspection_id, partner_id, category_id"
echo ""

echo -e "${GREEN}✅ Script de validação criado com sucesso!${NC}"
echo ""
echo "Este script não modifica o banco de dados, apenas testa endpoints e fornece"
echo "instruções para validação manual do fluxo de análise → orçamento."
