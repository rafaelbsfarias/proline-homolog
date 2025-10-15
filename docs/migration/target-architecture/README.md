# Arquitetura Alvo - Documentação

Este diretório contém a documentação da **arquitetura IDEAL/ALVO** (target state) do sistema ProLine Hub, descrevendo como o sistema deve ser implementado para suportar isolamento completo por parceiro, contexto unificado (orçamento/inspeção), checklist exclusivo para mecânica e genérico para demais categorias, e visualização somente leitura para administradores/clientes/especialistas.

## 📁 Estrutura do Diretório

### [concepts/](./concepts/)
Documentação conceitual e visão geral da arquitetura.

- **[functional-spec.md](./functional-spec.md)** - Especificação funcional completa do sistema de checklists por parceiro
- **[data-model.md](./data-model.md)** - Modelagem de dados ideal com diagramas ER e DDL sugerido

### [technical/](./technical/)
Especificações técnicas detalhadas da arquitetura.

- **[api-spec.md](./api-spec.md)** - Contratos de API com endpoints, parâmetros e respostas
- **[ui-ux.md](./ui-ux.md)** - Diretrizes de interface e experiência do usuário
- **[security-permissions.md](./security-permissions.md)** - Segurança, permissões e políticas de acesso
- **[flows.md](./flows.md)** - Fluxos e diagramas de sequência dos processos

### [implementation/](./implementation/)
Guias de implementação e estratégias técnicas.

- **[migration-plan.md](./migration-plan.md)** - Plano detalhado para migração do estado atual para o estado alvo

## 🎯 Objetivo

Esta documentação descreve a arquitetura desejada para o sistema de checklists/vistorias por parceiro, incluindo:

1. **Isolamento por Parceiro**: Cada parceiro trabalha apenas nos seus próprios dados
2. **Contexto Unificado**: Suporte a orçamentos (`quote_id`) e inspeções (`inspection_id`) 
3. **Checklist Exclusivo**: Template próprio para mecânica; genérico para outras categorias
4. **Visualização Somente Leitura**: Interface para administradores/clientes/especialistas

## 📋 Conteúdo Principal

### Especificação Funcional
Define os requisitos funcionais e não-funcionais do sistema:
- Conceitos e definições chave
- Requisitos funcionais por domínio
- Arquitetura de dados proposta
- APIs e componentes frontend
- Fluxos de negócio

### Modelagem de Dados
Descreve o modelo de dados ideal:
- Diagrama ER completo
- DDL sugerido para PostgreSQL
- Relacionamentos e constraints
- Estratégias de indexação

### Especificação de APIs
Contratos detalhados dos endpoints:
- Endpoints principais e secundários
- Parâmetros e respostas esperadas
- Códigos de erro padronizados
- Notas de implementação

### UI/UX e Integração
Diretrizes para implementação frontend:
- Componentes e páginas
- Fluxos de interface
- Estados e variações
- Integração com APIs

### Segurança e Permissões
Modelo de segurança do sistema:
- Papéis e permissões
- Matriz de acesso
- Políticas RLS
- Boas práticas de segurança

### Fluxos e Diagramas
Diagramas de sequência dos principais fluxos:
- Carregamento de checklist
- Salvamento de rascunho
- Submissão de checklist
- Upload de evidências
- Visualização pública

### Plano de Migração
Estratégia para alcançar a arquitetura alvo:
- Etapas de implementação
- Preparação de esquema
- ETL de dados legados
- Cutover e limpeza

## ⚠️ Importante

Esta documentação descreve o **estado alvo ideal** e pode divergir da implementação atual. Para entender o estado atual do sistema, consulte:

- 📖 `/docs/migration/MIGRATION_STATUS.md` - Status atual da migração
- 🔧 `/docs/migration/CURRENT_STATUS_AND_NEXT_STEPS.md` - Estado real e próximos passos
- 🗄️ `supabase/migrations/` - Schema real do banco de dados

## 📚 Referências

- [DEVELOPMENT_INSTRUCTIONS.md](../../DEVELOPMENT_INSTRUCTIONS.md) - Diretrizes de desenvolvimento do projeto
- [MIGRATION_STATUS.md](../MIGRATION_STATUS.md) - Status da migração atual
- [CURRENT_STATUS_AND_NEXT_STEPS.md](../CURRENT_STATUS_AND_NEXT_STEPS.md) - Estado atual e próximos passos