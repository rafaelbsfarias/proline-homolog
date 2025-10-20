# 01) Visão Geral

## Objetivo
Quando o veículo estiver “Finalizado” e não houver mais nenhum orçamento pendente de finalização, o cliente deve:
- Ser claramente sinalizado de que o veículo está pronto para retirada; e/ou
- Poder solicitar entrega do veículo em um endereço cadastrado.

## Escopo desta fase (planejamento)
- Definição das regras de prontidão (readiness).
- Desenho de fluxos UX (cliente e Ops/Admin).
- Proposta de modelo de dados e APIs (rascunho), sem implementar.
- Diretrizes de timeline, permissões e notificações.
- Plano de rollout e métricas de sucesso.

## Premissas
- Não alteraremos a lógica de delegação/queue nesta fase.
- A prontidão será uma derivação de dados (consulta), sem efeitos colaterais.
- Endereços do cliente já existem (ou serão tratados em escopo próprio).

## Não-objetivos
- Cobrança/pagamento de taxas de entrega.
- Otimização de rotas de logística.
- Criação de portal de logística para parceiros (pode ser fase futura).

