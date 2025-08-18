# Relatório de Melhorias na Modelagem do Banco de Dados

Este relatório detalha as oportunidades de melhoria na modelagem do banco de dados, com foco em chaves estrangeiras, índices e consistência de dados, com base na análise de **todas as migrações** localizadas em `supabase/migrations/**`.

## Observações Iniciais

*   Muitas chaves estrangeiras são definidas com a cláusula `NOT VALID`. Isso significa que elas não são verificadas para dados existentes no momento da criação, apenas para novas inserções. Embora útil em migrações grandes, é crucial validá-las após a migração para garantir a integridade de todo o conjunto de dados.
*   As colunas `created_at` e `updated_at` estão presentes em várias tabelas, o que é uma boa prática para auditoria.
*   `profile_id` é uma chave estrangeira comum, ligando a tabelas de perfil de usuário.

## Detalhamento das Melhorias Propostas

### 1. Validação de Chaves Estrangeiras (`NOT VALID`)

**Problema:** Todas as chaves estrangeiras, conforme o `initial_schema.sql` e as migrações subsequentes, são criadas com `NOT VALID`. Isso pode levar a inconsistências se houver dados inválidos preexistentes que não foram verificados.

**Recomendação:** Após a conclusão da migração e a garantia de que os dados existentes estão corretos, execute comandos `ALTER TABLE table_name VALIDATE CONSTRAINT fk_name;` para cada chave estrangeira. Isso garantirá que a restrição seja aplicada a todos os dados, novos e existentes.

### 2. Ações `ON DELETE` para Chaves Estrangeiras

**Problema:** Embora algumas migrações recentes tenham adicionado ações `ON DELETE CASCADE` (ex: `client_specialists`, `service_orders.client_id`, `partner_services`), muitas chaves estrangeiras ainda carecem de uma ação `ON DELETE` explícita. O comportamento padrão (`ON DELETE RESTRICT`) pode impedir operações de exclusão ou causar erros na aplicação.

**Recomendação:** Avaliar sistematicamente e adicionar ações `ON DELETE` apropriadas para cada chave estrangeira, considerando a lógica de negócio:

*   **`ON DELETE CASCADE`**: Se a exclusão do registro pai deve resultar na exclusão automática dos registros filhos relacionados. Considerar para:
    *   `addresses.profile_id`
    *   `evaluations.service_order_id`
    *   `quotes.service_order_id`
    *   `quotes.partner_id`
    *   `service_order_logs.service_order_id`
    *   `services.quote_id`
    *   `vehicles.client_id`

*   **`ON DELETE SET NULL`**: Se a exclusão do registro pai deve definir a chave estrangeira nos registros filhos como `NULL` (assumindo que a coluna permite `NULL`). Considerar para:
    *   `audit_logs.user_id`
    *   `invoices.payer_profile_id`
    *   `invoices.service_order_id`
    *   `partner_fees.partner_id`
    *   `partner_fees.service_order_id`
    *   `service_orders.specialist_id`
    *   `service_orders.pickup_address_id`
    *   `service_orders.delivery_address_id`
    *   `service_order_logs.changed_by_profile_id`

### 3. Índice Único Incorreto em `vehicles.color`

**Problema:** O índice único `vehicles_chassi_key` ainda está definido na coluna `color` da tabela `vehicles`. Isso é conceitualmente incorreto, pois múltiplos veículos podem ter a mesma cor, e pode impedir inserções de dados válidos.

**Recomendação:**
*   **Remover o índice `vehicles_chassi_key` da coluna `color`**. Se a intenção era ter uma coluna `chassi` única, ela deve ser adicionada separadamente e o índice criado sobre ela.

### 4. Colunas Redundantes/Inconsistentes na Tabela `vehicles`

**Problema:** A tabela `vehicles` ainda apresenta colunas duplicadas com nomes e tipos inconsistentes: `fipe_value` (numeric) e `fipe_value` (numeric), e `estimated_arrival_date` (date) e `estimated_arrival_date` (text). A coluna `estimated_arrival_date` sendo do tipo `text` é inadequada para dados de data.

**Recomendação:**
*   Adotar uma convenção de nomenclatura consistente (ex: `snake_case` para todas as colunas do banco de dados).
*   Remover as colunas duplicadas, mantendo apenas uma versão com o tipo de dado correto.
*   Garantir que a coluna de data de chegada (`estimated_arrival_date`) seja do tipo `date` ou `timestamp with time zone` para permitir operações de data e indexação eficientes.

### 5. Indexação de Chaves Estrangeiras (Revisão)

**Problema:** Embora o PostgreSQL crie índices automaticamente para chaves primárias e restrições únicas, nem todas as chaves estrangeiras recebem um índice automaticamente. A ausência de índices em colunas de chave estrangeira pode impactar negativamente o desempenho de consultas que envolvem junções (`JOIN`) nessas colunas.

**Recomendação:** Revisar todas as chaves estrangeiras e garantir que existam índices apropriados para otimizar o desempenho das consultas e a integridade referencial.

## Novas Tabelas e Suas Chaves Estrangeiras (Considerações)

As migrações recentes introduziram novas tabelas e relacionamentos:

*   **`client_contract_acceptance`**: Tabela para registrar a aceitação de contratos por clientes.
    *   `client_id` (FK para `profiles.id`): Definida com `ON DELETE CASCADE`, o que é adequado.
*   **`client_specialists`**: Tabela de junção para associar clientes a especialistas.
    *   `client_id` (FK para `profiles.id`): Definida com `ON DELETE CASCADE`, o que é adequado.
    *   `specialist_id` (FK para `profiles.id`): Definida com `ON DELETE CASCADE`, o que é adequado.
*   **`contract_partners`**: Tabela para registrar a aceitação de contratos por parceiros.
    *   A coluna `version` foi removida e `accepted` foi renomeada para `signed`.
*   **`partner_services`**: Tabela para serviços oferecidos por parceiros.
    *   `partner_id` (FK para `partners.profile_id`): Definida com `ON DELETE CASCADE`, o que é adequado.
*   **`service_orders`**: Adicionada a coluna `client_id` (FK para `profiles.id`) com `ON DELETE CASCADE` e `order_code` com índice único.

## Próximos Passos

Recomenda-se criar novas migrações para implementar as melhorias listadas, garantindo que a integridade dos dados seja mantida durante o processo. Testes abrangentes devem ser realizados após cada alteração na modelagem do banco de dados.