

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."fee_status" AS ENUM (
    'pending',
    'paid',
    'waived'
);


ALTER TYPE "public"."fee_status" OWNER TO "postgres";


CREATE TYPE "public"."fuel_level_enum" AS ENUM (
    'empty',
    'quarter',
    'half',
    'three_quarters',
    'full'
);


ALTER TYPE "public"."fuel_level_enum" OWNER TO "postgres";


CREATE TYPE "public"."invoice_status" AS ENUM (
    'pending',
    'paid',
    'canceled',
    'overdue'
);


ALTER TYPE "public"."invoice_status" OWNER TO "postgres";


CREATE TYPE "public"."quote_status" AS ENUM (
    'pending_admin_approval',
    'pending_client_approval',
    'approved',
    'rejected'
);


ALTER TYPE "public"."quote_status" OWNER TO "postgres";


CREATE TYPE "public"."service_classification" AS ENUM (
    'retail',
    'wholesale'
);


ALTER TYPE "public"."service_classification" OWNER TO "postgres";


CREATE TYPE "public"."service_order_status" AS ENUM (
    'pending_recommendation',
    'pending_quote',
    'pending_client_approval',
    'in_progress',
    'completed',
    'invoiced',
    'canceled'
);


ALTER TYPE "public"."service_order_status" OWNER TO "postgres";


CREATE TYPE "public"."service_status" AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'canceled'
);


ALTER TYPE "public"."service_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'client',
    'specialist',
    'partner',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_client_contract"("p_client_id" "uuid", "p_content" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO public.client_contract_acceptance (client_id, content, accepted_at)
    VALUES (p_client_id, p_content, now())
    ON CONFLICT (client_id) DO UPDATE
    SET
        content = EXCLUDED.content,
        accepted_at = now();
END;
$$;


ALTER FUNCTION "public"."accept_client_contract"("p_client_id" "uuid", "p_content" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_partner_contract"("p_partner_id" "uuid", "p_content" "text", "p_signed" boolean) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO public.contract_partners (partner_id, content, signed)
    VALUES (p_partner_id, p_content, p_signed)
    ON CONFLICT (partner_id) DO UPDATE
    SET
        content = EXCLUDED.content,
        signed = EXCLUDED.signed,
        created_at = now(); -- Update timestamp on re-acceptance
END;
$$;


ALTER FUNCTION "public"."accept_partner_contract"("p_partner_id" "uuid", "p_content" "text", "p_signed" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_users"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (SELECT count(*) FROM auth.users);
END;
$$;


ALTER FUNCTION "public"."count_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_collection_history_record"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    vehicle_count_val INTEGER;
BEGIN
    -- Only create history record when status changes to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Check if history record already exists for this collection and date
        IF EXISTS (
            SELECT 1 FROM public.collection_history
            WHERE collection_id = NEW.id AND collection_date = NEW.collection_date
        ) THEN
            -- Log that we're skipping duplicate creation
            RAISE NOTICE 'History record already exists for collection % on date %, skipping creation', NEW.id, NEW.collection_date;
            RETURN NEW;
        END IF;

        -- Count vehicles for this collection
        SELECT COUNT(*) INTO vehicle_count_val
        FROM public.vehicles
        WHERE collection_id = NEW.id;

        -- Ensure we have at least 1 vehicle
        IF vehicle_count_val < 1 THEN
            vehicle_count_val := 1;
        END IF;

        -- Insert immutable history record
        INSERT INTO public.collection_history (
            client_id,
            collection_id,
            collection_address,
            collection_fee_per_vehicle,
            collection_date,
            payment_received,
            payment_received_at,
            vehicle_count
        ) VALUES (
            NEW.client_id,
            NEW.id,
            NEW.collection_address,
            COALESCE(NEW.collection_fee_per_vehicle, 0),
            NEW.collection_date,
            COALESCE(NEW.payment_received, false),
            NEW.payment_received_at,
            vehicle_count_val
        );
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_collection_history_record"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_auth_users"() RETURNS TABLE("id" "uuid", "email" character varying, "email_confirmed_at" timestamp with time zone, "raw_user_meta_data" "jsonb", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$                               
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
 $$;


ALTER FUNCTION "public"."get_all_auth_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_client_vehicles_paginated"("p_client_id" "uuid", "p_page_size" integer, "p_page_num" integer) RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_offset integer;
    v_total_count bigint;
    v_vehicles json;
BEGIN
    v_offset := (p_page_num - 1) * p_page_size;

    -- Get the total count of vehicles for the client
    SELECT count(*) INTO v_total_count
    FROM public.vehicles
    WHERE client_id = p_client_id;

    -- Get the paginated vehicle data and aggregate it into a JSON array
    SELECT COALESCE(json_agg(v.*), '[]'::json) INTO v_vehicles
    FROM (
        SELECT
            id,
            plate,
            brand,
            model,
            color,
            year,
            status
        FROM
            public.vehicles
        WHERE
            client_id = p_client_id
        ORDER BY
            created_at DESC
        LIMIT
            p_page_size
        OFFSET
            v_offset
    ) v;

    -- Combine results into a single JSON object
    RETURN json_build_object(
        'vehicles', v_vehicles,
        'total_count', v_total_count
    );

END;
$$;


ALTER FUNCTION "public"."get_client_vehicles_paginated"("p_client_id" "uuid", "p_page_size" integer, "p_page_num" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_client_vehicles_paginated"("p_client_id" "uuid", "p_page_size" integer, "p_page_num" integer, "p_plate_filter" "text", "p_status_filter" "text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_offset integer;
    v_total_count bigint;
    v_vehicles json;
    v_status_counts json;
BEGIN
    v_offset := (p_page_num - 1) * p_page_size;

    -- Total global de veículos do cliente (sem filtros)
    SELECT count(*) INTO v_total_count
    FROM public.vehicles
    WHERE client_id = p_client_id;

    -- Contagem por todos os status disponíveis do cliente, sem filtros
    SELECT COALESCE(json_object_agg(status, count), '{}'::json)
    INTO v_status_counts
    FROM (
        SELECT status, count(*) AS count
        FROM public.vehicles
        WHERE client_id = p_client_id
        GROUP BY status
    ) AS status_counts;

    -- Lista paginada de veículos com filtros aplicados
    SELECT COALESCE(json_agg(v.*), '[]'::json) INTO v_vehicles
    FROM (
        SELECT
            id,
            plate,
            brand,
            model,
            year,
            color,
            status,
            created_at,
            fipe_value,
            current_odometer,
            fuel_level,
            estimated_arrival_date,
            pickup_address_id
        FROM
            public.vehicles
        WHERE
            client_id = p_client_id
            AND (p_status_filter IS NULL OR p_status_filter = '' OR trim(lower(status)) = trim(lower(p_status_filter)))
        ORDER BY
            created_at DESC
        LIMIT
            p_page_size
        OFFSET
            v_offset
    ) v;

    -- Retorna JSON consolidado com veículos, contagem total e status
    RETURN json_build_object(
        'vehicles', v_vehicles,
        'total_count', v_total_count,
        'status_counts', v_status_counts
    );
END;
$$;


ALTER FUNCTION "public"."get_client_vehicles_paginated"("p_client_id" "uuid", "p_page_size" integer, "p_page_num" integer, "p_plate_filter" "text", "p_status_filter" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_clients_with_vehicle_count"() RETURNS TABLE("id" "uuid", "full_name" "text", "company_name" "text", "vehicle_count" bigint, "specialist_names" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  WITH
    -- CTE to count vehicles per client (avoids duplication)
    vehicle_counts AS (
      SELECT
        v.client_id,
        COUNT(v.id) AS vehicle_count
      FROM vehicles v
      GROUP BY v.client_id
    ),
    -- CTE to aggregate specialist names per client (avoids duplication)
    specialist_agg AS (
      SELECT
        cs.client_id,
        STRING_AGG(DISTINCT sp.full_name, ', ') FILTER (WHERE sp.full_name IS NOT NULL) AS specialist_names
      FROM client_specialists cs
      JOIN profiles sp ON cs.specialist_id = sp.id AND sp.role = 'specialist'
      GROUP BY cs.client_id
    )
  SELECT
    p.id,
    p.full_name,
    c.company_name,
    COALESCE(vc.vehicle_count, 0) AS vehicle_count,
    COALESCE(sa.specialist_names, 'Nenhum') AS specialist_names
  FROM profiles p
  LEFT JOIN clients c ON p.id = c.profile_id
  LEFT JOIN vehicle_counts vc ON p.id = vc.client_id
  LEFT JOIN specialist_agg sa ON p.id = sa.client_id
  WHERE p.role = 'client';
END;
$$;


ALTER FUNCTION "public"."get_clients_with_vehicle_count"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_clients_with_vehicle_count"() IS 'Returns client information with correct vehicle counts and specialist names.
Fixed duplication bug where vehicle counts were multiplied by number of specialists.
Uses CTEs to aggregate data separately and avoid JOIN duplication.';



CREATE OR REPLACE FUNCTION "public"."get_formatted_users"() RETURNS TABLE("id" "uuid", "email" "text", "full_name" "text", "user_role" "text", "status" "text", "created_at" timestamp with time zone, "last_sign_in_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    COALESCE(
      (u.raw_user_meta_data->>'name')::TEXT,
      (u.raw_user_meta_data->>'full_name')::TEXT,
      'Nome não informado'
    ) as full_name,
    COALESCE(
      (u.raw_user_meta_data->>'role')::TEXT,
      'client'
    ) as user_role,
    CASE 
      WHEN u.banned_until IS NOT NULL AND u.banned_until > now() THEN 'Suspenso'
      WHEN u.email_confirmed_at IS NOT NULL THEN 'Ativo'
      ELSE 'Pendente'
    END as status,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_formatted_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_claim"("claim" "text") RETURNS "text"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb -> 'raw_user_meta_data' ->> claim, '')::text;
$$;


ALTER FUNCTION "public"."get_my_claim"("claim" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_partner_dashboard_data"("p_partner_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    pending_quotes_data json;
    in_progress_services_data json;
    budget_counters_data json;
    result json;
BEGIN
    -- 1. Contadores de Orçamentos por Status
    SELECT json_build_object(
        'total', COUNT(*),
        'pending', COUNT(*) FILTER (WHERE status IN ('pending_admin_approval', 'pending_client_approval')),
        'approved', COUNT(*) FILTER (WHERE status = 'approved'),
        'rejected', COUNT(*) FILTER (WHERE status = 'rejected')
    )
    INTO budget_counters_data
    FROM public.quotes
    WHERE partner_id = p_partner_id;

    -- 2. Agrega dados de Orçamentos Pendentes (Quotes) com informações do veículo
    SELECT json_build_object(
        'count', COUNT(q.id),
        'items', COALESCE(json_agg(
            json_build_object(
                'id', q.id,
                'client_name', client_profile.full_name,
                'service_description', (SELECT s.description FROM public.services s WHERE s.quote_id = q.id LIMIT 1),
                'date', q.created_at,
                'status', q.status,
                'total_value', q.total_value,
                'vehicle_plate', v.plate,
                'vehicle_brand', v.brand,
                'vehicle_model', v.model
            )
        ) FILTER (WHERE q.id IS NOT NULL), '[]'::json)
    )
    INTO pending_quotes_data
    FROM public.quotes q
    JOIN public.service_orders so ON q.service_order_id = so.id
    JOIN public.profiles client_profile ON so.client_id = client_profile.id
    JOIN public.vehicles v ON so.vehicle_id = v.id
    WHERE q.partner_id = p_partner_id AND q.status IN ('pending_admin_approval', 'pending_client_approval');

    -- 3. Agrega dados de Serviços em Andamento (Service Orders) com informações do veículo
    SELECT json_build_object(
        'count', COUNT(so.id),
        'items', COALESCE(json_agg(
            json_build_object(
                'id', so.id,
                'client_name', client_profile.full_name,
                'service_description', (SELECT s.description FROM public.services s JOIN public.quotes q2 ON s.quote_id = q2.id WHERE q2.service_order_id = so.id AND q2.partner_id = p_partner_id LIMIT 1),
                'status', so.status,
                'vehicle_plate', v.plate,
                'vehicle_brand', v.brand,
                'vehicle_model', v.model
            )
        ) FILTER (WHERE so.id IS NOT NULL), '[]'::json)
    )
    INTO in_progress_services_data
    FROM public.service_orders so
    JOIN public.profiles client_profile ON so.client_id = client_profile.id
    JOIN public.vehicles v ON so.vehicle_id = v.id
    WHERE so.status = 'in_progress'
      AND EXISTS (
          SELECT 1 FROM public.quotes q_ex
          WHERE q_ex.service_order_id = so.id
            AND q_ex.partner_id = p_partner_id
      );

    -- 4. Combina os resultados em um único JSON
    SELECT json_build_object(
        'budget_counters', budget_counters_data,
        'pending_quotes', pending_quotes_data,
        'in_progress_services', in_progress_services_data
    )
    INTO result;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_partner_dashboard_data"("p_partner_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pending_users"() RETURNS TABLE("id" "uuid", "email" "text", "full_name" "text", "user_role" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT, -- Cast para TEXT
    COALESCE(
      (u.raw_user_meta_data->>'name')::TEXT,
      (u.raw_user_meta_data->>'full_name')::TEXT,
      'Nome não informado'
    ) as full_name,
    COALESCE(
      (u.raw_user_meta_data->>'role')::TEXT,
      'client'
    ) as user_role,
    u.created_at
  FROM auth.users u
  WHERE u.confirmed_at IS NULL
  ORDER BY u.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_pending_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_specialist_clients_with_vehicle_count"("p_specialist_id" "uuid") RETURNS TABLE("client_id" "uuid", "client_full_name" "text", "vehicle_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        cs.client_id,
        p.full_name AS client_full_name,
        COUNT(v.id) AS vehicle_count
    FROM
        public.client_specialists cs
    JOIN
        public.profiles p ON cs.client_id = p.id
    LEFT JOIN
        public.vehicles v ON cs.client_id = v.client_id
    WHERE
        cs.specialist_id = p_specialist_id
    GROUP BY
        cs.client_id, p.full_name;
END;
$$;


ALTER FUNCTION "public"."get_specialist_clients_with_vehicle_count"("p_specialist_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_specialists"() RETURNS TABLE("id" "uuid", "full_name" "text", "email" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Apenas admins podem executar esta função
    IF (get_my_claim('user_role'))::text != 'admin' THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem listar especialistas.';
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.email,
        p.created_at
    FROM public.profiles p
    WHERE p.user_role = 'specialist'
      AND p.status = 'ativo'
    ORDER BY p.full_name ASC;
END;
$$;


ALTER FUNCTION "public"."get_specialists"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_specialists"() IS 'Retorna lista de todos os especialistas ativos. Apenas para administradores.';



CREATE OR REPLACE FUNCTION "public"."get_vehicle_collection_details"() RETURNS TABLE("vehicle_id" "uuid", "plate" "text", "client_id" "uuid", "pickup_address_id" "uuid", "collection_id" "uuid", "collection_address" "text", "collection_status" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id AS vehicle_id,
    v.plate,
    v.client_id,
    v.pickup_address_id,
    v.collection_id,
    vc.collection_address,
    vc.status AS collection_status
  FROM vehicles v
  LEFT JOIN vehicle_collections vc ON v.collection_id = vc.id;
END;
$$;


ALTER FUNCTION "public"."get_vehicle_collection_details"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_user_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_quote_total"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update the total_value in quotes table based on sum of quote_items
  UPDATE quotes 
  SET 
    total_value = COALESCE((
      SELECT SUM(total_price) 
      FROM quote_items 
      WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id)
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.quote_id, OLD.quote_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."recalculate_quote_total"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_set_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_set_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_quote_items_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_quote_items_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."addresses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "street" "text",
    "number" "text",
    "neighborhood" "text",
    "city" "text",
    "state" "text",
    "zip_code" character varying,
    "complement" "text",
    "is_default" boolean DEFAULT false NOT NULL,
    "is_collect_point" boolean DEFAULT false,
    "is_main_address" boolean DEFAULT false
);


ALTER TABLE "public"."addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admins" (
    "profile_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" bigint NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "details" "jsonb",
    "resource_id" "uuid",
    "resource_type" "text",
    "success" boolean
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."audit_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."audit_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."audit_logs_id_seq" OWNED BY "public"."audit_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."client_contract_acceptance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "content" "text",
    "accepted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."client_contract_acceptance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_specialists" (
    "client_id" "uuid" NOT NULL,
    "specialist_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."client_specialists" OWNER TO "postgres";


COMMENT ON TABLE "public"."client_specialists" IS 'Tabela de junção para associar especialistas a clientes.';



COMMENT ON COLUMN "public"."client_specialists"."client_id" IS 'FK para o perfil do cliente.';



COMMENT ON COLUMN "public"."client_specialists"."specialist_id" IS 'FK para o perfil do especialista.';



CREATE TABLE IF NOT EXISTS "public"."clients" (
    "profile_id" "uuid" NOT NULL,
    "document_type" "text",
    "document_number" character varying,
    "parqueamento" numeric(10,2),
    "quilometragem" "text",
    "percentual_fipe" numeric(5,2),
    "taxa_operacao" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "company_name" "text"
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collection_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "collection_id" "uuid" NOT NULL,
    "collection_address" "text" NOT NULL,
    "collection_fee_per_vehicle" numeric NOT NULL,
    "collection_date" "date" NOT NULL,
    "finalized_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payment_received" boolean DEFAULT false,
    "payment_received_at" timestamp with time zone,
    "vehicle_count" integer DEFAULT 1 NOT NULL,
    "total_amount" numeric GENERATED ALWAYS AS (("collection_fee_per_vehicle" * ("vehicle_count")::numeric)) STORED,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "collection_history_collection_fee_per_vehicle_check" CHECK (("collection_fee_per_vehicle" > (0)::numeric)),
    CONSTRAINT "collection_history_vehicle_count_check" CHECK (("vehicle_count" > 0))
);


ALTER TABLE "public"."collection_history" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."collection_history_detailed" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"uuid" AS "client_id",
    NULL::"uuid" AS "collection_id",
    NULL::"text" AS "collection_address",
    NULL::numeric AS "collection_fee_per_vehicle",
    NULL::"date" AS "collection_date",
    NULL::timestamp with time zone AS "finalized_at",
    NULL::boolean AS "payment_received",
    NULL::timestamp with time zone AS "payment_received_at",
    NULL::integer AS "vehicle_count",
    NULL::numeric AS "total_amount",
    NULL::timestamp with time zone AS "created_at",
    NULL::timestamp with time zone AS "updated_at",
    NULL::"text" AS "client_name",
    NULL::character varying(255) AS "client_email",
    NULL::"text" AS "current_status",
    NULL::json AS "vehicles";


ALTER VIEW "public"."collection_history_detailed" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_partners" (
    "partner_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content" "text",
    "signed" boolean,
    "contract_id" "uuid" DEFAULT "gen_random_uuid"(),
    "contract_value" numeric(12,2)
);


ALTER TABLE "public"."contract_partners" OWNER TO "postgres";


COMMENT ON COLUMN "public"."contract_partners"."contract_value" IS 'Valor de contrato acordado no momento do cadastro (BRL)';



CREATE TABLE IF NOT EXISTS "public"."evaluations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "service_order_id" "uuid" NOT NULL,
    "specialist_id" "uuid" NOT NULL,
    "evaluation_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "description" "text",
    "recommendations" "jsonb",
    "photos" "jsonb"
);


ALTER TABLE "public"."evaluations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inspection_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "inspection_id" "uuid",
    "vehicle_id" "uuid" NOT NULL,
    "edited_by" "uuid" NOT NULL,
    "snapshot" "jsonb" NOT NULL
);


ALTER TABLE "public"."inspection_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inspection_media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "inspection_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."inspection_media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inspection_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "inspection_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "required" boolean DEFAULT false NOT NULL,
    "notes" "text"
);


ALTER TABLE "public"."inspection_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inspections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "specialist_id" "uuid" NOT NULL,
    "inspection_date" "date" NOT NULL,
    "odometer" integer NOT NULL,
    "fuel_level" "public"."fuel_level_enum" NOT NULL,
    "observations" "text",
    "finalized" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."inspections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "due_date" "date",
    "payer_profile_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "status" "public"."invoice_status" NOT NULL,
    "service_order_id" "uuid",
    "description" "text"
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_fees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "partner_id" "uuid" NOT NULL,
    "service_order_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "status" "public"."fee_status" NOT NULL
);


ALTER TABLE "public"."partner_fees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "partner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "category" "text",
    "category_id" "uuid"
);


ALTER TABLE "public"."partner_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partners" (
    "profile_id" "uuid" NOT NULL,
    "cnpj" character varying,
    "company_name" "text",
    "is_active" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category" "text"
);


ALTER TABLE "public"."partners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partners_service_categories" (
    "partner_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "priority" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."partners_service_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "unit_price" numeric,
    "sku" character varying
);


ALTER TABLE "public"."parts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "full_name" "text",
    "role" "public"."user_role" NOT NULL,
    "status" "text",
    "must_change_password" boolean DEFAULT false
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quote_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quote_id" "uuid" NOT NULL,
    "service_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "total_price" numeric(10,2) NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_total_price_calculation" CHECK (("total_price" = (("quantity")::numeric * "unit_price"))),
    CONSTRAINT "quote_items_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "quote_items_total_price_check" CHECK (("total_price" >= (0)::numeric)),
    CONSTRAINT "quote_items_unit_price_check" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "public"."quote_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."quote_items" IS 'Stores individual services selected by partners for quotes/budgets';



COMMENT ON COLUMN "public"."quote_items"."quote_id" IS 'Reference to the main quote/budget';



COMMENT ON COLUMN "public"."quote_items"."service_id" IS 'Reference to the service from partner services catalog';



COMMENT ON COLUMN "public"."quote_items"."quantity" IS 'Number of units for this service';



COMMENT ON COLUMN "public"."quote_items"."unit_price" IS 'Price per unit (may differ from catalog price)';



COMMENT ON COLUMN "public"."quote_items"."total_price" IS 'Calculated total: quantity * unit_price';



COMMENT ON COLUMN "public"."quote_items"."notes" IS 'Optional notes about this service item';



CREATE TABLE IF NOT EXISTS "public"."quotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "service_order_id" "uuid" NOT NULL,
    "partner_id" "uuid" NOT NULL,
    "total_value" numeric,
    "supplier_delivery_date" "date",
    "status" "public"."quote_status" NOT NULL
);


ALTER TABLE "public"."quotes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."service_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_order_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "service_order_id" "uuid" NOT NULL,
    "old_status" "public"."service_order_status",
    "new_status" "public"."service_order_status" NOT NULL,
    "changed_by_profile_id" "uuid",
    "notes" "text"
);


ALTER TABLE "public"."service_order_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "specialist_id" "uuid" NOT NULL,
    "status" "public"."service_order_status" NOT NULL,
    "classification" "public"."service_classification",
    "estimated_delivery_date" "date",
    "final_delivery_date" "date",
    "pickup_address_id" "uuid",
    "delivery_address_id" "uuid",
    "total_cost" numeric,
    "client_id" "uuid" NOT NULL,
    "order_code" "text",
    "category_id" "uuid",
    "source_inspection_id" "uuid"
);


ALTER TABLE "public"."service_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quote_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "value" numeric,
    "status" "public"."service_status" NOT NULL,
    "estimated_days" integer,
    "parts_needed" "jsonb"
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."specialists" (
    "profile_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."specialists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_collections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "collection_address" "text" NOT NULL,
    "collection_fee_per_vehicle" numeric,
    "status" "text" DEFAULT 'requested'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "collection_date" "date",
    "payment_received" boolean DEFAULT false,
    "payment_received_at" timestamp with time zone,
    CONSTRAINT "vehicle_collections_status_chk" CHECK (("status" = ANY (ARRAY['requested'::"text", 'approved'::"text", 'paid'::"text"])))
);


ALTER TABLE "public"."vehicle_collections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "plate" character varying NOT NULL,
    "model" "text",
    "brand" "text",
    "year" integer,
    "color" character varying,
    "photos" "jsonb",
    "created_by" "text",
    "fipe_value" numeric,
    "status" "text",
    "current_odometer" integer DEFAULT 0 NOT NULL,
    "fuel_level" "public"."fuel_level_enum" DEFAULT 'half'::"public"."fuel_level_enum" NOT NULL,
    "estimated_arrival_date" "date",
    "pickup_address_id" "uuid",
    "collection_id" "uuid",
    "preparacao" boolean DEFAULT false,
    "comercializacao" boolean DEFAULT false,
    "observations" "text"
);


ALTER TABLE "public"."vehicles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."vehicles"."preparacao" IS 'Indicates if the vehicle is intended for preparation services';



COMMENT ON COLUMN "public"."vehicles"."comercializacao" IS 'Indicates if the vehicle is intended for commercialization services';



COMMENT ON COLUMN "public"."vehicles"."observations" IS 'General observations about the vehicle';



ALTER TABLE ONLY "public"."audit_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."audit_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("profile_id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_contract_acceptance"
    ADD CONSTRAINT "client_contract_acceptance_client_id_key" UNIQUE ("client_id");



ALTER TABLE ONLY "public"."client_contract_acceptance"
    ADD CONSTRAINT "client_contract_acceptance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_specialists"
    ADD CONSTRAINT "client_specialists_pkey" PRIMARY KEY ("client_id", "specialist_id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_document_number_key" UNIQUE ("document_number");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("profile_id");



ALTER TABLE ONLY "public"."collection_history"
    ADD CONSTRAINT "collection_history_collection_id_collection_date_key" UNIQUE ("collection_id", "collection_date");



ALTER TABLE ONLY "public"."collection_history"
    ADD CONSTRAINT "collection_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_partners"
    ADD CONSTRAINT "contract_partners_pkey" PRIMARY KEY ("partner_id");



ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inspection_history"
    ADD CONSTRAINT "inspection_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inspection_media"
    ADD CONSTRAINT "inspection_media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inspection_services"
    ADD CONSTRAINT "inspection_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inspections"
    ADD CONSTRAINT "inspections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partner_fees"
    ADD CONSTRAINT "partner_fees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partner_services"
    ADD CONSTRAINT "partner_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_cnpj_key" UNIQUE ("cnpj");



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_pkey" PRIMARY KEY ("profile_id");



ALTER TABLE ONLY "public"."partners_service_categories"
    ADD CONSTRAINT "partners_service_categories_pkey" PRIMARY KEY ("partner_id", "category_id");



ALTER TABLE ONLY "public"."parts"
    ADD CONSTRAINT "parts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parts"
    ADD CONSTRAINT "parts_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quote_items"
    ADD CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_categories"
    ADD CONSTRAINT "service_categories_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."service_categories"
    ADD CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_order_logs"
    ADD CONSTRAINT "service_order_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_orders"
    ADD CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."specialists"
    ADD CONSTRAINT "specialists_pkey" PRIMARY KEY ("profile_id");



ALTER TABLE ONLY "public"."vehicle_collections"
    ADD CONSTRAINT "vehicle_collections_client_addr_date_uniq" UNIQUE ("client_id", "collection_address", "collection_date");



ALTER TABLE ONLY "public"."vehicle_collections"
    ADD CONSTRAINT "vehicle_collections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_plate_key" UNIQUE ("plate");



CREATE INDEX "idx_addresses_profile_id" ON "public"."addresses" USING "btree" ("profile_id");



CREATE INDEX "idx_collection_history_client_id" ON "public"."collection_history" USING "btree" ("client_id");



CREATE INDEX "idx_collection_history_collection_date" ON "public"."collection_history" USING "btree" ("collection_date");



CREATE INDEX "idx_collection_history_finalized_at" ON "public"."collection_history" USING "btree" ("finalized_at");



CREATE INDEX "idx_partner_services_category_id" ON "public"."partner_services" USING "btree" ("category_id");



CREATE INDEX "idx_quote_items_created_at" ON "public"."quote_items" USING "btree" ("created_at");



CREATE INDEX "idx_quote_items_quote_id" ON "public"."quote_items" USING "btree" ("quote_id");



CREATE INDEX "idx_quote_items_service_id" ON "public"."quote_items" USING "btree" ("service_id");



CREATE INDEX "idx_service_orders_category_id" ON "public"."service_orders" USING "btree" ("category_id");



CREATE INDEX "idx_service_orders_client_id" ON "public"."service_orders" USING "btree" ("client_id");



CREATE UNIQUE INDEX "idx_service_orders_order_code" ON "public"."service_orders" USING "btree" ("order_code");



CREATE INDEX "idx_service_orders_source_inspection_id" ON "public"."service_orders" USING "btree" ("source_inspection_id");



CREATE INDEX "idx_vehicles_pickup_address_id" ON "public"."vehicles" USING "btree" ("pickup_address_id");



CREATE INDEX "vehicle_collections_client_idx" ON "public"."vehicle_collections" USING "btree" ("client_id");



CREATE INDEX "vehicle_collections_client_status_idx" ON "public"."vehicle_collections" USING "btree" ("client_id", "status");



CREATE INDEX "vehicle_collections_status_idx" ON "public"."vehicle_collections" USING "btree" ("status");



CREATE OR REPLACE VIEW "public"."collection_history_detailed" AS
 SELECT "ch"."id",
    "ch"."client_id",
    "ch"."collection_id",
    "ch"."collection_address",
    "ch"."collection_fee_per_vehicle",
    "ch"."collection_date",
    "ch"."finalized_at",
    "ch"."payment_received",
    "ch"."payment_received_at",
    "ch"."vehicle_count",
    "ch"."total_amount",
    "ch"."created_at",
    "ch"."updated_at",
    "p"."full_name" AS "client_name",
    "au"."email" AS "client_email",
    "vc"."status" AS "current_status",
    "json_agg"("json_build_object"('plate', "v"."plate", 'status', "v"."status", 'estimated_arrival_date', "v"."estimated_arrival_date")) FILTER (WHERE ("v"."id" IS NOT NULL)) AS "vehicles"
   FROM (((("public"."collection_history" "ch"
     JOIN "public"."profiles" "p" ON (("p"."id" = "ch"."client_id")))
     LEFT JOIN "auth"."users" "au" ON (("au"."id" = "ch"."client_id")))
     LEFT JOIN "public"."vehicle_collections" "vc" ON (("vc"."id" = "ch"."collection_id")))
     LEFT JOIN "public"."vehicles" "v" ON (("v"."collection_id" = "ch"."collection_id")))
  GROUP BY "ch"."id", "p"."full_name", "au"."email", "vc"."status";



CREATE OR REPLACE TRIGGER "on_profile_created" AFTER INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user_profile"();



CREATE OR REPLACE TRIGGER "trg_vehicle_collections_set_ts" BEFORE UPDATE ON "public"."vehicle_collections" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_create_collection_history" AFTER UPDATE ON "public"."vehicle_collections" FOR EACH ROW EXECUTE FUNCTION "public"."create_collection_history_record"();



CREATE OR REPLACE TRIGGER "trigger_quote_items_updated_at" BEFORE UPDATE ON "public"."quote_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_quote_items_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_recalculate_quote_total_delete" AFTER DELETE ON "public"."quote_items" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_quote_total"();



CREATE OR REPLACE TRIGGER "trigger_recalculate_quote_total_insert" AFTER INSERT ON "public"."quote_items" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_quote_total"();



CREATE OR REPLACE TRIGGER "trigger_recalculate_quote_total_update" AFTER UPDATE ON "public"."quote_items" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_quote_total"();



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."client_contract_acceptance"
    ADD CONSTRAINT "client_contract_acceptance_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_specialists"
    ADD CONSTRAINT "client_specialists_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_specialists"
    ADD CONSTRAINT "client_specialists_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collection_history"
    ADD CONSTRAINT "collection_history_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collection_history"
    ADD CONSTRAINT "collection_history_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "public"."vehicle_collections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_partners"
    ADD CONSTRAINT "contract_partners_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id");



ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "public"."specialists"("profile_id");



ALTER TABLE ONLY "public"."partner_services"
    ADD CONSTRAINT "fk_category" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."partner_services"
    ADD CONSTRAINT "fk_partner" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inspection_history"
    ADD CONSTRAINT "inspection_history_edited_by_fkey" FOREIGN KEY ("edited_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inspection_history"
    ADD CONSTRAINT "inspection_history_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "public"."inspections"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inspection_history"
    ADD CONSTRAINT "inspection_history_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inspection_media"
    ADD CONSTRAINT "inspection_media_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "public"."inspections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inspection_media"
    ADD CONSTRAINT "inspection_media_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inspection_services"
    ADD CONSTRAINT "inspection_services_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "public"."inspections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inspections"
    ADD CONSTRAINT "inspections_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inspections"
    ADD CONSTRAINT "inspections_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_payer_profile_id_fkey" FOREIGN KEY ("payer_profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id");



ALTER TABLE ONLY "public"."partner_fees"
    ADD CONSTRAINT "partner_fees_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("profile_id");



ALTER TABLE ONLY "public"."partner_fees"
    ADD CONSTRAINT "partner_fees_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id");



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partners_service_categories"
    ADD CONSTRAINT "partners_service_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partners_service_categories"
    ADD CONSTRAINT "partners_service_categories_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quote_items"
    ADD CONSTRAINT "quote_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quote_items"
    ADD CONSTRAINT "quote_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("profile_id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id");



ALTER TABLE ONLY "public"."service_order_logs"
    ADD CONSTRAINT "service_order_logs_changed_by_profile_id_fkey" FOREIGN KEY ("changed_by_profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."service_order_logs"
    ADD CONSTRAINT "service_order_logs_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id");



ALTER TABLE ONLY "public"."service_orders"
    ADD CONSTRAINT "service_orders_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id");



ALTER TABLE ONLY "public"."service_orders"
    ADD CONSTRAINT "service_orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_orders"
    ADD CONSTRAINT "service_orders_delivery_address_id_fkey" FOREIGN KEY ("delivery_address_id") REFERENCES "public"."addresses"("id");



ALTER TABLE ONLY "public"."service_orders"
    ADD CONSTRAINT "service_orders_pickup_address_id_fkey" FOREIGN KEY ("pickup_address_id") REFERENCES "public"."addresses"("id");



ALTER TABLE ONLY "public"."service_orders"
    ADD CONSTRAINT "service_orders_source_inspection_id_fkey" FOREIGN KEY ("source_inspection_id") REFERENCES "public"."inspections"("id");



ALTER TABLE ONLY "public"."service_orders"
    ADD CONSTRAINT "service_orders_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "public"."specialists"("profile_id");



ALTER TABLE ONLY "public"."service_orders"
    ADD CONSTRAINT "service_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id");



ALTER TABLE ONLY "public"."specialists"
    ADD CONSTRAINT "specialists_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_collections"
    ADD CONSTRAINT "vehicle_collections_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "public"."vehicle_collections"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_pickup_address_id_fkey" FOREIGN KEY ("pickup_address_id") REFERENCES "public"."addresses"("id") ON DELETE SET NULL;



CREATE POLICY "Admins can access their own data" ON "public"."admins" USING (("auth"."uid"() = "profile_id")) WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Admins can manage all admins" ON "public"."admins" USING (("public"."get_my_claim"('role'::"text") = 'admin'::"text")) WITH CHECK (("public"."get_my_claim"('role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can manage all clients" ON "public"."clients" USING (("public"."get_my_claim"('role'::"text") = 'admin'::"text")) WITH CHECK (("public"."get_my_claim"('role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can manage all partners" ON "public"."partners" USING (("public"."get_my_claim"('role'::"text") = 'admin'::"text")) WITH CHECK (("public"."get_my_claim"('role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can manage all specialists" ON "public"."specialists" USING (("public"."get_my_claim"('role'::"text") = 'admin'::"text")) WITH CHECK (("public"."get_my_claim"('role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can manage parts" ON "public"."parts" USING (("public"."get_my_claim"('role'::"text") = 'admin'::"text")) WITH CHECK (("public"."get_my_claim"('role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can view audit_logs" ON "public"."audit_logs" FOR SELECT USING (("public"."get_my_claim"('role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins podem gerenciar todas as associações" ON "public"."client_specialists" USING (("public"."get_my_claim"('user_role'::"text") = 'admin'::"text"));



CREATE POLICY "Allow service_role to read all profiles" ON "public"."profiles" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "Allow service_role to read all vehicles" ON "public"."vehicles" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "Clients can access their own data" ON "public"."clients" USING (("auth"."uid"() = "profile_id")) WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Clients can insert their own contract acceptance" ON "public"."client_contract_acceptance" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "client_id"));



CREATE POLICY "Clients can see related services" ON "public"."services" FOR SELECT USING (("auth"."uid"() = ( SELECT "clients"."profile_id"
   FROM "public"."clients"
  WHERE ("clients"."profile_id" = ( SELECT "vehicles"."client_id"
           FROM "public"."vehicles"
          WHERE ("vehicles"."id" = ( SELECT "service_orders"."vehicle_id"
                   FROM "public"."service_orders"
                  WHERE ("service_orders"."id" = ( SELECT "quotes"."service_order_id"
                           FROM "public"."quotes"
                          WHERE ("quotes"."id" = "services"."quote_id"))))))))));



CREATE POLICY "Clients can see their own quotes" ON "public"."quotes" FOR SELECT USING (("auth"."uid"() = ( SELECT "clients"."profile_id"
   FROM "public"."clients"
  WHERE ("clients"."profile_id" = ( SELECT "vehicles"."client_id"
           FROM "public"."vehicles"
          WHERE ("vehicles"."id" = ( SELECT "service_orders"."vehicle_id"
                   FROM "public"."service_orders"
                  WHERE ("service_orders"."id" = "quotes"."service_order_id"))))))));



CREATE POLICY "Clients can see their own service_orders" ON "public"."service_orders" FOR SELECT USING (("auth"."uid"() = ( SELECT "clients"."profile_id"
   FROM "public"."clients"
  WHERE ("clients"."profile_id" = ( SELECT "vehicles"."client_id"
           FROM "public"."vehicles"
          WHERE ("vehicles"."id" = "service_orders"."vehicle_id"))))));



CREATE POLICY "Clients can see their own vehicles" ON "public"."vehicles" FOR SELECT USING (("auth"."uid"() = ( SELECT "clients"."profile_id"
   FROM "public"."clients"
  WHERE ("clients"."profile_id" = "vehicles"."client_id"))));



CREATE POLICY "Clients can view their own contract acceptance" ON "public"."client_contract_acceptance" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "client_id"));



CREATE POLICY "Clients can view their own vehicles" ON "public"."vehicles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "client_id"));



CREATE POLICY "Enable insert for admins" ON "public"."vehicle_collections" FOR INSERT WITH CHECK (("auth"."role"() = 'admin'::"text"));



CREATE POLICY "Enable insert for service role only on collection_history" ON "public"."collection_history" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Enable read access for admins" ON "public"."vehicle_collections" FOR SELECT USING (("auth"."role"() = 'admin'::"text"));



CREATE POLICY "Enable read access for admins on collection_history" ON "public"."collection_history" FOR SELECT USING (("auth"."role"() = 'admin'::"text"));



CREATE POLICY "Enable read access for clients on their collection_history" ON "public"."collection_history" FOR SELECT USING (("auth"."uid"() = "client_id"));



CREATE POLICY "Enable update for admins" ON "public"."vehicle_collections" FOR UPDATE USING (("auth"."role"() = 'admin'::"text"));



CREATE POLICY "Enable update for admins on collection_id" ON "public"."vehicles" FOR UPDATE USING (("auth"."role"() = 'admin'::"text")) WITH CHECK (("auth"."role"() = 'admin'::"text"));



CREATE POLICY "Especialistas podem ver seus próprios clientes associados" ON "public"."client_specialists" FOR SELECT USING (("auth"."uid"() = "specialist_id"));



CREATE POLICY "Only partner can insert their contract" ON "public"."contract_partners" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "partner_id"));



CREATE POLICY "Partner can read their contracts" ON "public"."contract_partners" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "partner_id"));



CREATE POLICY "Partners can access their own data" ON "public"."partners" USING (("auth"."uid"() = "profile_id")) WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Partners can create their own services" ON "public"."partner_services" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "partner_id"));



CREATE POLICY "Partners can delete their own services." ON "public"."partner_services" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "partner_id"));



CREATE POLICY "Partners can manage related services" ON "public"."services" USING (("auth"."uid"() = ( SELECT "partners"."profile_id"
   FROM "public"."partners"
  WHERE ("partners"."profile_id" = ( SELECT "quotes"."partner_id"
           FROM "public"."quotes"
          WHERE ("quotes"."id" = "services"."quote_id")))))) WITH CHECK (("auth"."uid"() = ( SELECT "partners"."profile_id"
   FROM "public"."partners"
  WHERE ("partners"."profile_id" = ( SELECT "quotes"."partner_id"
           FROM "public"."quotes"
          WHERE ("quotes"."id" = "services"."quote_id"))))));



CREATE POLICY "Partners can manage their own quote items" ON "public"."quote_items" USING ((EXISTS ( SELECT 1
   FROM "public"."quotes"
  WHERE (("quotes"."id" = "quote_items"."quote_id") AND ("quotes"."partner_id" = "auth"."uid"())))));



CREATE POLICY "Partners can manage their own quotes" ON "public"."quotes" USING (("auth"."uid"() = "partner_id")) WITH CHECK (("auth"."uid"() = "partner_id"));



CREATE POLICY "Partners can see related service_orders" ON "public"."service_orders" FOR SELECT USING (("auth"."uid"() IN ( SELECT "partners"."profile_id"
   FROM "public"."partners"
  WHERE ("partners"."profile_id" IN ( SELECT "quotes"."partner_id"
           FROM "public"."quotes"
          WHERE ("quotes"."service_order_id" = "service_orders"."id"))))));



CREATE POLICY "Partners can see their own fees" ON "public"."partner_fees" FOR SELECT USING (("auth"."uid"() = "partner_id"));



CREATE POLICY "Partners can update their own services." ON "public"."partner_services" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "partner_id"));



CREATE POLICY "Partners can view their own services." ON "public"."partner_services" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "partner_id"));



CREATE POLICY "Payer can see their own invoices" ON "public"."invoices" FOR SELECT USING (("auth"."uid"() = "payer_profile_id"));



CREATE POLICY "Services are readable for quote items" ON "public"."services" FOR SELECT USING (true);



CREATE POLICY "Specialists can access their own data" ON "public"."specialists" USING (("auth"."uid"() = "profile_id")) WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Specialists can view parts" ON "public"."parts" FOR SELECT USING (("public"."get_my_claim"('role'::"text") = 'specialist'::"text"));



CREATE POLICY "Staff can manage all addresses" ON "public"."addresses" USING (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'specialist'::"text"]))) WITH CHECK (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'specialist'::"text"])));



CREATE POLICY "Staff can manage all invoices" ON "public"."invoices" USING (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'specialist'::"text"]))) WITH CHECK (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'specialist'::"text"])));



CREATE POLICY "Staff can manage all partner_fees" ON "public"."partner_fees" USING (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'specialist'::"text"]))) WITH CHECK (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'specialist'::"text"])));



CREATE POLICY "Staff can manage all quotes" ON "public"."quotes" USING (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'specialist'::"text"]))) WITH CHECK (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'specialist'::"text"])));



CREATE POLICY "Staff can manage all service_orders" ON "public"."service_orders" USING (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'specialist'::"text"]))) WITH CHECK (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'specialist'::"text"])));



CREATE POLICY "Staff can manage all services" ON "public"."services" USING (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'specialist'::"text"]))) WITH CHECK (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'specialist'::"text"])));



CREATE POLICY "Staff can manage evaluations" ON "public"."evaluations" USING (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'specialist'::"text"]))) WITH CHECK (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'specialist'::"text"])));



CREATE POLICY "Staff can see all vehicles" ON "public"."vehicles" FOR SELECT USING (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'specialist'::"text"])));



CREATE POLICY "Staff can view service_order_logs" ON "public"."service_order_logs" FOR SELECT USING (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'specialist'::"text"])));



CREATE POLICY "User can access their own profile" ON "public"."profiles" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "User can manage their own addresses" ON "public"."addresses" USING (("auth"."uid"() = "profile_id")) WITH CHECK (("auth"."uid"() = "profile_id"));



ALTER TABLE "public"."addresses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_contract_acceptance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_specialists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collection_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_partners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."evaluations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inspection_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inspection_history_admin_all" ON "public"."inspection_history" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role")))));



ALTER TABLE "public"."inspection_media" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inspection_media_admin_all" ON "public"."inspection_media" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "inspection_media_client_select" ON "public"."inspection_media" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."inspections" "i"
     JOIN "public"."vehicles" "v" ON (("v"."id" = "i"."vehicle_id")))
  WHERE (("i"."id" = "inspection_media"."inspection_id") AND ("v"."client_id" = "auth"."uid"())))));



CREATE POLICY "inspection_media_specialist_select" ON "public"."inspection_media" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."inspections" "i"
     JOIN "public"."vehicles" "v" ON (("v"."id" = "i"."vehicle_id")))
     JOIN "public"."client_specialists" "cs" ON (("cs"."client_id" = "v"."client_id")))
  WHERE (("i"."id" = "inspection_media"."inspection_id") AND ("cs"."specialist_id" = "auth"."uid"())))));



CREATE POLICY "inspection_media_specialist_write" ON "public"."inspection_media" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."inspections" "i"
  WHERE (("i"."id" = "inspection_media"."inspection_id") AND ("i"."specialist_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."inspections" "i"
  WHERE (("i"."id" = "inspection_media"."inspection_id") AND ("i"."specialist_id" = "auth"."uid"())))));



ALTER TABLE "public"."inspection_services" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inspection_services_admin_all" ON "public"."inspection_services" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "inspection_services_client_select" ON "public"."inspection_services" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."inspections" "i"
     JOIN "public"."vehicles" "v" ON (("v"."id" = "i"."vehicle_id")))
  WHERE (("i"."id" = "inspection_services"."inspection_id") AND ("v"."client_id" = "auth"."uid"())))));



CREATE POLICY "inspection_services_specialist_select" ON "public"."inspection_services" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."inspections" "i"
     JOIN "public"."vehicles" "v" ON (("v"."id" = "i"."vehicle_id")))
     JOIN "public"."client_specialists" "cs" ON (("cs"."client_id" = "v"."client_id")))
  WHERE (("i"."id" = "inspection_services"."inspection_id") AND ("cs"."specialist_id" = "auth"."uid"())))));



CREATE POLICY "inspection_services_specialist_write" ON "public"."inspection_services" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."inspections" "i"
     JOIN "public"."vehicles" "v" ON (("v"."id" = "i"."vehicle_id")))
     JOIN "public"."client_specialists" "cs" ON (("cs"."client_id" = "v"."client_id")))
  WHERE (("i"."id" = "inspection_services"."inspection_id") AND ("cs"."specialist_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."inspections" "i"
     JOIN "public"."vehicles" "v" ON (("v"."id" = "i"."vehicle_id")))
     JOIN "public"."client_specialists" "cs" ON (("cs"."client_id" = "v"."client_id")))
  WHERE (("i"."id" = "inspection_services"."inspection_id") AND ("cs"."specialist_id" = "auth"."uid"())))));



ALTER TABLE "public"."inspections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inspections_admin_all" ON "public"."inspections" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "inspections_client_select" ON "public"."inspections" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."vehicles" "v"
  WHERE (("v"."id" = "inspections"."vehicle_id") AND ("v"."client_id" = "auth"."uid"())))));



CREATE POLICY "inspections_specialist_insert" ON "public"."inspections" FOR INSERT TO "authenticated" WITH CHECK ((("specialist_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."vehicles" "v"
     JOIN "public"."client_specialists" "cs" ON (("cs"."client_id" = "v"."client_id")))
  WHERE (("v"."id" = "inspections"."vehicle_id") AND ("cs"."specialist_id" = "auth"."uid"()))))));



CREATE POLICY "inspections_specialist_select" ON "public"."inspections" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."vehicles" "v"
     JOIN "public"."client_specialists" "cs" ON (("cs"."client_id" = "v"."client_id")))
  WHERE (("v"."id" = "inspections"."vehicle_id") AND ("cs"."specialist_id" = "auth"."uid"())))));



CREATE POLICY "inspections_specialist_update" ON "public"."inspections" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."vehicles" "v"
     JOIN "public"."client_specialists" "cs" ON (("cs"."client_id" = "v"."client_id")))
  WHERE (("v"."id" = "inspections"."vehicle_id") AND ("cs"."specialist_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."vehicles" "v"
     JOIN "public"."client_specialists" "cs" ON (("cs"."client_id" = "v"."client_id")))
  WHERE (("v"."id" = "inspections"."vehicle_id") AND ("cs"."specialist_id" = "auth"."uid"())))));



ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partner_fees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partner_services" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "partner_svc_admin_all" ON "public"."partners_service_categories" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role")))));



ALTER TABLE "public"."partners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partners_service_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quote_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_order_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."specialists" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "svc_cat_admin_all" ON "public"."service_categories" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role")))));



ALTER TABLE "public"."vehicle_collections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."accept_client_contract"("p_client_id" "uuid", "p_content" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_client_contract"("p_client_id" "uuid", "p_content" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_client_contract"("p_client_id" "uuid", "p_content" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."accept_partner_contract"("p_partner_id" "uuid", "p_content" "text", "p_signed" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."accept_partner_contract"("p_partner_id" "uuid", "p_content" "text", "p_signed" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_partner_contract"("p_partner_id" "uuid", "p_content" "text", "p_signed" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."count_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."count_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_collection_history_record"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_collection_history_record"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_collection_history_record"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_auth_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_auth_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_auth_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_client_vehicles_paginated"("p_client_id" "uuid", "p_page_size" integer, "p_page_num" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_client_vehicles_paginated"("p_client_id" "uuid", "p_page_size" integer, "p_page_num" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_client_vehicles_paginated"("p_client_id" "uuid", "p_page_size" integer, "p_page_num" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_client_vehicles_paginated"("p_client_id" "uuid", "p_page_size" integer, "p_page_num" integer, "p_plate_filter" "text", "p_status_filter" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_client_vehicles_paginated"("p_client_id" "uuid", "p_page_size" integer, "p_page_num" integer, "p_plate_filter" "text", "p_status_filter" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_client_vehicles_paginated"("p_client_id" "uuid", "p_page_size" integer, "p_page_num" integer, "p_plate_filter" "text", "p_status_filter" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_clients_with_vehicle_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_clients_with_vehicle_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_clients_with_vehicle_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_formatted_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_formatted_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_formatted_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_claim"("claim" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_claim"("claim" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_claim"("claim" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_partner_dashboard_data"("p_partner_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_partner_dashboard_data"("p_partner_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_partner_dashboard_data"("p_partner_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pending_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_pending_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_specialist_clients_with_vehicle_count"("p_specialist_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_specialist_clients_with_vehicle_count"("p_specialist_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_specialist_clients_with_vehicle_count"("p_specialist_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_specialists"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_specialists"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_specialists"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_vehicle_collection_details"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_vehicle_collection_details"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_vehicle_collection_details"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_quote_total"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_quote_total"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_quote_total"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_quote_items_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_quote_items_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_quote_items_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."addresses" TO "anon";
GRANT ALL ON TABLE "public"."addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."addresses" TO "service_role";



GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."client_contract_acceptance" TO "anon";
GRANT ALL ON TABLE "public"."client_contract_acceptance" TO "authenticated";
GRANT ALL ON TABLE "public"."client_contract_acceptance" TO "service_role";



GRANT ALL ON TABLE "public"."client_specialists" TO "anon";
GRANT ALL ON TABLE "public"."client_specialists" TO "authenticated";
GRANT ALL ON TABLE "public"."client_specialists" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."collection_history" TO "anon";
GRANT ALL ON TABLE "public"."collection_history" TO "authenticated";
GRANT ALL ON TABLE "public"."collection_history" TO "service_role";



GRANT ALL ON TABLE "public"."collection_history_detailed" TO "anon";
GRANT ALL ON TABLE "public"."collection_history_detailed" TO "authenticated";
GRANT ALL ON TABLE "public"."collection_history_detailed" TO "service_role";



GRANT ALL ON TABLE "public"."contract_partners" TO "anon";
GRANT ALL ON TABLE "public"."contract_partners" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_partners" TO "service_role";



GRANT ALL ON TABLE "public"."evaluations" TO "anon";
GRANT ALL ON TABLE "public"."evaluations" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluations" TO "service_role";



GRANT ALL ON TABLE "public"."inspection_history" TO "anon";
GRANT ALL ON TABLE "public"."inspection_history" TO "authenticated";
GRANT ALL ON TABLE "public"."inspection_history" TO "service_role";



GRANT ALL ON TABLE "public"."inspection_media" TO "anon";
GRANT ALL ON TABLE "public"."inspection_media" TO "authenticated";
GRANT ALL ON TABLE "public"."inspection_media" TO "service_role";



GRANT ALL ON TABLE "public"."inspection_services" TO "anon";
GRANT ALL ON TABLE "public"."inspection_services" TO "authenticated";
GRANT ALL ON TABLE "public"."inspection_services" TO "service_role";



GRANT ALL ON TABLE "public"."inspections" TO "anon";
GRANT ALL ON TABLE "public"."inspections" TO "authenticated";
GRANT ALL ON TABLE "public"."inspections" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."partner_fees" TO "anon";
GRANT ALL ON TABLE "public"."partner_fees" TO "authenticated";
GRANT ALL ON TABLE "public"."partner_fees" TO "service_role";



GRANT ALL ON TABLE "public"."partner_services" TO "anon";
GRANT ALL ON TABLE "public"."partner_services" TO "authenticated";
GRANT ALL ON TABLE "public"."partner_services" TO "service_role";



GRANT ALL ON TABLE "public"."partners" TO "anon";
GRANT ALL ON TABLE "public"."partners" TO "authenticated";
GRANT ALL ON TABLE "public"."partners" TO "service_role";



GRANT ALL ON TABLE "public"."partners_service_categories" TO "anon";
GRANT ALL ON TABLE "public"."partners_service_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."partners_service_categories" TO "service_role";



GRANT ALL ON TABLE "public"."parts" TO "anon";
GRANT ALL ON TABLE "public"."parts" TO "authenticated";
GRANT ALL ON TABLE "public"."parts" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."quote_items" TO "anon";
GRANT ALL ON TABLE "public"."quote_items" TO "authenticated";
GRANT ALL ON TABLE "public"."quote_items" TO "service_role";



GRANT ALL ON TABLE "public"."quotes" TO "anon";
GRANT ALL ON TABLE "public"."quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."quotes" TO "service_role";



GRANT ALL ON TABLE "public"."service_categories" TO "anon";
GRANT ALL ON TABLE "public"."service_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."service_categories" TO "service_role";



GRANT ALL ON TABLE "public"."service_order_logs" TO "anon";
GRANT ALL ON TABLE "public"."service_order_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."service_order_logs" TO "service_role";



GRANT ALL ON TABLE "public"."service_orders" TO "anon";
GRANT ALL ON TABLE "public"."service_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."service_orders" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."specialists" TO "anon";
GRANT ALL ON TABLE "public"."specialists" TO "authenticated";
GRANT ALL ON TABLE "public"."specialists" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_collections" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_collections" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_collections" TO "service_role";



GRANT ALL ON TABLE "public"."vehicles" TO "anon";
GRANT ALL ON TABLE "public"."vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
