# Arquitetura do Fluxo de Serviço: A Centralidade da `service_orders`

## 1. Contexto e Decisão de Modelagem

Durante a implementação da funcionalidade de "vincular um especialista a um cliente", surgiu a necessidade de modelar a relação entre os domínios `Client`, `Specialist`, e `Vehicle`. A abordagem inicial de criar uma tabela de junção simples (`client_specialists`) foi descartada por ser insuficiente para suportar a complexidade do fluxo de negócio completo.

Após análise, foi decidido utilizar a tabela **`service_orders`** (Ordens de Serviço) como a entidade central que orquestra todo o ciclo de vida de um serviço em um veículo. Esta abordagem é mais robusta, escalável e alinhada com os princípios de Domain-Driven Design.

## 2. O Papel da Tabela `service_orders`

A tabela `service_orders` atua como um "dossiê" ou "prontuário" para cada ciclo de serviço de um veículo. Ela é a "cola" que conecta os diferentes domínios:

-   **Cliente (`client_id`):** O proprietário do veículo.
-   **Veículo (`vehicle_id`):** O ativo que está recebendo o serviço.
-   **Especialista (`specialist_id`):** O responsável pela avaliação e recomendação dos serviços.

A criação de um registro em `service_orders` representa o início formal do fluxo de trabalho, que é acionado quando um administrador vincula um especialista a um veículo de um cliente.

## 3. Estrutura da Tabela `service_orders` (Refinada)

Para suportar adequadamente o fluxo, a estrutura da tabela foi refinada para incluir:

```sql
CREATE TABLE IF NOT EXISTS "public"."service_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_code" TEXT, -- Identificador amigável (ex: OS-2025-001)
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL, -- Adicionado para clareza e performance
    "specialist_id" "uuid" NOT NULL,
    "status" "public"."service_order_status" NOT NULL,
    "classification" "public"."service_classification",
    "estimated_delivery_date" "date",
    "final_delivery_date" "date",
    "total_cost" numeric,
    -- ... outros campos
);
```

**Justificativa das Melhorias:**

-   **`client_id`:** Adicionado para fornecer uma referência direta ao cliente, simplificando consultas e melhorando a performance ao evitar joins desnecessários através da tabela `vehicles`.
-   **`order_code`:** Adicionado para criar um identificador legível para humanos, facilitando a comunicação e referência à ordem de serviço por parte dos usuários.

## 4. Como a Modelagem Suporta o Fluxo de Negócio

1.  **Vinculação (Admin):** O admin cria uma nova `service_orders`, associando `vehicle_id`, `client_id`, e `specialist_id`. O status inicial é `pending_recommendation`.
2.  **Recomendação (Especialista):** O especialista encontra a OS em seu painel e anexa as recomendações. O status muda para `pending_quote`.
3.  **Orçamento (Parceiro):** Os parceiros criam registros na tabela `quotes`, que se relaciona com a `service_orders`.
4.  **Aprovação (Admin/Cliente):** Os status em `quotes` e `service_orders` são atualizados.
5.  **Execução (Parceiro):** O andamento é rastreado através da tabela `services`, que se relaciona com `quotes`.
6.  **Transparência:** O campo `status` na `service_orders` fornece uma visão clara e em tempo real da "localização" e do estágio do veículo no fluxo para todos os perfis autorizados.

Esta abordagem centralizada garante que o sistema seja escalável para futuras funcionalidades, como relatórios, faturamento e métricas de produtividade, pois todas as informações relevantes estão conectadas através da Ordem de Serviço.
