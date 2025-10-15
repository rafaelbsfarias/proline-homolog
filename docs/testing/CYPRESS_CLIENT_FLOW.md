# 🚗 Testes do Fluxo de Coleta do Cliente

Este documento explica como executar o fluxo completo de coleta do cliente de forma simples e organizada.

## 📁 Estrutura Limpa

Após a limpeza, temos apenas **1 arquivo** de teste principal:

```
cypress/e2e/client/
└── client-collection-flow.cy.ts  ⭐ (ARQUIVO PRINCIPAL)
```

## 🎯 O que o Teste Faz

O arquivo `client-collection-flow.cy.ts` executa o **fluxo completo**:

1. **🔐 Login** como cliente
2. **🚗 Localizar** seção "Meus Veículos" 
3. **📋 Expandir** card de veículos (100 cadastrados, 100 aguardando definição)
4. **✏️ Clicar** em "Editar ponto de coleta"
5. **🎯 Interagir** com modal:
   - Selecionar "Ponto de Coleta" (radio button)
   - Escolher endereço no dropdown
   - Definir data preferencial
   - Salvar alterações
6. **✅ Validar** chamada da API `/api/client/set-vehicles-collection`

## 🚀 Como Executar

### Opção 1: NPM Scripts (Recomendado)

```bash
# Executar em modo headless (rápido)
npm run test:client-flow

# Abrir interface gráfica do Cypress
npm run test:client-flow:open
```

### Opção 2: Script Bash

```bash
# Modo headless (padrão)
./scripts/test-client-flow.sh

# Com interface gráfica
./scripts/test-client-flow.sh headed

# Abrir Cypress Test Runner
./scripts/test-client-flow.sh open
```

### Opção 3: Comando Direto

```bash
npx cypress run --spec cypress/e2e/client/client-collection-flow.cy.ts
```

## 📊 Resultados Esperados

✅ **2 testes passando:**
1. Fluxo principal completo
2. Edge case (quando não há veículos)

⏱️ **Duração:** ~12-15 segundos

📸 **Screenshots:** Gerados automaticamente em caso de problemas

🎥 **Vídeo:** Gravação completa do teste disponível

## 🔧 Troubleshooting

Se algum teste falhar:

1. **Verificar credenciais** em `cypress.env.json`:
   ```json
   {
     "testClient": {
       "email": "cliente@prolineauto.com.br",
       "password": "123qwe"
     }
   }
   ```

2. **Verificar servidor** em execução:
   ```bash
   npm run dev
   ```

3. **Verificar screenshots** em:
   ```
   cypress/screenshots/client-collection-flow.cy.ts/
   ```

## 🎯 Benefícios da Limpeza

- ✅ **1 arquivo** ao invés de 7
- ✅ **Fluxo unificado** completo
- ✅ **Fácil execução** com scripts NPM
- ✅ **Manutenção simples**
- ✅ **Testes robustos** com fallbacks
- ✅ **Documentação clara**

## 📝 Logs do Teste

O teste gera logs detalhados de cada passo:

```
🔐 PASSO 1: Login como cliente
🚗 PASSO 2: Localizar seção "Meus Veículos"
📋 PASSO 3: Expandir card de veículos para ver detalhes
🔍 PASSO 4: Localizar veículo específico e botão "Editar ponto de coleta"
🎯 PASSO 5: Interagir com modal "Editar ponto de coleta"
🎉 FLUXO COMPLETO: Veículo associado com endereço e data!
```
