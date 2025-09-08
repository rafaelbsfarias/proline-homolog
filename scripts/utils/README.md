# Scripts Utilitários

Esta pasta contém **scripts diversos e utilitários** para tarefas específicas de desenvolvimento e
manutenção.

## 🛠️ Scripts Disponíveis

### Scripts de Simulação

- `simulate-finalize.js` - Simula finalização de inspeções para teste

### Scripts de Validação

- `validate-flow.sh` - Validação manual do fluxo de orçamentos

### Scripts de Desenvolvimento

- `rewire-imports.ts` - Reorganiza e otimiza imports do projeto

## 🚀 Como Usar

### Simulação de Cenários

```bash
# Simular finalização de inspeção
./simulate-finalize.js

# Este script:
# - Cria cenário de teste
# - Simula finalização
# - Mostra resultados esperados
```

### Validação Manual

```bash
# Validação passo-a-passo
./validate-flow.sh

# Segue checklist manual:
# - Verificar inspeções
# - Validar service orders
# - Confirmar quotes
# - Testar contadores
```

### Otimização de Código

```bash
# Reorganizar imports
./rewire-imports.ts

# Este script:
# - Analisa estrutura de imports
# - Remove imports não utilizados
# - Reorganiza ordem de imports
# - Otimiza dependências
```

## 📊 O que Cada Script Faz

### `simulate-finalize.js`

- Cria ambiente controlado para teste
- Simula processo de finalização
- Gera dados de teste realistas
- Ajuda no desenvolvimento de funcionalidades

### `validate-flow.sh`

- Guia interativo para validação
- Checklist passo-a-passo
- Verificações manuais
- Documentação de problemas encontrados

### `rewire-imports.ts`

- Análise estática de imports
- Detecção de imports não utilizados
- Reorganização alfabética
- Otimização de dependências circulares

## 🎯 Quando Usar

- **Testes específicos:** `simulate-finalize.js`
- **Validação manual:** `validate-flow.sh`
- **Refatoração:** `rewire-imports.ts`
- **Debugging:** Scripts de simulação

## 📁 Estrutura dos Scripts

```
utils/
├── simulate-finalize.js     # Simulação de cenários
├── validate-flow.sh         # Validação manual
└── rewire-imports.ts        # Otimização de código
```

## ⚠️ Considerações

- Scripts de simulação podem criar dados temporários
- Validações manuais requerem interação do usuário
- Scripts de otimização podem modificar arquivos
- Sempre revise mudanças antes de commitar

---

**Utilitários para desenvolvimento e manutenção avançada**
