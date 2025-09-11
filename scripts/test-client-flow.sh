#!/bin/bash

# Script para executar o fluxo completo de coleta do cliente
# Uso: ./scripts/test-client-flow.sh [modo]
# Modos: headless (padrão) | headed | open

MODE=${1:-headless}

echo "🚗 Iniciando teste do fluxo completo de coleta do cliente..."
echo "📋 Modo: $MODE"
echo ""

case $MODE in
  "headed")
    echo "🖥️ Executando com interface gráfica..."
    npx cypress run --spec cypress/e2e/client/client-collection-flow.cy.ts --headed
    ;;
  "open")
    echo "🔧 Abrindo Cypress Test Runner..."
    npx cypress open --e2e --spec cypress/e2e/client/client-collection-flow.cy.ts
    ;;
  "headless"|*)
    echo "🤖 Executando em modo headless..."
    npx cypress run --spec cypress/e2e/client/client-collection-flow.cy.ts
    ;;
esac

echo ""
echo "✅ Teste concluído!"
echo ""
echo "📊 O teste inclui:"
echo "   • Login do cliente"
echo "   • Navegação no dashboard"  
echo "   • Expansão do card de veículos"
echo "   • Edição do ponto de coleta"
echo "   • Interação com modal"
echo "   • Associação de endereço e data"
echo "   • Validação via API"
