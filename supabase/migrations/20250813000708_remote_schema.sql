-- Create types conditionally to avoid conflicts
DO $$ BEGIN
    CREATE TYPE fee_status AS ENUM ('pending', 'paid', 'waived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('pending', 'paid', 'canceled', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE quote_status AS ENUM ('pending_admin_approval', 'pending_client_approval', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_classification AS ENUM ('retail', 'wholesale');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_order_status AS ENUM ('pending_recommendation', 'pending_quote', 'pending_client_approval', 'in_progress', 'completed', 'invoiced', 'canceled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_status AS ENUM ('pending', 'in_progress', 'completed', 'canceled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('client', 'specialist', 'partner', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
CREATE SEQUENCE IF NOT EXISTS "public"."audit_logs_id_seq";
CREATE TABLE IF NOT EXISTS "public"."addresses" (
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
ALTER TABLE "public"."addresses" ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS "public"."admins" (
    "profile_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);
ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" bigint not null default nextval('audit_logs_id_seq'::regclass),
    "timestamp" timestamp with time zone not null default now(),
    "user_id" uuid,
    "action" text not null,
    "details" jsonb,
    "resource_id" uuid,
    "resource_type" text,
    "success" boolean
);
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS "public"."client_contract_acceptance" (
    "id" uuid not null default gen_random_uuid(),
    "client_id" uuid not null,
    "content" text,
    "accepted_at" timestamp with time zone not null default now()
);
ALTER TABLE "public"."client_contract_acceptance" ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS "public"."client_specialists" (
    "client_id" uuid not null,
    "specialist_id" uuid not null,
    "created_at" timestamp with time zone default now()
);
ALTER TABLE "public"."client_specialists" ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS "public"."clients" (
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
ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS "public"."contract_partners" (
    "partner_id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "content" text,
    "signed" boolean,
    "contract_id" uuid default gen_random_uuid()
);
ALTER TABLE "public"."contract_partners" ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS "public"."evaluations" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "service_order_id" uuid not null,
    "specialist_id" uuid not null,
    "evaluation_date" timestamp with time zone not null default now(),
    "description" text,
    "recommendations" jsonb,
    "photos" jsonb
);
ALTER TABLE "public"."evaluations" ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "due_date" date,
    "payer_profile_id" uuid not null,
    "amount" numeric not null,
    "status" invoice_status not null,
    "service_order_id" uuid,
    "description" text
);
ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS "public"."partner_fees" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "partner_id" uuid not null,
    "service_order_id" uuid not null,
    "amount" numeric not null,
    "status" fee_status not null
);
ALTER TABLE "public"."partner_fees" ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS "public"."partner_services" (
    "id" uuid not null default gen_random_uuid(),
    "partner_id" uuid not null,
    "name" text not null,
    "description" text,
    "estimated_days" integer,
    "price" numeric,
    "created_at" timestamp with time zone not null default now()
);
ALTER TABLE "public"."partner_services" ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS "public"."partners" (
    "profile_id" uuid not null,
    "cnpj" character varying,
    "company_name" text,
    "is_active" boolean not null default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);
ALTER TABLE "public"."partners" ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS "public"."parts" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "description" text,
    "unit_price" numeric,
    "sku" character varying
);
ALTER TABLE "public"."parts" ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "full_name" text,
    "role" user_role not null,
    "status" text
);
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS "public"."quotes" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "service_order_id" uuid not null,
    "partner_id" uuid not null,
    "total_value" numeric,
    "supplier_delivery_date" date,
    "status" quote_status not null
);
ALTER TABLE "public"."quotes" ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS "public"."service_order_logs" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "service_order_id" uuid not null,
    "old_status" service_order_status,
    "new_status" service_order_status not null,
    "changed_by_profile_id" uuid,
    "notes" text
);
ALTER TABLE "public"."service_order_logs" ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS "public"."service_orders" (
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
ALTER TABLE "public"."service_orders" ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" uuid not null default gen_random_uuid(),
    "quote_id" uuid not null,
    "description" text not null,
    "value" numeric,
    "status" service_status not null,
    "estimated_days" integer,
    "parts_needed" jsonb
);
ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS "public"."specialists" (
    "profile_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);
ALTER TABLE "public"."specialists" ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS "public"."vehicles" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "client_id" uuid not null,
    "plate" character varying not null,
    "model" text,
    "brand" text,
    "year" integer,
    "color" character varying,
    "photos" jsonb,
    "fipeValue" numeric,
    "estimatedArrivalDate" date,
    "created_by" text,
    "estimated_arrival_date" text,
    "fipe_value" numeric,
    "status" text
);
ALTER TABLE "public"."vehicles" ENABLE ROW LEVEL SECURITY;
alter sequence "public"."audit_logs_id_seq" owned by "public"."audit_logs"."id";
CREATE UNIQUE INDEX IF NOT EXISTS addresses_pkey ON public.addresses USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS admins_pkey ON public.admins USING btree (profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS audit_logs_pkey ON public.audit_logs USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS client_contract_acceptance_client_id_key ON public.client_contract_acceptance USING btree (client_id);
CREATE UNIQUE INDEX IF NOT EXISTS client_contract_acceptance_pkey ON public.client_contract_acceptance USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS client_specialists_pkey ON public.client_specialists USING btree (client_id, specialist_id);
CREATE UNIQUE INDEX IF NOT EXISTS clients_document_number_key ON public.clients USING btree (document_number);
CREATE UNIQUE INDEX IF NOT EXISTS clients_pkey ON public.clients USING btree (profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS contract_partners_pkey ON public.contract_partners USING btree (partner_id);
CREATE UNIQUE INDEX IF NOT EXISTS evaluations_pkey ON public.evaluations USING btree (id);
CREATE INDEX IF NOT EXISTS idx_service_orders_client_id ON public.service_orders USING btree (client_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_orders_order_code ON public.service_orders USING btree (order_code);
CREATE UNIQUE INDEX IF NOT EXISTS invoices_pkey ON public.invoices USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS partner_fees_pkey ON public.partner_fees USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS partner_services_pkey ON public.partner_services USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS partners_cnpj_key ON public.partners USING btree (cnpj);
CREATE UNIQUE INDEX IF NOT EXISTS partners_pkey ON public.partners USING btree (profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS parts_pkey ON public.parts USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS parts_sku_key ON public.parts USING btree (sku);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_pkey ON public.profiles USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS quotes_pkey ON public.quotes USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS service_order_logs_pkey ON public.service_order_logs USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS service_orders_pkey ON public.service_orders USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS services_pkey ON public.services USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS specialists_pkey ON public.specialists USING btree (profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_pkey ON public.vehicles USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_plate_key ON public.vehicles USING btree (plate);
-- Add primary key constraints conditionally
-- Helper to add/attach UNIQUE constraint using existing index to avoid name conflicts
CREATE OR REPLACE FUNCTION public.ensure_unique(_schema text, _table text, _constraint_name text, _cols text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  cons_exists boolean;
  idx_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = _schema AND table_name = _table AND constraint_name = _constraint_name
  ) INTO cons_exists;
  IF cons_exists THEN RETURN; END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = _schema AND indexname = _constraint_name
  ) INTO idx_exists;

  IF idx_exists THEN
    EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I UNIQUE USING INDEX %I', _schema, _table, _constraint_name, _constraint_name);
  ELSE
    EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I UNIQUE (%s)', _schema, _table, _constraint_name, _cols);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helper to add/attach PRIMARY KEY using existing index to avoid conflicts
CREATE OR REPLACE FUNCTION public.ensure_pk(_schema text, _table text, _constraint_name text, _cols text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  cons_exists boolean;
  idx_exists boolean;
BEGIN
  -- If PK constraint already exists, do nothing
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = _schema AND table_name = _table AND constraint_type = 'PRIMARY KEY'
      AND constraint_name = _constraint_name
  ) INTO cons_exists;
  IF cons_exists THEN RETURN; END IF;

  -- If an index with the desired name exists, attach it as PK
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = _schema AND indexname = _constraint_name
  ) INTO idx_exists;

  IF idx_exists THEN
    EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I PRIMARY KEY USING INDEX %I', _schema, _table, _constraint_name, _constraint_name);
  ELSE
    EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I PRIMARY KEY (%s)', _schema, _table, _constraint_name, _cols);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

SELECT public.ensure_pk('public','addresses','addresses_pkey','id');

SELECT public.ensure_pk('public','admins','admins_pkey','profile_id');

SELECT public.ensure_pk('public','audit_logs','audit_logs_pkey','id');

SELECT public.ensure_pk('public','client_contract_acceptance','client_contract_acceptance_pkey','id');

SELECT public.ensure_pk('public','client_specialists','client_specialists_pkey','client_id, specialist_id');

SELECT public.ensure_pk('public','clients','clients_pkey','profile_id');

SELECT public.ensure_pk('public','contract_partners','contract_partners_pkey','partner_id');

SELECT public.ensure_pk('public','evaluations','evaluations_pkey','id');

SELECT public.ensure_pk('public','invoices','invoices_pkey','id');

SELECT public.ensure_pk('public','partner_fees','partner_fees_pkey','id');

SELECT public.ensure_pk('public','partner_services','partner_services_pkey','id');

SELECT public.ensure_pk('public','partners','partners_pkey','profile_id');

SELECT public.ensure_pk('public','parts','parts_pkey','id');

SELECT public.ensure_pk('public','profiles','profiles_pkey','id');

SELECT public.ensure_pk('public','quotes','quotes_pkey','id');

SELECT public.ensure_pk('public','service_order_logs','service_order_logs_pkey','id');

SELECT public.ensure_pk('public','service_orders','service_orders_pkey','id');

SELECT public.ensure_pk('public','services','services_pkey','id');

SELECT public.ensure_pk('public','specialists','specialists_pkey','profile_id');

SELECT public.ensure_pk('public','vehicles','vehicles_pkey','id');
-- Add foreign key constraints conditionally
DO $$ BEGIN
    ALTER TABLE public.addresses ADD CONSTRAINT addresses_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) not valid;
    ALTER TABLE public.addresses VALIDATE CONSTRAINT addresses_profile_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.admins ADD CONSTRAINT admins_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;
    ALTER TABLE public.admins VALIDATE CONSTRAINT admins_profile_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) not valid;
    ALTER TABLE public.audit_logs VALIDATE CONSTRAINT audit_logs_user_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.client_contract_acceptance ADD CONSTRAINT client_contract_acceptance_client_id_fkey FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;
    ALTER TABLE public.client_contract_acceptance VALIDATE CONSTRAINT client_contract_acceptance_client_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

SELECT public.ensure_unique('public','client_contract_acceptance','client_contract_acceptance_client_id_key','client_id');

DO $$ BEGIN
    ALTER TABLE public.client_specialists ADD CONSTRAINT client_specialists_client_id_fkey FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;
    ALTER TABLE public.client_specialists VALIDATE CONSTRAINT client_specialists_client_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.client_specialists ADD CONSTRAINT client_specialists_specialist_id_fkey FOREIGN KEY (specialist_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;
    ALTER TABLE public.client_specialists VALIDATE CONSTRAINT client_specialists_specialist_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

SELECT public.ensure_unique('public','clients','clients_document_number_key','document_number');

DO $$ BEGIN
    ALTER TABLE public.clients ADD CONSTRAINT clients_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;
    ALTER TABLE public.clients VALIDATE CONSTRAINT clients_profile_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.contract_partners ADD CONSTRAINT contract_partners_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES partners(profile_id) not valid;
    ALTER TABLE public.contract_partners VALIDATE CONSTRAINT contract_partners_partner_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.evaluations ADD CONSTRAINT evaluations_service_order_id_fkey FOREIGN KEY (service_order_id) REFERENCES service_orders(id) not valid;
    ALTER TABLE public.evaluations VALIDATE CONSTRAINT evaluations_service_order_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.evaluations ADD CONSTRAINT evaluations_specialist_id_fkey FOREIGN KEY (specialist_id) REFERENCES specialists(profile_id) not valid;
    ALTER TABLE public.evaluations VALIDATE CONSTRAINT evaluations_specialist_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.invoices ADD CONSTRAINT invoices_payer_profile_id_fkey FOREIGN KEY (payer_profile_id) REFERENCES profiles(id) not valid;
    ALTER TABLE public.invoices VALIDATE CONSTRAINT invoices_payer_profile_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.invoices ADD CONSTRAINT invoices_service_order_id_fkey FOREIGN KEY (service_order_id) REFERENCES service_orders(id) not valid;
    ALTER TABLE public.invoices VALIDATE CONSTRAINT invoices_service_order_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.partner_fees ADD CONSTRAINT partner_fees_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES partners(profile_id) not valid;
    ALTER TABLE public.partner_fees VALIDATE CONSTRAINT partner_fees_partner_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.partner_fees ADD CONSTRAINT partner_fees_service_order_id_fkey FOREIGN KEY (service_order_id) REFERENCES service_orders(id) not valid;
    ALTER TABLE public.partner_fees VALIDATE CONSTRAINT partner_fees_service_order_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.partner_services ADD CONSTRAINT fk_partner FOREIGN KEY (partner_id) REFERENCES partners(profile_id) ON DELETE CASCADE not valid;
    ALTER TABLE public.partner_services VALIDATE CONSTRAINT fk_partner;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

SELECT public.ensure_unique('public','partners','partners_cnpj_key','cnpj');

DO $$ BEGIN
    ALTER TABLE public.partners ADD CONSTRAINT partners_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;
    ALTER TABLE public.partners VALIDATE CONSTRAINT partners_profile_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

SELECT public.ensure_unique('public','parts','parts_sku_key','sku');

DO $$ BEGIN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
    ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.quotes ADD CONSTRAINT quotes_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES partners(profile_id) not valid;
    ALTER TABLE public.quotes VALIDATE CONSTRAINT quotes_partner_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.quotes ADD CONSTRAINT quotes_service_order_id_fkey FOREIGN KEY (service_order_id) REFERENCES service_orders(id) not valid;
    ALTER TABLE public.quotes VALIDATE CONSTRAINT quotes_service_order_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.service_order_logs ADD CONSTRAINT service_order_logs_changed_by_profile_id_fkey FOREIGN KEY (changed_by_profile_id) REFERENCES profiles(id) not valid;
    ALTER TABLE public.service_order_logs VALIDATE CONSTRAINT service_order_logs_changed_by_profile_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.service_order_logs ADD CONSTRAINT service_order_logs_service_order_id_fkey FOREIGN KEY (service_order_id) REFERENCES service_orders(id) not valid;
    ALTER TABLE public.service_order_logs VALIDATE CONSTRAINT service_order_logs_service_order_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.service_orders ADD CONSTRAINT service_orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;
    ALTER TABLE public.service_orders VALIDATE CONSTRAINT service_orders_client_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.service_orders ADD CONSTRAINT service_orders_delivery_address_id_fkey FOREIGN KEY (delivery_address_id) REFERENCES addresses(id) not valid;
    ALTER TABLE public.service_orders VALIDATE CONSTRAINT service_orders_delivery_address_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.service_orders ADD CONSTRAINT service_orders_pickup_address_id_fkey FOREIGN KEY (pickup_address_id) REFERENCES addresses(id) not valid;
    ALTER TABLE public.service_orders VALIDATE CONSTRAINT service_orders_pickup_address_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.service_orders ADD CONSTRAINT service_orders_specialist_id_fkey FOREIGN KEY (specialist_id) REFERENCES specialists(profile_id) not valid;
    ALTER TABLE public.service_orders VALIDATE CONSTRAINT service_orders_specialist_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.service_orders ADD CONSTRAINT service_orders_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) not valid;
    ALTER TABLE public.service_orders VALIDATE CONSTRAINT service_orders_vehicle_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.services ADD CONSTRAINT services_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES quotes(id) not valid;
    ALTER TABLE public.services VALIDATE CONSTRAINT services_quote_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.specialists ADD CONSTRAINT specialists_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;
    ALTER TABLE public.specialists VALIDATE CONSTRAINT specialists_profile_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(profile_id) not valid;
    ALTER TABLE public.vehicles VALIDATE CONSTRAINT vehicles_client_id_fkey;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

SELECT public.ensure_unique('public','vehicles','vehicles_plate_key','plate');
set check_function_bodies = off;
CREATE OR REPLACE FUNCTION public.count_users()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (SELECT count(*) FROM auth.users);
END;
$function$;
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
 $function$;
CREATE OR REPLACE FUNCTION public.get_my_claim(claim text)
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb -> 'raw_user_meta_data' ->> claim, '')::text;
$function$;
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
$function$;
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
-- Create RLS policies conditionally
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'addresses' AND policyname = 'Staff can manage all addresses') THEN
        create policy "Staff can manage all addresses"
        on "public"."addresses"
        as permissive
        for all
        to public
        using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])))
        with check ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'addresses' AND policyname = 'User can manage their own addresses') THEN
        create policy "User can manage their own addresses"
        on "public"."addresses"
        as permissive
        for all
        to public
        using ((auth.uid() = profile_id))
        with check ((auth.uid() = profile_id));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admins' AND policyname = 'Admins can access their own data') THEN
        create policy "Admins can access their own data"
        on "public"."admins"
        as permissive
        for all
        to public
        using ((auth.uid() = profile_id))
        with check ((auth.uid() = profile_id));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admins' AND policyname = 'Admins can manage all admins') THEN
        create policy "Admins can manage all admins"
        on "public"."admins"
        as permissive
        for all
        to public
        using ((get_my_claim('role'::text) = 'admin'::text))
        with check ((get_my_claim('role'::text) = 'admin'::text));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs' AND policyname = 'Admins can view audit_logs') THEN
        create policy "Admins can view audit_logs"
        on "public"."audit_logs"
        as permissive
        for select
        to public
        using ((get_my_claim('role'::text) = 'admin'::text));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'client_contract_acceptance' AND policyname = 'Clients can insert their own contract acceptance') THEN
        create policy "Clients can insert their own contract acceptance"
        on "public"."client_contract_acceptance"
        as permissive
        for insert
        to authenticated
        with check ((auth.uid() = client_id));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'client_contract_acceptance' AND policyname = 'Clients can view their own contract acceptance') THEN
        create policy "Clients can view their own contract acceptance"
        on "public"."client_contract_acceptance"
        as permissive
        for select
        to authenticated
        using ((auth.uid() = client_id));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'client_specialists' AND policyname = 'Admins podem gerenciar todas as associações') THEN
        create policy "Admins podem gerenciar todas as associações"
        on "public"."client_specialists"
        as permissive
        for all
        to public
        using ((get_my_claim('user_role'::text) = 'admin'::text));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'client_specialists' AND policyname = 'Especialistas podem ver seus próprios clientes associados') THEN
        create policy "Especialistas podem ver seus próprios clientes associados"
        on "public"."client_specialists"
        as permissive
        for select
        to public
        using ((auth.uid() = specialist_id));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clients' AND policyname = 'Admins can manage all clients') THEN
        create policy "Admins can manage all clients"
        on "public"."clients"
        as permissive
        for all
        to public
        using ((get_my_claim('role'::text) = 'admin'::text))
        with check ((get_my_claim('role'::text) = 'admin'::text));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clients' AND policyname = 'Clients can access their own data') THEN
        create policy "Clients can access their own data"
        on "public"."clients"
        as permissive
        for all
        to public
        using ((auth.uid() = profile_id))
        with check ((auth.uid() = profile_id));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contract_partners' AND policyname = 'Only partner can insert their contract') THEN
        create policy "Only partner can insert their contract"
        on "public"."contract_partners"
        as permissive
        for insert
        to authenticated
        with check ((auth.uid() = partner_id));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contract_partners' AND policyname = 'Partner can read their contracts') THEN
        create policy "Partner can read their contracts"
        on "public"."contract_partners"
        as permissive
        for select
        to authenticated
        using ((auth.uid() = partner_id));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'evaluations' AND policyname = 'Staff can manage evaluations') THEN
        create policy "Staff can manage evaluations"
        on "public"."evaluations"
        as permissive
        for all
        to public
        using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])))
        with check ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoices' AND policyname = 'Payer can see their own invoices') THEN
        create policy "Payer can see their own invoices"
        on "public"."invoices"
        as permissive
        for select
        to public
        using ((auth.uid() = payer_profile_id));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoices' AND policyname = 'Staff can manage all invoices') THEN
        create policy "Staff can manage all invoices"
        on "public"."invoices"
        as permissive
        for all
        to public
        using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])))
        with check ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partner_fees' AND policyname = 'Partners can see their own fees') THEN
        create policy "Partners can see their own fees"
        on "public"."partner_fees"
        as permissive
        for select
        to public
        using ((auth.uid() = partner_id));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partner_fees' AND policyname = 'Staff can manage all partner_fees') THEN
        create policy "Staff can manage all partner_fees"
        on "public"."partner_fees"
        as permissive
        for all
        to public
        using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])))
        with check ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partner_services' AND policyname = 'Partners can create their own services') THEN
        create policy "Partners can create their own services"
        on "public"."partner_services"
        as permissive
        for insert
        to authenticated
        with check ((auth.uid() = partner_id));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partner_services' AND policyname = 'Partners can delete their own services.') THEN
        create policy "Partners can delete their own services."
        on "public"."partner_services"
        as permissive
        for delete
        to authenticated
        using ((auth.uid() = partner_id));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partner_services' AND policyname = 'Partners can update their own services.') THEN
        create policy "Partners can update their own services."
        on "public"."partner_services"
        as permissive
        for update
        to authenticated
        using ((auth.uid() = partner_id));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partner_services' AND policyname = 'Partners can view their own services.') THEN
        create policy "Partners can view their own services."
        on "public"."partner_services"
        as permissive
        for select
        to authenticated
        using ((auth.uid() = partner_id));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partners' AND policyname = 'Admins can manage all partners') THEN
        create policy "Admins can manage all partners"
        on "public"."partners"
        as permissive
        for all
        to public
        using ((get_my_claim('role'::text) = 'admin'::text))
        with check ((get_my_claim('role'::text) = 'admin'::text));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partners' AND policyname = 'Partners can access their own data') THEN
        create policy "Partners can access their own data"
        on "public"."partners"
        as permissive
        for all
        to public
        using ((auth.uid() = profile_id))
        with check ((auth.uid() = profile_id));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'parts' AND policyname = 'Admins can manage parts') THEN
        create policy "Admins can manage parts"
        on "public"."parts"
        as permissive
        for all
        to public
        using ((get_my_claim('role'::text) = 'admin'::text))
        with check ((get_my_claim('role'::text) = 'admin'::text));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'parts' AND policyname = 'Specialists can view parts') THEN
        create policy "Specialists can view parts"
        on "public"."parts"
        as permissive
        for select
        to public
        using ((get_my_claim('role'::text) = 'specialist'::text));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Allow service_role to read all profiles') THEN
        create policy "Allow service_role to read all profiles"
        on "public"."profiles"
        as permissive
        for select
        to service_role
        using (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'User can access their own profile') THEN
        create policy "User can access their own profile"
        on "public"."profiles"
        as permissive
        for all
        to public
        using ((auth.uid() = id))
        with check ((auth.uid() = id));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quotes' AND policyname = 'Clients can see their own quotes') THEN
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
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quotes' AND policyname = 'Partners can manage their own quotes') THEN
        create policy "Partners can manage their own quotes"
        on "public"."quotes"
        as permissive
        for all
        to public
        using ((auth.uid() = partner_id))
        with check ((auth.uid() = partner_id));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quotes' AND policyname = 'Staff can manage all quotes') THEN
        create policy "Staff can manage all quotes"
        on "public"."quotes"
        as permissive
        for all
        to public
        using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])))
        with check ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_order_logs' AND policyname = 'Staff can view service_order_logs') THEN
        create policy "Staff can view service_order_logs"
        on "public"."service_order_logs"
        as permissive
        for select
        to public
        using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_orders' AND policyname = 'Clients can see their own service_orders') THEN
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
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_orders' AND policyname = 'Partners can see related service_orders') THEN
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
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_orders' AND policyname = 'Staff can manage all service_orders') THEN
        create policy "Staff can manage all service_orders"
        on "public"."service_orders"
        as permissive
        for all
        to public
        using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])))
        with check ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'services' AND policyname = 'Clients can see related services') THEN
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
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'services' AND policyname = 'Partners can manage related services') THEN
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
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'services' AND policyname = 'Staff can manage all services') THEN
        create policy "Staff can manage all services"
        on "public"."services"
        as permissive
        for all
        to public
        using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])))
        with check ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'specialists' AND policyname = 'Admins can manage all specialists') THEN
        create policy "Admins can manage all specialists"
        on "public"."specialists"
        as permissive
        for all
        to public
        using ((get_my_claim('role'::text) = 'admin'::text))
        with check ((get_my_claim('role'::text) = 'admin'::text));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'specialists' AND policyname = 'Specialists can access their own data') THEN
        create policy "Specialists can access their own data"
        on "public"."specialists"
        as permissive
        for all
        to public
        using ((auth.uid() = profile_id))
        with check ((auth.uid() = profile_id));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Allow service_role to read all vehicles') THEN
        create policy "Allow service_role to read all vehicles"
        on "public"."vehicles"
        as permissive
        for select
        to service_role
        using (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Clients can see their own vehicles') THEN
        create policy "Clients can see their own vehicles"
        on "public"."vehicles"
        as permissive
        for select
        to public
        using ((auth.uid() = ( SELECT clients.profile_id
           FROM clients
          WHERE (clients.profile_id = vehicles.client_id))));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Clients can view their own vehicles') THEN
        create policy "Clients can view their own vehicles"
        on "public"."vehicles"
        as permissive
        for select
        to authenticated
        using ((auth.uid() = client_id));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Staff can see all vehicles') THEN
        create policy "Staff can see all vehicles"
        on "public"."vehicles"
        as permissive
        for select
        to public
        using ((get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));
    END IF;
END $$;
CREATE TRIGGER on_profile_created AFTER INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();
