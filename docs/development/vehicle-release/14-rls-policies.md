# 14) RLS Policies — Diretrizes e Exemplos (Rascunho)

> Não aplicar em produção antes de validação. Ajustar schema/roles conforme ambiente.

## 14.1 delivery_requests

Habilitar RLS
```sql
alter table public.delivery_requests enable row level security;
```

Política: cliente lê e altera somente seus pedidos
```sql
create policy "delivery_requests_client_select" on public.delivery_requests
for select using (client_id = auth.uid());

create policy "delivery_requests_client_insert" on public.delivery_requests
for insert with check (client_id = auth.uid());

create policy "delivery_requests_client_update" on public.delivery_requests
for update using (client_id = auth.uid());
```

Admin (service-role) — via cabeçalho Service Key ou role dedicada (sem RLS ou com bypass)

## 14.2 delivery_request_events

Habilitar RLS
```sql
alter table public.delivery_request_events enable row level security;
```

Cliente vê somente eventos de pedidos próprios
```sql
create policy "delivery_events_client_select" on public.delivery_request_events
for select using (
  request_id in (select id from public.delivery_requests where client_id = auth.uid())
);
```

Admin — leitura/escrita ampla via service-role.

## 14.3 delivery_reschedule_requests

Habilitar RLS
```sql
alter table public.delivery_reschedule_requests enable row level security;
```

Cliente vê/cria apenas reagendamentos de seus pedidos
```sql
create policy "delivery_resched_client_select" on public.delivery_reschedule_requests
for select using (
  request_id in (select id from public.delivery_requests where client_id = auth.uid())
);

create policy "delivery_resched_client_insert" on public.delivery_reschedule_requests
for insert with check (
  request_id in (select id from public.delivery_requests where client_id = auth.uid())
);
```

Admin — pode responder (propor/aceitar/rejeitar) via service-role.

## 14.4 Observações
- Ajustar nomes de roles e schemas conforme ambiente.
- Sempre validar índices necessários para as subconsultas das policies.
- Testar RLS com usuários reais em um ambiente de staging.

