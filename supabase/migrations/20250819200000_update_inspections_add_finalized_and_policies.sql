-- Add finalized flag to inspections and relax policies for collaborative edits
alter table public.inspections
  add column if not exists finalized boolean not null default false;

-- Allow specialists linked to the client to UPDATE inspections
do $$ begin
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'inspections' and policyname = 'inspections_specialist_update'
  ) then
    drop policy "inspections_specialist_update" on public.inspections;
  end if;
end $$;
create policy "inspections_specialist_update" on public.inspections
for update to authenticated
using (
  exists (
    select 1 from public.vehicles v
    join public.client_specialists cs on cs.client_id = v.client_id
    where v.id = inspections.vehicle_id
      and cs.specialist_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.vehicles v
    join public.client_specialists cs on cs.client_id = v.client_id
    where v.id = inspections.vehicle_id
      and cs.specialist_id = auth.uid()
  )
);

-- Relax inspection_services write policy to allow any linked specialist (not only creator)
do $$ begin
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'inspection_services' and policyname = 'inspection_services_specialist_write'
  ) then
    drop policy "inspection_services_specialist_write" on public.inspection_services;
  end if;
end $$;
create policy "inspection_services_specialist_write" on public.inspection_services
for all to authenticated
using (
  exists (
    select 1 from public.inspections i
    join public.vehicles v on v.id = i.vehicle_id
    join public.client_specialists cs on cs.client_id = v.client_id
    where i.id = inspection_services.inspection_id
      and cs.specialist_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.inspections i
    join public.vehicles v on v.id = i.vehicle_id
    join public.client_specialists cs on cs.client_id = v.client_id
    where i.id = inspection_services.inspection_id
      and cs.specialist_id = auth.uid()
  )
);

