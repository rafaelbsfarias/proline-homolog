#!/bin/bash

# Script para executar testes de integração da API PartnerService v2
# Este script configura o ambiente e executa todos os testes necessários

set -e

echo "🚀 Iniciando testes de integração - PartnerService API v2"
echo "======================================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script do diretório raiz do projeto"
    exit 1
fi

# Verificar se o servidor está rodando
echo "📡 Verificando se o servidor de desenvolvimento está rodando..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "⚠️  Servidor não está rodando. Iniciando..."
    npm run dev &
    SERVER_PID=$!

    # Aguardar o servidor iniciar
    echo "⏳ Aguardando servidor iniciar..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null; then
            echo "✅ Servidor iniciado com sucesso"
            break
        fi
        sleep 2
    done

    if ! curl -s http://localhost:3000 > /dev/null; then
        echo "❌ Erro: Servidor não iniciou corretamente"
        exit 1
    fi
else
    echo "✅ Servidor já está rodando"
fi

# Executar testes de integração
echo ""
echo "🧪 Executando testes de integração..."
echo "====================================="

# Testes de funcionalidade básica
echo "📋 Executando testes básicos..."
npm test -- tests/integration/api/partner/partner-services-v2.integration.test.ts

# Testes de performance
echo ""
echo "⚡ Executando testes de performance..."
npm test -- tests/integration/api/partner/partner-services-v2.performance.test.ts

# Executar testes unitários relacionados
echo ""
echo "🔧 Executando testes unitários do domínio..."
npm test -- modules/partner/domain

# Verificar cobertura de testes
echo ""
echo "📊 Verificando cobertura de testes..."
npm run test:coverage -- --collectCoverageFrom="app/api/partner/services/v2/**/*.ts" --collectCoverageFrom="modules/partner/**/*.ts"

# Executar linting
echo ""
echo "🔍 Executando linting..."
npm run lint -- app/api/partner/services/v2/ modules/partner/

# Build de produção para verificar se tudo compila
echo ""
echo "🏗️  Executando build de produção..."
npm run build

echo ""
echo "🎉 Todos os testes passaram!"
echo "==========================="
echo "✅ Testes de integração: Aprovados"
echo "✅ Testes de performance: Aprovados"
echo "✅ Testes unitários: Aprovados"
echo "✅ Linting: Aprovado"
echo "✅ Build: Aprovado"
echo ""
echo "📝 Resumo da Fase 6:"
echo "   • Documentação OpenAPI/Swagger criada"
echo "   • Testes de integração abrangentes implementados"
echo "   • Testes de performance configurados"
echo "   • Estratégia de versioning documentada"
echo "   • API pronta para produção"

# Matar processo do servidor se foi iniciado por este script
if [ ! -z "$SERVER_PID" ]; then
    echo ""
    echo "🛑 Encerrando servidor de teste..."
    kill $SERVER_PID 2>/dev/null || true
fi

echo ""
echo "🎊 Fase 6 concluída com sucesso!"
echo "A PartnerService API v2 está pronta para produção."
