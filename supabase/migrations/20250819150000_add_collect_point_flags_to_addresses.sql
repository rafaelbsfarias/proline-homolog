-- Add flags to addresses for collect points and main address
alter table public.addresses
  add column if not exists is_collect_point boolean not null default false,
  add column if not exists is_main_address boolean not null default false;
-- Ensure only one main address per profile (partial unique index)
do $$ begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'uniq_main_address_per_profile'
  ) then
    create unique index uniq_main_address_per_profile
      on public.addresses (profile_id)
      where is_main_address = true;
  end if;
end $$;
