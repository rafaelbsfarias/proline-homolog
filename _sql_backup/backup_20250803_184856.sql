--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.5 (Ubuntu 17.5-1.pgdg22.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: _realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA _realtime;


--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pg_net; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_net; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_net IS 'Async HTTP';


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_functions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_functions;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: fee_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.fee_status AS ENUM (
    'pending',
    'paid',
    'waived'
);


--
-- Name: invoice_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invoice_status AS ENUM (
    'pending',
    'paid',
    'canceled',
    'overdue'
);


--
-- Name: quote_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.quote_status AS ENUM (
    'pending_admin_approval',
    'pending_client_approval',
    'approved',
    'rejected'
);


--
-- Name: service_classification; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.service_classification AS ENUM (
    'retail',
    'wholesale'
);


--
-- Name: service_order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.service_order_status AS ENUM (
    'pending_recommendation',
    'pending_quote',
    'pending_client_approval',
    'in_progress',
    'completed',
    'invoiced',
    'canceled'
);


--
-- Name: service_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.service_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'canceled'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'client',
    'specialist',
    'partner',
    'admin'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

    REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
    REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

    GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


--
-- Name: get_my_claim(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_claim(claim text) RETURNS text
    LANGUAGE sql STABLE
    AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb -> 'raw_user_meta_data' ->> claim, '')::text;
$$;


--
-- Name: handle_new_user_profile(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: add_prefixes(text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.add_prefixes(_bucket_id text, _name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: delete_prefix(text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_prefix(_bucket_id text, _name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


--
-- Name: delete_prefix_hierarchy_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_prefix_hierarchy_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


--
-- Name: objects_insert_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_insert_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


--
-- Name: objects_update_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_update_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: prefixes_insert_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.prefixes_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: search_v1_optimised(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
BEGIN
    RETURN query EXECUTE
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name || '/' AS name,
                    NULL::uuid AS id,
                    NULL::timestamptz AS updated_at,
                    NULL::timestamptz AS created_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%'
                AND bucket_id = $2
                AND level = $4
                AND name COLLATE "C" > $5
                ORDER BY prefixes.name COLLATE "C" LIMIT $3
            )
            UNION ALL
            (SELECT split_part(name, '/', $4) AS key,
                name,
                id,
                updated_at,
                created_at,
                metadata
            FROM storage.objects
            WHERE name COLLATE "C" LIKE $1 || '%'
                AND bucket_id = $2
                AND level = $4
                AND name COLLATE "C" > $5
            ORDER BY name COLLATE "C" LIMIT $3)
        ) obj
        ORDER BY name COLLATE "C" LIMIT $3;
        $sql$
        USING prefix, bucket_name, limits, levels, start_after;
END;
$_$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


--
-- Name: http_request(); Type: FUNCTION; Schema: supabase_functions; Owner: -
--

CREATE FUNCTION supabase_functions.http_request() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'supabase_functions'
    AS $$
  DECLARE
    request_id bigint;
    payload jsonb;
    url text := TG_ARGV[0]::text;
    method text := TG_ARGV[1]::text;
    headers jsonb DEFAULT '{}'::jsonb;
    params jsonb DEFAULT '{}'::jsonb;
    timeout_ms integer DEFAULT 1000;
  BEGIN
    IF url IS NULL OR url = 'null' THEN
      RAISE EXCEPTION 'url argument is missing';
    END IF;

    IF method IS NULL OR method = 'null' THEN
      RAISE EXCEPTION 'method argument is missing';
    END IF;

    IF TG_ARGV[2] IS NULL OR TG_ARGV[2] = 'null' THEN
      headers = '{"Content-Type": "application/json"}'::jsonb;
    ELSE
      headers = TG_ARGV[2]::jsonb;
    END IF;

    IF TG_ARGV[3] IS NULL OR TG_ARGV[3] = 'null' THEN
      params = '{}'::jsonb;
    ELSE
      params = TG_ARGV[3]::jsonb;
    END IF;

    IF TG_ARGV[4] IS NULL OR TG_ARGV[4] = 'null' THEN
      timeout_ms = 1000;
    ELSE
      timeout_ms = TG_ARGV[4]::integer;
    END IF;

    CASE
      WHEN method = 'GET' THEN
        SELECT http_get INTO request_id FROM net.http_get(
          url,
          params,
          headers,
          timeout_ms
        );
      WHEN method = 'POST' THEN
        payload = jsonb_build_object(
          'old_record', OLD,
          'record', NEW,
          'type', TG_OP,
          'table', TG_TABLE_NAME,
          'schema', TG_TABLE_SCHEMA
        );

        SELECT http_post INTO request_id FROM net.http_post(
          url,
          payload,
          params,
          headers,
          timeout_ms
        );
      ELSE
        RAISE EXCEPTION 'method argument % is invalid', method;
    END CASE;

    INSERT INTO supabase_functions.hooks
      (hook_table_id, hook_name, request_id)
    VALUES
      (TG_RELID, TG_NAME, request_id);

    RETURN NEW;
  END
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: extensions; Type: TABLE; Schema: _realtime; Owner: -
--

CREATE TABLE _realtime.extensions (
    id uuid NOT NULL,
    type text,
    settings jsonb,
    tenant_external_id text,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: _realtime; Owner: -
--

CREATE TABLE _realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: tenants; Type: TABLE; Schema: _realtime; Owner: -
--

CREATE TABLE _realtime.tenants (
    id uuid NOT NULL,
    name text,
    external_id text,
    jwt_secret text,
    max_concurrent_users integer DEFAULT 200 NOT NULL,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL,
    max_events_per_second integer DEFAULT 100 NOT NULL,
    postgres_cdc_default text DEFAULT 'postgres_cdc_rls'::text,
    max_bytes_per_second integer DEFAULT 100000 NOT NULL,
    max_channels_per_client integer DEFAULT 100 NOT NULL,
    max_joins_per_second integer DEFAULT 500 NOT NULL,
    suspend boolean DEFAULT false,
    jwt_jwks jsonb,
    notify_private_alpha boolean DEFAULT false,
    private_only boolean DEFAULT false NOT NULL,
    migrations_ran integer DEFAULT 0,
    broadcast_adapter character varying(255) DEFAULT 'gen_rpc'::character varying
);


--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    profile_id uuid NOT NULL,
    street text,
    number text,
    neighborhood text,
    city text,
    state text,
    zip_code character varying,
    complement text,
    is_default boolean DEFAULT false NOT NULL
);


--
-- Name: admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admins (
    profile_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    details jsonb,
    resource_id uuid,
    resource_type text,
    success boolean
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    profile_id uuid NOT NULL,
    document_type text,
    document_number character varying,
    address_street text,
    address_number text,
    address_neighborhood text,
    address_city text,
    address_state text,
    address_zip_code character varying,
    parqueamento numeric(10,2),
    quilometragem text,
    percentual_fipe numeric(5,2),
    taxa_operacao numeric(10,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    company_name text
);


--
-- Name: evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    service_order_id uuid NOT NULL,
    specialist_id uuid NOT NULL,
    evaluation_date timestamp with time zone DEFAULT now() NOT NULL,
    description text,
    recommendations jsonb,
    photos jsonb
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    due_date date,
    payer_profile_id uuid NOT NULL,
    amount numeric NOT NULL,
    status public.invoice_status NOT NULL,
    service_order_id uuid,
    description text
);


--
-- Name: partner_fees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_fees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    partner_id uuid NOT NULL,
    service_order_id uuid NOT NULL,
    amount numeric NOT NULL,
    status public.fee_status NOT NULL
);


--
-- Name: partners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partners (
    profile_id uuid NOT NULL,
    cnpj character varying,
    company_name text,
    company_address_street text,
    company_address_number text,
    company_address_neighborhood text,
    company_address_city text,
    company_address_state text,
    company_address_zip_code character varying,
    company_phone text,
    is_active boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: parts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    description text,
    unit_price numeric,
    sku character varying
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    full_name text,
    role public.user_role NOT NULL,
    status text
);


--
-- Name: quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    service_order_id uuid NOT NULL,
    partner_id uuid NOT NULL,
    total_value numeric,
    supplier_delivery_date date,
    status public.quote_status NOT NULL
);


--
-- Name: service_order_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_order_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    service_order_id uuid NOT NULL,
    old_status public.service_order_status,
    new_status public.service_order_status NOT NULL,
    changed_by_profile_id uuid,
    notes text
);


--
-- Name: service_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    vehicle_id uuid NOT NULL,
    specialist_id uuid NOT NULL,
    status public.service_order_status NOT NULL,
    classification public.service_classification,
    estimated_delivery_date date,
    final_delivery_date date,
    pickup_address_id uuid,
    delivery_address_id uuid,
    total_cost numeric
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quote_id uuid NOT NULL,
    description text NOT NULL,
    value numeric,
    status public.service_status NOT NULL,
    estimated_days integer,
    parts_needed jsonb
);


--
-- Name: specialists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.specialists (
    profile_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id uuid NOT NULL,
    plate character varying NOT NULL,
    model text,
    brand text,
    year integer,
    chassi character varying,
    photos jsonb
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: messages_2025_08_02; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_08_02 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_08_03; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_08_03 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_08_04; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_08_04 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_08_05; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_08_05 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_08_06; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_08_06 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: iceberg_namespaces; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.iceberg_namespaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: iceberg_tables; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.iceberg_tables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    namespace_id uuid NOT NULL,
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    location text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    level integer
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: prefixes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.prefixes (
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    level integer GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hooks; Type: TABLE; Schema: supabase_functions; Owner: -
--

CREATE TABLE supabase_functions.hooks (
    id bigint NOT NULL,
    hook_table_id integer NOT NULL,
    hook_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    request_id bigint
);


--
-- Name: TABLE hooks; Type: COMMENT; Schema: supabase_functions; Owner: -
--

COMMENT ON TABLE supabase_functions.hooks IS 'Supabase Functions Hooks: Audit trail for triggered hooks.';


--
-- Name: hooks_id_seq; Type: SEQUENCE; Schema: supabase_functions; Owner: -
--

CREATE SEQUENCE supabase_functions.hooks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hooks_id_seq; Type: SEQUENCE OWNED BY; Schema: supabase_functions; Owner: -
--

ALTER SEQUENCE supabase_functions.hooks_id_seq OWNED BY supabase_functions.hooks.id;


--
-- Name: migrations; Type: TABLE; Schema: supabase_functions; Owner: -
--

CREATE TABLE supabase_functions.migrations (
    version text NOT NULL,
    inserted_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages_2025_08_02; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_08_02 FOR VALUES FROM ('2025-08-02 00:00:00') TO ('2025-08-03 00:00:00');


--
-- Name: messages_2025_08_03; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_08_03 FOR VALUES FROM ('2025-08-03 00:00:00') TO ('2025-08-04 00:00:00');


--
-- Name: messages_2025_08_04; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_08_04 FOR VALUES FROM ('2025-08-04 00:00:00') TO ('2025-08-05 00:00:00');


--
-- Name: messages_2025_08_05; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_08_05 FOR VALUES FROM ('2025-08-05 00:00:00') TO ('2025-08-06 00:00:00');


--
-- Name: messages_2025_08_06; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_08_06 FOR VALUES FROM ('2025-08-06 00:00:00') TO ('2025-08-07 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: hooks id; Type: DEFAULT; Schema: supabase_functions; Owner: -
--

ALTER TABLE ONLY supabase_functions.hooks ALTER COLUMN id SET DEFAULT nextval('supabase_functions.hooks_id_seq'::regclass);


--
-- Data for Name: extensions; Type: TABLE DATA; Schema: _realtime; Owner: -
--

COPY _realtime.extensions (id, type, settings, tenant_external_id, inserted_at, updated_at) FROM stdin;
90b273ce-b98d-4428-9354-e39ceb2778cf	postgres_cdc_rls	{"region": "us-east-1", "db_host": "Yqfr7mA51bNwVIyECLMah9I45VqdgDZ7Q8o8pd74UEw=", "db_name": "sWBpZNdjggEPTQVlI52Zfw==", "db_port": "+enMDFi1J/3IrrquHHwUmA==", "db_user": "uxbEq/zz8DXVD53TOI1zmw==", "slot_name": "supabase_realtime_replication_slot", "db_password": "sWBpZNdjggEPTQVlI52Zfw==", "publication": "supabase_realtime", "ssl_enforced": false, "poll_interval_ms": 100, "poll_max_changes": 100, "poll_max_record_bytes": 1048576}	realtime-dev	2025-08-03 20:11:18	2025-08-03 20:11:18
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: _realtime; Owner: -
--

COPY _realtime.schema_migrations (version, inserted_at) FROM stdin;
20210706140551	2025-08-03 20:10:51
20220329161857	2025-08-03 20:10:51
20220410212326	2025-08-03 20:10:51
20220506102948	2025-08-03 20:10:51
20220527210857	2025-08-03 20:10:51
20220815211129	2025-08-03 20:10:51
20220815215024	2025-08-03 20:10:51
20220818141501	2025-08-03 20:10:51
20221018173709	2025-08-03 20:10:51
20221102172703	2025-08-03 20:10:51
20221223010058	2025-08-03 20:10:51
20230110180046	2025-08-03 20:10:51
20230810220907	2025-08-03 20:10:51
20230810220924	2025-08-03 20:10:51
20231024094642	2025-08-03 20:10:51
20240306114423	2025-08-03 20:10:51
20240418082835	2025-08-03 20:10:51
20240625211759	2025-08-03 20:10:51
20240704172020	2025-08-03 20:10:51
20240902173232	2025-08-03 20:10:51
20241106103258	2025-08-03 20:10:51
20250424203323	2025-08-03 20:10:51
20250613072131	2025-08-03 20:10:51
20250711044927	2025-08-03 20:10:51
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: _realtime; Owner: -
--

COPY _realtime.tenants (id, name, external_id, jwt_secret, max_concurrent_users, inserted_at, updated_at, max_events_per_second, postgres_cdc_default, max_bytes_per_second, max_channels_per_client, max_joins_per_second, suspend, jwt_jwks, notify_private_alpha, private_only, migrations_ran, broadcast_adapter) FROM stdin;
4e7e08af-503c-423b-9f93-5e6cb57aff56	realtime-dev	realtime-dev	iNjicxc4+llvc9wovDvqymwfnj9teWMlyOIbJ8Fh6j2WNU8CIJ2ZgjR6MUIKqSmeDmvpsKLsZ9jgXJmQPpwL8w==	200	2025-08-03 20:11:18	2025-08-03 20:11:18	100	postgres_cdc_rls	100000	100	100	f	{"keys": [{"k": "c3VwZXItc2VjcmV0LWp3dC10b2tlbi13aXRoLWF0LWxlYXN0LTMyLWNoYXJhY3RlcnMtbG9uZw", "kty": "oct"}]}	f	f	63	gen_rpc
\.


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
00000000-0000-0000-0000-000000000000	02226759-8218-4ac2-a693-0c4b3c3a1522	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"rafaelbsfarias@gmail.com","user_id":"99a49937-0918-447f-92eb-d8a6a61a9f3b","user_phone":""}}	2025-08-03 20:27:52.684548+00	
00000000-0000-0000-0000-000000000000	2147c4df-09ea-4a9b-961f-eddb7c12f9c6	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"asdasd@prolineauto.com.br","user_id":"d1e66456-ea7a-485f-abbe-899474b5f921","user_phone":""}}	2025-08-03 20:34:09.576012+00	
00000000-0000-0000-0000-000000000000	1d30b990-e7b6-4334-8593-011f8677d1ce	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"asdasdasd@prolineauto.com.br","user_id":"6ce3398f-79c4-43bd-a389-92dfcdc65b9b","user_phone":""}}	2025-08-03 20:36:20.247923+00	
00000000-0000-0000-0000-000000000000	f5dbbe6f-b500-4cdc-bfb7-0a8c5593c770	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"asdasdl@serejo.tech","user_id":"61c9c3bc-41b1-4053-a543-4f0fe750e8fd","user_phone":""}}	2025-08-03 20:37:11.446886+00	
00000000-0000-0000-0000-000000000000	c4dd58a8-410b-47cd-aa16-bff1329f4dba	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"asdasddfgl@serejo.tech","user_id":"fa60bb36-add9-4507-a877-135ddfa9a917","user_phone":""}}	2025-08-03 20:41:52.791328+00	
00000000-0000-0000-0000-000000000000	462d683d-3ca4-4486-85c3-22c0f02a7816	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin@prolineauto.com.br","user_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","user_phone":""}}	2025-08-03 20:42:37.527587+00	
00000000-0000-0000-0000-000000000000	2e1bdb63-eec3-4036-b366-7987a09954e3	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 20:58:41.582814+00	
00000000-0000-0000-0000-000000000000	7efba9ef-cab8-45dc-b3db-0fa6229d4e76	{"action":"logout","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account"}	2025-08-03 20:58:47.232305+00	
00000000-0000-0000-0000-000000000000	e37eb127-fa6f-4377-8e16-abd0f80e0452	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"asdasdlasd@serejo.tech","user_id":"8b3ed44a-acf9-4469-8110-8339a56603e7","user_phone":""}}	2025-08-03 20:59:06.943124+00	
00000000-0000-0000-0000-000000000000	4e82c13e-a0b6-4a19-9594-606631bed891	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:00:11.652784+00	
00000000-0000-0000-0000-000000000000	78c252a0-f73b-4ed7-885c-2c7c8dd365ce	{"action":"user_modified","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"user","traits":{"user_email":"asdasdlasd@serejo.tech","user_id":"8b3ed44a-acf9-4469-8110-8339a56603e7","user_phone":""}}	2025-08-03 21:01:15.255821+00	
00000000-0000-0000-0000-000000000000	8c59c582-b926-494a-b26b-74f78cd53f02	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"asdasdlasd@serejo.tech","user_id":"8b3ed44a-acf9-4469-8110-8339a56603e7","user_phone":""}}	2025-08-03 21:01:22.318826+00	
00000000-0000-0000-0000-000000000000	ea2007e9-0685-49f8-b140-b535a91e8b75	{"action":"user_confirmation_requested","actor_id":"fa60bb36-add9-4507-a877-135ddfa9a917","actor_name":"asdasd","actor_username":"asdasddfgl@serejo.tech","actor_via_sso":false,"log_type":"user"}	2025-08-03 21:01:37.331969+00	
00000000-0000-0000-0000-000000000000	caf20125-2df1-4335-a772-ee9b67b78b1c	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"rafaelbsfarias@gmail.com","user_id":"99a49937-0918-447f-92eb-d8a6a61a9f3b","user_phone":""}}	2025-08-03 21:01:43.594338+00	
00000000-0000-0000-0000-000000000000	457c10f5-ced3-434d-8b19-2307d322c943	{"action":"user_confirmation_requested","actor_id":"d1e66456-ea7a-485f-abbe-899474b5f921","actor_name":"felipe","actor_username":"asdasd@prolineauto.com.br","actor_via_sso":false,"log_type":"user"}	2025-08-03 21:01:52.362887+00	
00000000-0000-0000-0000-000000000000	e5b6c15b-9280-4edb-a804-c6a7827c40ae	{"action":"user_confirmation_requested","actor_id":"61c9c3bc-41b1-4053-a543-4f0fe750e8fd","actor_name":"asdasd","actor_username":"asdasdl@serejo.tech","actor_via_sso":false,"log_type":"user"}	2025-08-03 21:02:04.127568+00	
00000000-0000-0000-0000-000000000000	8a71eee3-b688-4f2c-9057-801b6ff93653	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"asdasdlasd@serejo.tech","user_id":"dafc3a7b-38ec-4115-a0e1-1965519d3ee0","user_phone":""}}	2025-08-03 21:02:23.075102+00	
00000000-0000-0000-0000-000000000000	fe8ebaaa-b396-4be0-a9f5-c311c734123f	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin2@prolineauto.com.br","user_id":"4529579b-f032-46c1-afa9-b35b65d17e99","user_phone":""}}	2025-08-03 21:03:25.101603+00	
00000000-0000-0000-0000-000000000000	5a6b2fa7-f278-4e10-b0c2-26cef1b16d75	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"especialista1@prolineauto.com.br","user_id":"64295dc1-48f0-42d6-8d21-d7d1b93951f0","user_phone":""}}	2025-08-03 21:03:34.884236+00	
00000000-0000-0000-0000-000000000000	c7a17390-f29e-4dae-8e8d-2ed0d4bbadb0	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:06:43.74192+00	
00000000-0000-0000-0000-000000000000	7c92aaa3-4090-4bc2-9d7a-60e603c8e949	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"novo_cliente_201945@prolineauto.com.br","user_id":"ea5a5cc3-e2f6-4afe-a5f7-a836f661e024","user_phone":""}}	2025-08-03 21:06:49.356236+00	
00000000-0000-0000-0000-000000000000	4d6f99e6-0d9c-408d-8d46-de2bf38bde8a	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"novo_cliente_201945@prolineauto.com.br","user_id":"ea5a5cc3-e2f6-4afe-a5f7-a836f661e024","user_phone":""}}	2025-08-03 21:06:49.372995+00	
00000000-0000-0000-0000-000000000000	6606b48e-45f4-4e91-add5-82e17bb7063c	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:09:42.020358+00	
00000000-0000-0000-0000-000000000000	45cb1ed7-7f8f-4d41-8074-f9093bf95156	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:10:44.793711+00	
00000000-0000-0000-0000-000000000000	aa6de24b-4ec7-401f-8d85-7ca6a8c034d8	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:10:49.201649+00	
00000000-0000-0000-0000-000000000000	05638e17-2c58-4220-af45-ed0c3d1a6c96	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:10:52.41869+00	
00000000-0000-0000-0000-000000000000	43d8028e-5d20-4d56-9a99-6d75788258c0	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:11:40.110129+00	
00000000-0000-0000-0000-000000000000	d6e5a597-13de-457e-8146-41daff509c68	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:16:21.404173+00	
00000000-0000-0000-0000-000000000000	cd43919e-82ba-4c22-bd50-fa23374cc0ee	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:16:45.526409+00	
00000000-0000-0000-0000-000000000000	5772a571-0785-434e-88d3-9cfc54cab4ad	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:17:01.513276+00	
00000000-0000-0000-0000-000000000000	cfdc7561-1035-425c-ba59-cf69760f5016	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"novo_cliente_654046@prolineauto.com.br","user_id":"b9f6b4ae-56e7-4244-894a-af1d5226490d","user_phone":""}}	2025-08-03 21:11:46.270663+00	
00000000-0000-0000-0000-000000000000	7f53b73e-0cab-4c8c-9be8-128ab3f13d7c	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"novo_cliente_654046@prolineauto.com.br","user_id":"b9f6b4ae-56e7-4244-894a-af1d5226490d","user_phone":""}}	2025-08-03 21:11:46.312936+00	
00000000-0000-0000-0000-000000000000	607f4a7e-b9f1-45a5-a719-d61abe861da3	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:12:06.433226+00	
00000000-0000-0000-0000-000000000000	9c64f0cd-6edb-4ae9-8013-6479fc9ae699	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"asdasd@asdasd.com","user_id":"f574f7d3-0d09-41e6-b4c3-8ac1aa5e9609","user_phone":""}}	2025-08-03 21:13:49.022537+00	
00000000-0000-0000-0000-000000000000	45eba6a7-4705-41b6-bd6d-67f0b96e2598	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"asdasd@asdasd.com","user_id":"f574f7d3-0d09-41e6-b4c3-8ac1aa5e9609","user_phone":""}}	2025-08-03 21:13:49.03443+00	
00000000-0000-0000-0000-000000000000	2c2e31e9-8f1d-4b51-bba0-d2712dc108a8	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:15:48.655235+00	
00000000-0000-0000-0000-000000000000	eca782d4-284f-4797-bb48-1f93c0a4d1b0	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:16:05.172289+00	
00000000-0000-0000-0000-000000000000	beff611c-b3aa-4805-a274-2a716f3f38e3	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:16:38.066907+00	
00000000-0000-0000-0000-000000000000	e343b979-5187-46d4-beab-6b7cb4f271f4	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:16:41.515958+00	
00000000-0000-0000-0000-000000000000	8f044c4d-d9c6-4679-a017-3f48f49c7c5c	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:17:17.746928+00	
00000000-0000-0000-0000-000000000000	137c7389-10d4-45fb-9d58-8b6ff46843d5	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:17:22.348362+00	
00000000-0000-0000-0000-000000000000	903c70c1-83d8-4836-bcda-847d279b96b0	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"novo_cliente_372879@prolineauto.com.br","user_id":"a021ec01-5c7e-479b-b7df-c29636105cad","user_phone":""}}	2025-08-03 21:17:29.167708+00	
00000000-0000-0000-0000-000000000000	8109c787-5c21-4c6b-b527-b2588ebc03c5	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"novo_cliente_372879@prolineauto.com.br","user_id":"a021ec01-5c7e-479b-b7df-c29636105cad","user_phone":""}}	2025-08-03 21:17:29.19356+00	
00000000-0000-0000-0000-000000000000	0d800595-62f3-447f-bd19-657214f5fdf6	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:18:07.078645+00	
00000000-0000-0000-0000-000000000000	51859967-b5b8-4ade-ac9a-553c5c6f521e	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"asdasd@asdasd.com","user_id":"f4d98256-07bf-4fc9-9cd5-5b62a4dcb9cf","user_phone":""}}	2025-08-03 21:18:39.096027+00	
00000000-0000-0000-0000-000000000000	f18663db-7b2d-4e03-b30e-56c344880387	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"asdasd@asdasd.com","user_id":"f4d98256-07bf-4fc9-9cd5-5b62a4dcb9cf","user_phone":""}}	2025-08-03 21:18:39.103702+00	
00000000-0000-0000-0000-000000000000	881724c2-063f-4ad5-a1aa-41f67503f3cb	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:19:01.918844+00	
00000000-0000-0000-0000-000000000000	f12e1219-d692-429c-8f24-1473a3baa929	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:19:10.638382+00	
00000000-0000-0000-0000-000000000000	4d164019-1384-4f35-b988-c4e489005d31	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:19:19.426241+00	
00000000-0000-0000-0000-000000000000	4aeab46d-a1e4-477a-85e7-75a57c7b0556	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"sdfgmnm@ccnbn.com","user_id":"7ae71085-ccd8-4811-930a-1870d78eca53","user_phone":""}}	2025-08-03 21:19:43.236807+00	
00000000-0000-0000-0000-000000000000	c5fbd12e-702a-40cc-bc0a-489cfe651a61	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"sdfgmnm@ccnbn.com","user_id":"7ae71085-ccd8-4811-930a-1870d78eca53","user_phone":""}}	2025-08-03 21:19:43.243263+00	
00000000-0000-0000-0000-000000000000	73b779a4-1392-4c95-8ee7-e8d8201e0a3a	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:20:47.728714+00	
00000000-0000-0000-0000-000000000000	8414527a-37ff-4aa4-b1c0-f067b9d0c55d	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"sdfgmnm@ccnbn.com","user_id":"4af4833e-d1e6-469e-9342-30adb563bdc3","user_phone":""}}	2025-08-03 21:21:11.529132+00	
00000000-0000-0000-0000-000000000000	26207648-0ef4-4143-8905-0bdd88919110	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"sdfgmnm@ccnbn.com","user_id":"4af4833e-d1e6-469e-9342-30adb563bdc3","user_phone":""}}	2025-08-03 21:21:11.556359+00	
00000000-0000-0000-0000-000000000000	538a9feb-e747-4593-b1f5-33ae726e2ee1	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:27:55.760346+00	
00000000-0000-0000-0000-000000000000	816b2b45-7962-4c32-894d-37d15a547246	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:28:17.48812+00	
00000000-0000-0000-0000-000000000000	0a1c3f56-abb4-41da-b3ac-b081e2a5e8cb	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:28:39.494004+00	
00000000-0000-0000-0000-000000000000	996ff7d6-e2ea-4524-9bb0-adc4316c6e6f	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:29:01.355296+00	
00000000-0000-0000-0000-000000000000	5399e36b-fb4c-4cb5-bb0e-6a3009f91000	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:29:04.682504+00	
00000000-0000-0000-0000-000000000000	07f010ad-3b03-434e-a76c-c5d452275103	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:29:08.972548+00	
00000000-0000-0000-0000-000000000000	87fd4f21-5bb0-4935-acf2-3684251dea62	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:29:25.568813+00	
00000000-0000-0000-0000-000000000000	4871f5ff-1aa4-4cc5-b35b-4b2d1bd1b297	{"action":"login","actor_id":"5e5c27fb-c4fe-4e6e-940c-9b481e73924c","actor_username":"admin@prolineauto.com.br","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-08-03 21:29:42.516419+00	
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
d1e66456-ea7a-485f-abbe-899474b5f921	d1e66456-ea7a-485f-abbe-899474b5f921	{"sub": "d1e66456-ea7a-485f-abbe-899474b5f921", "email": "asdasd@prolineauto.com.br", "email_verified": false, "phone_verified": false}	email	2025-08-03 20:34:09.575018+00	2025-08-03 20:34:09.57506+00	2025-08-03 20:34:09.57506+00	2930cb77-2778-4bc7-8c7b-75bc3a5714b4
6ce3398f-79c4-43bd-a389-92dfcdc65b9b	6ce3398f-79c4-43bd-a389-92dfcdc65b9b	{"sub": "6ce3398f-79c4-43bd-a389-92dfcdc65b9b", "email": "asdasdasd@prolineauto.com.br", "email_verified": false, "phone_verified": false}	email	2025-08-03 20:36:20.246967+00	2025-08-03 20:36:20.247046+00	2025-08-03 20:36:20.247046+00	c8d9f40e-fb63-4550-91d1-1b711fc6b41b
61c9c3bc-41b1-4053-a543-4f0fe750e8fd	61c9c3bc-41b1-4053-a543-4f0fe750e8fd	{"sub": "61c9c3bc-41b1-4053-a543-4f0fe750e8fd", "email": "asdasdl@serejo.tech", "email_verified": false, "phone_verified": false}	email	2025-08-03 20:37:11.446366+00	2025-08-03 20:37:11.446405+00	2025-08-03 20:37:11.446405+00	70114a08-078d-4df6-8ea8-e6758fb5da91
fa60bb36-add9-4507-a877-135ddfa9a917	fa60bb36-add9-4507-a877-135ddfa9a917	{"sub": "fa60bb36-add9-4507-a877-135ddfa9a917", "email": "asdasddfgl@serejo.tech", "email_verified": false, "phone_verified": false}	email	2025-08-03 20:41:52.790718+00	2025-08-03 20:41:52.790751+00	2025-08-03 20:41:52.790751+00	4c33698f-3c96-4167-9d6a-3e49d1ab80e2
5e5c27fb-c4fe-4e6e-940c-9b481e73924c	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	{"sub": "5e5c27fb-c4fe-4e6e-940c-9b481e73924c", "email": "admin@prolineauto.com.br", "email_verified": false, "phone_verified": false}	email	2025-08-03 20:42:37.526732+00	2025-08-03 20:42:37.526777+00	2025-08-03 20:42:37.526777+00	3fdf4278-f2e7-4468-950e-6b6d73e01dd1
dafc3a7b-38ec-4115-a0e1-1965519d3ee0	dafc3a7b-38ec-4115-a0e1-1965519d3ee0	{"sub": "dafc3a7b-38ec-4115-a0e1-1965519d3ee0", "email": "asdasdlasd@serejo.tech", "email_verified": false, "phone_verified": false}	email	2025-08-03 21:02:23.074277+00	2025-08-03 21:02:23.074323+00	2025-08-03 21:02:23.074323+00	4a6a8c55-25b3-48fa-855d-356cf2a38212
4529579b-f032-46c1-afa9-b35b65d17e99	4529579b-f032-46c1-afa9-b35b65d17e99	{"sub": "4529579b-f032-46c1-afa9-b35b65d17e99", "email": "admin2@prolineauto.com.br", "email_verified": false, "phone_verified": false}	email	2025-08-03 21:03:25.101191+00	2025-08-03 21:03:25.10122+00	2025-08-03 21:03:25.10122+00	b9c9189d-1081-48b3-9442-c08530b3feb7
64295dc1-48f0-42d6-8d21-d7d1b93951f0	64295dc1-48f0-42d6-8d21-d7d1b93951f0	{"sub": "64295dc1-48f0-42d6-8d21-d7d1b93951f0", "email": "especialista1@prolineauto.com.br", "email_verified": false, "phone_verified": false}	email	2025-08-03 21:03:34.883917+00	2025-08-03 21:03:34.883941+00	2025-08-03 21:03:34.883941+00	bdf46c31-711a-4090-bd0e-44c7c9d726f0
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
5e188573-cbb0-4a35-87b2-ccbe087c3542	2025-08-03 21:00:11.654641+00	2025-08-03 21:00:11.654641+00	password	bcea8d3e-0757-4855-8ef4-db1b73faeb1e
2628f20a-6bb9-48d3-b01f-ddf979fd6574	2025-08-03 21:06:43.743897+00	2025-08-03 21:06:43.743897+00	password	57250fa4-080a-4c51-adfb-4b3ca5b5845f
d07c75d0-7845-4966-b676-e5e1dac32647	2025-08-03 21:09:42.022743+00	2025-08-03 21:09:42.022743+00	password	b2002254-e5e1-4346-9035-1848f7eeaed3
b5119423-153d-4d2b-a9d6-d79b68af4047	2025-08-03 21:10:44.796164+00	2025-08-03 21:10:44.796164+00	password	fceb3a7f-be41-47fb-ba6d-c3f392101266
2e090324-5a17-4125-bfe6-72b29f3a2d09	2025-08-03 21:10:49.203902+00	2025-08-03 21:10:49.203902+00	password	ec4ee172-f2ef-4311-a733-51b433fcda1e
5f778d83-3799-44d2-8fb8-a04bf4484340	2025-08-03 21:10:52.424435+00	2025-08-03 21:10:52.424435+00	password	43cf0ed4-2ad6-4f27-bda3-0f6bbb691bc1
b67b9106-0302-4f81-8172-d8095f6825d7	2025-08-03 21:11:40.112659+00	2025-08-03 21:11:40.112659+00	password	512216c8-c3ed-4c86-bc1b-224722fd609a
f94dabe4-0d64-4f30-b53c-fefc672d5aea	2025-08-03 21:12:06.434557+00	2025-08-03 21:12:06.434557+00	password	5cbc6d62-6e12-40a2-86ae-d38687521e49
e1b9d7e5-3ed3-4246-b8a6-7e6f7d737ec5	2025-08-03 21:15:48.657692+00	2025-08-03 21:15:48.657692+00	password	1701112b-2964-438d-8b9e-f01bbff30012
a8e7fec7-ef19-4473-9b92-57e9a000bfce	2025-08-03 21:16:05.173647+00	2025-08-03 21:16:05.173647+00	password	d2d591a2-2c63-4e5f-a758-27a95689c296
3e7e5cdb-2f1d-42d5-a2a2-d7857326c85f	2025-08-03 21:16:21.406781+00	2025-08-03 21:16:21.406781+00	password	8e8aa963-ec8f-4f37-88c6-38cab7062281
a2bcedd3-21f8-40cd-936b-4ab5a893cce9	2025-08-03 21:16:38.069197+00	2025-08-03 21:16:38.069197+00	password	d0358173-a9ce-40f6-8952-8c3a15824ac6
49890076-bf09-42bf-8836-af38762e3248	2025-08-03 21:16:41.518657+00	2025-08-03 21:16:41.518657+00	password	34fa9886-ea7b-4f30-acde-4cc563365ab1
f1e1abb1-5124-4d0d-b628-c696f5950347	2025-08-03 21:16:45.528737+00	2025-08-03 21:16:45.528737+00	password	faa2c59f-6d62-43be-aa03-29d64a29c43d
cadc046d-6a53-4f8a-82ae-607f9fc018a6	2025-08-03 21:17:01.515097+00	2025-08-03 21:17:01.515097+00	password	40ed5377-8d61-40a7-a918-01780a1de0e3
212d45b8-e4d9-42c2-b6c2-700b1811a671	2025-08-03 21:17:17.748861+00	2025-08-03 21:17:17.748861+00	password	5c40295d-e97d-4eac-9675-27145bf094d8
13616fe0-9119-4e43-90dd-df6719f94c1c	2025-08-03 21:17:22.351224+00	2025-08-03 21:17:22.351224+00	password	6f309717-cffa-4d85-b386-4a37e825a48d
f7d64939-6271-4e70-a83c-e907e55da2e9	2025-08-03 21:18:07.080486+00	2025-08-03 21:18:07.080486+00	password	1c5a7431-0d1a-4511-8f2a-3f18367a252f
5b87b091-80e3-49b9-99c8-3cb72719ac08	2025-08-03 21:19:01.921162+00	2025-08-03 21:19:01.921162+00	password	cb52603b-ff30-4d1e-8dc9-e09381dd4960
cec2dcd9-5ba6-4b9d-93ba-9738265cd63f	2025-08-03 21:19:10.639399+00	2025-08-03 21:19:10.639399+00	password	68382f4c-8339-418b-aad0-f15f64c1d359
fab3e602-7c1a-479d-b372-50bb1c2f505d	2025-08-03 21:19:19.428187+00	2025-08-03 21:19:19.428187+00	password	665fa725-e8c4-41e4-8686-768a2c77ee46
cdb5d9ac-051d-42dd-a4c7-de87950b012a	2025-08-03 21:20:47.730808+00	2025-08-03 21:20:47.730808+00	password	f7e258a1-9b69-452e-8e32-206a8a39e446
56d985c8-f4d4-4316-9d9b-2d9fe842aa69	2025-08-03 21:27:55.762186+00	2025-08-03 21:27:55.762186+00	password	a5cb5da1-7ba9-4244-af0e-22cfc0c083ce
7ec8d66f-961f-4e86-99eb-445e6e1645f9	2025-08-03 21:28:17.489718+00	2025-08-03 21:28:17.489718+00	password	1ec53dec-b0ec-4743-92d5-d85ae1f53858
2ba69e41-d3fd-4b4c-91ff-2d5e27e984e3	2025-08-03 21:28:39.495348+00	2025-08-03 21:28:39.495348+00	password	2a1fd29c-5471-481b-af7a-9a77856db27a
147fbafe-2380-49cb-b75f-6624c49971c7	2025-08-03 21:29:01.356335+00	2025-08-03 21:29:01.356335+00	password	f07dfbe1-67d6-43bd-850c-3b2b22384abf
6a1d89f8-f30e-42ff-9844-2809b4e0532a	2025-08-03 21:29:04.684003+00	2025-08-03 21:29:04.684003+00	password	cee23347-c246-4992-81a7-c541c9438384
e4a81479-7ee0-47ae-b4ef-8c463972b237	2025-08-03 21:29:08.975998+00	2025-08-03 21:29:08.975998+00	password	7cba6d73-d098-4a94-86a9-66a75ff18cb0
b5943d59-6f74-4a4a-b9f2-cf7510b4a7a1	2025-08-03 21:29:25.569862+00	2025-08-03 21:29:25.569862+00	password	deab69e6-03bc-4aa0-ba9d-117afd7eef67
da5ed6b7-6f84-44c7-8c9c-ee904d3cfb4c	2025-08-03 21:29:42.517624+00	2025-08-03 21:29:42.517624+00	password	7a99fbfa-2bcb-43a0-8b00-5d85ba399d55
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
672c70d2-42df-42dc-b3b2-b176cba5dbab	fa60bb36-add9-4507-a877-135ddfa9a917	confirmation_token	ba67aa7217f1ba028bfa6ee3427cd6cd41deb3915941cc88b4402006	asdasddfgl@serejo.tech	2025-08-03 21:01:37.349723	2025-08-03 21:01:37.349723
221c4e3a-0d07-4c48-95d8-0bc51c4e70ec	d1e66456-ea7a-485f-abbe-899474b5f921	confirmation_token	398f80057e2475f2cb5a67796831e32c6eb7ed3cf1f71274aac8b9a3	asdasd@prolineauto.com.br	2025-08-03 21:01:52.382948	2025-08-03 21:01:52.382948
e9327f50-056e-442d-81e1-4386f833efcb	61c9c3bc-41b1-4053-a543-4f0fe750e8fd	confirmation_token	c38a5be4e59f784ea713cb443d0de8a1fbd11251b081d1eac196a749	asdasdl@serejo.tech	2025-08-03 21:02:04.140112	2025-08-03 21:02:04.140112
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	2	bwjewqrc5we4	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:00:11.65361+00	2025-08-03 21:00:11.65361+00	\N	5e188573-cbb0-4a35-87b2-ccbe087c3542
00000000-0000-0000-0000-000000000000	3	qdba5gqzr4ya	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:06:43.742918+00	2025-08-03 21:06:43.742918+00	\N	2628f20a-6bb9-48d3-b01f-ddf979fd6574
00000000-0000-0000-0000-000000000000	4	dr5tmn775ekp	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:09:42.021463+00	2025-08-03 21:09:42.021463+00	\N	d07c75d0-7845-4966-b676-e5e1dac32647
00000000-0000-0000-0000-000000000000	5	ilb3xss6i3fp	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:10:44.794841+00	2025-08-03 21:10:44.794841+00	\N	b5119423-153d-4d2b-a9d6-d79b68af4047
00000000-0000-0000-0000-000000000000	6	xcmeinw4prj6	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:10:49.202733+00	2025-08-03 21:10:49.202733+00	\N	2e090324-5a17-4125-bfe6-72b29f3a2d09
00000000-0000-0000-0000-000000000000	7	ezldpguqj7au	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:10:52.423272+00	2025-08-03 21:10:52.423272+00	\N	5f778d83-3799-44d2-8fb8-a04bf4484340
00000000-0000-0000-0000-000000000000	8	sloumgggebja	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:11:40.111604+00	2025-08-03 21:11:40.111604+00	\N	b67b9106-0302-4f81-8172-d8095f6825d7
00000000-0000-0000-0000-000000000000	9	76fa64gabths	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:12:06.434042+00	2025-08-03 21:12:06.434042+00	\N	f94dabe4-0d64-4f30-b53c-fefc672d5aea
00000000-0000-0000-0000-000000000000	10	lmtr6vevb4hy	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:15:48.656612+00	2025-08-03 21:15:48.656612+00	\N	e1b9d7e5-3ed3-4246-b8a6-7e6f7d737ec5
00000000-0000-0000-0000-000000000000	11	3p5oybve2to6	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:16:05.173022+00	2025-08-03 21:16:05.173022+00	\N	a8e7fec7-ef19-4473-9b92-57e9a000bfce
00000000-0000-0000-0000-000000000000	12	q5rj6jglhlq5	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:16:21.405751+00	2025-08-03 21:16:21.405751+00	\N	3e7e5cdb-2f1d-42d5-a2a2-d7857326c85f
00000000-0000-0000-0000-000000000000	13	23gpuolthv4n	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:16:38.068068+00	2025-08-03 21:16:38.068068+00	\N	a2bcedd3-21f8-40cd-936b-4ab5a893cce9
00000000-0000-0000-0000-000000000000	14	ozfephrpovfk	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:16:41.517355+00	2025-08-03 21:16:41.517355+00	\N	49890076-bf09-42bf-8836-af38762e3248
00000000-0000-0000-0000-000000000000	15	bhabsyvwmnwk	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:16:45.527698+00	2025-08-03 21:16:45.527698+00	\N	f1e1abb1-5124-4d0d-b628-c696f5950347
00000000-0000-0000-0000-000000000000	16	exzaaezqsbmg	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:17:01.514246+00	2025-08-03 21:17:01.514246+00	\N	cadc046d-6a53-4f8a-82ae-607f9fc018a6
00000000-0000-0000-0000-000000000000	17	g2tmiebeco3s	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:17:17.747882+00	2025-08-03 21:17:17.747882+00	\N	212d45b8-e4d9-42c2-b6c2-700b1811a671
00000000-0000-0000-0000-000000000000	18	chwz2son6w5m	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:17:22.349957+00	2025-08-03 21:17:22.349957+00	\N	13616fe0-9119-4e43-90dd-df6719f94c1c
00000000-0000-0000-0000-000000000000	19	6gnzmqtzttvp	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:18:07.079609+00	2025-08-03 21:18:07.079609+00	\N	f7d64939-6271-4e70-a83c-e907e55da2e9
00000000-0000-0000-0000-000000000000	20	mudlfc3rlfwt	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:19:01.920317+00	2025-08-03 21:19:01.920317+00	\N	5b87b091-80e3-49b9-99c8-3cb72719ac08
00000000-0000-0000-0000-000000000000	21	wvlgty6a7rci	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:19:10.638977+00	2025-08-03 21:19:10.638977+00	\N	cec2dcd9-5ba6-4b9d-93ba-9738265cd63f
00000000-0000-0000-0000-000000000000	22	bv3vzcdjgp2n	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:19:19.427356+00	2025-08-03 21:19:19.427356+00	\N	fab3e602-7c1a-479d-b372-50bb1c2f505d
00000000-0000-0000-0000-000000000000	23	nvl6kcar6fwj	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:20:47.730329+00	2025-08-03 21:20:47.730329+00	\N	cdb5d9ac-051d-42dd-a4c7-de87950b012a
00000000-0000-0000-0000-000000000000	24	qecy3dj5u4m5	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:27:55.76137+00	2025-08-03 21:27:55.76137+00	\N	56d985c8-f4d4-4316-9d9b-2d9fe842aa69
00000000-0000-0000-0000-000000000000	25	f5ytjfe3eqrd	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:28:17.489005+00	2025-08-03 21:28:17.489005+00	\N	7ec8d66f-961f-4e86-99eb-445e6e1645f9
00000000-0000-0000-0000-000000000000	26	pfgux23sc4xm	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:28:39.494901+00	2025-08-03 21:28:39.494901+00	\N	2ba69e41-d3fd-4b4c-91ff-2d5e27e984e3
00000000-0000-0000-0000-000000000000	27	6fn522k27bqh	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:29:01.355918+00	2025-08-03 21:29:01.355918+00	\N	147fbafe-2380-49cb-b75f-6624c49971c7
00000000-0000-0000-0000-000000000000	28	v634t6lz546e	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:29:04.683383+00	2025-08-03 21:29:04.683383+00	\N	6a1d89f8-f30e-42ff-9844-2809b4e0532a
00000000-0000-0000-0000-000000000000	29	uewn5h2k4ozg	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:29:08.975596+00	2025-08-03 21:29:08.975596+00	\N	e4a81479-7ee0-47ae-b4ef-8c463972b237
00000000-0000-0000-0000-000000000000	30	zhkcfbs3eb5w	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:29:25.569406+00	2025-08-03 21:29:25.569406+00	\N	b5943d59-6f74-4a4a-b9f2-cf7510b4a7a1
00000000-0000-0000-0000-000000000000	31	eeriwxqgqcxw	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	f	2025-08-03 21:29:42.517051+00	2025-08-03 21:29:42.517051+00	\N	da5ed6b7-6f84-44c7-8c9c-ee904d3cfb4c
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag) FROM stdin;
5e188573-cbb0-4a35-87b2-ccbe087c3542	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:00:11.653191+00	2025-08-03 21:00:11.653191+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	172.22.0.1	\N
2628f20a-6bb9-48d3-b01f-ddf979fd6574	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:06:43.742412+00	2025-08-03 21:06:43.742412+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	172.22.0.1	\N
d07c75d0-7845-4966-b676-e5e1dac32647	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:09:42.02091+00	2025-08-03 21:09:42.02091+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	172.22.0.1	\N
b5119423-153d-4d2b-a9d6-d79b68af4047	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:10:44.794248+00	2025-08-03 21:10:44.794248+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
2e090324-5a17-4125-bfe6-72b29f3a2d09	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:10:49.202147+00	2025-08-03 21:10:49.202147+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
5f778d83-3799-44d2-8fb8-a04bf4484340	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:10:52.419845+00	2025-08-03 21:10:52.419845+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
b67b9106-0302-4f81-8172-d8095f6825d7	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:11:40.110903+00	2025-08-03 21:11:40.110903+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	172.22.0.1	\N
f94dabe4-0d64-4f30-b53c-fefc672d5aea	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:12:06.433629+00	2025-08-03 21:12:06.433629+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	172.22.0.1	\N
e1b9d7e5-3ed3-4246-b8a6-7e6f7d737ec5	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:15:48.655814+00	2025-08-03 21:15:48.655814+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
a8e7fec7-ef19-4473-9b92-57e9a000bfce	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:16:05.172728+00	2025-08-03 21:16:05.172728+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
3e7e5cdb-2f1d-42d5-a2a2-d7857326c85f	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:16:21.404998+00	2025-08-03 21:16:21.404998+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
a2bcedd3-21f8-40cd-936b-4ab5a893cce9	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:16:38.067445+00	2025-08-03 21:16:38.067445+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
49890076-bf09-42bf-8836-af38762e3248	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:16:41.516678+00	2025-08-03 21:16:41.516678+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
f1e1abb1-5124-4d0d-b628-c696f5950347	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:16:45.527046+00	2025-08-03 21:16:45.527046+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
cadc046d-6a53-4f8a-82ae-607f9fc018a6	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:17:01.513776+00	2025-08-03 21:17:01.513776+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
212d45b8-e4d9-42c2-b6c2-700b1811a671	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:17:17.747378+00	2025-08-03 21:17:17.747378+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
13616fe0-9119-4e43-90dd-df6719f94c1c	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:17:22.349114+00	2025-08-03 21:17:22.349114+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	172.22.0.1	\N
f7d64939-6271-4e70-a83c-e907e55da2e9	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:18:07.079197+00	2025-08-03 21:18:07.079197+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
5b87b091-80e3-49b9-99c8-3cb72719ac08	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:19:01.919613+00	2025-08-03 21:19:01.919613+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
cec2dcd9-5ba6-4b9d-93ba-9738265cd63f	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:19:10.638765+00	2025-08-03 21:19:10.638765+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
fab3e602-7c1a-479d-b372-50bb1c2f505d	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:19:19.426815+00	2025-08-03 21:19:19.426815+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
cdb5d9ac-051d-42dd-a4c7-de87950b012a	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:20:47.729899+00	2025-08-03 21:20:47.729899+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
56d985c8-f4d4-4316-9d9b-2d9fe842aa69	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:27:55.760877+00	2025-08-03 21:27:55.760877+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
7ec8d66f-961f-4e86-99eb-445e6e1645f9	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:28:17.488756+00	2025-08-03 21:28:17.488756+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
2ba69e41-d3fd-4b4c-91ff-2d5e27e984e3	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:28:39.494611+00	2025-08-03 21:28:39.494611+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
147fbafe-2380-49cb-b75f-6624c49971c7	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:29:01.355676+00	2025-08-03 21:29:01.355676+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
6a1d89f8-f30e-42ff-9844-2809b4e0532a	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:29:04.683057+00	2025-08-03 21:29:04.683057+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
e4a81479-7ee0-47ae-b4ef-8c463972b237	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:29:08.975367+00	2025-08-03 21:29:08.975367+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
b5943d59-6f74-4a4a-b9f2-cf7510b4a7a1	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:29:25.569208+00	2025-08-03 21:29:25.569208+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
da5ed6b7-6f84-44c7-8c9c-ee904d3cfb4c	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 21:29:42.516826+00	2025-08-03 21:29:42.516826+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/14.5.3 Chrome/130.0.6723.137 Electron/33.2.1 Safari/537.36	172.22.0.1	\N
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	64295dc1-48f0-42d6-8d21-d7d1b93951f0	authenticated	authenticated	especialista1@prolineauto.com.br	$2a$10$mpmL6YDmVCDmex1L/.DKiOjG5qgDDKcElnfJp/C2rUkw8WR8ExH06	2025-08-03 21:03:34.884533+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"name": "milestone", "role": "specialist", "created_at": "2025-08-03T21:03:34.825Z", "profile_id": "64295dc1-48f0-42d6-8d21-d7d1b93951f0", "email_verified": true, "created_by_admin": true, "temporary_password": true}	\N	2025-08-03 21:03:34.883379+00	2025-08-03 21:03:34.88489+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	dafc3a7b-38ec-4115-a0e1-1965519d3ee0	authenticated	authenticated	asdasdlasd@serejo.tech	$2a$10$N7IW/T.f8OVTh3xLu4sHw.4g8z9XdgyOTSmY2iwA49y2a59JVueZW	\N	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"role": "client", "phone": "(71) 99178-1013", "full_name": "asdasd", "profile_id": "dafc3a7b-38ec-4115-a0e1-1965519d3ee0"}	\N	2025-08-03 21:02:23.073157+00	2025-08-03 21:02:23.07794+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	6ce3398f-79c4-43bd-a389-92dfcdc65b9b	authenticated	authenticated	asdasdasd@prolineauto.com.br	$2a$10$8Wk/8nu0v9GDp/3LoXSNhe27TRr1CldRTgiytXcYNsH.LCy2.kRHC	\N	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"role": "client", "phone": "(71) 19917-8101", "full_name": "felipe", "profile_id": "6ce3398f-79c4-43bd-a389-92dfcdc65b9b"}	\N	2025-08-03 20:36:20.246089+00	2025-08-03 20:36:20.249043+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	4529579b-f032-46c1-afa9-b35b65d17e99	authenticated	authenticated	admin2@prolineauto.com.br	$2a$10$G0II8KFNISjn43Gs/yvD5.6HZF38tmIW6JvRqWzi7ZnkibkDIbBtq	2025-08-03 21:03:25.101978+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"name": "milestone", "role": "admin", "created_at": "2025-08-03T21:03:24.995Z", "profile_id": "4529579b-f032-46c1-afa9-b35b65d17e99", "email_verified": true, "created_by_admin": true, "temporary_password": true}	\N	2025-08-03 21:03:25.1005+00	2025-08-03 21:03:25.102375+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	fa60bb36-add9-4507-a877-135ddfa9a917	authenticated	authenticated	asdasddfgl@serejo.tech	$2a$10$JtEJAnx519a6eLDS3KLpm.TXp/3QnVfxTV9.3VnJcShSbe1FrIQOa	\N	\N	ba67aa7217f1ba028bfa6ee3427cd6cd41deb3915941cc88b4402006	2025-08-03 21:01:37.333117+00		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"role": "client", "phone": "(71) 99178-1013", "full_name": "asdasd", "profile_id": "fa60bb36-add9-4507-a877-135ddfa9a917"}	\N	2025-08-03 20:41:52.788915+00	2025-08-03 21:01:37.348728+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	d1e66456-ea7a-485f-abbe-899474b5f921	authenticated	authenticated	asdasd@prolineauto.com.br	$2a$10$AlwwOitV0kWlVYPSYts.JOP2hPL5.Pz.4mlfgDV2hwFN5csZ.SafK	\N	\N	398f80057e2475f2cb5a67796831e32c6eb7ed3cf1f71274aac8b9a3	2025-08-03 21:01:52.363319+00		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"role": "client", "phone": "(71) 19917-8101", "full_name": "felipe", "profile_id": "d1e66456-ea7a-485f-abbe-899474b5f921"}	\N	2025-08-03 20:34:09.571432+00	2025-08-03 21:01:52.38099+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	61c9c3bc-41b1-4053-a543-4f0fe750e8fd	authenticated	authenticated	asdasdl@serejo.tech	$2a$10$BtFaK2vilfoCQ76hbJ2eY.PCqUNFP/WmiqE3XZRYoTKp53Vb.RL9m	\N	\N	c38a5be4e59f784ea713cb443d0de8a1fbd11251b081d1eac196a749	2025-08-03 21:02:04.128192+00		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"role": "client", "phone": "(71) 99178-1013", "full_name": "asdasd", "profile_id": "61c9c3bc-41b1-4053-a543-4f0fe750e8fd"}	\N	2025-08-03 20:37:11.445497+00	2025-08-03 21:02:04.139054+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	5e5c27fb-c4fe-4e6e-940c-9b481e73924c	authenticated	authenticated	admin@prolineauto.com.br	$2a$10$PwLxYYx8NCCow1H8.bXRKeUdrY7TGeQZcMPyB6qklKmxPAOqDLk3C	2025-08-03 20:42:37.528679+00	\N		\N		\N			\N	2025-08-03 21:29:42.516784+00	{"provider": "email", "providers": ["email"]}	{"role": "admin", "profile_id": "5e5c27fb-c4fe-4e6e-940c-9b481e73924c", "email_verified": true}	\N	2025-08-03 20:42:37.525715+00	2025-08-03 21:29:42.517402+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.addresses (id, created_at, profile_id, street, number, neighborhood, city, state, zip_code, complement, is_default) FROM stdin;
\.


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admins (profile_id, created_at, updated_at) FROM stdin;
5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 20:55:46.577764+00	2025-08-03 20:55:46.577764+00
4529579b-f032-46c1-afa9-b35b65d17e99	2025-08-03 21:03:25.12+00	2025-08-03 21:03:25.12+00
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, "timestamp", user_id, action, details, resource_id, resource_type, success) FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clients (profile_id, document_type, document_number, address_street, address_number, address_neighborhood, address_city, address_state, address_zip_code, parqueamento, quilometragem, percentual_fipe, taxa_operacao, created_at, updated_at, company_name) FROM stdin;
fa60bb36-add9-4507-a877-135ddfa9a917	cnpj	80.105.651/0001-85	\N	\N	\N	\N	\N	\N	1.00	1	1.00	1.00	2025-08-03 20:41:52.917+00	2025-08-03 20:41:52.917+00	serejo tech
dafc3a7b-38ec-4115-a0e1-1965519d3ee0	cnpj	53.419.420/0001-73	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-08-03 21:02:23.085+00	2025-08-03 21:02:23.085+00	serejo tech
\.


--
-- Data for Name: evaluations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluations (id, created_at, service_order_id, specialist_id, evaluation_date, description, recommendations, photos) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, created_at, due_date, payer_profile_id, amount, status, service_order_id, description) FROM stdin;
\.


--
-- Data for Name: partner_fees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.partner_fees (id, created_at, partner_id, service_order_id, amount, status) FROM stdin;
\.


--
-- Data for Name: partners; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.partners (profile_id, cnpj, company_name, company_address_street, company_address_number, company_address_neighborhood, company_address_city, company_address_state, company_address_zip_code, company_phone, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: parts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parts (id, created_at, name, description, unit_price, sku) FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, created_at, updated_at, full_name, role, status) FROM stdin;
d1e66456-ea7a-485f-abbe-899474b5f921	2025-08-03 20:34:09.604971+00	2025-08-03 20:34:09.604971+00	felipe	client	\N
6ce3398f-79c4-43bd-a389-92dfcdc65b9b	2025-08-03 20:36:20.253236+00	2025-08-03 20:36:20.253236+00	felipe	client	\N
61c9c3bc-41b1-4053-a543-4f0fe750e8fd	2025-08-03 20:37:11.462993+00	2025-08-03 20:37:11.462993+00	asdasd	client	\N
fa60bb36-add9-4507-a877-135ddfa9a917	2025-08-03 20:41:52.906219+00	2025-08-03 20:41:52.906219+00	asdasd	client	\N
5e5c27fb-c4fe-4e6e-940c-9b481e73924c	2025-08-03 20:55:46.577764+00	2025-08-03 20:57:42.288929+00	Administrador	admin	ativo
dafc3a7b-38ec-4115-a0e1-1965519d3ee0	2025-08-03 21:02:23.082261+00	2025-08-03 21:02:23.082261+00	asdasd	client	\N
4529579b-f032-46c1-afa9-b35b65d17e99	2025-08-03 21:03:25.104+00	2025-08-03 21:03:25.104+00	milestone	admin	\N
64295dc1-48f0-42d6-8d21-d7d1b93951f0	2025-08-03 21:03:34.888+00	2025-08-03 21:03:34.888+00	milestone	specialist	\N
\.


--
-- Data for Name: quotes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quotes (id, created_at, updated_at, service_order_id, partner_id, total_value, supplier_delivery_date, status) FROM stdin;
\.


--
-- Data for Name: service_order_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_order_logs (id, created_at, service_order_id, old_status, new_status, changed_by_profile_id, notes) FROM stdin;
\.


--
-- Data for Name: service_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_orders (id, created_at, updated_at, vehicle_id, specialist_id, status, classification, estimated_delivery_date, final_delivery_date, pickup_address_id, delivery_address_id, total_cost) FROM stdin;
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services (id, quote_id, description, value, status, estimated_days, parts_needed) FROM stdin;
\.


--
-- Data for Name: specialists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.specialists (profile_id, created_at, updated_at) FROM stdin;
64295dc1-48f0-42d6-8d21-d7d1b93951f0	2025-08-03 21:03:34.901+00	2025-08-03 21:03:34.901+00
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicles (id, created_at, client_id, plate, model, brand, year, chassi, photos) FROM stdin;
\.


--
-- Data for Name: messages_2025_08_02; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.messages_2025_08_02 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_08_03; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.messages_2025_08_03 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_08_04; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.messages_2025_08_04 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_08_05; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.messages_2025_08_05 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_08_06; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.messages_2025_08_06 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-08-03 20:10:59
20211116045059	2025-08-03 20:10:59
20211116050929	2025-08-03 20:10:59
20211116051442	2025-08-03 20:10:59
20211116212300	2025-08-03 20:10:59
20211116213355	2025-08-03 20:10:59
20211116213934	2025-08-03 20:10:59
20211116214523	2025-08-03 20:10:59
20211122062447	2025-08-03 20:10:59
20211124070109	2025-08-03 20:10:59
20211202204204	2025-08-03 20:10:59
20211202204605	2025-08-03 20:10:59
20211210212804	2025-08-03 20:10:59
20211228014915	2025-08-03 20:10:59
20220107221237	2025-08-03 20:10:59
20220228202821	2025-08-03 20:10:59
20220312004840	2025-08-03 20:10:59
20220603231003	2025-08-03 20:10:59
20220603232444	2025-08-03 20:10:59
20220615214548	2025-08-03 20:10:59
20220712093339	2025-08-03 20:10:59
20220908172859	2025-08-03 20:10:59
20220916233421	2025-08-03 20:10:59
20230119133233	2025-08-03 20:10:59
20230128025114	2025-08-03 20:10:59
20230128025212	2025-08-03 20:10:59
20230227211149	2025-08-03 20:10:59
20230228184745	2025-08-03 20:10:59
20230308225145	2025-08-03 20:10:59
20230328144023	2025-08-03 20:10:59
20231018144023	2025-08-03 20:10:59
20231204144023	2025-08-03 20:10:59
20231204144024	2025-08-03 20:10:59
20231204144025	2025-08-03 20:10:59
20240108234812	2025-08-03 20:10:59
20240109165339	2025-08-03 20:10:59
20240227174441	2025-08-03 20:10:59
20240311171622	2025-08-03 20:10:59
20240321100241	2025-08-03 20:10:59
20240401105812	2025-08-03 20:10:59
20240418121054	2025-08-03 20:10:59
20240523004032	2025-08-03 20:10:59
20240618124746	2025-08-03 20:10:59
20240801235015	2025-08-03 20:10:59
20240805133720	2025-08-03 20:10:59
20240827160934	2025-08-03 20:10:59
20240919163303	2025-08-03 20:10:59
20240919163305	2025-08-03 20:10:59
20241019105805	2025-08-03 20:10:59
20241030150047	2025-08-03 20:10:59
20241108114728	2025-08-03 20:10:59
20241121104152	2025-08-03 20:10:59
20241130184212	2025-08-03 20:10:59
20241220035512	2025-08-03 20:10:59
20241220123912	2025-08-03 20:10:59
20241224161212	2025-08-03 20:10:59
20250107150512	2025-08-03 20:10:59
20250110162412	2025-08-03 20:10:59
20250123174212	2025-08-03 20:10:59
20250128220012	2025-08-03 20:10:59
20250506224012	2025-08-03 20:10:59
20250523164012	2025-08-03 20:10:59
20250714121412	2025-08-03 20:10:59
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_analytics (id, type, format, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.iceberg_namespaces (id, bucket_id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.iceberg_tables (id, namespace_id, bucket_id, name, location, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-08-03 20:11:08.051994
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-08-03 20:11:08.053515
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2025-08-03 20:11:08.054195
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-08-03 20:11:08.059788
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-08-03 20:11:08.064752
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-08-03 20:11:08.065899
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2025-08-03 20:11:08.067629
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-08-03 20:11:08.069699
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-08-03 20:11:08.070682
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2025-08-03 20:11:08.07157
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2025-08-03 20:11:08.072884
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-08-03 20:11:08.076618
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-08-03 20:11:08.07858
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-08-03 20:11:08.079405
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-08-03 20:11:08.080126
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-08-03 20:11:08.086378
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-08-03 20:11:08.087363
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-08-03 20:11:08.087967
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-08-03 20:11:08.089361
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-08-03 20:11:08.090977
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-08-03 20:11:08.092571
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-08-03 20:11:08.09472
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-08-03 20:11:08.099028
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-08-03 20:11:08.101964
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-08-03 20:11:08.103437
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-08-03 20:11:08.104673
26	objects-prefixes	ef3f7871121cdc47a65308e6702519e853422ae2	2025-08-03 20:11:08.105511
27	search-v2	33b8f2a7ae53105f028e13e9fcda9dc4f356b4a2	2025-08-03 20:11:08.110622
28	object-bucket-name-sorting	ba85ec41b62c6a30a3f136788227ee47f311c436	2025-08-03 20:11:08.138921
29	create-prefixes	a7b1a22c0dc3ab630e3055bfec7ce7d2045c5b7b	2025-08-03 20:11:08.142324
30	update-object-levels	6c6f6cc9430d570f26284a24cf7b210599032db7	2025-08-03 20:11:08.144747
31	objects-level-index	33f1fef7ec7fea08bb892222f4f0f5d79bab5eb8	2025-08-03 20:11:08.146556
32	backward-compatible-index-on-objects	2d51eeb437a96868b36fcdfb1ddefdf13bef1647	2025-08-03 20:11:08.148156
33	backward-compatible-index-on-prefixes	fe473390e1b8c407434c0e470655945b110507bf	2025-08-03 20:11:08.149611
34	optimize-search-function-v1	82b0e469a00e8ebce495e29bfa70a0797f7ebd2c	2025-08-03 20:11:08.149949
35	add-insert-trigger-prefixes	63bb9fd05deb3dc5e9fa66c83e82b152f0caf589	2025-08-03 20:11:08.151693
36	optimise-existing-functions	81cf92eb0c36612865a18016a38496c530443899	2025-08-03 20:11:08.152778
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2025-08-03 20:11:08.157253
38	iceberg-catalog-flag-on-buckets	19a8bd89d5dfa69af7f222a46c726b7c41e462c5	2025-08-03 20:11:08.160678
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata, level) FROM stdin;
\.


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.prefixes (bucket_id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: -
--

COPY supabase_functions.hooks (id, hook_table_id, hook_name, created_at, request_id) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: supabase_functions; Owner: -
--

COPY supabase_functions.migrations (version, inserted_at) FROM stdin;
initial	2025-08-03 20:10:41.871589+00
20210809183423_update_grants	2025-08-03 20:10:41.871589+00
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 31, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: -
--

SELECT pg_catalog.setval('supabase_functions.hooks_id_seq', 1, false);


--
-- Name: extensions extensions_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.extensions
    ADD CONSTRAINT extensions_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (profile_id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: clients clients_document_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_document_number_key UNIQUE (document_number);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (profile_id);


--
-- Name: evaluations evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: partner_fees partner_fees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_fees
    ADD CONSTRAINT partner_fees_pkey PRIMARY KEY (id);


--
-- Name: partners partners_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_cnpj_key UNIQUE (cnpj);


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (profile_id);


--
-- Name: parts parts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts
    ADD CONSTRAINT parts_pkey PRIMARY KEY (id);


--
-- Name: parts parts_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts
    ADD CONSTRAINT parts_sku_key UNIQUE (sku);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- Name: service_order_logs service_order_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_order_logs
    ADD CONSTRAINT service_order_logs_pkey PRIMARY KEY (id);


--
-- Name: service_orders service_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: specialists specialists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialists
    ADD CONSTRAINT specialists_pkey PRIMARY KEY (profile_id);


--
-- Name: vehicles vehicles_chassi_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_chassi_key UNIQUE (chassi);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_plate_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_plate_key UNIQUE (plate);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_08_02 messages_2025_08_02_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_08_02
    ADD CONSTRAINT messages_2025_08_02_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_08_03 messages_2025_08_03_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_08_03
    ADD CONSTRAINT messages_2025_08_03_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_08_04 messages_2025_08_04_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_08_04
    ADD CONSTRAINT messages_2025_08_04_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_08_05 messages_2025_08_05_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_08_05
    ADD CONSTRAINT messages_2025_08_05_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_08_06 messages_2025_08_06_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_08_06
    ADD CONSTRAINT messages_2025_08_06_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: iceberg_namespaces iceberg_namespaces_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.iceberg_namespaces
    ADD CONSTRAINT iceberg_namespaces_pkey PRIMARY KEY (id);


--
-- Name: iceberg_tables iceberg_tables_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.iceberg_tables
    ADD CONSTRAINT iceberg_tables_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: hooks hooks_pkey; Type: CONSTRAINT; Schema: supabase_functions; Owner: -
--

ALTER TABLE ONLY supabase_functions.hooks
    ADD CONSTRAINT hooks_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: supabase_functions; Owner: -
--

ALTER TABLE ONLY supabase_functions.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (version);


--
-- Name: extensions_tenant_external_id_index; Type: INDEX; Schema: _realtime; Owner: -
--

CREATE INDEX extensions_tenant_external_id_index ON _realtime.extensions USING btree (tenant_external_id);


--
-- Name: extensions_tenant_external_id_type_index; Type: INDEX; Schema: _realtime; Owner: -
--

CREATE UNIQUE INDEX extensions_tenant_external_id_type_index ON _realtime.extensions USING btree (tenant_external_id, type);


--
-- Name: tenants_external_id_index; Type: INDEX; Schema: _realtime; Owner: -
--

CREATE UNIQUE INDEX tenants_external_id_index ON _realtime.tenants USING btree (external_id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_iceberg_namespaces_bucket_id; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_iceberg_namespaces_bucket_id ON storage.iceberg_namespaces USING btree (bucket_id, name);


--
-- Name: idx_iceberg_tables_namespace_id; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_iceberg_tables_namespace_id ON storage.iceberg_tables USING btree (namespace_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_name_bucket_level_unique; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_lower_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);


--
-- Name: idx_prefixes_lower_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: objects_bucket_id_level_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");


--
-- Name: supabase_functions_hooks_h_table_id_h_name_idx; Type: INDEX; Schema: supabase_functions; Owner: -
--

CREATE INDEX supabase_functions_hooks_h_table_id_h_name_idx ON supabase_functions.hooks USING btree (hook_table_id, hook_name);


--
-- Name: supabase_functions_hooks_request_id_idx; Type: INDEX; Schema: supabase_functions; Owner: -
--

CREATE INDEX supabase_functions_hooks_request_id_idx ON supabase_functions.hooks USING btree (request_id);


--
-- Name: messages_2025_08_02_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_08_02_pkey;


--
-- Name: messages_2025_08_03_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_08_03_pkey;


--
-- Name: messages_2025_08_04_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_08_04_pkey;


--
-- Name: messages_2025_08_05_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_08_05_pkey;


--
-- Name: messages_2025_08_06_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_08_06_pkey;


--
-- Name: profiles on_profile_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_profile_created AFTER INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: objects objects_delete_delete_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects objects_insert_create_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();


--
-- Name: objects objects_update_create_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();


--
-- Name: prefixes prefixes_create_hierarchy; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();


--
-- Name: prefixes prefixes_delete_hierarchy; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: extensions extensions_tenant_external_id_fkey; Type: FK CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.extensions
    ADD CONSTRAINT extensions_tenant_external_id_fkey FOREIGN KEY (tenant_external_id) REFERENCES _realtime.tenants(external_id) ON DELETE CASCADE;


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: addresses addresses_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id);


--
-- Name: admins admins_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: clients clients_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: evaluations evaluations_service_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_service_order_id_fkey FOREIGN KEY (service_order_id) REFERENCES public.service_orders(id);


--
-- Name: evaluations evaluations_specialist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_specialist_id_fkey FOREIGN KEY (specialist_id) REFERENCES public.specialists(profile_id);


--
-- Name: invoices invoices_payer_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_payer_profile_id_fkey FOREIGN KEY (payer_profile_id) REFERENCES public.profiles(id);


--
-- Name: invoices invoices_service_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_service_order_id_fkey FOREIGN KEY (service_order_id) REFERENCES public.service_orders(id);


--
-- Name: partner_fees partner_fees_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_fees
    ADD CONSTRAINT partner_fees_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(profile_id);


--
-- Name: partner_fees partner_fees_service_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_fees
    ADD CONSTRAINT partner_fees_service_order_id_fkey FOREIGN KEY (service_order_id) REFERENCES public.service_orders(id);


--
-- Name: partners partners_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: quotes quotes_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(profile_id);


--
-- Name: quotes quotes_service_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_service_order_id_fkey FOREIGN KEY (service_order_id) REFERENCES public.service_orders(id);


--
-- Name: service_order_logs service_order_logs_changed_by_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_order_logs
    ADD CONSTRAINT service_order_logs_changed_by_profile_id_fkey FOREIGN KEY (changed_by_profile_id) REFERENCES public.profiles(id);


--
-- Name: service_order_logs service_order_logs_service_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_order_logs
    ADD CONSTRAINT service_order_logs_service_order_id_fkey FOREIGN KEY (service_order_id) REFERENCES public.service_orders(id);


--
-- Name: service_orders service_orders_delivery_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_delivery_address_id_fkey FOREIGN KEY (delivery_address_id) REFERENCES public.addresses(id);


--
-- Name: service_orders service_orders_pickup_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_pickup_address_id_fkey FOREIGN KEY (pickup_address_id) REFERENCES public.addresses(id);


--
-- Name: service_orders service_orders_specialist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_specialist_id_fkey FOREIGN KEY (specialist_id) REFERENCES public.specialists(profile_id);


--
-- Name: service_orders service_orders_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);


--
-- Name: services services_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id);


--
-- Name: specialists specialists_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialists
    ADD CONSTRAINT specialists_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: vehicles vehicles_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(profile_id);


--
-- Name: iceberg_namespaces iceberg_namespaces_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.iceberg_namespaces
    ADD CONSTRAINT iceberg_namespaces_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_analytics(id) ON DELETE CASCADE;


--
-- Name: iceberg_tables iceberg_tables_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.iceberg_tables
    ADD CONSTRAINT iceberg_tables_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_analytics(id) ON DELETE CASCADE;


--
-- Name: iceberg_tables iceberg_tables_namespace_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.iceberg_tables
    ADD CONSTRAINT iceberg_tables_namespace_id_fkey FOREIGN KEY (namespace_id) REFERENCES storage.iceberg_namespaces(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: prefixes prefixes_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: admins Admins can access their own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can access their own data" ON public.admins USING ((auth.uid() = profile_id)) WITH CHECK ((auth.uid() = profile_id));


--
-- Name: admins Admins can manage all admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all admins" ON public.admins USING ((public.get_my_claim('role'::text) = 'admin'::text)) WITH CHECK ((public.get_my_claim('role'::text) = 'admin'::text));


--
-- Name: clients Admins can manage all clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all clients" ON public.clients USING ((public.get_my_claim('role'::text) = 'admin'::text)) WITH CHECK ((public.get_my_claim('role'::text) = 'admin'::text));


--
-- Name: partners Admins can manage all partners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all partners" ON public.partners USING ((public.get_my_claim('role'::text) = 'admin'::text)) WITH CHECK ((public.get_my_claim('role'::text) = 'admin'::text));


--
-- Name: specialists Admins can manage all specialists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all specialists" ON public.specialists USING ((public.get_my_claim('role'::text) = 'admin'::text)) WITH CHECK ((public.get_my_claim('role'::text) = 'admin'::text));


--
-- Name: parts Admins can manage parts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage parts" ON public.parts USING ((public.get_my_claim('role'::text) = 'admin'::text)) WITH CHECK ((public.get_my_claim('role'::text) = 'admin'::text));


--
-- Name: audit_logs Admins can view audit_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view audit_logs" ON public.audit_logs FOR SELECT USING ((public.get_my_claim('role'::text) = 'admin'::text));


--
-- Name: clients Clients can access their own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can access their own data" ON public.clients USING ((auth.uid() = profile_id)) WITH CHECK ((auth.uid() = profile_id));


--
-- Name: services Clients can see related services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can see related services" ON public.services FOR SELECT USING ((auth.uid() = ( SELECT clients.profile_id
   FROM public.clients
  WHERE (clients.profile_id = ( SELECT vehicles.client_id
           FROM public.vehicles
          WHERE (vehicles.id = ( SELECT service_orders.vehicle_id
                   FROM public.service_orders
                  WHERE (service_orders.id = ( SELECT quotes.service_order_id
                           FROM public.quotes
                          WHERE (quotes.id = services.quote_id))))))))));


--
-- Name: quotes Clients can see their own quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can see their own quotes" ON public.quotes FOR SELECT USING ((auth.uid() = ( SELECT clients.profile_id
   FROM public.clients
  WHERE (clients.profile_id = ( SELECT vehicles.client_id
           FROM public.vehicles
          WHERE (vehicles.id = ( SELECT service_orders.vehicle_id
                   FROM public.service_orders
                  WHERE (service_orders.id = quotes.service_order_id))))))));


--
-- Name: service_orders Clients can see their own service_orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can see their own service_orders" ON public.service_orders FOR SELECT USING ((auth.uid() = ( SELECT clients.profile_id
   FROM public.clients
  WHERE (clients.profile_id = ( SELECT vehicles.client_id
           FROM public.vehicles
          WHERE (vehicles.id = service_orders.vehicle_id))))));


--
-- Name: vehicles Clients can see their own vehicles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can see their own vehicles" ON public.vehicles FOR SELECT USING ((auth.uid() = ( SELECT clients.profile_id
   FROM public.clients
  WHERE (clients.profile_id = vehicles.client_id))));


--
-- Name: partners Partners can access their own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Partners can access their own data" ON public.partners USING ((auth.uid() = profile_id)) WITH CHECK ((auth.uid() = profile_id));


--
-- Name: services Partners can manage related services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Partners can manage related services" ON public.services USING ((auth.uid() = ( SELECT partners.profile_id
   FROM public.partners
  WHERE (partners.profile_id = ( SELECT quotes.partner_id
           FROM public.quotes
          WHERE (quotes.id = services.quote_id)))))) WITH CHECK ((auth.uid() = ( SELECT partners.profile_id
   FROM public.partners
  WHERE (partners.profile_id = ( SELECT quotes.partner_id
           FROM public.quotes
          WHERE (quotes.id = services.quote_id))))));


--
-- Name: quotes Partners can manage their own quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Partners can manage their own quotes" ON public.quotes USING ((auth.uid() = partner_id)) WITH CHECK ((auth.uid() = partner_id));


--
-- Name: service_orders Partners can see related service_orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Partners can see related service_orders" ON public.service_orders FOR SELECT USING ((auth.uid() = ( SELECT partners.profile_id
   FROM public.partners
  WHERE (partners.profile_id = ( SELECT quotes.partner_id
           FROM public.quotes
          WHERE (quotes.service_order_id = quotes.id))))));


--
-- Name: partner_fees Partners can see their own fees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Partners can see their own fees" ON public.partner_fees FOR SELECT USING ((auth.uid() = partner_id));


--
-- Name: invoices Payer can see their own invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Payer can see their own invoices" ON public.invoices FOR SELECT USING ((auth.uid() = payer_profile_id));


--
-- Name: specialists Specialists can access their own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Specialists can access their own data" ON public.specialists USING ((auth.uid() = profile_id)) WITH CHECK ((auth.uid() = profile_id));


--
-- Name: parts Specialists can view parts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Specialists can view parts" ON public.parts FOR SELECT USING ((public.get_my_claim('role'::text) = 'specialist'::text));


--
-- Name: addresses Staff can manage all addresses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage all addresses" ON public.addresses USING ((public.get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text]))) WITH CHECK ((public.get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));


--
-- Name: invoices Staff can manage all invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage all invoices" ON public.invoices USING ((public.get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text]))) WITH CHECK ((public.get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));


--
-- Name: partner_fees Staff can manage all partner_fees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage all partner_fees" ON public.partner_fees USING ((public.get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text]))) WITH CHECK ((public.get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));


--
-- Name: quotes Staff can manage all quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage all quotes" ON public.quotes USING ((public.get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text]))) WITH CHECK ((public.get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));


--
-- Name: service_orders Staff can manage all service_orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage all service_orders" ON public.service_orders USING ((public.get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text]))) WITH CHECK ((public.get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));


--
-- Name: services Staff can manage all services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage all services" ON public.services USING ((public.get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text]))) WITH CHECK ((public.get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));


--
-- Name: evaluations Staff can manage evaluations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage evaluations" ON public.evaluations USING ((public.get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text]))) WITH CHECK ((public.get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));


--
-- Name: vehicles Staff can see all vehicles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can see all vehicles" ON public.vehicles FOR SELECT USING ((public.get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));


--
-- Name: service_order_logs Staff can view service_order_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view service_order_logs" ON public.service_order_logs FOR SELECT USING ((public.get_my_claim('role'::text) = ANY (ARRAY['admin'::text, 'specialist'::text])));


--
-- Name: profiles User can access their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User can access their own profile" ON public.profiles USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: addresses User can manage their own addresses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User can manage their own addresses" ON public.addresses USING ((auth.uid() = profile_id)) WITH CHECK ((auth.uid() = profile_id));


--
-- Name: addresses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

--
-- Name: admins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: evaluations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_fees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partner_fees ENABLE ROW LEVEL SECURITY;

--
-- Name: partners; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

--
-- Name: parts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: quotes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

--
-- Name: service_order_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_order_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: service_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

--
-- Name: specialists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;

--
-- Name: vehicles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: iceberg_namespaces; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.iceberg_namespaces ENABLE ROW LEVEL SECURITY;

--
-- Name: iceberg_tables; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.iceberg_tables ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: prefixes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.prefixes ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

