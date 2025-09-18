#!/bin/bash

# Script Rápido de Verificação de Serviços de Parceiro
# Uso: ./quick-check-partner-services.sh

echo "🔍 VERIFICAÇÃO RÁPIDA: SERVIÇOS DE PARCEIRO"
echo "=========================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script do diretório raiz do projeto"
    exit 1
fi

echo ""
echo "📊 1. VERIFICANDO ESTRUTURA DO BANCO..."
echo "---------------------------------------"

# Executar script de investigação
node scripts/investigate-partner-services-inconsistency.js

echo ""
echo "🧪 2. TESTANDO API..."
echo "--------------------"

# Executar teste da API
node scripts/test-partner-services-api.js

echo ""
echo "📋 3. VERIFICAÇÃO MANUAL RECOMENDADA:"
echo "-------------------------------------"
echo "   • Acesse: http://localhost:3001/dashboard/partner/orcamento"
echo "   • Verifique o painel de debug adicionado"
echo "   • Faça login com: mecanica@parceiro.com"
echo "   • Observe os valores no debug info"

echo ""
echo "🔧 SCRIPTS DISPONÍVEIS:"
echo "-----------------------"
echo "   • investigate-partner-services-inconsistency.js - Investigação completa"
echo "   • test-partner-services-api.js - Teste da API"
echo "   • check-database-state.js - Estado geral do banco"
echo "   • verify-partner-services.js - Verificação de serviços"

echo ""
echo "✅ VERIFICAÇÃO CONCLUÍDA!"
