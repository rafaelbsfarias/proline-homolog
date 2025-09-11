# Scripts de Teste

Esta pasta contém scripts de teste **seguros** que não modificam o banco de dados. Eles são usados
para validar funcionalidades do sistema sem criar ou alterar dados.

## 📋 Scripts Disponíveis

### Scripts de Validação de Fluxo

- `test-budget-flow.sh` - Valida fluxo de criação automática de orçamentos
- `test-collection-flow.*` - Testa fluxo de coletas (várias versões)
- `test-complete-flow.cjs` - Testa fluxo completo do sistema
- `test-flow-validation.sh` - Valida fluxo de orçamentos manualmente

### Scripts de Teste de Funcionalidades

- `test-confirm-email.sh` - Testa sistema de confirmação de email
- `test-create-admin.js` - Testa criação de usuários admin
- `test-finalize-api.js` - Testa API de finalização de inspeções
- `test-finalized-inspections.sh` - Testa inspeções finalizadas
- `test-magic-link.js` - Testa sistema de magic links
- `test-partner-categories.sh` - Testa categorias de parceiros
- `test-reset-password.sh` - Testa reset de senha
- `test-signup.sh` - Testa cadastro de novos usuários
- `test-status-fix.cjs` - Corrige status de inspeções

### Scripts de Infraestrutura

- `test-endpoints.sh` - Testa conectividade dos endpoints
- `test-guide.sh` - Guia completo para testes manuais
- `test-all.sh` - Executa todos os testes disponíveis

## 🚀 Como Usar

### Fluxo Básico de Teste:

```bash
# 1. Verificar conectividade
./test-endpoints.sh

# 2. Testar fluxo específico
./test-budget-flow.sh

# 3. Seguir guia completo se necessário
./test-guide.sh
```

## ✅ Características

- **Seguros:** Não modificam dados do banco
- **Readonly:** Apenas consultas e validações
- **Diagnósticos:** Ajudam a identificar problemas
- **Documentação:** Guias para testes manuais

## 🎯 Quando Usar

- Validar se uma funcionalidade está funcionando
- Diagnosticar problemas no sistema
- Verificar conectividade de endpoints
- Testar fluxos completos sem risco de dados

---

**Estes scripts são seguros para executar em qualquer ambiente**
