#!/bin/bash

# Script Completo de Diagnóstico de Serviços de Parceiro
# Executa todas as verificações em sequência

echo "🔍 DIAGNÓSTICO COMPLETO: SERVIÇOS DE PARCEIRO"
echo "=============================================="
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script do diretório raiz do projeto"
    exit 1
fi

# Criar diretório de relatórios se não existir
mkdir -p reports

echo "📊 EXECUTANDO VERIFICAÇÕES..."
echo ""

# 1. Investigação específica da inconsistência
echo "1️⃣ INVESTIGAÇÃO ESPECÍFICA DA INCONSISTÊNCIA"
echo "--------------------------------------------"
node scripts/investigate-partner-services-inconsistency.js
echo ""

# 2. Teste da API
echo "2️⃣ TESTE DA API DE SERVIÇOS"
echo "----------------------------"
node scripts/test-partner-services-api.js
echo ""

# 3. Verificação de RLS
echo "3️⃣ VERIFICAÇÃO DE POLÍTICAS RLS"
echo "--------------------------------"
node scripts/check-partner-services-rls.js
echo ""

# 4. Verificação geral do banco
echo "4️⃣ VERIFICAÇÃO GERAL DO BANCO"
echo "------------------------------"
node scripts/check-database-state.js
echo ""

# 5. Verificação específica de serviços
echo "5️⃣ VERIFICAÇÃO DE SERVIÇOS POR PARCEIRO"
echo "----------------------------------------"
node scripts/verify-partner-services.js
echo ""

echo "📄 RELATÓRIOS GERADOS:"
echo "----------------------"
ls -la reports/
echo ""

echo "🎯 PRÓXIMOS PASSOS RECOMENDADOS:"
echo "---------------------------------"
echo "1. 📖 Leia os relatórios em 'reports/'"
echo "2. 🌐 Acesse: http://localhost:3001/dashboard/partner/orcamento"
echo "3. 🔐 Faça login com: mecanica@parceiro.com"
echo "4. 🔍 Verifique o painel de debug na página"
echo "5. 🛠️ Aplique correções baseadas nos diagnósticos"
echo ""

echo "✅ DIAGNÓSTICO CONCLUÍDO!"
echo ""
echo "📊 Resumo dos relatórios:"
echo "   • partner-services-investigation.json - Diagnóstico específico"
echo "   • database-test-report.json - Estado geral do banco"
