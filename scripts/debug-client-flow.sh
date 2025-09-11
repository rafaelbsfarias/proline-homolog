#!/bin/bash

# Script para executar o teste em modo DEBUG com interface visual
echo "🔍 Executando teste do cliente em modo DEBUG..."
echo "⚠️  IMPORTANTE: Este teste roda com interface visual para você observar o comportamento"
echo ""

# Rodar apenas o primeiro teste (DEBUG MODE) em modo headed
npx cypress run --spec cypress/e2e/client/client-collection-flow.cy.ts --headed --browser chrome --grep "DEBUG MODE"

echo ""
echo "🎯 O que observar:"
echo "   • Dashboard carregou corretamente?"
echo "   • Seção 'Meus Veículos' está visível (destacada em vermelho/amarelo)?"
echo "   • Cards de veículos se expandem ao clicar?"
echo "   • Botão 'Editar ponto de coleta' aparece?"
echo "   • Modal abre corretamente?"
echo ""
echo "📸 Screenshots são salvos automaticamente em cypress/screenshots/"
