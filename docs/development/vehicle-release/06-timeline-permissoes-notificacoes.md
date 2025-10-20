# 06) Timeline, Permissões e Notificações

## Entradas na Timeline (vehicle_history)
- Quando veículo torna-se “pronto” (primeira detecção):
  - Status: Finalizado | Notes: “Pronto para retirada” (sem PII)
- Ações do cliente:
  - “Retirada Agendada” (data/hora)
  - “Entrega Solicitada — {apelido do endereço}” (sem endereço completo)
- Ações de Ops:
  - “Entrega Agendada”, “Saiu para Entrega”, “Entregue”, “Cancelado”

## Permissões (RLS)
- Clientes: somente ler veículos próprios e criar pedidos para seu `vehicle_id`.
- Ops/Admin: gerenciar todos os pedidos (service-role ou policies específicas).
- Parceiro/logística (se houver): acesso apenas a pedidos atribuídos.

## Notificações
- Cliente: quando veículo pronto; confirmação de pedido; status agendado/em rota/entregue.
- Ops: novas solicitações “requested”.
- Canais: e-mail, SMS, in-app (parametrizável).

## Privacidade
- Não armazenar endereço completo em `vehicle_history` (usar apelidos/identificadores).
- Garantir políticas de acesso a dados de endereço e pedidos.

