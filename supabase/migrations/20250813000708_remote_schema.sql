create type "public"."fee_status" as enum ('pending', 'paid', 'waived');

create type "public"."invoice_status" as enum ('pending', 'paid', 'canceled', 'overdue');

create type "public"."quote_status" as enum ('pending_admin_approval', 'pending_client_approval', 'approved', 'rejected');

create type "public"."service_classification" as enum ('retail', 'wholesale');

create type "public"."service_order_status" as enum ('pending_recommendation', 'pending_quote', 'pending_client_approval', 'in_progress', 'completed', 'invoiced', 'canceled');

create type "public"."service_status" as enum ('pending', 'in_progress', 'completed', 'canceled');

create type "public"."user_role" as enum ('client', 'specialist', 'partner', 'admin');

create sequence "public"."audit_logs_id_seq";

create table "public"."addresses" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "profile_id" uuid not null,
    "street" text,
    "number" text,
    "neighborhood" text,
    "city" text,
    "state" text,
    "zip_code" character varying,
    "complement" text,
    "is_default" boolean not null default false
);


alter table "public"."addresses" enable row level security;

create table "public"."admins" (
    "profile_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."admins" enable row level security;

create table "public"."audit_logs" (
    "id" bigint not null default nextval('audit_logs_id_seq'::regclass),
    "timestamp" timestamp with time zone not null default now(),
    "user_id" uuid,
    "action" text not null,
    "details" jsonb,
    "resource_id" uuid,
    "resource_type" text,
    "success" boolean
);


alter table "public"."audit_logs" enable row level security;

create table "public"."client_contract_acceptance" (
    "id" uuid not null default gen_random_uuid(),
    "client_id" uuid not null,
    "content" text,
    "accepted_at" timestamp with time zone not null default now()
);


alter table "public"."client_contract_acceptance" enable row level security;

create table "public"."client_specialists" (
    "client_id" uuid not null,
    "specialist_id" uuid not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."client_specialists" enable row level security;

create table "public"."clients" (
    "profile_id" uuid not null,
    "document_type" text,
    "document_number" character varying,
    "parqueamento" numeric(10,2),
    "quilometragem" text,
    "percentual_fipe" numeric(5,2),
    "taxa_operacao" numeric(10,2),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "company_name" text
);


alter table "public"."clients" enable row level security;

create table "public"."contract_partners" (
    "partner_id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "content" text,
    "signed" boolean,
    "contract_id" uuid default gen_random_uuid()
);


alter table "public"."contract_partners" enable row level security;

create table "public"."evaluations" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "service_order_id" uuid not null,
    "specialist_id" uuid not null,
    "evaluation_date" timestamp with time zone not null default now(),
    "description" text,
    "recommendations" jsonb,
    "photos" jsonb
);


alter table "public"."evaluations" enable row level security;

create table "public"."invoices" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "due_date" date,
    "payer_profile_id" uuid not null,
    "amount" numeric not null,
    "status" invoice_status not null,
    "service_order_id" uuid,
    "description" text
);


alter table "public"."invoices" enable row level security;

create table "public"."partner_fees" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "partner_id" uuid not null,
    "service_order_id" uuid not null,
    "amount" numeric not null,
    "status" fee_status not null
);


alter table "public"."partner_fees" enable row level security;

create table "public"."partner_services" (
    "id" uuid not null default gen_random_uuid(),
    "partner_id" uuid not null,
    "name" text not null,
    "description" text,
    "estimated_days" integer,
    "price" numeric,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."partner_services" enable row level security;

create table "public"."partners" (
    "profile_id" uuid not null,
    "cnpj" character varying,
    "company_name" text,
    "is_active" boolean not null default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."partners" enable row level security;

create table "public"."parts" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "description" text,
    "unit_price" numeric,
    "sku" character varying
);


alter table "public"."parts" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "full_name" text,
    "role" user_role not null,
    "status" text
);


alter table "public"."profiles" enable row level security;

create table "public"."quotes" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "service_order_id" uuid not null,
    "partner_id" uuid not null,
    "total_value" numeric,
    "supplier_delivery_date" date,
    "status" quote_status not null
);


alter table "public"."quotes" enable row level security;

create table "public"."service_order_logs" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "service_order_id" uuid not null,
    "old_status" service_order_status,
    "new_status" service_order_status not null,
    "changed_by_profile_id" uuid,
    "notes" text
);


alter table "public"."service_order_logs" enable row level security;

create table "public"."service_orders" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "vehicle_id" uuid not null,
    "specialist_id" uuid not null,
    "status" service_order_status not null,
    "classification" service_classification,
    "estimated_delivery_date" date,
    "final_delivery_date" date,
    "pickup_address_id" uuid,
    "delivery_address_id" uuid,
    "total_cost" numeric,
    "client_id" uuid not null,
    "order_code" text
);


alter table "public"."service_orders" enable row level security;

create table "public"."services" (
    "id" uuid not null default gen_random_uuid(),
    "quote_id" uuid not null,
    "description" text not null,
    "value" numeric,
    "status" service_status not null,
    "estimated_days" integer,
    "parts_needed" jsonb
);


alter table "public"."services" enable row level security;

create table "public"."specialists" (
    "profile_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."specialists" enable row level security;

create table "public"."vehicles" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "client_id" uuid not null,
    "plate" character varying not null,
    "model" text,
    "brand" text,
    "year" integer,
    "color" character varying,
    "photos" jsonb,
    "fipe_value" numeric,
    "estimated_arrival_date" date,
    "created_by" text,
    "status" text
);


alter table "public"."vehicles" enable row level security;

alter sequence "public"."audit_logs_id_seq" owned by "public"."audit_logs"."id";

CREATE UNIQUE INDEX addresses_pkey ON public.addresses USING btree (id);

CREATE UNIQUE INDEX admins_pkey ON public.admins USING btree (profile_id);

CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);

CREATE UNIQUE INDEX client_contract_acceptance_client_id_key ON public.client_contract_acceptance USING btree (client_id);

CREATE UNIQUE INDEX client_contract_acceptance_pkey ON public.client_contract_acceptance USING btree (id);

CREATE UNIQUE INDEX client_specialists_pkey ON public.client_specialists USING btree (client_id, specialist_id);

CREATE UNIQUE INDEX clients_document_number_key ON public.clients USING btree (document_number);

CREATE UNIQUE INDEX clients_pkey ON public.clients USING btree (profile_id);

CREATE UNIQUE INDEX contract_partners_pkey ON public.contract_partners USING btree (partner_id);

CREATE UNIQUE INDEX evaluations_pkey ON public.evaluations USING btree (id);

CREATE INDEX idx_service_orders_client_id ON public.service_orders USING btree (client_id);

CREATE UNIQUE INDEX idx_service_orders_order_code ON public.service_orders USING btree (order_code);

CREATE UNIQUE INDEX invoices_pkey ON public.invoices USING btree (id);

CREATE UNIQUE INDEX partner_fees_pkey ON public.partner_fees USING btree (id);

CREATE UNIQUE INDEX partner_services_pkey ON public.partner_services USING btree (id);

CREATE UNIQUE INDEX partners_cnpj_key ON public.partners USING btree (cnpj);

CREATE UNIQUE INDEX partners_pkey ON public.partners USING btree (profile_id);

CREATE UNIQUE INDEX parts_pkey ON public.parts USING btree (id);

CREATE UNIQUE INDEX parts_sku_key ON public.parts USING btree (sku);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX quotes_pkey ON public.quotes USING btree (id);

CREATE UNIQUE INDEX service_order_logs_pkey ON public.service_order_logs USING btree (id);

CREATE UNIQUE INDEX service_orders_pkey ON public.service_orders USING btree (id);

CREATE UNIQUE INDEX services_pkey ON public.services USING btree (id);

CREATE UNIQUE INDEX specialists_pkey ON public.specialists USING btree (profile_id);

CREATE UNIQUE INDEX vehicles_pkey ON public.vehicles USING btree (id);

CREATE UNIQUE INDEX vehicles_plate_key ON public.vehicles USING btree (plate);

alter table "public"."addresses" add constraint "addresses_pkey" PRIMARY KEY using index "addresses_pkey";

alter table "public"."admins" add constraint "admins_pkey" PRIMARY KEY using index "admins_pkey";

alter table "public"."audit_logs" add constraint "audit_logs_pkey" PRIMARY KEY using index "audit_logs_pkey";

alter table "public"."client_contract_acceptance" add constraint "client_contract_acceptance_pkey" PRIMARY KEY using index "client_contract_acceptance_pkey";

alter table "public"."client_specialists" add constraint "client_specialists_pkey" PRIMARY KEY using index "client_specialists_pkey";

alter table "public"."clients" add constraint "clients_pkey" PRIMARY KEY using index "clients_pkey";

alter table "public"."contract_partners" add constraint "contract_partners_pkey" PRIMARY KEY using index "contract_partners_pkey";

alter table "public"."evaluations" add constraint "evaluations_pkey" PRIMARY KEY using index "evaluations_pkey";

alter table "public"."invoices" add constraint "invoices_pkey" PRIMARY KEY using index "invoices_pkey";

alter table "public"."partner_fees" add constraint "partner_fees_pkey" PRIMARY KEY using index "partner_fees_pkey";

alter table "public"."partner_services" add constraint "partner_services_pkey" PRIMARY KEY using index "partner_services_pkey";

alter table "public"."partners" add constraint "partners_pkey" PRIMARY KEY using index "partners_pkey";

alter table "public"."parts" add constraint "parts_pkey" PRIMARY KEY using index "parts_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."quotes" add constraint "quotes_pkey" PRIMARY KEY using index "quotes_pkey";

alter table "public"."service_order_logs" add constraint "service_order_logs_pkey" PRIMARY KEY using index "service_order_logs_pkey";

alter table "public"."service_orders" add constraint "service_orders_pkey" PRIMARY KEY using index "service_orders_pkey";

alter table "public"."services" add constraint "services_pkey" PRIMARY KEY using index "services_pkey";

alter table "public"."specialists" add constraint "specialists_pkey" PRIMARY KEY using index "specialists_pkey";

alter table "public"."vehicles" add constraint "vehicles_pkey" PRIMARY KEY using index "vehicles_pkey";

alter table "public"."addresses" add constraint "addresses_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) not valid;

alter table "public"."addresses" validate constraint "addresses_profile_id_fkey";

alter table "public"."admins" add constraint "admins_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."admins" validate constraint "admins_profile_id_fkey";

alter table "public"."audit_logs" add constraint "audit_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) not valid;

alter table "public"."audit_logs" validate constraint "audit_logs_user_id_fkey";

alter table "public"."client_contract_acceptance" add constraint "client_contract_acceptance_client_id_fkey" FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."client_contract_acceptance" validate constraint "client_contract_acceptance_client_id_fkey";

alter table "public"."client_contract_acceptance" add constraint "client_contract_acceptance_client_id_key" UNIQUE using index "client_contract_acceptance_client_id_key";

alter table "public"."client_specialists" add constraint "client_specialists_client_id_fkey" FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."client_specialists" validate constraint "client_specialists_client_id_fkey";

alter table "public"."client_specialists" add constraint "client_specialists_specialist_id_fkey" FOREIGN KEY (specialist_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."client_specialists" validate constraint "client_specialists_specialist_id_fkey";

alter table "public"."clients" add constraint "clients_document_number_key" UNIQUE using index "clients_document_number_key";

alter table "public"."clients" add constraint "clients_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."clients" validate constraint "clients_profile_id_fkey";

alter table "public"."contract_partners" add constraint "contract_partners_partner_id_fkey" FOREIGN KEY (partner_id) REFERENCES partners(profile_id) not valid;

alter table "public"."contract_partners" validate constraint "contract_partners_partner_id_fkey";

alter table "public"."evaluations" add constraint "evaluations_service_order_id_fkey" FOREIGN KEY (service_order_id) REFERENCES service_orders(id) not valid;

alter table "public"."evaluations" validate constraint "evaluations_service_order_id_fkey";

alter table "public"."evaluations" add constraint "evaluations_specialist_id_fkey" FOREIGN KEY (specialist_id) REFERENCES specialists(profile_id) not valid;

alter table "public"."evaluations" validate constraint "evaluations_specialist_id_fkey";

alter table "public"."invoices" add constraint "invoices_payer_profile_id_fkey" FOREIGN KEY (payer_profile_id) REFERENCES profiles(id) not valid;

alter table "public"."invoices" validate constraint "invoices_payer_profile_id_fkey";

alter table "public"."invoices" add constraint "invoices_service_order_id_fkey" FOREIGN KEY (service_order_id) REFERENCES service_orders(id) not valid;

alter table "public"."invoices" validate constraint "invoices_service_order_id_fkey";

alter table "public"."partner_fees" add constraint "partner_fees_partner_id_fkey" FOREIGN KEY (partner_id) REFERENCES partners(profile_id) not valid;

alter table "public"."partner_fees" validate constraint "partner_fees_partner_id_fkey";

alter table "public"."partner_fees" add constraint "partner_fees_service_order_id_fkey" FOREIGN KEY (service_order_id) REFERENCES service_orders(id) not valid;

alter table "public"."partner_fees" validate constraint "partner_fees_service_order_id_fkey";

alter table "public"."partner_services" add constraint "fk_partner" FOREIGN KEY (partner_id) REFERENCES partners(profile_id) ON DELETE CASCADE not valid;

alter table "public"."partner_services" validate constraint "fk_partner";

alter table "public"."partners" add constraint "partners_cnpj_key" UNIQUE using index "partners_cnpj_key";

alter table "public"."partners" add constraint "partners_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."partners" validate constraint "partners_profile_id_fkey";

alter table "public"."parts" add constraint "parts_sku_key" UNIQUE using index "parts_sku_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."quotes" add constraint "quotes_partner_id_fkey" FOREIGN KEY (partner_id) REFERENCES partners(profile_id) not valid;

alter table "public"."quotes" validate constraint "quotes_partner_id_fkey";

alter table "public"."quotes" add constraint "quotes_service_order_id_fkey" FOREIGN KEY (service_order_id) REFERENCES service_orders(id) not valid;

alter table "public"."quotes" validate constraint "quotes_service_order_id_fkey";

alter table "public"."service_order_logs" add constraint "service_order_logs_changed_by_profile_id_fkey" FOREIGN KEY (changed_by_profile_id) REFERENCES profiles(id) not valid;

alter table "public"."service_order_logs" validate constraint "service_order_logs_changed_by_profile_id_fkey";

alter table "public"."service_order_logs" add constraint "service_order_logs_service_order_id_fkey" FOREIGN KEY (service_order_id) REFERENCES service_orders(id) not valid;

alter table "public"."service_order_logs" validate constraint "service_order_logs_service_order_id_fkey";

alter table "public"."service_orders" add constraint "service_orders_client_id_fkey" FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."service_orders" validate constraint "service_orders_client_id_fkey";

alter table "public"."service_orders" add constraint "service_orders_delivery_address_id_fkey" FOREIGN KEY (delivery_address_id) REFERENCES addresses(id) not valid;

alter table "public"."service_orders" validate constraint "service_orders_delivery_address_id_fkey";

alter table "public"."service_orders" add constraint "service_orders_pickup_address_id_fkey" FOREIGN KEY (pickup_address_id) REFERENCES addresses(id) not valid;

alter table "public"."service_orders" validate constraint "service_orders_pickup_address_id_fkey";

alter table "public"."service_orders" add constraint "service_orders_specialist_id_fkey" FOREIGN KEY (specialist_id) REFERENCES specialists(profile_id) not valid;

alter table "public"."service_orders" validate constraint "service_orders_specialist_id_fkey";

alter table "public"."service_orders" add constraint "service_orders_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) not valid;

alter table "public"."service_orders" validate constraint "service_orders_vehicle_id_fkey";

alter table "public"."services" add constraint "services_quote_id_fkey" FOREIGN KEY (quote_id) REFERENCES quotes(id) not valid;

alter table "public"."services" validate constraint "services_quote_id_fkey";

alter table "public"."specialists" add constraint "specialists_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."specialists" validate constraint "specialists_profile_id_fkey";

alter table "public"."vehicles" add constraint "vehicles_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(profile_id) not valid;

alter table "public"."vehicles" validate constraint "vehicles_client_id_fkey";

alter table "public"."vehicles" add constraint "vehicles_plate_key" UNIQUE using index "vehicles_plate_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.count_users()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (SELECT count(*) FROM auth.users);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_all_auth_users()
 RETURNS TABLE(id uuid, email character varying, email_confirmed_at timestamp with time zone, raw_user_meta_data jsonb, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$                               
 BEGIN                                 
   RETURN QUERY                        
   SELECT                              
     u.id,                             
     u.email,                          
     u.email_confirmed_at,             
     u.raw_user_meta_data,             
     u.created_at,                     
     u.updated_at                      
   FROM auth.users u;                  
 END;                                  
 $function$
;

CREATE OR REPLACE FUNCTION public.get_my_claim(claim text)
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb -> 'raw_user_meta_data' ->> claim, '')::text;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(NEW.role)
  ) || jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{profile_id}',
      to_jsonb(NEW.id)
  ) -- Adiciona o profile_id ao JWT
  WHERE id = NEW.id;
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."addresses" to "anon";

grant insert on table "public"."addresses" to "anon";

grant references on table "public"."addresses" to "anon";

grant select on table "public"."addresses" to "anon";

grant trigger on table "public"."addresses" to "anon";

grant truncate on table "public"."addresses" to "anon";

grant update on table "public"."addresses" to "anon";

grant delete on table "public"."addresses" to "authenticated";

grant insert on table "public"."addresses" to "authenticated";

grant references on table "public"."addresses" to "authenticated";

grant select on table "public"."addresses" to "authenticated";

grant trigger on table "public"."addresses" to "authenticated";

grant truncate on table "public"."addresses" to "authenticated";

grant update on table "public"."addresses" to "authenticated";

grant delete on table "public"."addresses" to "service_role";

grant insert on table "public"."addresses" to "service_role";

grant references on table "public"."addresses" to "service_role";

grant select on table "public"."addresses" to "service_role";

grant trigger on table "public"."addresses" to "service_role";

grant truncate on table "public"."addresses" to "service_role";

grant update on table "public"."addresses" to "service_role";

grant delete on table "public"."admins" to "anon";

grant insert on table "public"."admins" to "anon";

grant references on table "public"."admins" to "anon";

grant select on table "public"."admins" to "anon";

grant trigger on table "public"."admins" to "anon";

grant truncate on table "public"."admins" to "anon";

grant update on table "public"."admins" to "anon";

grant delete on table "public"."admins" to "authenticated";

grant insert on table "public"."admins" to "authenticated";

grant references on table "public"."admins" to "authenticated";

grant select on table "public"."admins" to "authenticated";

grant trigger on table "public"."admins" to "authenticated";

grant truncate on table "public"."admins" to "authenticated";

grant update on table "public"."admins" to "authenticated";

grant delete on table "public"."admins" to "service_role";

grant insert on table "public"."admins" to "service_role";

grant references on table "public"."admins" to "service_role";

grant select on table "public"."admins" to "service_role";

grant trigger on table "public"."admins" to "service_role";

grant truncate on table "public"."admins" to "service_role";

grant update on table "public"."admins" to "service_role";

grant delete on table "public"."audit_logs" to "anon";

grant insert on table "public"."audit_logs" to "anon";

grant references on table "public"."audit_logs" to "anon";

grant select on table "public"."audit_logs" to "anon";

grant trigger on table "public"."audit_logs" to "anon";

grant truncate on table "public"."audit_logs" to "anon";

grant update on table "public"."audit_logs" to "anon";

grant delete on table "public"."audit_logs" to "authenticated";

grant insert on table "public"."audit_logs" to "authenticated";

grant references on table "public"."audit_logs" to "authenticated";

grant select on table "public"."audit_logs" to "authenticated";

grant trigger on table "public"."audit_logs" to "authenticated";

grant truncate on table "public"."audit_logs" to "authenticated";

grant update on table "public"."audit_logs" to "authenticated";

grant delete on table "public"."audit_logs" to "service_role";

grant insert on table "public"."audit_logs" to "service_role";

grant references on table "public"."audit_logs" to "service_role";

grant select on table "public"."audit_logs" to "service_role";

grant trigger on table "public"."audit_logs" to "service_role";

grant truncate on table "public"."audit_logs" to "service_role";

grant update on table "public"."audit_logs" to "service_role";

grant delete on table "public"."client_contract_acceptance" to "anon";

grant insert on table "public"."client_contract_acceptance" to "anon";

grant references on table "public"."client_contract_acceptance" to "anon";

grant select on table "public"."client_contract_acceptance" to "anon";

grant trigger on table "public"."client_contract_acceptance" to "anon";

grant truncate on table "public"."client_contract_acceptance" to "anon";

grant update on table "public"."client_contract_acceptance" to "anon";

grant delete on table "public"."client_contract_acceptance" to "authenticated";

grant insert on table "public"."client_contract_acceptance" to "authenticated";

grant references on table "public"."client_contract_acceptance" to "authenticated";

grant select on table "public"."client_contract_acceptance" to "authenticated";

grant trigger on table "public"."client_contract_acceptance" to "authenticated";

grant truncate on table "public"."client_contract_acceptance" to "authenticated";

grant update on table "public"."client_contract_acceptance" to "authenticated";

grant delete on table "public"."client_contract_acceptance" to "service_role";

grant insert on table "public"."client_contract_acceptance" to "service_role";

grant references on table "public"."client_contract_acceptance" to "service_role";

grant select on table "public"."client_contract_acceptance" to "service_role";

grant trigger on table "public"."client_contract_acceptance" to "service_role";

grant truncate on table "public"."client_contract_acceptance" to "service_role";

grant update on table "public"."client_contract_acceptance" to "service_role";

grant delete on table "public"."client_specialists" to "anon";

grant insert on table "public"."client_specialists" to "anon";

grant references on table "public"."client_specialists" to "anon";

grant select on table "public"."client_specialists" to "anon";

grant trigger on table "public"."client_specialists" to "anon";

grant truncate on table "public"."client_specialists" to "anon";

grant update on table "public"."client_specialists" to "anon";

grant delete on table "public"."client_specialists" to "authenticated";

grant insert on table "public"."client_specialists" to "authenticated";

grant references on table "public"."client_specialists" to "authenticated";

grant select on table "public"."client_specialists" to "authenticated";

grant trigger on table "public"."client_specialists" to "authenticated";

grant truncate on table "public"."client_specialists" to "authenticated";

grant update on table "public"."client_specialists" to "authenticated";

grant delete on table "public"."client_specialists" to "service_role";

grant insert on table "public"."client_specialists" to "service_role";

grant references on table "public"."client_specialists" to "service_role";

grant select on table "public"."client_specialists" to "service_role";

grant trigger on table "public"."client_specialists" to "service_role";

grant truncate on table "public"."client_specialists" to "service_role";

grant update on table "public"."client_specialists" to "service_role";

grant delete on table "public"."clients" to "anon";

grant insert on table "public"."clients" to "anon";

grant references on table "public"."clients" to "anon";

grant select on table "public"."clients" to "anon";

grant trigger on table "public"."clients" to "anon";

grant truncate on table "public"."clients" to "anon";

grant update on table "public"."clients" to "anon";

grant delete on table "public"."clients" to "authenticated";

grant insert on table "public"."clients" to "authenticated";

grant references on table "public"."clients" to "authenticated";

grant select on table "public"."clients" to "authenticated";

grant trigger on table "public"."clients" to "authenticated";

grant truncate on table "public"."clients" to "authenticated";

grant update on table "public"."clients" to "authenticated";

grant delete on table "public"."clients" to "service_role";

grant insert on table "public"."clients" to "service_role";

grant references on table "public"."clients" to "service_role";

grant select on table "public"."clients" to "service_role";

grant trigger on table "public"."clients" to "service_role";

grant truncate on table "public"."clients" to "service_role";

grant update on table "public"."clients" to "service_role";

grant delete on table "public"."contract_partners" to "anon";

grant insert on table "public"."contract_partners" to "anon";

grant references on table "public"."contract_partners" to "anon";

grant select on table "public"."contract_partners" to "anon";

grant trigger on table "public"."contract_partners" to "anon";

grant truncate on table "public"."contract_partners" to "anon";

grant update on table "public"."contract_partners" to "anon";

grant delete on table "public"."contract_partners" to "authenticated";

grant insert on table "public"."contract_partners" to "authenticated";

grant references on table "public"."contract_partners" to "authenticated";

grant select on table "public"."contract_partners" to "authenticated";

grant trigger on table "public"."contract_partners" to "authenticated";

grant truncate on table "public"."contract_partners" to "authenticated";

grant update on table "public"."contract_partners" to "authenticated";

grant delete on table "public"."contract_partners" to "service_role";

grant insert on table "public"."contract_partners" to "service_role";

grant references on table "public"."contract_partners" to "service_role";

grant select on table "public"."contract_partners" to "service_role";

grant trigger on table "public"."contract_partners" to "service_role";

grant truncate on table "public"."contract_partners" to "service_role";

grant update on table "public"."contract_partners" to "service_role";

grant delete on table "public"."evaluations" to "anon";

grant insert on table "public"."evaluations" to "anon";

grant references on table "public"."evaluations" to "anon";

grant select on table "public"."evaluations" to "anon";

grant trigger on table "public"."evaluations" to "anon";

grant truncate on table "public"."evaluations" to "anon";

grant update on table "public"."evaluations" to "anon";

grant delete on table "public"."evaluations" to "authenticated";

grant insert on table "public"."evaluations" to "authenticated";

grant references on table "public"."evaluations" to "authenticated";

grant select on table "public"."evaluations" to "authenticated";

grant trigger on table "public"."evaluations" to "authenticated";

grant truncate on table "public"."evaluations" to "authenticated";

grant update on table "public"."evaluations" to "authenticated";

grant delete on table "public"."evaluations" to "service_role";

grant insert on table "public"."evaluations" to "service_role";

grant references on table "public"."evaluations" to "service_role";

grant select on table "public"."evaluations" to "service_role";

grant trigger on table "public"."evaluations" to "service_role";

grant truncate on table "public"."evaluations" to "service_role";

grant update on table "public"."evaluations" to "service_role";

grant delete on table "public"."invoices" to "anon";

grant insert on table "public"."invoices" to "anon";

grant references on table "public"."invoices" to "anon";

grant select on table "public"."invoices" to "anon";

grant trigger on table "public"."invoices" to "anon";

grant truncate on table "public"."invoices" to "anon";

grant update on table "public"."invoices" to "anon";

grant delete on table "public"."invoices" to "authenticated";

grant insert on table "public"."invoices" to "authenticated";

grant references on table "public"."invoices" to "authenticated";

grant select on table "public"."invoices" to "authenticated";

grant trigger on table "public"."invoices" to "authenticated";

grant truncate on table "public"."invoices" to "authenticated";

grant update on table "public"."invoices" to "authenticated";

grant delete on table "public"."invoices" to "service_role";

grant insert on table "public"."invoices" to "service_role";

grant references on table "public"."invoices" to "service_role";

grant select on table "public"."invoices" to "service_role";

grant trigger on table "public"."invoices" to "service_role";

grant truncate on table "public"."invoices" to "service_role";

grant update on table "public"."invoices" to "service_role";

grant delete on table "public"."partner_fees" to "anon";

grant insert on table "public"."partner_fees" to "anon";

grant references on table "public"."partner_fees" to "anon";

grant select on table "public"."partner_fees" to "anon";

grant trigger on table "public"."partner_fees" to "anon";

grant truncate on table "public"."partner_fees" to "anon";

grant update on table "public"."partner_fees" to "anon";

grant delete on table "public"."partner_fees" to "authenticated";

grant insert on table "public"."partner_fees" to "authenticated";

grant references on table "public"."partner_fees" to "authenticated";

grant select on table "public"."partner_fees" to "authenticated";

grant trigger on table "public"."partner_fees" to "authenticated";

grant truncate on table "public"."partner_fees" to "authenticated";

grant update on table "public"."partner_fees" to "authenticated";

grant delete on table "public"."partner_fees" to "service_role";

grant insert on table "public"."partner_fees" to "service_role";

grant references on table "public"."partner_fees" to "service_role";

grant select on table "public"."partner_fees" to "service_role";

grant trigger on table "public"."partner_fees" to "service_role";

grant truncate on table "public"."partner_fees" to "service_role";

grant update on table "public"."partner_fees" to "service_role";

grant delete on table "public"."partner_services" to "anon";

grant insert on table "public"."partner_services" to "anon";

grant references on table "public"."partner_services" to "anon";

grant select on table "public"."partner_services" to "anon";

grant trigger on table "public"."partner_services" to "anon";

grant truncate on table "public"."partner_services" to "anon";

grant update on table "public"."partner_services" to "anon";

grant delete on table "public"."partner_services" to "authenticated";

grant insert on table "public"."partner_services" to "authenticated";

grant references on table "public"."partner_services" to "authenticated";

grant select on table "public"."partner_services" to "authenticated";

grant trigger on table "public"."partner_services" to "authenticated";

grant truncate on table "public"."partner_services" to "authenticated";

grant update on table "public"."partner_services" to "authenticated";

grant delete on table "public"."partner_services" to "service_role";

grant insert on table "public"."partner_services" to "service_role";

grant references on table "public"."partner_services" to "service_role";

grant select on table "public"."partner_services" to "service_role";

grant trigger on table "public"."partner_services" to "service_role";

grant truncate on table "public"."partner_services" to "service_role";

grant update on table "public"."partner_services" to "service_role";

grant delete on table "public"."partners" to "anon";

grant insert on table "public"."partners" to "anon";

grant references on table "public"."partners" to "anon";

grant select on table "public"."partners" to "anon";

grant trigger on table "public"."partners" to "anon";

grant truncate on table "public"."partners" to "anon";

grant update on table "public"."partners" to "anon";

grant delete on table "public"."partners" to "authenticated";

grant insert on table "public"."partners" to "authenticated";

grant references on table "public"."partners" to "authenticated";

grant select on table "public"."partners" to "authenticated";

grant trigger on table "public"."partners" to "authenticated";

grant truncate on table "public"."partners" to "authenticated";

grant update on table "public"."partners" to "authenticated";

grant delete on table "public"."partners" to "service_role";

grant insert on table "public"."partners" to "service_role";

grant references on table "public"."partners" to "service_role";

grant select on table "public"."partners" to "service_role";

grant trigger on table "public"."partners" to "service_role";

grant truncate on table "public"."partners" to "service_role";

grant update on table "public"."partners" to "service_role";

grant delete on table "public"."parts" to "anon";

grant insert on table "public"."parts" to "anon";

grant references on table "public"."parts" to "anon";

grant select on table "public"."parts" to "anon";

grant trigger on table "public"."parts" to "anon";

grant truncate on table "public"."parts" to "anon";

grant update on table "public"."parts" to "anon";

grant delete on table "public"."parts" to "authenticated";

grant insert on table "public"."parts" to "authenticated";

grant references on table "public"."parts" to "authenticated";

grant select on table "public"."parts" to "authenticated";

grant trigger on table "public"."parts" to "authenticated";

grant truncate on table "public"."parts" to "authenticated";

grant update on table "public"."parts" to "authenticated";

grant delete on table "public"."parts" to "service_role";

grant insert on table "public"."parts" to "service_role";

grant references on table "public"."parts" to "service_role";

grant select on table "public"."parts" to "service_role";

grant trigger on table "public"."parts" to "service_role";

grant truncate on table "public"."parts" to "service_role";

grant update on table "public"."parts" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."quotes" to "anon";

grant insert on table "public"."quotes" to "anon";

grant references on table "public"."quotes" to "anon";

grant select on table "public"."quotes" to "anon";

grant trigger on table "public"."quotes" to "anon";

grant truncate on table "public"."quotes" to "anon";

grant update on table "public"."quotes" to "anon";

grant delete on table "public"."quotes" to "authenticated";

grant insert on table "public"."quotes" to "authenticated";

grant references on table "public"."quotes" to "authenticated";

grant select on table "public"."quotes" to "authenticated";

grant trigger on table "public"."quotes" to "authenticated";

grant truncate on table "public"."quotes" to "authenticated";

grant update on table "public"."quotes" to "authenticated";

grant delete on table "public"."quotes" to "service_role";

grant insert on table "public"."quotes" to "service_role";

grant references on table "public"."quotes" to "service_role";

grant select on table "public"."quotes" to "service_role";

grant trigger on table "public"."quotes" to "service_role";

grant truncate on table "public"."quotes" to "service_role";

grant update on table "public"."quotes" to "service_role";

grant delete on table "public"."service_order_logs" to "anon";

grant insert on table "public"."service_order_logs" to "anon";

grant references on table "public"."service_order_logs" to "anon";

grant select on table "public"."service_order_logs" to "anon";

grant trigger on table "public"."service_order_logs" to "anon";

grant truncate on table "public"."service_order_logs" to "anon";

grant update on table "public"."service_order_logs" to "anon";

grant delete on table "public"."service_order_logs" to "authenticated";

grant insert on table "public"."service_order_logs" to "authenticated";

grant references on table "public"."service_order_logs" to "authenticated";

grant select on table "public"."service_order_logs" to "authenticated";

grant trigger on table "public"."service_order_logs" to "authenticated";

grant truncate on table "public"."service_order_logs" to "authenticated";

grant update on table "public"."service_order_logs" to "authenticated";

grant delete on table "public"."service_order_logs" to "service_role";

grant insert on table "public"."service_order_logs" to "service_role";

grant references on table "public"."service_order_logs" to "service_role";

grant select on table "public"."service_order_logs" to "service_role";

grant trigger on table "public"."service_order_logs" to "service_role";

grant truncate on table "public"."service_order_logs" to "service_role";

grant update on table "public"."service_order_logs" to "service_role";

grant delete on table "public"."service_orders" to "anon";

grant insert on table "public"."service_orders" to "anon";

grant references on table "public"."service_orders" to "anon";

grant select on table "public"."service_orders" to "anon";

grant trigger on table "public"."service_orders" to "anon";

grant truncate on table "public"."service_orders" to "anon";

grant update on table "public"."service_orders" to "anon";

grant delete on table "public"."service_orders" to "authenticated";

grant insert on table "public"."service_orders" to "authenticated";

grant references on table "public"."service_orders" to "authenticated";

grant select on table "public"."service_orders" to "authenticated";

grant trigger on table "public"."service_orders" to "authenticated";

grant truncate on table "public"."service_orders" to "authenticated";

grant update on table "public"."service_orders" to "authenticated";

grant delete on table "public"."service_orders" to "service_role";

grant insert on table "public"."service_orders" to "service_role";

grant references on table "public"."service_orders" to "service_role";

grant select on table "public"."service_orders" to "service_role";

grant trigger on table "public"."service_orders" to "service_role";

grant truncate on table "public"."service_orders" to "service_role";

grant update on table "public"."service_orders" to "service_role";

grant delete on table "public"."services" to "anon";

grant insert on table "public"."services" to "anon";

grant references on table "public"."services" to "anon";

grant select on table "public"."services" to "anon";

grant trigger on table "public"."services" to "anon";

grant truncate on table "public"."services" to "anon";

grant update on table "public"."services" to "anon";

grant delete on table "public"."services" to "authenticated";

grant insert on table "public"."services" to "authenticated";

grant references on table "public"."services" to "authenticated";

grant select on table "public"."services" to "authenticated";

grant trigger on table "public"."services" to "authenticated";

grant truncate on table "public"."services" to "authenticated";

grant update on table "public"."services" to "authenticated";

grant delete on table "public"."services" to "service_role";

grant insert on table "public"."services" to "service_role";

grant references on table "public"."services" to "service_role";

grant select on table "public"."services" to "service_role";

grant trigger on table "public"."services" to "service_role";

grant truncate on table "public"."services" to "service_role";

grant update on table "public"."services" to "service_role";

grant delete on table "public"."specialists" to "anon";

grant insert on table "public"."specialists" to "anon";

grant references on table "public"."specialists" to "anon";

grant select on table "public"."specialists" to "anon";

grant trigger on table "public"."specialists" to "anon";

grant truncate on table "public"."specialists" to "anon";

grant update on table "public"."specialists" to "anon";

grant delete on table "public"."specialists" to "authenticated";

grant insert on table "public"."specialists" to "authenticated";

grant references on table "public"."specialists" to "authenticated";

grant select on table "public"."specialists" to "authenticated";

grant trigger on table "public"."specialists" to "authenticated";

grant truncate on table "public"."specialists" to "authenticated";

grant update on table "public"."specialists" to "authenticated";

grant delete on table "public"."specialists" to "service_role";

grant insert on table "public"."specialists" to "service_role";

grant references on table "public"."specialists" to "service_role";

grant select on table "public"."specialists" to "service_role";

grant trigger on table "public"."specialists" to "service_role";

grant truncate on table "public"."specialists" to "service_role";

grant update on table "public"."specialists" to "service_role";

grant delete on table "public"."vehicles" to "anon";

grant insert on table "public"."vehicles" to "anon";

grant references on table "public"."vehicles" to "anon";

grant select on table "public"."vehicles" to "anon";

grant trigger on table "public"."vehicles" to "anon";

grant truncate on table "public"."vehicles" to "anon";

grant update on table "public"."vehicles" to "anon";

grant delete on table "public"."vehicles" to "authenticated";

grant insert on table "public"."vehicles" to "authenticated";

grant references on table "public"."vehicles" to "authenticated";

grant select on table "public"."vehicles" to "authenticated";

grant trigger on table "public"."vehicles" to "authenticated";

grant truncate on table "public"."vehicles" to "authenticated";

grant update on table "public"."vehicles" to "authenticated";

grant delete on table "public"."vehicles" to "service_role";

grant insert on table "public"."vehicles" to "service_role";

grant references on table "public"."vehicles" to "service_role";

grant select on table "public"."vehicles" to "service_role";

grant trigger on table "public"."vehicles" to "service_role";

grant truncate on table "public"."vehicles" to "service_role";

grant update on table "public"."vehicles" to "service_role";

create policy "Staff can manage all addresses"
on "public"."addresses"
as permissive
for all
to public
using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])))
with check ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));


create policy "User can manage their own addresses"
on "public"."addresses"
as permissive
for all
to public
using ((auth.uid() = profile_id))
with check ((auth.uid() = profile_id));


create policy "Admins can access their own data"
on "public"."admins"
as permissive
for all
to public
using ((auth.uid() = profile_id))
with check ((auth.uid() = profile_id));


create policy "Admins can manage all admins"
on "public"."admins"
as permissive
for all
to public
using ((get_my_claim('role'::text) = 'admin'::text))
with check ((get_my_claim('role'::text) = 'admin'::text));


create policy "Admins can view audit_logs"
on "public"."audit_logs"
as permissive
for select
to public
using ((get_my_claim('role'::text) = 'admin'::text));


create policy "Clients can insert their own contract acceptance"
on "public"."client_contract_acceptance"
as permissive
for insert
to authenticated
with check ((auth.uid() = client_id));


create policy "Clients can view their own contract acceptance"
on "public"."client_contract_acceptance"
as permissive
for select
to authenticated
using ((auth.uid() = client_id));


create policy "Admins podem gerenciar todas as associações"
on "public"."client_specialists"
as permissive
for all
to public
using ((get_my_claim('user_role'::text) = 'admin'::text));


create policy "Especialistas podem ver seus próprios clientes associados"
on "public"."client_specialists"
as permissive
for select
to public
using ((auth.uid() = specialist_id));


create policy "Admins can manage all clients"
on "public"."clients"
as permissive
for all
to public
using ((get_my_claim('role'::text) = 'admin'::text))
with check ((get_my_claim('role'::text) = 'admin'::text));


create policy "Clients can access their own data"
on "public"."clients"
as permissive
for all
to public
using ((auth.uid() = profile_id))
with check ((auth.uid() = profile_id));


create policy "Only partner can insert their contract"
on "public"."contract_partners"
as permissive
for insert
to authenticated
with check ((auth.uid() = partner_id));


create policy "Partner can read their contracts"
on "public"."contract_partners"
as permissive
for select
to authenticated
using ((auth.uid() = partner_id));


create policy "Staff can manage evaluations"
on "public"."evaluations"
as permissive
for all
to public
using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])))
with check ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));


create policy "Payer can see their own invoices"
on "public"."invoices"
as permissive
for select
to public
using ((auth.uid() = payer_profile_id));


create policy "Staff can manage all invoices"
on "public"."invoices"
as permissive
for all
to public
using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])))
with check ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));


create policy "Partners can see their own fees"
on "public"."partner_fees"
as permissive
for select
to public
using ((auth.uid() = partner_id));


create policy "Staff can manage all partner_fees"
on "public"."partner_fees"
as permissive
for all
to public
using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])))
with check ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));


create policy "Partners can create their own services"
on "public"."partner_services"
as permissive
for insert
to authenticated
with check ((auth.uid() = partner_id));


create policy "Partners can delete their own services."
on "public"."partner_services"
as permissive
for delete
to authenticated
using ((auth.uid() = partner_id));


create policy "Partners can update their own services."
on "public"."partner_services"
as permissive
for update
to authenticated
using ((auth.uid() = partner_id));


create policy "Partners can view their own services."
on "public"."partner_services"
as permissive
for select
to authenticated
using ((auth.uid() = partner_id));


create policy "Admins can manage all partners"
on "public"."partners"
as permissive
for all
to public
using ((get_my_claim('role'::text) = 'admin'::text))
with check ((get_my_claim('role'::text) = 'admin'::text));


create policy "Partners can access their own data"
on "public"."partners"
as permissive
for all
to public
using ((auth.uid() = profile_id))
with check ((auth.uid() = profile_id));


create policy "Admins can manage parts"
on "public"."parts"
as permissive
for all
to public
using ((get_my_claim('role'::text) = 'admin'::text))
with check ((get_my_claim('role'::text) = 'admin'::text));


create policy "Specialists can view parts"
on "public"."parts"
as permissive
for select
to public
using ((get_my_claim('role'::text) = 'specialist'::text));


create policy "Allow service_role to read all profiles"
on "public"."profiles"
as permissive
for select
to service_role
using (true);


create policy "User can access their own profile"
on "public"."profiles"
as permissive
for all
to public
using ((auth.uid() = id))
with check ((auth.uid() = id));


create policy "Clients can see their own quotes"
on "public"."quotes"
as permissive
for select
to public
using ((auth.uid() = ( SELECT clients.profile_id
   FROM clients
  WHERE (clients.profile_id = ( SELECT vehicles.client_id
           FROM vehicles
          WHERE (vehicles.id = ( SELECT service_orders.vehicle_id
                   FROM service_orders
                  WHERE (service_orders.id = quotes.service_order_id))))))));


create policy "Partners can manage their own quotes"
on "public"."quotes"
as permissive
for all
to public
using ((auth.uid() = partner_id))
with check ((auth.uid() = partner_id));


create policy "Staff can manage all quotes"
on "public"."quotes"
as permissive
for all
to public
using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])))
with check ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));


create policy "Staff can view service_order_logs"
on "public"."service_order_logs"
as permissive
for select
to public
using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));


create policy "Clients can see their own service_orders"
on "public"."service_orders"
as permissive
for select
to public
using ((auth.uid() = ( SELECT clients.profile_id
   FROM clients
  WHERE (clients.profile_id = ( SELECT vehicles.client_id
           FROM vehicles
          WHERE (vehicles.id = service_orders.vehicle_id))))));


create policy "Partners can see related service_orders"
on "public"."service_orders"
as permissive
for select
to public
using ((auth.uid() = ( SELECT partners.profile_id
   FROM partners
  WHERE (partners.profile_id = ( SELECT quotes.partner_id
           FROM quotes
          WHERE (quotes.service_order_id = quotes.id))))));


create policy "Staff can manage all service_orders"
on "public"."service_orders"
as permissive
for all
to public
using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])))
with check ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));


create policy "Clients can see related services"
on "public"."services"
as permissive
for select
to public
using ((auth.uid() = ( SELECT clients.profile_id
   FROM clients
  WHERE (clients.profile_id = ( SELECT vehicles.client_id
           FROM vehicles
          WHERE (vehicles.id = ( SELECT service_orders.vehicle_id
                   FROM service_orders
                  WHERE (service_orders.id = ( SELECT quotes.service_order_id
                           FROM quotes
                          WHERE (quotes.id = services.quote_id))))))))));


create policy "Partners can manage related services"
on "public"."services"
as permissive
for all
to public
using ((auth.uid() = ( SELECT partners.profile_id
   FROM partners
  WHERE (partners.profile_id = ( SELECT quotes.partner_id
           FROM quotes
          WHERE (quotes.id = services.quote_id))))))
with check ((auth.uid() = ( SELECT partners.profile_id
   FROM partners
  WHERE (partners.profile_id = ( SELECT quotes.partner_id
           FROM quotes
          WHERE (quotes.id = services.quote_id))))));


create policy "Staff can manage all services"
on "public"."services"
as permissive
for all
to public
using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])))
with check ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));


create policy "Admins can manage all specialists"
on "public"."specialists"
as permissive
for all
to public
using ((get_my_claim('role'::text) = 'admin'::text))
with check ((get_my_claim('role'::text) = 'admin'::text));


create policy "Specialists can access their own data"
on "public"."specialists"
as permissive
for all
to public
using ((auth.uid() = profile_id))
with check ((auth.uid() = profile_id));


create policy "Allow service_role to read all vehicles"
on "public"."vehicles"
as permissive
for select
to service_role
using (true);


create policy "Clients can see their own vehicles"
on "public"."vehicles"
as permissive
for select
to public
using ((auth.uid() = ( SELECT clients.profile_id
   FROM clients
  WHERE (clients.profile_id = vehicles.client_id))));


create policy "Clients can view their own vehicles"
on "public"."vehicles"
as permissive
for select
to authenticated
using ((auth.uid() = client_id));


create policy "Staff can see all vehicles"
on "public"."vehicles"
as permissive
for select
to public
using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));


CREATE TRIGGER on_profile_created AFTER INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();


