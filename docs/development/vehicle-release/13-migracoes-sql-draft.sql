-- 13) Migrações SQL (rascunho) — NÃO EXECUTAR
-- Crie um novo arquivo de migração baseado nestes trechos, após validação com Produto/Ops.

-- 13.1 delivery_requests
create table if not exists public.delivery_requests (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  service_order_id uuid not null references public.service_orders(id) on delete restrict,
  client_id uuid not null references public.clients(profile_id) on delete restrict,
  address_id uuid not null references public.addresses(id) on delete restrict,
  status text not null check (status in ('requested','approved','scheduled','in_transit','delivered','rejected','canceled','failed')),
  desired_date date null,
  window_start timestamptz null,
  window_end timestamptz null,
  scheduled_at timestamptz null,
  fee_amount numeric(10,2) null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_delivery_requests_vehicle on public.delivery_requests(vehicle_id);
create index if not exists idx_delivery_requests_client on public.delivery_requests(client_id);
create index if not exists idx_delivery_requests_status on public.delivery_requests(status);

-- 13.2 delivery_request_events
create table if not exists public.delivery_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.delivery_requests(id) on delete cascade,
  event_type text not null check (event_type in ('created','approved','rejected','scheduled','in_transit','delivered','canceled','failed','reschedule_requested','reschedule_proposed','reschedule_accepted','reschedule_rejected')),
  status_from text null,
  status_to text null,
  actor_id uuid not null,
  actor_role text not null check (actor_role in ('client','admin','system','partner')),
  notes text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_delivery_request_events_req on public.delivery_request_events(request_id);
create index if not exists idx_delivery_request_events_type on public.delivery_request_events(event_type);

-- 13.3 delivery_reschedule_requests
create table if not exists public.delivery_reschedule_requests (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.delivery_requests(id) on delete cascade,
  requested_by uuid not null,
  requested_at timestamptz not null default now(),
  requested_date date not null,
  reason text null,
  admin_id uuid null,
  proposed_window_start timestamptz null,
  proposed_window_end timestamptz null,
  response_status text null check (response_status in ('approved','proposed','rejected')),
  responded_at timestamptz null,
  resolution text null check (resolution in ('accepted','declined','canceled')),
  resolved_at timestamptz null
);

create index if not exists idx_delivery_reschedule_req on public.delivery_reschedule_requests(request_id);

-- 13.4 Triggers (opcional) para updated_at
-- create trigger set_updated_at before update on public.delivery_requests for each row execute procedure trigger_set_updated_at();
-- create trigger set_updated_at_events before update on public.delivery_request_events for each row execute procedure trigger_set_updated_at();

-- 13.5 Policies RLS (exemplos ver 14-rls-policies.md)
-- Habilitar RLS:
-- alter table public.delivery_requests enable row level security;
-- alter table public.delivery_request_events enable row level security;
-- alter table public.delivery_reschedule_requests enable row level security;

