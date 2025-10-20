# 03) UX — Fluxos do Cliente

## Dashboard do Cliente (estado “pronto”)
- Exibir banner/estado: “Veículo pronto para retirada”.
- CTAs:
  - Agendar Retirada (no local do parceiro)
  - Solicitar Entrega (em endereço do cliente)
- Se o cliente não tiver endereços cadastrados e clicar em “Solicitar Entrega”, exibir fluxo de cadastro (ou instrução para cadastrar antes).

## Agendar Retirada (MVP)
- Selecionar data/horário (ou primeira disponibilidade).
- Campo de observações (opcional).
- Tela de confirmação com resumo.

## Solicitar Entrega (MVP)
- Selecionar endereço da lista do cliente.
- Exibir taxa estimada/flat (ou “a confirmar”).
- Observações de entrega (ex.: portaria, garagem).
- Confirmação de solicitação.

## Acompanhamento
- Após submeter, mostrar cartão com status da solicitação: aguardando aprovação, agendado, em rota, entregue.
- Atualizar conforme Ops altera o status.

