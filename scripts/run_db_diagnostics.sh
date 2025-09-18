#!/bin/bash

# Orquestrador de Diagnóstico do Banco de Dados
# Executa os principais scripts de análise para um "raio-x" completo.

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 INICIANDO RAIO-X COMPLETO DO BANCO DE DADOS...${NC}"
echo "========================================================"
echo ""

# --- ETAPA 1: VERIFICAÇÃO RÁPIDA DE STATUS ---
echo -e "${YELLOW}--- ETAPA 1: Verificação Rápida de Status do Sistema ---${NC}"
./scripts/maintenance/check-system-status.sh
echo ""
echo "--------------------------------------------------------"
echo ""

# --- ETAPA 2: ANÁLISE PROFUNDA DO ESTADO DO BANCO (PG) ---
echo -e "${YELLOW}--- ETAPA 2: Análise Profunda do Estado do Banco (Recomendado) ---${NC}"
node ./scripts/maintenance/check-database-state-pg.js
echo ""
echo "--------------------------------------------------------"
echo ""

# --- ETAPA 3: INVESTIGAÇÃO DE INCONSISTÊNCIAS LÓGICAS ---
echo -e "${YELLOW}--- ETAPA 3: Investigação de Inconsistências Lógicas ---${NC}"
node ./scripts/maintenance/investigate-inconsistencies.js
echo ""
echo "--------------------------------------------------------"
echo ""

# --- ETAPA 4: ANÁLISE DETALHADA DE DADOS E RELACIONAMENTOS ---
echo -e "${YELLOW}--- ETAPA 4: Análise Detalhada (Dados Mock, Relacionamentos Órfãos) ---${NC}"
node ./scripts/maintenance/detailed-analysis.cjs
echo ""
echo "--------------------------------------------------------"
echo ""

echo -e "${GREEN}✅ Raio-X do banco de dados concluído!${NC}"
