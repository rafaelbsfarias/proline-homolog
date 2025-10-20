# 15) Plano de Testes — Entrega do Veículo

## 15.1 Cliente
- Exibir botão “Solicitar entrega do veículo” somente quando `vehicle.status === 'Finalizado'` e não houver pendências.
- Abrir modal em modo “entrega”: labels, placeholders e aria-labels corretos.
- Validar obrigatórios: endereço e data; mensagens claras.
- Enviar solicitação (mock/API futura) e ver status “requested”.
- Solicitar mudança de data: criar, ver status pendente, acompanhar resposta do admin.

## 15.2 Admin
- Listar pedidos por status/filtros.
- Aprovar/rejeitar; propor janela; agendar; progredir para `in_transit` e `delivered`.
- Ver histórico de eventos por pedido e consistência das datas.

## 15.3 Timeline
- Escrever/validar eventos: “Entrega Solicitada”, “Entrega Agendada”, “Saiu para Entrega”, “Veículo Entregue”, “Reagendamento …”.
- Garantir que não há PII de endereço completo nas notas.

## 15.4 RLS/Segurança
- Cliente só vê pedidos próprios e seus eventos/reagendamentos.
- Admin acessa tudo (service-role).

## 15.5 Integração
- Readiness: quando o veículo sai de “Finalizado” (ex.: reabertura), esconder CTA e bloquear criação de pedidos.
- Convivência com coleta: telas e filtros separados; BI com métricas por tipo.

