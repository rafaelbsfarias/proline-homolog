-- Create partner_budgets table for storing partner budget/quote data
-- Migration: 20250915120000_create_partner_budgets_tables.sql

-- Create partner_budgets table
create table "public"."partner_budgets" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "partner_id" uuid not null,
    "name" text not null,
    "vehicle_plate" text not null,
    "vehicle_model" text,
    "vehicle_brand" text,
    "vehicle_year" integer,
    "total_value" numeric not null default 0,
    "service_request_id" uuid,
    "status" text not null default 'draft',
    "notes" text
);

-- Create partner_budget_items table
create table "public"."partner_budget_items" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "budget_id" uuid not null,
    "service_id" uuid not null,
    "description" text not null,
    "quantity" integer not null default 1,
    "unit_price" numeric not null default 0,
    "total_price" numeric not null default 0
);

-- Enable RLS
alter table "public"."partner_budgets" enable row level security;
alter table "public"."partner_budget_items" enable row level security;

-- Create indexes
CREATE UNIQUE INDEX partner_budgets_pkey ON public.partner_budgets USING btree (id);
CREATE UNIQUE INDEX partner_budget_items_pkey ON public.partner_budget_items USING btree (id);
CREATE INDEX idx_partner_budgets_partner_id ON public.partner_budgets USING btree (partner_id);
CREATE INDEX idx_partner_budgets_status ON public.partner_budgets USING btree (status);
CREATE INDEX idx_partner_budget_items_budget_id ON public.partner_budget_items USING btree (budget_id);

-- Create primary key constraints
alter table "public"."partner_budgets" add constraint "partner_budgets_pkey" PRIMARY KEY using index "partner_budgets_pkey";
alter table "public"."partner_budget_items" add constraint "partner_budget_items_pkey" PRIMARY KEY using index "partner_budget_items_pkey";

-- Create foreign key constraints
alter table "public"."partner_budgets" add constraint "partner_budgets_partner_id_fkey" FOREIGN KEY (partner_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;
alter table "public"."partner_budgets" validate constraint "partner_budgets_partner_id_fkey";

alter table "public"."partner_budget_items" add constraint "partner_budget_items_budget_id_fkey" FOREIGN KEY (budget_id) REFERENCES partner_budgets(id) ON DELETE CASCADE not valid;
alter table "public"."partner_budget_items" validate constraint "partner_budget_items_budget_id_fkey";

-- Create RLS policies for partner_budgets
create policy "Partners can create their own budgets"
on "public"."partner_budgets"
as permissive
for insert
to authenticated
with check ((auth.uid() = partner_id));

create policy "Partners can view their own budgets"
on "public"."partner_budgets"
as permissive
for select
to authenticated
using ((auth.uid() = partner_id));

create policy "Partners can update their own budgets"
on "public"."partner_budgets"
as permissive
for update
to authenticated
using ((auth.uid() = partner_id))
with check ((auth.uid() = partner_id));

create policy "Partners can delete their own budgets"
on "public"."partner_budgets"
as permissive
for delete
to authenticated
using ((auth.uid() = partner_id));

create policy "Staff can manage all budgets"
on "public"."partner_budgets"
as permissive
for all
to public
using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])))
with check ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));

-- Create RLS policies for partner_budget_items
create policy "Partners can manage their budget items"
on "public"."partner_budget_items"
as permissive
for all
to authenticated
using ((auth.uid() = (SELECT partner_id FROM partner_budgets WHERE id = budget_id)))
with check ((auth.uid() = (SELECT partner_id FROM partner_budgets WHERE id = budget_id)));

create policy "Staff can manage all budget items"
on "public"."partner_budget_items"
as permissive
for all
to public
using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])))
with check ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));

-- Grant permissions
grant delete on table "public"."partner_budgets" to "anon";
grant insert on table "public"."partner_budgets" to "anon";
grant references on table "public"."partner_budgets" to "anon";
grant select on table "public"."partner_budgets" to "anon";
grant trigger on table "public"."partner_budgets" to "anon";
grant truncate on table "public"."partner_budgets" to "anon";
grant update on table "public"."partner_budgets" to "anon";
grant delete on table "public"."partner_budgets" to "authenticated";
grant insert on table "public"."partner_budgets" to "authenticated";
grant references on table "public"."partner_budgets" to "authenticated";
grant select on table "public"."partner_budgets" to "authenticated";
grant trigger on table "public"."partner_budgets" to "authenticated";
grant truncate on table "public"."partner_budgets" to "authenticated";
grant update on table "public"."partner_budgets" to "authenticated";
grant delete on table "public"."partner_budgets" to "service_role";
grant insert on table "public"."partner_budgets" to "service_role";
grant references on table "public"."partner_budgets" to "service_role";
grant select on table "public"."partner_budgets" to "service_role";
grant trigger on table "public"."partner_budgets" to "service_role";
grant truncate on table "public"."partner_budgets" to "service_role";
grant update on table "public"."partner_budgets" to "service_role";

grant delete on table "public"."partner_budget_items" to "anon";
grant insert on table "public"."partner_budget_items" to "anon";
grant references on table "public"."partner_budget_items" to "anon";
grant select on table "public"."partner_budget_items" to "anon";
grant trigger on table "public"."partner_budget_items" to "anon";
grant truncate on table "public"."partner_budget_items" to "anon";
grant update on table "public"."partner_budget_items" to "anon";
grant delete on table "public"."partner_budget_items" to "authenticated";
grant insert on table "public"."partner_budget_items" to "authenticated";
grant references on table "public"."partner_budget_items" to "authenticated";
grant select on table "public"."partner_budget_items" to "authenticated";
grant trigger on table "public"."partner_budget_items" to "authenticated";
grant truncate on table "public"."partner_budget_items" to "authenticated";
grant update on table "public"."partner_budget_items" to "authenticated";
grant delete on table "public"."partner_budget_items" to "service_role";
grant insert on table "public"."partner_budget_items" to "service_role";
grant references on table "public"."partner_budget_items" to "service_role";
grant select on table "public"."partner_budget_items" to "service_role";
grant trigger on table "public"."partner_budget_items" to "service_role";
grant truncate on table "public"."partner_budget_items" to "service_role";
grant update on table "public"."partner_budget_items" to "service_role";
