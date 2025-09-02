#!/bin/bash

echo "=== Guia de Teste: Validação do Fluxo de Orçamentos ==="
echo "Script informativo - não modifica o banco de dados"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎯 OBJETIVO DO TESTE${NC}"
echo "===================="

echo -e "${CYAN}Validar se quando uma análise de veículo é finalizada,"
echo -e "o parceiro de mecânica recebe automaticamente uma solicitação de orçamento.${NC}"
echo ""

echo -e "${BLUE}📋 PRÉ-REQUISITOS${NC}"
echo "==================="

echo -e "${YELLOW}Antes de executar os testes, certifique-se de:${NC}"
echo "  ✅ Servidor Next.js está rodando (npm run dev)"
echo "  ✅ Supabase está ativo"
echo "  ✅ Existe pelo menos:"
echo "     • 1 cliente com veículo"
echo "     • 1 especialista"
echo "     • 1 parceiro com categoria 'mechanics'"
echo ""

echo -e "${BLUE}🔄 FLUXO DE TESTE MANUAL${NC}"
echo "==========================="

echo -e "${CYAN}PASSO 1: Verificar Estado Inicial${NC}"
echo "  • Acesse o dashboard do parceiro"
echo "  • Anote os contadores atuais de orçamentos"
echo "  • Verifique se o parceiro tem categoria 'mechanics' associada"
echo ""

echo -e "${CYAN}PASSO 2: Iniciar Análise como Cliente${NC}"
echo "  • Login como cliente"
echo "  • Vá para a lista de veículos"
echo "  • Solicite análise para um veículo"
echo ""

echo -e "${CYAN}PASSO 3: Processar Análise como Especialista${NC}"
echo "  • Login como especialista"
echo "  • Localize o veículo que precisa de análise"
echo "  • Execute: POST /api/specialist/start-analysis?vehicleId=<ID>"
echo "  • Preencha o checklist da análise"
echo "  • Execute: POST /api/specialist/finalize-checklist?vehicleId=<ID>"
echo ""

echo -e "${CYAN}PASSO 4: Verificar Geração de Orçamento${NC}"
echo "  • Login novamente como parceiro"
echo "  • Acesse o dashboard"
echo "  • Verifique se os contadores de orçamento aumentaram"
echo "  • Confirme que apareceu um novo orçamento pendente"
echo "  • Valide que o orçamento está relacionado à categoria 'mechanics'"
echo ""

echo -e "${BLUE}🧪 TESTES DE ENDPOINTS${NC}"
echo "========================="

echo -e "${YELLOW}Endpoints para testar o fluxo:${NC}"
echo ""

echo -e "${PURPLE}Cliente:${NC}"
echo "  GET  /api/client/vehicles"
echo "  GET  /api/client/vehicle-inspection?vehicleId=<id>"
echo ""

echo -e "${PURPLE}Especialista:${NC}"
echo "  POST /api/specialist/start-analysis?vehicleId=<id>"
echo "  GET  /api/specialist/get-checklist?vehicleId=<id>"
echo "  POST /api/specialist/save-checklist?vehicleId=<id>"
echo "  POST /api/specialist/finalize-checklist?vehicleId=<id>"
echo ""

echo -e "${PURPLE}Parceiro:${NC}"
echo "  GET  /api/partner/dashboard"
echo "  GET  /api/partner/services"
echo ""

echo -e "${BLUE}✅ CRITÉRIOS DE SUCESSO${NC}"
echo "==========================="

echo -e "${GREEN}O teste é considerado bem-sucedido quando:${NC}"
echo "  ✅ Análise é finalizada sem erros"
echo "  ✅ Service Order é criada automaticamente"
echo "  ✅ Quote é gerada para parceiro de mecânica"
echo "  ✅ Parceiro vê orçamento no dashboard"
echo "  ✅ Contadores são atualizados corretamente"
echo ""

echo -e "${BLUE}🔍 DEBUGGING${NC}"
echo "==============="

echo -e "${YELLOW}Se o teste falhar, verifique:${NC}"
echo "  • Logs do servidor Next.js"
echo "  • Tabelas no Supabase:"
echo "    - inspections (finalized = true)"
echo "    - service_orders (source_inspection_id)"
echo "    - quotes (partner_id, service_order_id)"
echo "    - partners_service_categories (category = 'mechanics')"
echo ""

echo -e "${BLUE}📝 REGISTRO DE TESTES${NC}"
echo "========================="

echo -e "${CYAN}Para documentar os testes realizados:${NC}"
echo "  • Data/Hora do teste"
echo "  • Usuário/Perfil utilizado"
echo "  • Endpoint testado"
echo "  • Resultado esperado vs obtido"
echo "  • Logs de erro (se houver)"
echo ""

echo -e "${GREEN}✅ GUIA DE TESTE PRONTO!${NC}"
echo ""
echo -e "${YELLOW}Este script é apenas informativo e não modifica o banco de dados.${NC}"
echo -e "${YELLOW}Use-o como referência para executar os testes manuais.${NC}"
