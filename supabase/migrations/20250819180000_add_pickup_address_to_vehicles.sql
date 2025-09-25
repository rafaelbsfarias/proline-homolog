-- Add optional pickup address reference to vehicles for client collection points
alter table public.vehicles
  add column if not exists pickup_address_id uuid;

do $$ begin
  if not exists (
    select 1 from information_schema.constraint_column_usage
    where table_schema = 'public' and table_name = 'vehicles' and constraint_name = 'vehicles_pickup_address_id_fkey'
  ) then
    alter table public.vehicles
      add constraint vehicles_pickup_address_id_fkey foreign key (pickup_address_id)
      references public.addresses(id) on delete set null;
  end if;
end $$;

create index if not exists idx_vehicles_pickup_address_id on public.vehicles(pickup_address_id);

