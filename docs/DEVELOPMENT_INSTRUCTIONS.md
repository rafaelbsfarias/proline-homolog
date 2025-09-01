## Princípios de Desenvolvimento

Este projeto adere aos seguintes princípios para garantir a qualidade, manutenibilidade e
escalabilidade do código:

- **DRY (Don't Repeat Yourself):** Evitar a duplicação de código, promovendo a reutilização e a
  centralização da lógica.
- **SOLID:** Seguir os cinco princípios do design orientado a objetos (Single Responsibility,
  Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion) para criar sistemas
  mais compreensíveis, flexíveis e manuteníveis.
- **Object Calisthenics:** Aplicar um conjunto de nove regras simples para escrever código mais
  limpo, coeso e desacoplado, focando na simplicidade e na responsabilidade única dos objetos.
- **Arquitetura Modular:** Organizar o código em módulos independentes e coesos, facilitando a
  manutenção, escalabilidade e reusabilidade. Cada módulo deve ter responsabilidades bem definidas e
  interfaces claras.
- **Criação de Componentes:** Todos os componentes devem seguir o composition pattern. As páginas principais atuarão como "containers" que compõem múltiplos componentes filhos, cada um gerenciando uma parte específica do fluxo. Modais serão

## Práticas de Desenvolvimento

- Esse é um projeto **REACT/TS** e deve seguir as melhores práticas para um desenvolvimento seguro
- Considerar sempre que o ambiente está em produção, debugs devem ser removidos logo após a resolução do problema
- Manter o código limpo, após uma correção de código verifique duas vezes se não está deixando sujeira para trás
- O deploy é feito na vercel
- Toda **migration** deve ser **idempotente**
- Toda migration deve ser criada com **supabase migration new**

## Sistema de Histórico Imutável

### Visão Geral
O sistema de histórico de coletas foi implementado com imutabilidade para garantir que registros históricos nunca sejam alterados, mesmo que os dados originais (preços, datas) sejam modificados posteriormente.

### Arquitetura
- **Tabela `collection_history`**: Armazena registros imutáveis de coletas finalizadas
- **Trigger automático**: Cria registros históricos quando coletas mudam para status 'approved'
- **Service Layer**: `CollectionHistoryService` para acesso aos dados históricos
- **View `collection_history_detailed`**: Fornece dados agregados com informações de cliente e veículos

### Funcionalidades
- ✅ Registros históricos nunca são modificados
- ✅ Preços e datas são preservados no momento da finalização
- ✅ Dados agregados incluem contagem de veículos e valores totais
- ✅ RLS policies garantem acesso apropriado por cliente/admin

### Como Funciona
1. Quando uma coleta é aprovada (status = 'approved'), um trigger cria automaticamente um registro na tabela `collection_history`
2. O registro histórico contém uma cópia imutável de todos os dados relevantes
3. Mudanças futuras nos dados originais não afetam o histórico
4. O histórico é exibido na interface do admin com dados enriquecidos

### Benefícios
- **Integridade histórica**: Dados passados nunca são perdidos ou alterados
- **Auditoria**: Rastreamento completo de todas as coletas finalizadas
- **Conformidade**: Garante que relatórios históricos reflitam valores reais da época
- **Performance**: Consultas otimizadas para dados históricos

### API Endpoints
- `GET /api/admin/collection-history/[clientId]`: Retorna histórico imutável do cliente
- `POST /api/admin/collection-history/[clientId]/migrate`: Migração manual (desabilitada temporariamente)

### Migration
A migration `20250901183406_create_collection_history_table.sql` cria:
- Tabela `collection_history` com constraints de imutabilidade
- Trigger para criação automática de registros históricos
- View para consultas otimizadas
- Políticas RLS apropriadas