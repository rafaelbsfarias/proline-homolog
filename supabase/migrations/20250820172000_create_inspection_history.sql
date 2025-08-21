-- Create inspection_history to track all edits/snapshots
create table if not exists public.inspection_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  inspection_id uuid references public.inspections(id) on delete set null,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  edited_by uuid not null references public.profiles(id) on delete restrict,
  snapshot jsonb not null
);

alter table public.inspection_history enable row level security;

-- For now, allow only admins via existing admin policy pattern (requests use service role)
do $$
begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='inspection_history' and policyname='inspection_history_admin_all'
  ) then
    drop policy "inspection_history_admin_all" on public.inspection_history;
  end if;
end $$;
create policy "inspection_history_admin_all" on public.inspection_history for all to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

