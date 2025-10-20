# 02) Condições de Prontidão do Veículo

## Definição de “Pronto para Retirada”
Um veículo é considerado “pronto” quando:
- Status do veículo é “Finalizado”; e
- Não existe orçamento pendente de execução/finalização vinculado ao veículo (na OS/ordem de serviço corrente).

## Como avaliar “não existe orçamento pendente”
Para a OS ativa do veículo, não podem existir orçamentos com status de aprovação/execução em andamento, por exemplo:
- pending_admin_approval, admin_review
- pending_client_approval
- specialist_time_approved / specialist_time_revision_requested (se aplicável)
- approved (sem execução concluída)

Orçamentos válidos para considerar “sem pendências”:
- rejected; ou
- totalmente executados (todos os itens concluídos), com qualquer flag de fechamento marcada.

## Recomendações técnicas
- Implementar uma view/RPC somente leitura que retorne: `{ vehicle_id, ready: boolean, reasons?: string[] }`.
- Evitar triggers/efeitos colaterais para determinar prontidão.
- Esta verificação deve ser barata e indexada.

