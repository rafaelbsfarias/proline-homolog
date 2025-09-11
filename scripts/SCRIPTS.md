# Scripts de Teste Disponíveis

## Lista Completa de Scripts

| Script                          | Descrição                         | Uso                                       |
| ------------------------------- | --------------------------------- | ----------------------------------------- |
| `test-partner-categories.sh`    | Verifica categorias dos parceiros | `./scripts/test-partner-categories.sh`    |
| `test-finalized-inspections.sh` | Verifica análises finalizadas     | `./scripts/test-finalized-inspections.sh` |
| `test-all.sh`                   | Executa todos os testes           | `./scripts/test-all.sh`                   |
| `create-test-data.sh`           | Cria dados de teste               | `./scripts/create-test-data.sh`           |
| `generate-report.sh`            | Gera relatório consolidado        | `./scripts/generate-report.sh`            |

## Scripts de Apoio Existentes

| Script                     | Descrição                    |
| -------------------------- | ---------------------------- |
| `test-signup.sh`           | Teste de cadastro de cliente |
| `test-collection-flow.cjs` | Teste de fluxo de coleta     |
| `test-create-admin.js`     | Teste de criação de admin    |
| `test-magic-link.js`       | Teste de magic link          |
| `test-reset-password.sh`   | Teste de reset de senha      |

## Como Executar

1. Tornar executável (se necessário):

   ```bash
   chmod +x scripts/*.sh
   ```

2. Executar script específico:
   ```bash
   ./scripts/nome-do-script.sh
   ```

## Dependências

- PostgreSQL/Supabase rodando na porta 54322
- Credenciais: postgres/postgres
- Permissões de execução nos scripts

## Estrutura dos Dados Testados

### Parceiros

- Dados cadastrais (nome, empresa, CNPJ)
- Categorias de serviço associadas
- Orçamentos realizados
- Status de atividade

### Análises

- Inspeções finalizadas
- Serviços identificados por categoria
- Ordens de serviço geradas
- Orçamentos relacionados
- Dados de veículos e clientes

## Troubleshooting

### Erro de Conexão

```bash
❌ Erro na conexão com o banco de dados
```

**Solução**: Verificar se Supabase está ativo:

```bash
supabase status
supabase start
```

### Dados Vazios

Se testes retornarem dados vazios:

1. Executar `./scripts/create-test-data.sh`
2. Verificar estrutura das tabelas
3. Checar dados existentes no banco

### Permissões

```bash
bash: ./scripts/script.sh: Permission denied
```

**Solução**:

```bash
chmod +x scripts/script.sh
```

## Desenvolvimento

Para criar novos scripts:

1. Criar arquivo `.sh` no diretório `scripts/`
2. Seguir padrão dos scripts existentes
3. Adicionar documentação no README.md
4. Incluir na lista acima
5. Testar conectividade e dados

## Exemplos de Output

### Teste de Parceiros

```
✅ Categorias associadas ao parceiro:
  - Mecânica (mechanics) - Prioridade: 1
  - Funilaria/Pintura (body_paint) - Prioridade: 2
```

### Teste de Análises

```
✅ Inspeções finalizadas encontradas:
Total de inspeções finalizadas: 3

  📋 Inspeção ID: uuid-456
     Veículo: ABC-1234 - Fiat Uno
     Cliente: Maria Santos
     Finalizada: true
```

## Contato

Para dúvidas sobre os scripts, verificar:

- README.md completo
- Código dos scripts
- Estrutura das tabelas no banco
