--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.5

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
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
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


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_admin;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
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


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
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


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
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


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
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


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
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


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
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


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
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
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
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


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
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


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
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


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- Name: check_access(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_access(resource_owner_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    RETURN (
        auth.uid() = resource_owner_id -- Case A: It's mine
        OR
        EXISTS ( -- Case B: It was shared with me
            SELECT 1 FROM public.account_shares
            WHERE owner_id = resource_owner_id
            AND lower(shared_with_email) = lower(auth.jwt() ->> 'email')
        )
    );
END;
$$;


ALTER FUNCTION public.check_access(resource_owner_id uuid) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: motivation_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.motivation_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    text text NOT NULL,
    period text,
    category text DEFAULT 'general'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT motivation_messages_period_check CHECK ((period = ANY (ARRAY['morning'::text, 'afternoon'::text, 'night'::text, 'any'::text])))
);


ALTER TABLE public.motivation_messages OWNER TO postgres;

--
-- Name: get_daily_motivation(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_daily_motivation(p_period text) RETURNS SETOF public.motivation_messages
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
    v_count INT;
BEGIN
    v_user_id := auth.uid();
    
    -- Check if we have unseen messages for this period
    SELECT COUNT(*) INTO v_count
    FROM motivation_messages m
    WHERE (m.period = p_period OR m.period = 'any')
    AND m.is_active = true
    AND NOT EXISTS (
        SELECT 1 FROM user_seen_messages s 
        WHERE s.message_id = m.id 
        AND s.user_id = v_user_id
    );

    IF v_count > 0 THEN
        RETURN QUERY
        SELECT *
        FROM motivation_messages m
        WHERE (m.period = p_period OR m.period = 'any')
        AND m.is_active = true
        AND NOT EXISTS (
            SELECT 1 FROM user_seen_messages s 
            WHERE s.message_id = m.id 
            AND s.user_id = v_user_id
        )
        ORDER BY random()
        LIMIT 1;
    ELSE
        -- Return EMPTY (No rows)
        -- This signals the App to "Call the Generator/Refill"
        RETURN;
    END IF;
END;
$$;


ALTER FUNCTION public.get_daily_motivation(p_period text) OWNER TO postgres;

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- Name: has_full_access(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.has_full_access(resource_owner_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
    return (
        -- É o dono?
        resource_owner_id = auth.uid()
        OR
        -- É um convidado autorizado? (Verifica email via JWT)
        exists (
            select 1 from public.account_shares
            where owner_id = resource_owner_id
            and shared_with_email = (select auth.jwt() ->> 'email')
        )
    );
end;
$$;


ALTER FUNCTION public.has_full_access(resource_owner_id uuid) OWNER TO postgres;

--
-- Name: has_patient_access(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.has_patient_access(target_patient_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    BEGIN
        RETURN (
            exists (
                select 1 from public.patients
                where id = target_patient_id
                and user_id = auth.uid()
            )
            OR
            exists (
                select 1 from public.patient_shares
                where patient_id = target_patient_id
                and lower(shared_with_email) = lower(auth.jwt() ->> 'email')
                and status = 'accepted'
            )
        );
    END;
    $$;


ALTER FUNCTION public.has_patient_access(target_patient_id uuid) OWNER TO postgres;

--
-- Name: lowercase_share_email(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.lowercase_share_email() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.shared_with_email = LOWER(NEW.shared_with_email);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.lowercase_share_email() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_admin;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: add_prefixes(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.add_prefixes(_bucket_id text, _name text) OWNER TO supabase_storage_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: delete_leaf_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


ALTER FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) OWNER TO supabase_storage_admin;

--
-- Name: delete_prefix(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.delete_prefix(_bucket_id text, _name text) OWNER TO supabase_storage_admin;

--
-- Name: delete_prefix_hierarchy_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.delete_prefix_hierarchy_trigger() OWNER TO supabase_storage_admin;

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


ALTER FUNCTION storage.get_level(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.get_prefix(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.get_prefixes(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text) OWNER TO supabase_storage_admin;

--
-- Name: lock_top_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$$;


ALTER FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[]) OWNER TO supabase_storage_admin;

--
-- Name: objects_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.objects_delete_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: objects_insert_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.objects_insert_prefix_trigger() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEW−OLD (added paths) and OLD−NEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEW−OLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLD−NEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.objects_update_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_level_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_level_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Set the new level
        NEW."level" := "storage"."get_level"(NEW."name");
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_update_level_trigger() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.objects_update_prefix_trigger() OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: prefixes_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.prefixes_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.prefixes_delete_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: prefixes_insert_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.prefixes_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.prefixes_insert_trigger() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v1_optimised(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    sort_col text;
    sort_ord text;
    cursor_op text;
    cursor_expr text;
    sort_expr text;
BEGIN
    -- Validate sort_order
    sort_ord := lower(sort_order);
    IF sort_ord NOT IN ('asc', 'desc') THEN
        sort_ord := 'asc';
    END IF;

    -- Determine cursor comparison operator
    IF sort_ord = 'asc' THEN
        cursor_op := '>';
    ELSE
        cursor_op := '<';
    END IF;
    
    sort_col := lower(sort_column);
    -- Validate sort column  
    IF sort_col IN ('updated_at', 'created_at') THEN
        cursor_expr := format(
            '($5 = '''' OR ROW(date_trunc(''milliseconds'', %I), name COLLATE "C") %s ROW(COALESCE(NULLIF($6, '''')::timestamptz, ''epoch''::timestamptz), $5))',
            sort_col, cursor_op
        );
        sort_expr := format(
            'COALESCE(date_trunc(''milliseconds'', %I), ''epoch''::timestamptz) %s, name COLLATE "C" %s',
            sort_col, sort_ord, sort_ord
        );
    ELSE
        cursor_expr := format('($5 = '''' OR name COLLATE "C" %s $5)', cursor_op);
        sort_expr := format('name COLLATE "C" %s', sort_ord);
    END IF;

    RETURN QUERY EXECUTE format(
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    NULL::uuid AS id,
                    updated_at,
                    created_at,
                    NULL::timestamptz AS last_accessed_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
            UNION ALL
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    id,
                    updated_at,
                    created_at,
                    last_accessed_at,
                    metadata
                FROM storage.objects
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
        ) obj
        ORDER BY %s
        LIMIT $3
        $sql$,
        cursor_expr,    -- prefixes WHERE
        sort_expr,      -- prefixes ORDER BY
        cursor_expr,    -- objects WHERE
        sort_expr,      -- objects ORDER BY
        sort_expr       -- final ORDER BY
    )
    USING prefix, bucket_name, limits, levels, start_after, sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: account_shares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_shares (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid DEFAULT auth.uid() NOT NULL,
    shared_with_email text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.account_shares OWNER TO postgres;

--
-- Name: alert_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alert_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    prescription_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    alert_date date NOT NULL,
    alert_time time without time zone NOT NULL,
    sent_at timestamp with time zone DEFAULT now(),
    sent_to text[]
);


ALTER TABLE public.alert_logs OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    user_email text,
    action text NOT NULL,
    resource_type text,
    resource_id uuid,
    ip_address text,
    user_agent text,
    metadata jsonb,
    is_suspicious boolean DEFAULT false,
    risk_level text DEFAULT 'low'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT audit_logs_risk_level_check CHECK ((risk_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])))
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.audit_logs IS 'Security audit log tracking all significant user actions';


--
-- Name: COLUMN audit_logs.action; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.audit_logs.action IS 'Type of action performed (login, create, delete, share, etc.)';


--
-- Name: COLUMN audit_logs.is_suspicious; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.audit_logs.is_suspicious IS 'Flag for potentially suspicious activity requiring review';


--
-- Name: COLUMN audit_logs.risk_level; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.audit_logs.risk_level IS 'Severity level: low, medium, high, critical';


--
-- Name: consumption_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consumption_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    prescription_id uuid NOT NULL,
    date date NOT NULL,
    scheduled_time time without time zone NOT NULL,
    taken_at timestamp with time zone,
    status text DEFAULT 'pending'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    taken_by uuid,
    CONSTRAINT consumption_log_status_check CHECK ((status = ANY (ARRAY['taken'::text, 'missed'::text, 'pending'::text])))
);


ALTER TABLE public.consumption_log OWNER TO postgres;

--
-- Name: TABLE consumption_log; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.consumption_log IS 'Histórico de consumo de medicamentos';


--
-- Name: COLUMN consumption_log.taken_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.consumption_log.taken_by IS 'ID do usuário que registrou o consumo';


--
-- Name: health_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.health_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    category text NOT NULL,
    value numeric(10,2) NOT NULL,
    value_secondary numeric(10,2),
    measured_at timestamp with time zone DEFAULT now() NOT NULL,
    notes text,
    CONSTRAINT health_logs_category_check CHECK ((category = ANY (ARRAY['pressure'::text, 'glucose'::text, 'weight'::text, 'temperature'::text, 'heart_rate'::text, 'other'::text])))
);


ALTER TABLE public.health_logs OWNER TO postgres;

--
-- Name: medication_library; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medication_library (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    indications text,
    warnings text,
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('portuguese'::regconfig, ((name || ' '::text) || COALESCE(description, ''::text)))) STORED,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE public.medication_library OWNER TO postgres;

--
-- Name: medications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    dosage text NOT NULL,
    type text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    quantity integer DEFAULT 0,
    last_alert_date date,
    color text DEFAULT 'white'::text,
    shape text DEFAULT 'round'::text
);


ALTER TABLE public.medications OWNER TO postgres;

--
-- Name: TABLE medications; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.medications IS 'Medicamentos disponíveis';


--
-- Name: patient_shares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patient_shares (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    shared_with_email text NOT NULL,
    permission text DEFAULT 'view'::text,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    accepted_at timestamp with time zone,
    shared_with_id uuid
);

ALTER TABLE ONLY public.patient_shares REPLICA IDENTITY FULL;


ALTER TABLE public.patient_shares OWNER TO postgres;

--
-- Name: patients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    birth_date date NOT NULL,
    phone text,
    condition text,
    cep text,
    street text,
    number text,
    complement text,
    neighborhood text,
    city text,
    state text,
    observations text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    email text,
    blood_type text,
    allergies text
);


ALTER TABLE public.patients OWNER TO postgres;

--
-- Name: TABLE patients; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.patients IS 'Pacientes cadastrados no sistema';


--
-- Name: COLUMN patients.email; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patients.email IS 'Email address of the patient for notifications and contact.';


--
-- Name: COLUMN patients.blood_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patients.blood_type IS 'Tipo Sanguíneo (Ex: A+, O-)';


--
-- Name: COLUMN patients.allergies; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patients.allergies IS 'Lista de alergias e intolerâncias';


--
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prescriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    medication_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date,
    frequency text NOT NULL,
    times jsonb NOT NULL,
    instructions text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    dose_amount text,
    continuous_use boolean DEFAULT false
);


ALTER TABLE public.prescriptions OWNER TO postgres;

--
-- Name: TABLE prescriptions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.prescriptions IS 'Prescrições médicas ativas';


--
-- Name: COLUMN prescriptions.continuous_use; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.prescriptions.continuous_use IS 'Flag para medicamentos de uso contínuo (sem data fim obrigatória)';


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: TABLE profiles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.profiles IS 'Perfis de usuário estendidos';


--
-- Name: sponsors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sponsors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    logo_url text NOT NULL,
    website_url text,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    description text,
    whatsapp text,
    tiktok text,
    youtube text,
    instagram text,
    facebook text
);

ALTER TABLE ONLY public.sponsors REPLICA IDENTITY FULL;


ALTER TABLE public.sponsors OWNER TO postgres;

--
-- Name: stock_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_history (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL,
    patient_id uuid,
    medication_id uuid NOT NULL,
    quantity_change numeric(10,2) NOT NULL,
    previous_balance numeric(10,2),
    new_balance numeric(10,2),
    reason text NOT NULL,
    notes text
);


ALTER TABLE public.stock_history OWNER TO postgres;

--
-- Name: support_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    sender_name text,
    sender_email text NOT NULL,
    subject text,
    message text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.support_messages OWNER TO postgres;

--
-- Name: suspicious_activities; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.suspicious_activities WITH (security_invoker='true') AS
 SELECT id,
    user_id,
    user_email,
    action,
    resource_type,
    resource_id,
    ip_address,
    user_agent,
    metadata,
    is_suspicious,
    risk_level,
    created_at,
    count(*) OVER (PARTITION BY user_id, (date(created_at))) AS daily_action_count,
    count(*) OVER (PARTITION BY ip_address, (date(created_at))) AS daily_ip_count
   FROM public.audit_logs al
  WHERE ((is_suspicious = true) OR (risk_level = ANY (ARRAY['high'::text, 'critical'::text])) OR (action = ANY (ARRAY['failed_login'::text, 'unauthorized_access'::text, 'data_export'::text])))
  ORDER BY created_at DESC;


ALTER VIEW public.suspicious_activities OWNER TO postgres;

--
-- Name: user_seen_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_seen_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    message_id uuid,
    seen_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE public.user_seen_messages OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
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


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: messages_2025_12_12; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_12_12 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_12_12 OWNER TO supabase_admin;

--
-- Name: messages_2025_12_13; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_12_13 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_12_13 OWNER TO supabase_admin;

--
-- Name: messages_2025_12_14; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_12_14 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_12_14 OWNER TO supabase_admin;

--
-- Name: messages_2025_12_15; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_12_15 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_12_15 OWNER TO supabase_admin;

--
-- Name: messages_2025_12_16; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_12_16 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_12_16 OWNER TO supabase_admin;

--
-- Name: messages_2025_12_17; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_12_17 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_12_17 OWNER TO supabase_admin;

--
-- Name: messages_2025_12_18; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_12_18 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_12_18 OWNER TO supabase_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
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


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
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
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
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


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
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


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: prefixes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.prefixes (
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    level integer GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE storage.prefixes OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
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


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
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


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- Name: messages_2025_12_12; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_12 FOR VALUES FROM ('2025-12-12 00:00:00') TO ('2025-12-13 00:00:00');


--
-- Name: messages_2025_12_13; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_13 FOR VALUES FROM ('2025-12-13 00:00:00') TO ('2025-12-14 00:00:00');


--
-- Name: messages_2025_12_14; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_14 FOR VALUES FROM ('2025-12-14 00:00:00') TO ('2025-12-15 00:00:00');


--
-- Name: messages_2025_12_15; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_15 FOR VALUES FROM ('2025-12-15 00:00:00') TO ('2025-12-16 00:00:00');


--
-- Name: messages_2025_12_16; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_16 FOR VALUES FROM ('2025-12-16 00:00:00') TO ('2025-12-17 00:00:00');


--
-- Name: messages_2025_12_17; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_17 FOR VALUES FROM ('2025-12-17 00:00:00') TO ('2025-12-18 00:00:00');


--
-- Name: messages_2025_12_18; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_18 FOR VALUES FROM ('2025-12-18 00:00:00') TO ('2025-12-19 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
f7d00018-fb2d-471a-acde-7405db7390dc	f7d00018-fb2d-471a-acde-7405db7390dc	{"sub": "f7d00018-fb2d-471a-acde-7405db7390dc", "email": "silvio@sigsis.com.br", "full_name": "Silvio Teste", "email_verified": false, "phone_verified": false}	email	2025-12-02 21:12:23.636918+00	2025-12-02 21:12:23.636986+00	2025-12-02 21:12:23.636986+00	3db6e9d2-3117-46cc-aab0-63700bfa81e4
5338cb78-fca8-4496-953f-f5e72b30c174	5338cb78-fca8-4496-953f-f5e72b30c174	{"sub": "5338cb78-fca8-4496-953f-f5e72b30c174", "email": "jaguarconsultoriadigital@gmail.com", "full_name": "jaguarconsultoriadigital@gmail.com", "email_verified": false, "phone_verified": false}	email	2025-12-09 13:08:25.896498+00	2025-12-09 13:08:25.896557+00	2025-12-09 13:08:25.896557+00	8cd22e87-7b6e-4061-9078-5715de690869
b36c1774-bcda-4e2e-9ccf-b20c23089c40	b36c1774-bcda-4e2e-9ccf-b20c23089c40	{"sub": "b36c1774-bcda-4e2e-9ccf-b20c23089c40", "email": "sigsis@gmail.com", "full_name": "Silvio Gregório", "email_verified": true, "phone_verified": false}	email	2025-11-30 19:18:40.856397+00	2025-11-30 19:18:40.85645+00	2025-12-11 14:57:58.108794+00	b6ca734c-edba-47a0-b6ab-a37077c395ab
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
5ac29096-5b7c-481c-82d4-3a75daac8982	2025-12-09 13:08:25.968996+00	2025-12-09 13:08:25.968996+00	password	95201dbd-e716-474a-8382-d3467650c9ce
508b6bad-4dc4-4e89-a150-ddcccefbb44f	2025-12-12 20:38:27.049094+00	2025-12-12 20:38:27.049094+00	password	f225995d-5873-4648-b96b-c75b825a0387
3295f7fe-171d-4e8c-8aae-c857a6a648e2	2025-12-13 02:22:29.451602+00	2025-12-13 02:22:29.451602+00	password	95871999-22c6-43ef-8be6-46aff6028950
96844179-9dba-46d8-8932-4f792480476e	2025-12-13 14:18:52.519385+00	2025-12-13 14:18:52.519385+00	password	2bbbba4e-baf1-4d98-a131-4d92128cfd0e
76848f0c-b622-4b95-a860-23a820cba910	2025-12-14 19:12:46.974579+00	2025-12-14 19:12:46.974579+00	password	0d4b1dc8-8ac5-4636-b9a6-73c98ad200d6
1cd7773e-354b-4438-aa9b-5298959ffaa9	2025-12-15 03:39:19.318011+00	2025-12-15 03:39:19.318011+00	password	cdb82247-c054-4112-8732-da39ba960073
0ec3c9fc-467c-444c-a302-08e4f859b8c5	2025-12-15 04:41:59.358047+00	2025-12-15 04:41:59.358047+00	password	ff96f570-eb75-4b10-aeb8-e54f1e5e5507
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	370	q4myya5siwk7	b36c1774-bcda-4e2e-9ccf-b20c23089c40	f	2025-12-12 21:37:25.179897+00	2025-12-12 21:37:25.179897+00	mlyflxlxrajh	508b6bad-4dc4-4e89-a150-ddcccefbb44f
00000000-0000-0000-0000-000000000000	431	mn62lspnw42y	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 04:41:59.352265+00	2025-12-15 05:40:14.026444+00	\N	0ec3c9fc-467c-444c-a302-08e4f859b8c5
00000000-0000-0000-0000-000000000000	223	muxgauyp4b3h	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-09 18:02:27.864542+00	2025-12-09 19:00:42.484553+00	2mofgwvu5bx4	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	289	aznferuux3o6	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-11 01:29:17.864573+00	2025-12-11 02:28:17.551998+00	dywwqvh2ztzi	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	225	h3if6blkbtp3	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-09 19:00:42.502081+00	2025-12-09 19:59:17.096826+00	muxgauyp4b3h	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	373	zvupu2kpc3vk	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-13 15:17:25.703825+00	2025-12-13 16:16:25.586954+00	2oiakze6bene	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	434	bwxuvse2j2uv	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 05:36:16.589201+00	2025-12-15 06:34:46.612275+00	d3yu4n5oequr	1cd7773e-354b-4438-aa9b-5298959ffaa9
00000000-0000-0000-0000-000000000000	227	itr3x6e2atto	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-09 19:59:17.121473+00	2025-12-09 20:58:17.278522+00	h3if6blkbtp3	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	376	d54ryxe7n7fl	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-13 18:14:25.736883+00	2025-12-13 19:13:25.778741+00	isn3u66ko4gy	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	437	j36fgpnv7o5z	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 05:59:25.941706+00	2025-12-15 06:58:25.93681+00	gnd3dmr52mkv	76848f0c-b622-4b95-a860-23a820cba910
00000000-0000-0000-0000-000000000000	379	wg4czeemge5k	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-13 21:10:35.13722+00	2025-12-13 22:09:25.490832+00	jlw7m3mmrof3	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	440	tlaq73a3krhe	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 06:36:25.456332+00	2025-12-15 07:35:25.609314+00	7byk7oxb4dvo	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	382	nltrwu4ihllu	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 00:07:25.787315+00	2025-12-14 01:06:25.853247+00	pr6u7obl2gjx	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	443	w7amwyouiq3u	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-15 07:19:25.874916+00	2025-12-15 08:18:26.170728+00	5darm3foqrtb	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	385	rparh5kq53qh	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 03:04:25.909151+00	2025-12-14 04:03:03.923981+00	6gzju5mufkxm	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	446	tgdodhdzx3np	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 07:37:14.319574+00	2025-12-15 08:35:43.937981+00	6zro5ypeud7n	0ec3c9fc-467c-444c-a302-08e4f859b8c5
00000000-0000-0000-0000-000000000000	388	kd7ci6zvfztp	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 06:01:25.80667+00	2025-12-14 07:00:25.910005+00	dglwuu5v67f5	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	449	iobhe5myog4w	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 08:31:46.521433+00	2025-12-15 09:30:16.702709+00	3m4nr4nir2hp	1cd7773e-354b-4438-aa9b-5298959ffaa9
00000000-0000-0000-0000-000000000000	391	7hq2jck3dkny	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 08:58:25.932418+00	2025-12-14 09:57:25.804923+00	g63x2bw72blm	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	394	6kd4d54vb7g3	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 11:55:25.931017+00	2025-12-14 12:54:26.245792+00	5mwbea47xyce	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	243	ho73c4ogenzu	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 02:52:17.401936+00	2025-12-10 03:51:17.218432+00	mpdfumymcfda	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	245	assxfuo3yqvz	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 03:51:17.236931+00	2025-12-10 04:50:17.334661+00	ho73c4ogenzu	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	397	v2vk7skvza76	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 14:52:25.934303+00	2025-12-14 15:51:25.867148+00	mupaqdtivufg	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	247	vtnwwizwcdh4	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 04:50:17.358444+00	2025-12-10 05:49:17.207766+00	assxfuo3yqvz	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	400	q5fs4nqv4dny	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 17:49:25.652095+00	2025-12-14 18:48:25.914705+00	qalvsrqnlved	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	403	kgf6slkgpdet	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 19:47:25.751546+00	2025-12-14 20:46:25.851015+00	zo67h2xjjtrl	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	249	ipvztifhea5z	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 05:49:17.229852+00	2025-12-10 06:48:17.406876+00	vtnwwizwcdh4	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	406	gugpbps6kvjt	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 21:09:50.01328+00	2025-12-14 22:08:25.867108+00	g3i6rezgyflf	76848f0c-b622-4b95-a860-23a820cba910
00000000-0000-0000-0000-000000000000	409	bbdhyoq3mdju	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-14 22:28:02.235839+00	2025-12-14 23:27:25.709522+00	juqecch7jtnd	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	251	gjy3miitauie	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 06:48:17.417012+00	2025-12-10 07:47:17.369679+00	ipvztifhea5z	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	253	bjxicg7l5ztp	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 07:47:17.386893+00	2025-12-10 08:46:17.379269+00	gjy3miitauie	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	412	6zecepjreioo	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-14 23:27:25.731574+00	2025-12-15 00:26:25.708414+00	bbdhyoq3mdju	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	255	qlukpmrzbkzl	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 08:46:17.396516+00	2025-12-10 09:45:17.334531+00	bjxicg7l5ztp	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	257	s4pt446nmkbj	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 09:45:17.359947+00	2025-12-10 10:44:17.251371+00	qlukpmrzbkzl	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	259	3cllmcpt7bi4	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 10:44:17.263802+00	2025-12-10 11:43:17.254832+00	s4pt446nmkbj	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	305	u2lvmjejx4t4	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-11 09:20:51.57829+00	2025-12-11 10:20:17.856553+00	nauulmd7khsy	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	261	qq3uwdowbase	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 11:43:17.262466+00	2025-12-10 12:42:17.894883+00	3cllmcpt7bi4	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	263	ga2o6aqyvw6b	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 12:42:17.920432+00	2025-12-10 13:41:17.449168+00	qq3uwdowbase	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	265	cf65xokhxidi	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 13:41:17.459946+00	2025-12-10 14:40:17.686569+00	ga2o6aqyvw6b	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	267	ip3catzuwayb	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 14:40:17.700924+00	2025-12-10 15:39:17.471644+00	cf65xokhxidi	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	269	5qqgxedz4knf	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 15:39:17.480065+00	2025-12-10 16:38:17.507346+00	ip3catzuwayb	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	271	hn4wgfztw3ys	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 16:38:17.530167+00	2025-12-10 17:37:17.746097+00	5qqgxedz4knf	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	273	hlus63h3p5tl	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 17:37:17.774063+00	2025-12-10 18:36:18.900473+00	hn4wgfztw3ys	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	275	pizkn2gsj2dl	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 18:36:18.915421+00	2025-12-10 19:35:18.092018+00	hlus63h3p5tl	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	277	d7mm7i5z4lef	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 19:35:18.105769+00	2025-12-10 20:34:17.696158+00	pizkn2gsj2dl	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	279	io762cjodp65	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 20:34:17.713801+00	2025-12-10 21:33:17.671424+00	d7mm7i5z4lef	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	281	4tnbdrad7uos	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 21:33:17.693426+00	2025-12-10 22:32:18.774971+00	io762cjodp65	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	283	eqyxw64pemt2	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 22:32:18.790784+00	2025-12-10 23:31:17.663941+00	4tnbdrad7uos	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	285	araohu4rztv7	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 23:31:17.677175+00	2025-12-11 00:30:17.800628+00	eqyxw64pemt2	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	287	dywwqvh2ztzi	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-11 00:30:17.828534+00	2025-12-11 01:29:17.843549+00	araohu4rztv7	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	221	2mofgwvu5bx4	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-09 17:04:17.333221+00	2025-12-09 18:02:27.857418+00	fyrobh444b4w	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	428	xpskuhhcc2ne	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-15 04:22:22.678179+00	2025-12-15 05:21:26.20362+00	qfgx3qdxwhsz	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	369	mlyflxlxrajh	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-12 20:38:27.041127+00	2025-12-12 21:37:25.157703+00	\N	508b6bad-4dc4-4e89-a150-ddcccefbb44f
00000000-0000-0000-0000-000000000000	371	hhlyvshbdthj	b36c1774-bcda-4e2e-9ccf-b20c23089c40	f	2025-12-13 02:22:29.408241+00	2025-12-13 02:22:29.408241+00	\N	3295f7fe-171d-4e8c-8aae-c857a6a648e2
00000000-0000-0000-0000-000000000000	432	gnd3dmr52mkv	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 05:00:25.955134+00	2025-12-15 05:59:25.923769+00	6635n44ivlkg	76848f0c-b622-4b95-a860-23a820cba910
00000000-0000-0000-0000-000000000000	374	7e2smjfamkbi	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-13 16:16:25.606679+00	2025-12-13 17:15:25.683143+00	zvupu2kpc3vk	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	291	wc2t72rlnto5	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-11 02:28:17.565566+00	2025-12-11 03:27:18.012172+00	aznferuux3o6	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	435	7byk7oxb4dvo	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 05:37:25.400356+00	2025-12-15 06:36:25.454569+00	zg7zlsykgrr4	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	230	wphz7xscbynq	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-09 20:58:17.304532+00	2025-12-09 21:57:17.079447+00	itr3x6e2atto	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	232	rnlviviwlgwn	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-09 21:57:17.098743+00	2025-12-09 22:56:17.33211+00	wphz7xscbynq	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	293	uanddfrbinnz	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-11 03:27:18.036489+00	2025-12-11 04:26:18.103891+00	wc2t72rlnto5	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	234	swz2fut57gyy	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-09 22:56:17.356128+00	2025-12-09 23:55:17.219368+00	rnlviviwlgwn	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	438	5darm3foqrtb	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-15 06:20:26.242692+00	2025-12-15 07:19:25.854393+00	iwtzbybvyx2u	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	377	rsvy7jiy23nl	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-13 19:13:25.79539+00	2025-12-13 20:11:45.922679+00	d54ryxe7n7fl	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	441	6zro5ypeud7n	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 06:38:44.008174+00	2025-12-15 07:37:14.318326+00	mo67wh5bwrjr	0ec3c9fc-467c-444c-a302-08e4f859b8c5
00000000-0000-0000-0000-000000000000	236	xllqvbahgh2p	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-09 23:55:17.234514+00	2025-12-10 00:54:17.513204+00	swz2fut57gyy	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	295	hjvuiwh4yfv6	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-11 04:26:18.122702+00	2025-12-11 05:25:17.558102+00	uanddfrbinnz	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	238	nacyqca5cxm2	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 00:54:17.540484+00	2025-12-10 01:53:16.838684+00	xllqvbahgh2p	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	444	3m4nr4nir2hp	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 07:33:16.602465+00	2025-12-15 08:31:46.514364+00	hgytw4jsodwt	1cd7773e-354b-4438-aa9b-5298959ffaa9
00000000-0000-0000-0000-000000000000	297	ug25dxwmvphd	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-11 05:25:17.580011+00	2025-12-11 06:24:17.750007+00	hjvuiwh4yfv6	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	240	mpdfumymcfda	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-10 01:53:16.848425+00	2025-12-10 02:52:17.382143+00	nacyqca5cxm2	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	380	kt3vaibr6iwh	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-13 22:09:25.517672+00	2025-12-13 23:08:25.618445+00	wg4czeemge5k	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	383	aj2h5m4zuudt	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 01:06:25.876067+00	2025-12-14 02:05:25.787737+00	nltrwu4ihllu	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	213	kl6j7skkv7z6	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-09 13:08:25.945895+00	2025-12-09 14:07:17.126578+00	\N	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	299	ortllgpclfdw	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-11 06:24:17.769785+00	2025-12-11 07:23:17.735006+00	ug25dxwmvphd	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	215	pqmhqv73n2mt	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-09 14:07:17.150269+00	2025-12-09 15:06:17.473604+00	kl6j7skkv7z6	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	447	ssh3j24nhmd7	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 07:57:25.992342+00	2025-12-15 08:56:25.922768+00	4vubey3tdfrq	76848f0c-b622-4b95-a860-23a820cba910
00000000-0000-0000-0000-000000000000	217	itcpdunw2z5t	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-09 15:06:17.495282+00	2025-12-09 16:05:17.312166+00	pqmhqv73n2mt	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	386	2d7t7s7dab2s	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 04:03:03.935817+00	2025-12-14 05:02:25.787157+00	rparh5kq53qh	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	219	fyrobh444b4w	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-09 16:05:17.342367+00	2025-12-09 17:04:17.313179+00	itcpdunw2z5t	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	301	ln2xllkgu6le	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-11 07:23:17.748582+00	2025-12-11 08:22:17.801334+00	ortllgpclfdw	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	450	s7lblkj4afp3	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 08:34:25.690701+00	2025-12-15 09:33:25.735555+00	iglelk7podl3	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	389	tmqjeartce7t	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 07:00:25.927998+00	2025-12-14 07:59:25.855821+00	kd7ci6zvfztp	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	303	nauulmd7khsy	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-11 08:22:17.82513+00	2025-12-11 09:20:51.559005+00	ln2xllkgu6le	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	392	wrzqt2tpv6ki	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 09:57:25.822189+00	2025-12-14 10:56:25.924126+00	7hq2jck3dkny	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	395	u3t4lhkvmwhz	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 12:54:26.261417+00	2025-12-14 13:53:25.883871+00	6kd4d54vb7g3	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	398	xisnzzuqc6rt	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 15:51:25.886278+00	2025-12-14 16:49:57.77656+00	v2vk7skvza76	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	401	zo67h2xjjtrl	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 18:48:25.934606+00	2025-12-14 19:47:25.731604+00	q5fs4nqv4dny	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	404	g3i6rezgyflf	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 20:11:23.525766+00	2025-12-14 21:09:49.994799+00	mjfl2e4wgmqq	76848f0c-b622-4b95-a860-23a820cba910
00000000-0000-0000-0000-000000000000	323	juqecch7jtnd	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-11 14:16:17.778552+00	2025-12-14 22:28:02.224174+00	klu7q275lioj	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	407	3zjtixigqwsi	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 21:45:25.734884+00	2025-12-14 22:44:25.620142+00	p7b6brzltx7n	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	410	wtxyhht4kbs7	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 22:44:25.633532+00	2025-12-14 23:43:25.682395+00	3zjtixigqwsi	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	413	hcvldscqqdno	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 23:43:25.689618+00	2025-12-15 00:42:26.061023+00	wtxyhht4kbs7	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	415	ok5bdvnw7dmk	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-15 00:26:25.72635+00	2025-12-15 01:25:25.742414+00	6zecepjreioo	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	417	f4fr3kjitw74	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 01:05:26.047747+00	2025-12-15 02:04:25.73606+00	lth6pq3eszvf	76848f0c-b622-4b95-a860-23a820cba910
00000000-0000-0000-0000-000000000000	419	lov5mo3ixtnv	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 01:41:26.21685+00	2025-12-15 02:40:25.513054+00	s4f6vtzecsla	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	421	yrki4nbleoxe	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-15 02:24:25.748842+00	2025-12-15 03:23:25.944432+00	6tqayu6jfpsb	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	423	2jhqcskxrljj	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 03:02:42.946443+00	2025-12-15 04:01:25.992273+00	eos4u6tcnuej	76848f0c-b622-4b95-a860-23a820cba910
00000000-0000-0000-0000-000000000000	425	nw7jx5jyutpn	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 03:39:19.3029+00	2025-12-15 04:37:46.295089+00	\N	1cd7773e-354b-4438-aa9b-5298959ffaa9
00000000-0000-0000-0000-000000000000	426	honjujhe257v	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 03:39:25.395145+00	2025-12-15 04:38:25.450261+00	p5qg2kufryza	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	314	klu7q275lioj	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-11 13:17:17.897884+00	2025-12-11 14:16:17.768834+00	kxnnjvv6zbu4	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	427	6635n44ivlkg	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 04:01:26.00883+00	2025-12-15 05:00:25.943724+00	2jhqcskxrljj	76848f0c-b622-4b95-a860-23a820cba910
00000000-0000-0000-0000-000000000000	307	4bkrcft5uag3	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-11 10:20:17.875561+00	2025-12-11 11:19:18.2972+00	u2lvmjejx4t4	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	372	2oiakze6bene	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-13 14:18:52.475859+00	2025-12-13 15:17:25.679341+00	\N	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	375	isn3u66ko4gy	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-13 17:15:25.698792+00	2025-12-13 18:14:25.712306+00	7e2smjfamkbi	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	309	unrws6f5335s	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-11 11:19:18.320833+00	2025-12-11 12:18:21.137684+00	4bkrcft5uag3	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	429	d3yu4n5oequr	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 04:37:46.314411+00	2025-12-15 05:36:16.568093+00	nw7jx5jyutpn	1cd7773e-354b-4438-aa9b-5298959ffaa9
00000000-0000-0000-0000-000000000000	378	jlw7m3mmrof3	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-13 20:11:45.940906+00	2025-12-13 21:10:35.121642+00	rsvy7jiy23nl	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	430	zg7zlsykgrr4	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 04:38:25.451593+00	2025-12-15 05:37:25.39937+00	honjujhe257v	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	381	pr6u7obl2gjx	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-13 23:08:25.641112+00	2025-12-14 00:07:25.764319+00	kt3vaibr6iwh	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	311	kxnnjvv6zbu4	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-11 12:18:21.159398+00	2025-12-11 13:17:17.879+00	unrws6f5335s	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	384	6gzju5mufkxm	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 02:05:25.805087+00	2025-12-14 03:04:25.88521+00	aj2h5m4zuudt	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	433	iwtzbybvyx2u	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-15 05:21:26.221909+00	2025-12-15 06:20:26.224656+00	xpskuhhcc2ne	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	387	dglwuu5v67f5	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 05:02:25.81256+00	2025-12-14 06:01:25.782607+00	2d7t7s7dab2s	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	390	g63x2bw72blm	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 07:59:25.873481+00	2025-12-14 08:58:25.91167+00	tmqjeartce7t	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	436	mo67wh5bwrjr	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 05:40:14.029736+00	2025-12-15 06:38:44.006024+00	mn62lspnw42y	0ec3c9fc-467c-444c-a302-08e4f859b8c5
00000000-0000-0000-0000-000000000000	393	5mwbea47xyce	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 10:56:25.939043+00	2025-12-14 11:55:25.915828+00	wrzqt2tpv6ki	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	396	mupaqdtivufg	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 13:53:25.902671+00	2025-12-14 14:52:25.917628+00	u3t4lhkvmwhz	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	439	hgytw4jsodwt	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 06:34:46.628004+00	2025-12-15 07:33:16.588892+00	bwxuvse2j2uv	1cd7773e-354b-4438-aa9b-5298959ffaa9
00000000-0000-0000-0000-000000000000	399	qalvsrqnlved	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 16:49:57.790841+00	2025-12-14 17:49:25.632938+00	xisnzzuqc6rt	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	402	mjfl2e4wgmqq	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 19:12:46.937923+00	2025-12-14 20:11:23.515126+00	\N	76848f0c-b622-4b95-a860-23a820cba910
00000000-0000-0000-0000-000000000000	442	4vubey3tdfrq	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 06:58:25.946202+00	2025-12-15 07:57:25.977462+00	j36fgpnv7o5z	76848f0c-b622-4b95-a860-23a820cba910
00000000-0000-0000-0000-000000000000	405	p7b6brzltx7n	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 20:46:25.867075+00	2025-12-14 21:45:25.714799+00	kgf6slkgpdet	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	408	wd2524rddrmc	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 22:08:25.883019+00	2025-12-14 23:07:26.102123+00	gugpbps6kvjt	76848f0c-b622-4b95-a860-23a820cba910
00000000-0000-0000-0000-000000000000	445	iglelk7podl3	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 07:35:25.611423+00	2025-12-15 08:34:25.686873+00	tlaq73a3krhe	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	411	7fsbbdmcd6up	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-14 23:07:26.116627+00	2025-12-15 00:06:25.925199+00	wd2524rddrmc	76848f0c-b622-4b95-a860-23a820cba910
00000000-0000-0000-0000-000000000000	414	lth6pq3eszvf	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 00:06:25.9472+00	2025-12-15 01:05:26.019634+00	7fsbbdmcd6up	76848f0c-b622-4b95-a860-23a820cba910
00000000-0000-0000-0000-000000000000	448	r6pwnebuitxy	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-15 08:18:26.188299+00	2025-12-15 09:17:25.795426+00	w7amwyouiq3u	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	416	s4f6vtzecsla	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 00:42:26.072953+00	2025-12-15 01:41:26.202357+00	hcvldscqqdno	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	418	6tqayu6jfpsb	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-15 01:25:25.751879+00	2025-12-15 02:24:25.731054+00	ok5bdvnw7dmk	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	420	eos4u6tcnuej	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 02:04:25.755996+00	2025-12-15 03:02:42.935099+00	f4fr3kjitw74	76848f0c-b622-4b95-a860-23a820cba910
00000000-0000-0000-0000-000000000000	422	p5qg2kufryza	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 02:40:25.523008+00	2025-12-15 03:39:25.392198+00	lov5mo3ixtnv	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	424	qfgx3qdxwhsz	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-15 03:23:25.951513+00	2025-12-15 04:22:22.652223+00	yrki4nbleoxe	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	451	lm3ueqrittcl	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 08:35:43.947216+00	2025-12-15 09:34:13.87318+00	tgdodhdzx3np	0ec3c9fc-467c-444c-a302-08e4f859b8c5
00000000-0000-0000-0000-000000000000	452	kvpiyycxqhuj	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 08:56:25.945883+00	2025-12-15 09:55:25.886021+00	ssh3j24nhmd7	76848f0c-b622-4b95-a860-23a820cba910
00000000-0000-0000-0000-000000000000	453	d6sh52t5lszc	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-15 09:17:25.814573+00	2025-12-15 10:16:25.852712+00	r6pwnebuitxy	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	454	7nmvj55d23yq	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 09:30:16.715836+00	2025-12-15 10:28:46.433376+00	iobhe5myog4w	1cd7773e-354b-4438-aa9b-5298959ffaa9
00000000-0000-0000-0000-000000000000	455	fgwjue76behe	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 09:33:25.74809+00	2025-12-15 10:32:25.820777+00	s7lblkj4afp3	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	456	ll5evlp7k5tp	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 09:34:13.874005+00	2025-12-15 10:32:43.878375+00	lm3ueqrittcl	0ec3c9fc-467c-444c-a302-08e4f859b8c5
00000000-0000-0000-0000-000000000000	457	v7qugps3cxru	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 09:55:25.896756+00	2025-12-15 10:54:25.835072+00	kvpiyycxqhuj	76848f0c-b622-4b95-a860-23a820cba910
00000000-0000-0000-0000-000000000000	458	laedd6gdscdd	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-15 10:16:25.873715+00	2025-12-15 11:15:25.899041+00	d6sh52t5lszc	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	459	vsyeaiqdgbwo	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 10:28:46.442509+00	2025-12-15 11:27:16.433029+00	7nmvj55d23yq	1cd7773e-354b-4438-aa9b-5298959ffaa9
00000000-0000-0000-0000-000000000000	460	uc2yw56mfzuw	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 10:32:25.83806+00	2025-12-15 11:30:56.629646+00	fgwjue76behe	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	461	dnh67yxbgy4p	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 10:32:43.879458+00	2025-12-15 11:31:15.293428+00	ll5evlp7k5tp	0ec3c9fc-467c-444c-a302-08e4f859b8c5
00000000-0000-0000-0000-000000000000	462	akcbzjimeswd	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 10:54:25.850155+00	2025-12-15 11:53:25.889639+00	v7qugps3cxru	76848f0c-b622-4b95-a860-23a820cba910
00000000-0000-0000-0000-000000000000	467	6gbkxgdj4nqs	b36c1774-bcda-4e2e-9ccf-b20c23089c40	f	2025-12-15 11:53:25.904293+00	2025-12-15 11:53:25.904293+00	akcbzjimeswd	76848f0c-b622-4b95-a860-23a820cba910
00000000-0000-0000-0000-000000000000	463	lrzhxn44yzlk	5338cb78-fca8-4496-953f-f5e72b30c174	t	2025-12-15 11:15:25.91093+00	2025-12-15 12:14:25.801818+00	laedd6gdscdd	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	464	ygp2yqrue3hw	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 11:27:16.44263+00	2025-12-15 12:25:46.513586+00	vsyeaiqdgbwo	1cd7773e-354b-4438-aa9b-5298959ffaa9
00000000-0000-0000-0000-000000000000	466	hjoedk7llpsk	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 11:31:15.294065+00	2025-12-15 12:29:44.212085+00	dnh67yxbgy4p	0ec3c9fc-467c-444c-a302-08e4f859b8c5
00000000-0000-0000-0000-000000000000	465	uyvo2de5mb43	b36c1774-bcda-4e2e-9ccf-b20c23089c40	t	2025-12-15 11:30:56.633625+00	2025-12-15 12:30:25.573865+00	uc2yw56mfzuw	96844179-9dba-46d8-8932-4f792480476e
00000000-0000-0000-0000-000000000000	468	j5ffj5i6zk6k	5338cb78-fca8-4496-953f-f5e72b30c174	f	2025-12-15 12:14:25.817356+00	2025-12-15 12:14:25.817356+00	lrzhxn44yzlk	5ac29096-5b7c-481c-82d4-3a75daac8982
00000000-0000-0000-0000-000000000000	469	rci5zqs6jiqy	b36c1774-bcda-4e2e-9ccf-b20c23089c40	f	2025-12-15 12:25:46.527643+00	2025-12-15 12:25:46.527643+00	ygp2yqrue3hw	1cd7773e-354b-4438-aa9b-5298959ffaa9
00000000-0000-0000-0000-000000000000	470	7d4g753aagea	b36c1774-bcda-4e2e-9ccf-b20c23089c40	f	2025-12-15 12:29:44.216145+00	2025-12-15 12:29:44.216145+00	hjoedk7llpsk	0ec3c9fc-467c-444c-a302-08e4f859b8c5
00000000-0000-0000-0000-000000000000	471	5wwzyq5dfwac	b36c1774-bcda-4e2e-9ccf-b20c23089c40	f	2025-12-15 12:30:25.57495+00	2025-12-15 12:30:25.57495+00	uyvo2de5mb43	96844179-9dba-46d8-8932-4f792480476e
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
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
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
508b6bad-4dc4-4e89-a150-ddcccefbb44f	b36c1774-bcda-4e2e-9ccf-b20c23089c40	2025-12-12 20:38:27.038776+00	2025-12-12 21:37:25.199929+00	\N	aal1	\N	2025-12-12 21:37:25.199181	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	177.54.193.49	\N	\N	\N	\N	\N
3295f7fe-171d-4e8c-8aae-c857a6a648e2	b36c1774-bcda-4e2e-9ccf-b20c23089c40	2025-12-13 02:22:29.367951+00	2025-12-13 02:22:29.367951+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	177.54.193.49	\N	\N	\N	\N	\N
76848f0c-b622-4b95-a860-23a820cba910	b36c1774-bcda-4e2e-9ccf-b20c23089c40	2025-12-14 19:12:46.88927+00	2025-12-15 11:53:25.920468+00	\N	aal1	\N	2025-12-15 11:53:25.920368	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	177.54.193.49	\N	\N	\N	\N	\N
5ac29096-5b7c-481c-82d4-3a75daac8982	5338cb78-fca8-4496-953f-f5e72b30c174	2025-12-09 13:08:25.927641+00	2025-12-15 12:14:25.836927+00	\N	aal1	\N	2025-12-15 12:14:25.836829	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	177.54.193.49	\N	\N	\N	\N	\N
1cd7773e-354b-4438-aa9b-5298959ffaa9	b36c1774-bcda-4e2e-9ccf-b20c23089c40	2025-12-15 03:39:19.279889+00	2025-12-15 12:25:46.543379+00	\N	aal1	\N	2025-12-15 12:25:46.543262	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	177.54.193.49	\N	\N	\N	\N	\N
0ec3c9fc-467c-444c-a302-08e4f859b8c5	b36c1774-bcda-4e2e-9ccf-b20c23089c40	2025-12-15 04:41:59.337328+00	2025-12-15 12:29:44.220136+00	\N	aal1	\N	2025-12-15 12:29:44.220036	Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36	177.54.193.49	\N	\N	\N	\N	\N
96844179-9dba-46d8-8932-4f792480476e	b36c1774-bcda-4e2e-9ccf-b20c23089c40	2025-12-13 14:18:52.446101+00	2025-12-15 12:30:25.58054+00	\N	aal1	\N	2025-12-15 12:30:25.580444	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	177.54.193.49	\N	\N	\N	\N	\N
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	5338cb78-fca8-4496-953f-f5e72b30c174	authenticated	authenticated	jaguarconsultoriadigital@gmail.com	$2a$10$dOZvpqSqvXXijWGawPrIvu180QRjKtcEGpB.4emTrYdMslFK4Bhnu	2025-12-09 13:08:25.91301+00	\N		\N		\N			\N	2025-12-09 13:08:25.92617+00	{"provider": "email", "providers": ["email"]}	{"sub": "5338cb78-fca8-4496-953f-f5e72b30c174", "email": "jaguarconsultoriadigital@gmail.com", "full_name": "jaguarconsultoriadigital@gmail.com", "email_verified": true, "phone_verified": false}	\N	2025-12-09 13:08:25.859817+00	2025-12-15 12:14:25.830944+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	f7d00018-fb2d-471a-acde-7405db7390dc	authenticated	authenticated	silvio@sigsis.com.br	$2a$10$twVPTIbIZsOUMNETB.CywuyrBo8p5P0NC1T6GvnEoAp4Q4UQH.QEq	2025-12-02 21:12:23.649808+00	\N		\N		\N			\N	2025-12-02 21:12:23.67576+00	{"provider": "email", "providers": ["email"]}	{"sub": "f7d00018-fb2d-471a-acde-7405db7390dc", "email": "silvio@sigsis.com.br", "full_name": "Silvio Teste1", "email_verified": true, "phone_verified": false}	\N	2025-12-02 21:12:23.541116+00	2025-12-06 11:56:43.857199+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	b36c1774-bcda-4e2e-9ccf-b20c23089c40	authenticated	authenticated	sigsis@gmail.com	$2a$10$6SIQeApBNL2puQ9YoCJoBOQfn.BGNexH1exisDnt1tMqjsavKVEZK	2025-11-30 19:18:40.859718+00	\N		\N		\N			2025-12-11 14:57:47.054608+00	2025-12-15 04:41:59.33723+00	{"provider": "email", "providers": ["email"]}	{"sub": "b36c1774-bcda-4e2e-9ccf-b20c23089c40", "email": "sigsis@gmail.com", "full_name": "Silvio Gregório", "email_verified": true, "phone_verified": false}	\N	2025-11-30 19:18:40.850787+00	2025-12-15 12:30:25.577967+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: account_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.account_shares (id, owner_id, shared_with_email, created_at) FROM stdin;
f7bb2a13-133b-433e-9628-fa619511ea10	b36c1774-bcda-4e2e-9ccf-b20c23089c40	vendas@sigsis.com.br	2025-12-13 21:03:57.586936+00
\.


--
-- Data for Name: alert_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alert_logs (id, prescription_id, patient_id, alert_date, alert_time, sent_at, sent_to) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, user_email, action, resource_type, resource_id, ip_address, user_agent, metadata, is_suspicious, risk_level, created_at) FROM stdin;
\.


--
-- Data for Name: consumption_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.consumption_log (id, prescription_id, date, scheduled_time, taken_at, status, notes, created_at, taken_by) FROM stdin;
d51a098e-33e8-412a-bcf2-fbe3009c6c13	3d0440c5-cb4e-4502-bc92-52a42020e236	2025-12-14	08:00:00	2025-12-15 03:49:40.261+00	taken	\N	2025-12-15 03:49:41.334795+00	b36c1774-bcda-4e2e-9ccf-b20c23089c40
\.


--
-- Data for Name: health_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.health_logs (id, created_at, user_id, patient_id, category, value, value_secondary, measured_at, notes) FROM stdin;
0c917af2-7fff-4daf-8e74-d1d8201a7b8e	2025-12-15 03:16:52.958239+00	b36c1774-bcda-4e2e-9ccf-b20c23089c40	55184598-3ce5-4068-804d-f4d9313a35ac	pressure	33.00	3.00	2025-12-14 21:00:00+00	
f9884ae8-2955-488f-8a19-9dcac0077308	2025-12-15 04:00:30.48982+00	b36c1774-bcda-4e2e-9ccf-b20c23089c40	3a94ee66-e3e2-4a6b-a789-2c3876758d85	pressure	33.00	3.00	2025-12-14 17:59:00+00	
\.


--
-- Data for Name: medication_library; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medication_library (id, name, description, indications, warnings, created_at) FROM stdin;
b764e89e-acd9-40e8-8c28-b0006c9055d7	Dipirona	Analgésico e antitérmico.	Dor e febre.	Contraindicado para quem tem alergia a dipirona. Cuidado com pressão baixa.	2025-12-14 02:50:30.496561+00
74d18b48-674a-42a0-a3e5-c8e5b5a3fb44	Paracetamol	Analgésico e antitérmico.	Dores leves a moderadas e febre.	Em excesso pode causar danos graves ao fígado. Não misture com álcool.	2025-12-14 02:50:30.496561+00
b6e8a50c-5d48-439a-a4dd-689a327a44e9	Ibuprofeno	Anti-inflamatório não esteroide (AINE).	Inflamação, dor, febre, cólicas.	Pode irritar o estômago. Evite se tiver gastrite ou úlcera.	2025-12-14 02:50:30.496561+00
63be3129-766b-467a-9bc1-f4e846fe28c0	Omeprazol	Protetor gástrico.	Gastrite, úlcera, refluxo.	Use preferencialmente em jejum pela manhã. Não use por tempo prolongado sem orientação.	2025-12-14 02:50:30.496561+00
4a3d32b2-5731-478e-bd2b-ff1661903028	Losartana	Anti-hipertensivo.	Controle da pressão alta (hipertensão).	Uso contínuo. Não interrompa sem ordem médica. Pode causar tontura no início.	2025-12-14 02:50:30.496561+00
b9e18b61-3449-4595-a673-6bebcd8fcc07	Simeticona	Antigases.	Alívio de gases e desconforto abdominal.	Geralmente seguro. Não indicado se houver suspeita de perfuração ou obstrução.	2025-12-14 02:50:30.496561+00
248b118e-9290-4f52-aa7c-763e3cc66c8c	Amoxicilina	Antibiótico.	Infecções bacterianas (garganta, ouvido, etc).	ATENÇÃO: Cumpra o horário exato. Se for alérgico a penicilina, NÃO USE.	2025-12-14 02:50:30.496561+00
a6a5499a-8d2a-4e1e-bb5c-4d9086cb4d7d	Nimesulida	Anti-inflamatório.	Dor aguda e inflamação.	Uso restrito e por curto período. Risco hepático se usado por muitos dias.	2025-12-14 02:50:30.496561+00
30771b15-2442-4220-a3ff-0aa35308e85e	Clonazepam	Ansiolítico (Tarja Preta).	Ansiedade, pânico, convulsões.	Causa sonolência e dependência. Nunca misture com álcool. Uso estritamente médico.	2025-12-14 02:50:30.496561+00
2076bd2a-12e9-4aeb-bfd3-366d0481915d	Metformina	Antidiabético.	Controle do diabetes tipo 2.	Tome junto com as refeições para evitar enjoo. Cuidado com função renal.	2025-12-14 02:50:30.496561+00
1eaead57-89d6-46fa-8820-68e5888b37f4	AAS (Aspirina)	Antiagregante / Analgésico.	Prevenção de infarto/AVC (dose baixa) ou dor.	Risco de sangramento. Não dê para crianças com febre (Síndrome de Reye).	2025-12-14 02:50:30.496561+00
55310355-e441-447e-b3c2-2f03f6518fb7	Domperidona	Antiemético.	Náuseas, vômitos, sensação de estômago cheio.	Cuidado com arritmias cardíacas. Respeite a dose máxima.	2025-12-14 02:50:30.496561+00
640366b9-720d-4e7b-87fe-717e4da8193b	Dorflex	Relaxante muscular e analgésico.	Dores musculares, tensão, dor de cabeça tensional.	Contém cafeína e dipirona. Cuidado se tiver alergia ou problemas de pressão.	2025-12-14 02:50:30.496561+00
29583a32-9771-41c0-839e-a79437defe65	Neosaldina	Analgésico e relaxante.	Dores de cabeça e enxaqueca.	Contém dipirona e cafeína. Cuidado com hipertensos sensíveis.	2025-12-14 02:50:30.496561+00
213d1378-7b28-4598-b699-71e2f8d7a3ac	Torsilax	Relaxante muscular e anti-inflamatório potente.	Dores fortes nas costas, articulações, reumatismo.	Contém corticoide (uso prolongado faz mal). Irrita o estômago.	2025-12-14 02:50:30.496561+00
d998579f-a9f0-443f-bc6a-73aefeafa4c0	Dramin	Antiemético e antivertiginoso.	Enjoo de viagem, labirintite.	Causa sonolência intensa. Não dirija após tomar.	2025-12-14 02:50:30.496561+00
3f8ad34a-c25b-4cbe-baf9-b085b06d57c6	Buscopan	Antiespasmódico.	Cólicas abdominais, dores na barriga.	Versão Composta contém Dipirona (cuidado alérgicos).	2025-12-14 02:50:30.496561+00
841e517f-6533-476a-912c-b9967847ec90	Rivotril	Ansiolítico (Marca do Clonazepam).	Ansiedade, distúrbios do sono, pânico.	Alto risco de dependência. Só use com receita retida.	2025-12-14 02:50:30.496561+00
651bbfe9-7361-4f5c-8a42-e1c958313992	Pantoprazol	Inibidor de acidez.	Refluxo, gastrite, proteção estomacal.	Similar ao Omeprazol. Melhor tomado em jejum.	2025-12-14 02:50:30.496561+00
6be231fe-1876-4edd-9426-4de2e3f0b8e1	Xarelto (Rivaroxabana)	Anticoagulante.	Prevenção de trombose e AVC.	Risco alto de hemorragia. Nunca falhe a dose e cuidado com ferimentos.	2025-12-14 02:50:30.496561+00
\.


--
-- Data for Name: medications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medications (id, user_id, name, dosage, type, created_at, updated_at, quantity, last_alert_date, color, shape) FROM stdin;
0d787b6e-5540-4560-ae2a-d5d6190b53c9	f7d00018-fb2d-471a-acde-7405db7390dc	Dipirona	1 mg	comprimido	2025-12-03 01:58:48.7573+00	2025-12-03 01:58:48.7573+00	0	\N	white	round
900dacbe-5200-4d5a-9c49-a8a0e0229ae1	b36c1774-bcda-4e2e-9ccf-b20c23089c40	Dipirona	1 mg	comprimido	2025-12-06 13:48:24.806278+00	2025-12-15 03:49:41.52501+00	28	\N	white	round
\.


--
-- Data for Name: motivation_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.motivation_messages (id, text, period, category, is_active, created_at) FROM stdin;
b72a8f8c-7886-486e-9c58-bbc27ef15658	Bom dia! Que o dia de hoje traga novas forças e leve embora o que não serve mais.	morning	faith	t	2025-12-14 02:23:29.150876+00
82691d46-3730-4b2e-99cd-c32bf9830996	A cada manhã nascemos de novo. O que fazemos hoje é o que mais importa.	morning	motivation	t	2025-12-14 02:23:29.150876+00
7f89aa5e-b198-43ff-bc08-c382d9656e49	Comece o dia acreditando que tudo é possível. A fé move montanhas.	morning	faith	t	2025-12-14 02:23:29.150876+00
ec1cf1a8-c8f7-46dd-a6f5-73872c41bd9b	Respire fundo. Agradeça por mais um dia de vida. Sua saúde é uma bênção.	morning	health	t	2025-12-14 02:23:29.150876+00
af728352-e92d-4e0f-ab49-5a29ba30d54d	Que a luz desta manhã ilumine seus caminhos e aqueça seu coração.	morning	inspiration	t	2025-12-14 02:23:29.150876+00
0a9afc82-14d5-48ce-8226-3971c9b276a5	Não se preocupe com o ontem. Hoje é uma nova oportunidade de fazer dar certo.	morning	motivation	t	2025-12-14 02:23:29.150876+00
07bafebb-76f4-4a58-afcd-ba56960f2f64	Tome seu remédio com gratidão. Ele é um instrumento de cura para o seu corpo.	morning	health	t	2025-12-14 02:23:29.150876+00
6055abc0-78a6-4821-b94d-5f587bfa678d	A alegria do Senhor é a nossa força. Tenha um dia abençoado!	morning	faith	t	2025-12-14 02:23:29.150876+00
7cc2b53b-6d14-4e68-ac75-3b163d49ea8b	Sorria para o dia e ele sorrirá de volta para você.	morning	inspiration	t	2025-12-14 02:23:29.150876+00
693ed6ca-5d0c-40f2-ad29-1e0c66fbaff7	Hoje é um presente, por isso se chama Presente. Aproveite cada momento.	morning	motivation	t	2025-12-14 02:23:29.150876+00
93f37861-f2aa-46a9-b295-8d26c303e3e2	Coragem! Você é mais forte do que imagina e capaz de vencer qualquer desafio.	morning	motivation	t	2025-12-14 02:23:29.150876+00
21eb6c45-b437-4491-bfdd-24b452d05cc0	Que seu café seja forte e sua fé seja mais forte ainda.	morning	faith	t	2025-12-14 02:23:29.150876+00
2d88dd3b-c97b-4aa2-af55-cebe336606ee	Sua saúde é seu maior tesouro. Cuide dela com carinho hoje.	morning	health	t	2025-12-14 02:23:29.150876+00
4bfade03-4bcd-4ba3-90b5-bb3e42c16353	Paz na alma, amor no coração e gratidão pela vida. Bom dia!	morning	inspiration	t	2025-12-14 02:23:29.150876+00
c5801d84-6a7e-41f9-9743-5d2f45b57eed	Cada novo amanhecer é um convite de Deus para recomeçarmos.	morning	faith	t	2025-12-14 02:23:29.150876+00
468bab80-fb47-4787-af05-5a49c10d4b59	Boa tarde! Continue firme. Você já venceu metade do dia.	afternoon	motivation	t	2025-12-14 02:23:29.150876+00
4b35daca-a41d-4074-8221-14b8051232fd	Não desista. O cansaço é temporário, a satisfação de se cuidar é permanente.	afternoon	health	t	2025-12-14 02:23:29.150876+00
66e257f4-bb22-4244-b870-e02f4e95e4c7	Uma pausa para respirar é tão importante quanto seguir em frente.	afternoon	health	t	2025-12-14 02:23:29.150876+00
2926e22d-0a75-4439-b608-8dedbb785d48	Confie no tempo de Deus. Tudo acontece na hora certa.	afternoon	faith	t	2025-12-14 02:23:29.150876+00
461d3394-ef21-414b-8681-462ee5287a65	A tarde é o momento de colher os frutos da manhã e plantar novas sementes.	afternoon	inspiration	t	2025-12-14 02:23:29.150876+00
3a533dca-99b1-409f-ba7d-e11193cdae94	Mantenha o foco na sua recuperação. Cada passo conta.	afternoon	health	t	2025-12-14 02:23:29.150876+00
383ee3c2-f7ef-4d75-91ff-f9e32f0ad0f4	Que a paz de Deus envolva sua tarde e renove suas energias.	afternoon	faith	t	2025-12-14 02:23:29.150876+00
25994859-c626-466e-a0e6-b36c97faa826	Não deixe para amanhã a alegria que você pode sentir hoje.	afternoon	motivation	t	2025-12-14 02:23:29.150876+00
0ec3f6a5-a1ec-4832-9537-01aaa864f3a0	Lembre-se de beber água. Seu corpo agradece!	afternoon	health	t	2025-12-14 02:23:29.150876+00
ef2bc455-e522-4359-aafc-121805ee2528	A persistência é o caminho do êxito. Continue se cuidando.	afternoon	motivation	t	2025-12-14 02:23:29.150876+00
25b94a0e-1e86-4d22-9b83-53b32215d456	Deus está no controle de todas as coisas. Descanse seu coração.	afternoon	faith	t	2025-12-14 02:23:29.150876+00
3daa0adb-833c-44d9-be8e-5fa5ea89ff1e	Seja gentil com você mesmo. Você está fazendo o seu melhor.	afternoon	inspiration	t	2025-12-14 02:23:29.150876+00
a597e672-e4ac-4147-bbc2-0502b9960393	Pequenos progressos são grandes vitórias. Valorize cada um deles.	afternoon	motivation	t	2025-12-14 02:23:29.150876+00
35e08259-f954-4221-b4a6-0d5bc49aae1b	A tarde traz a serenidade de dever cumprido. Siga em frente.	afternoon	inspiration	t	2025-12-14 02:23:29.150876+00
8e534304-39bf-4020-9a95-753dfda325cf	Sua saúde depende das suas escolhas de agora. Escolha o bem.	afternoon	health	t	2025-12-14 02:23:29.150876+00
87fb5739-6789-4af8-9b83-8c97bdd11e1e	Boa noite! Entregue suas preocupações a Deus e descanse em paz.	night	faith	t	2025-12-14 02:23:29.150876+00
24e80745-e466-4b23-84b2-dd6beb3e613a	O descanso é parte fundamental da cura. Durma bem.	night	health	t	2025-12-14 02:23:29.150876+00
591bb177-792f-4689-8310-aa4fb9b54229	Amanhã é um novo dia. Hoje você fez o seu melhor.	night	motivation	t	2025-12-14 02:23:29.150876+00
6c6bda84-ed9d-4951-82f9-26a1a900ccb4	Que os anjos zelem pelo seu sono e tragam sonhos de esperança.	night	faith	t	2025-12-14 02:23:29.150876+00
7cbc0121-ca60-4872-8848-f706e728a24d	Desligue os pensamentos, acalme o coração. A noite foi feita para recarregar.	night	health	t	2025-12-14 02:23:29.150876+00
26604ce1-c6d3-48f5-b735-de881bba74f4	Gratidão pelo dia que passou, fé no dia que virá.	night	faith	t	2025-12-14 02:23:29.150876+00
92c19a1d-ef33-4b99-b594-27bbee73351b	Seu corpo se cura enquanto você dorme. Permita-se descansar profundamente.	night	health	t	2025-12-14 02:23:29.150876+00
bdfff399-cfca-49a9-9cda-73e763213b92	A noite é o silêncio de Deus nos preparando para um novo espetáculo.	night	inspiration	t	2025-12-14 02:23:29.150876+00
6a127580-5a8c-4e77-b5da-19ddab72b093	Tome seu remédio da noite e durma com a certeza de que está se cuidando.	night	health	t	2025-12-14 02:23:29.150876+00
8c9eda62-919b-4462-8a08-8f0d1dec7fab	Nenhum mal dura para sempre. Confie que o amanhecer trará alegria.	night	faith	t	2025-12-14 02:23:29.150876+00
25f134c9-4ca3-4137-8296-f376d56f504b	Estrelas não podem brilhar sem escuridão. Tenha fé nos momentos difíceis.	night	motivation	t	2025-12-14 02:23:29.150876+00
7a3a4b4e-eab8-4d9f-9390-0d0af5c05957	Que a paz inunde seu quarto e seu coração nesta noite.	night	faith	t	2025-12-14 02:23:29.150876+00
e168c175-31ae-41fa-8411-097ccbd4cb87	Dormir bem é o melhor remédio. Relaxe e bonos sonhos.	night	health	t	2025-12-14 02:23:29.150876+00
768d6e43-2a79-4af5-adca-8105e90b063d	Obrigado, meu Deus, por mais um dia vencido com a Tua graça.	night	faith	t	2025-12-14 02:23:29.150876+00
1142796b-215b-4792-a67a-0ab26b88f5dd	A cada noite, renovamos nossas esperanças. Até amanhã!	night	inspiration	t	2025-12-14 02:23:29.150876+00
\.


--
-- Data for Name: patient_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patient_shares (id, owner_id, patient_id, shared_with_email, permission, status, created_at, accepted_at, shared_with_id) FROM stdin;
6a482097-dd2b-4bb3-b326-c4a2d7bf138f	b36c1774-bcda-4e2e-9ccf-b20c23089c40	55184598-3ce5-4068-804d-f4d9313a35ac	jaguarconsultoriadigital@gmail.com	view	pending	2025-12-09 19:38:17.468525+00	2025-12-09 19:38:17.75+00	5338cb78-fca8-4496-953f-f5e72b30c174
83cb348f-6990-4b2c-b5c3-5ba86197efa1	b36c1774-bcda-4e2e-9ccf-b20c23089c40	55184598-3ce5-4068-804d-f4d9313a35ac	suporte@sigsis.com.br	edit	pending	2025-12-13 21:04:16.34071+00	\N	\N
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patients (id, user_id, name, birth_date, phone, condition, cep, street, number, complement, neighborhood, city, state, observations, created_at, updated_at, email, blood_type, allergies) FROM stdin;
d0d12e73-a17c-41aa-831d-9c326e4dc83c	f7d00018-fb2d-471a-acde-7405db7390dc	Paciente 1	1970-11-07	(17) 99142-6306	tem de tudo	15610-378	Rua Aicás	65		Jardim Residencial Uirapuru	Fernandópolis	SP	especial	2025-12-03 01:39:56.20705+00	2025-12-03 01:39:56.20705+00	\N	\N	\N
b0c0aa88-dc7b-47c5-8ff2-4b6626cc1fc5	f7d00018-fb2d-471a-acde-7405db7390dc	paciente 2	1939-03-15	(17) 99142-6306	tudo	15600-218	Rua Paraíba	1698		Vila Regina	Fernandópolis	SP		2025-12-03 01:53:13.658313+00	2025-12-03 01:53:13.658313+00	\N	\N	\N
3a94ee66-e3e2-4a6b-a789-2c3876758d85	b36c1774-bcda-4e2e-9ccf-b20c23089c40	paciente2	1970-12-12	(17) 99142-6306		15600-218	Rua Paraíba	1698		Vila Regina	Fernandópolis	SP		2025-12-08 19:19:14.744612+00	2025-12-08 19:34:29.043456+00	sigremedios@gmail.com	\N	\N
55184598-3ce5-4068-804d-f4d9313a35ac	b36c1774-bcda-4e2e-9ccf-b20c23089c40	Paciente 1 Silvio Adriano Borsetti Gregório	1970-11-07	(17) 99142-6306	teste	15610-378	Rua Aicás	65		Jardim Residencial Uirapuru	Fernandópolis	SP	teste	2025-12-06 13:48:08.215668+00	2025-12-15 04:10:53.691225+00	sigsis@gmail.com	A+	sem alergia
\.


--
-- Data for Name: prescriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prescriptions (id, user_id, patient_id, medication_id, start_date, end_date, frequency, times, instructions, created_at, updated_at, dose_amount, continuous_use) FROM stdin;
3d0440c5-cb4e-4502-bc92-52a42020e236	b36c1774-bcda-4e2e-9ccf-b20c23089c40	55184598-3ce5-4068-804d-f4d9313a35ac	900dacbe-5200-4d5a-9c49-a8a0e0229ae1	2025-12-09	2025-12-10	sdfsdfsdf	["08:00"]	\N	2025-12-09 19:46:03.660745+00	2025-12-14 03:56:55.386708+00	1	t
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profiles (id, email, full_name, avatar_url, created_at, updated_at) FROM stdin;
b36c1774-bcda-4e2e-9ccf-b20c23089c40	sigsis@gmail.com	Silvio Gregório	\N	2025-11-30 19:18:40.850347+00	2025-11-30 19:18:40.850347+00
f7d00018-fb2d-471a-acde-7405db7390dc	silvio@sigsis.com.br	Silvio Teste1	\N	2025-12-02 21:12:23.535768+00	2025-12-04 05:16:07.565711+00
5338cb78-fca8-4496-953f-f5e72b30c174	jaguarconsultoriadigital@gmail.com	jaguarconsultoriadigital@gmail.com	\N	2025-12-09 13:08:25.856896+00	2025-12-09 13:08:25.856896+00
\.


--
-- Data for Name: sponsors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sponsors (id, name, logo_url, website_url, active, created_at, description, whatsapp, tiktok, youtube, instagram, facebook) FROM stdin;
f78f93b2-8791-4203-bdf8-3ff7ed441eae	sigsistemas e consultoria asdfasdf asdf asdf asdf asdf asdf asdf 	https://ahjywlsnmmkavgtkvpod.supabase.co/storage/v1/object/public/sponsors/0.9446978724129629.png	www.sigsis.com.br	f	2025-12-06 19:22:36.494195+00	sigsisa sdfasd fasdf asd fasdfasdfsadfsad	https://wa.me/5517991426306	https://tiktok.com/silviogregorio	https://www.youtube.com/aaa	https://instagram.com/silviogregorio	https://facebook.com/silviogregorio
\.


--
-- Data for Name: stock_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_history (id, created_at, user_id, patient_id, medication_id, quantity_change, previous_balance, new_balance, reason, notes) FROM stdin;
691d0f46-b42d-4784-b044-a8afa0276230	2025-12-15 02:43:48.193404+00	b36c1774-bcda-4e2e-9ccf-b20c23089c40	55184598-3ce5-4068-804d-f4d9313a35ac	900dacbe-5200-4d5a-9c49-a8a0e0229ae1	-1.00	29.00	28.00	consumption	Dose tomada: 1
d1d42987-71e0-4735-912b-9964b40a515b	2025-12-15 02:49:56.125192+00	b36c1774-bcda-4e2e-9ccf-b20c23089c40	55184598-3ce5-4068-804d-f4d9313a35ac	900dacbe-5200-4d5a-9c49-a8a0e0229ae1	-1.00	29.00	28.00	consumption	Dose tomada: 1
7896f01b-862c-4f0d-bf5e-73ff001f08f6	2025-12-15 02:51:24.84893+00	b36c1774-bcda-4e2e-9ccf-b20c23089c40	55184598-3ce5-4068-804d-f4d9313a35ac	900dacbe-5200-4d5a-9c49-a8a0e0229ae1	-1.00	29.00	28.00	consumption	Dose tomada: 1
de903614-5c5b-49b3-868e-1478fddecb81	2025-12-15 02:54:45.873796+00	b36c1774-bcda-4e2e-9ccf-b20c23089c40	55184598-3ce5-4068-804d-f4d9313a35ac	900dacbe-5200-4d5a-9c49-a8a0e0229ae1	-1.00	29.00	28.00	consumption	Dose tomada: 1
1977391f-d576-4018-9ba7-658c59121d54	2025-12-15 03:49:41.651918+00	b36c1774-bcda-4e2e-9ccf-b20c23089c40	55184598-3ce5-4068-804d-f4d9313a35ac	900dacbe-5200-4d5a-9c49-a8a0e0229ae1	-1.00	29.00	28.00	consumption	Dose tomada: 1
\.


--
-- Data for Name: support_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_messages (id, user_id, sender_name, sender_email, subject, message, details, status, created_at) FROM stdin;
ce91cb4a-e34b-46ba-9941-4d873de59eb2	b36c1774-bcda-4e2e-9ccf-b20c23089c40	Silvio Gregório	sigsis@gmail.com	[SUPORTE] Dúvida de Silvio Gregório	sd asdfasdfasdf sadf asdf sadf	{"age": 55, "city": "Fernandópolis/SP", "phone": "(17) 99142-6306", "shares": [{"shares": ["jaguarconsultoriadigital@gmail.com - Ver", "suporte@sigsis.com.br - Editar (Pendente)"], "patientName": "Paciente 1"}]}	resolved	2025-12-13 21:19:29.977922+00
18a607b9-28ad-4bca-9369-cd5d4d9dbd17	b36c1774-bcda-4e2e-9ccf-b20c23089c40	Silvio Gregório	sigsis@gmail.com	[SUPORTE] Dúvida de Silvio Gregório	a sasdf asdf asdf asd fasdf asdf asdf asdfk fasdjfsadfasdfjkasdflasdfasdlkf asdkljfjasd flkasçjdf asdljkf asdlkjf asldjf jaslkdfjlkasdflkasd\nasdf nasdfjasdfsajdfsadf  sdfajsdf✌️😢	{"age": 55, "city": "Fernandópolis/SP", "phone": "(17) 99142-6306", "shares": [{"shares": ["jaguarconsultoriadigital@gmail.com - Ver", "suporte@sigsis.com.br - Editar (Pendente)"], "patientName": "Paciente 1"}]}	pending	2025-12-13 21:32:16.898232+00
\.


--
-- Data for Name: user_seen_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_seen_messages (id, user_id, message_id, seen_at) FROM stdin;
ff92a959-cc18-4340-843c-b634ab483c68	b36c1774-bcda-4e2e-9ccf-b20c23089c40	7a3a4b4e-eab8-4d9f-9390-0d0af5c05957	2025-12-14 03:48:00.775+00
9fd2f019-a9fe-4a48-b54a-47c8d85c9cd4	b36c1774-bcda-4e2e-9ccf-b20c23089c40	468bab80-fb47-4787-af05-5a49c10d4b59	2025-12-14 17:33:26.15+00
36f606af-b043-4f27-9041-4339a90af162	b36c1774-bcda-4e2e-9ccf-b20c23089c40	a597e672-e4ac-4147-bbc2-0502b9960393	2025-12-14 19:12:46.911+00
fb95a388-260d-43e4-b82a-cd02f5ea60d2	b36c1774-bcda-4e2e-9ccf-b20c23089c40	383ee3c2-f7ef-4d75-91ff-f9e32f0ad0f4	2025-12-14 19:12:46.912+00
f2e77aa5-db38-46f5-b661-83b02d5d3c7b	b36c1774-bcda-4e2e-9ccf-b20c23089c40	6a127580-5a8c-4e77-b5da-19ddab72b093	2025-12-14 21:12:30.829+00
21852d8a-5f92-44c5-bc54-0e25e9474b6d	b36c1774-bcda-4e2e-9ccf-b20c23089c40	7cbc0121-ca60-4872-8848-f706e728a24d	2025-12-15 02:30:53.113+00
9558e295-29d1-4490-bcd1-2bf743afca4a	b36c1774-bcda-4e2e-9ccf-b20c23089c40	8c9eda62-919b-4462-8a08-8f0d1dec7fab	2025-12-15 02:41:53.642+00
30ff1eea-3345-4d02-8636-b5789cb21f64	b36c1774-bcda-4e2e-9ccf-b20c23089c40	25f134c9-4ca3-4137-8296-f376d56f504b	2025-12-15 02:41:53.641+00
66d08fd0-f59c-46d3-b0d2-76a0f81f1e06	b36c1774-bcda-4e2e-9ccf-b20c23089c40	24e80745-e466-4b23-84b2-dd6beb3e613a	2025-12-15 03:39:19.096+00
07a4eb6b-5503-43a1-8077-d217ef052861	b36c1774-bcda-4e2e-9ccf-b20c23089c40	26604ce1-c6d3-48f5-b735-de881bba74f4	2025-12-15 03:39:19.189+00
2abbdd74-b6fd-45d7-b593-875f9945faed	b36c1774-bcda-4e2e-9ccf-b20c23089c40	e168c175-31ae-41fa-8411-097ccbd4cb87	2025-12-15 03:39:19.324+00
db88be1e-0ebd-4c06-b273-a63dac1ff536	b36c1774-bcda-4e2e-9ccf-b20c23089c40	bdfff399-cfca-49a9-9cda-73e763213b92	2025-12-15 03:39:19.097+00
8499cd75-23b4-4f43-90bf-9540ba5b6f71	b36c1774-bcda-4e2e-9ccf-b20c23089c40	768d6e43-2a79-4af5-adca-8105e90b063d	2025-12-15 04:41:58.84+00
\.


--
-- Data for Name: messages_2025_12_12; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_12_12 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_12_13; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_12_13 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_12_14; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_12_14 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_12_15; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_12_15 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_12_16; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_12_16 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_12_17; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_12_17 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_12_18; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_12_18 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-11-30 15:14:03
20211116045059	2025-11-30 15:14:08
20211116050929	2025-11-30 15:14:11
20211116051442	2025-11-30 15:14:15
20211116212300	2025-11-30 15:14:19
20211116213355	2025-11-30 15:14:22
20211116213934	2025-11-30 15:14:25
20211116214523	2025-11-30 15:14:30
20211122062447	2025-11-30 15:14:33
20211124070109	2025-11-30 15:14:37
20211202204204	2025-11-30 15:14:40
20211202204605	2025-11-30 15:14:44
20211210212804	2025-11-30 15:14:55
20211228014915	2025-11-30 15:14:58
20220107221237	2025-11-30 15:15:01
20220228202821	2025-11-30 15:15:05
20220312004840	2025-11-30 15:15:08
20220603231003	2025-11-30 15:15:14
20220603232444	2025-11-30 15:15:17
20220615214548	2025-11-30 15:15:21
20220712093339	2025-11-30 15:15:24
20220908172859	2025-11-30 15:15:28
20220916233421	2025-11-30 15:15:31
20230119133233	2025-11-30 15:15:34
20230128025114	2025-11-30 15:15:39
20230128025212	2025-11-30 15:15:42
20230227211149	2025-11-30 15:15:46
20230228184745	2025-11-30 15:15:49
20230308225145	2025-11-30 15:15:52
20230328144023	2025-11-30 15:15:56
20231018144023	2025-11-30 15:16:00
20231204144023	2025-11-30 15:16:05
20231204144024	2025-11-30 15:16:08
20231204144025	2025-11-30 15:16:12
20240108234812	2025-11-30 15:16:15
20240109165339	2025-11-30 15:16:18
20240227174441	2025-11-30 15:16:24
20240311171622	2025-11-30 15:16:29
20240321100241	2025-11-30 15:16:36
20240401105812	2025-11-30 15:16:45
20240418121054	2025-11-30 15:16:50
20240523004032	2025-11-30 15:17:02
20240618124746	2025-11-30 15:17:05
20240801235015	2025-11-30 15:17:08
20240805133720	2025-11-30 15:17:12
20240827160934	2025-11-30 15:17:15
20240919163303	2025-11-30 15:17:20
20240919163305	2025-11-30 15:17:23
20241019105805	2025-11-30 15:17:26
20241030150047	2025-11-30 15:17:39
20241108114728	2025-11-30 15:17:43
20241121104152	2025-11-30 15:17:47
20241130184212	2025-11-30 15:17:51
20241220035512	2025-11-30 15:17:54
20241220123912	2025-11-30 15:17:58
20241224161212	2025-11-30 15:18:01
20250107150512	2025-11-30 15:18:04
20250110162412	2025-11-30 15:18:08
20250123174212	2025-11-30 15:18:11
20250128220012	2025-11-30 15:18:14
20250506224012	2025-11-30 15:18:17
20250523164012	2025-11-30 15:18:20
20250714121412	2025-11-30 15:18:24
20250905041441	2025-11-30 15:18:27
20251103001201	2025-11-30 15:18:30
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
avatars	avatars	\N	2025-11-30 16:50:45.880655+00	2025-11-30 16:50:45.880655+00	t	f	\N	\N	\N	STANDARD
sponsors	sponsors	\N	2025-12-06 17:21:14.469623+00	2025-12-06 17:21:14.469623+00	t	f	\N	\N	\N	STANDARD
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-11-30 15:13:58.279248
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-11-30 15:13:58.288074
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2025-11-30 15:13:58.295998
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-11-30 15:13:58.319406
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-11-30 15:13:58.381857
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-11-30 15:13:58.389018
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2025-11-30 15:13:58.396686
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-11-30 15:13:58.403142
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-11-30 15:13:58.426185
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2025-11-30 15:13:58.46451
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2025-11-30 15:13:58.551283
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-11-30 15:13:58.658219
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-11-30 15:13:58.668012
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-11-30 15:13:58.674756
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-11-30 15:13:58.681037
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-11-30 15:13:58.728217
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-11-30 15:13:58.734924
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-11-30 15:13:58.742983
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-11-30 15:13:58.750506
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-11-30 15:13:58.759254
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-11-30 15:13:58.76913
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-11-30 15:13:58.778102
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-11-30 15:13:58.795309
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-11-30 15:13:58.808716
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-11-30 15:13:58.816544
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-11-30 15:13:58.822845
26	objects-prefixes	ef3f7871121cdc47a65308e6702519e853422ae2	2025-11-30 15:13:58.829399
27	search-v2	33b8f2a7ae53105f028e13e9fcda9dc4f356b4a2	2025-11-30 15:13:58.844151
28	object-bucket-name-sorting	ba85ec41b62c6a30a3f136788227ee47f311c436	2025-11-30 15:13:59.018584
29	create-prefixes	a7b1a22c0dc3ab630e3055bfec7ce7d2045c5b7b	2025-11-30 15:13:59.027535
30	update-object-levels	6c6f6cc9430d570f26284a24cf7b210599032db7	2025-11-30 15:13:59.035178
31	objects-level-index	33f1fef7ec7fea08bb892222f4f0f5d79bab5eb8	2025-11-30 15:13:59.798559
32	backward-compatible-index-on-objects	2d51eeb437a96868b36fcdfb1ddefdf13bef1647	2025-11-30 15:13:59.808168
33	backward-compatible-index-on-prefixes	fe473390e1b8c407434c0e470655945b110507bf	2025-11-30 15:13:59.817264
34	optimize-search-function-v1	82b0e469a00e8ebce495e29bfa70a0797f7ebd2c	2025-11-30 15:13:59.81991
35	add-insert-trigger-prefixes	63bb9fd05deb3dc5e9fa66c83e82b152f0caf589	2025-11-30 15:13:59.829038
36	optimise-existing-functions	81cf92eb0c36612865a18016a38496c530443899	2025-11-30 15:13:59.835551
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2025-11-30 15:13:59.846016
38	iceberg-catalog-flag-on-buckets	19a8bd89d5dfa69af7f222a46c726b7c41e462c5	2025-11-30 15:13:59.853063
39	add-search-v2-sort-support	39cf7d1e6bf515f4b02e41237aba845a7b492853	2025-11-30 15:13:59.867066
40	fix-prefix-race-conditions-optimized	fd02297e1c67df25a9fc110bf8c8a9af7fb06d1f	2025-11-30 15:13:59.874171
41	add-object-level-update-trigger	44c22478bf01744b2129efc480cd2edc9a7d60e9	2025-11-30 15:13:59.885349
42	rollback-prefix-triggers	f2ab4f526ab7f979541082992593938c05ee4b47	2025-11-30 15:13:59.892664
43	fix-object-level	ab837ad8f1c7d00cc0b7310e989a23388ff29fc6	2025-11-30 15:13:59.903305
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2025-11-30 15:13:59.911645
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2025-11-30 15:13:59.919274
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2025-11-30 15:13:59.933368
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2025-11-30 15:13:59.941185
48	iceberg-catalog-ids	2666dff93346e5d04e0a878416be1d5fec345d6f	2025-11-30 15:13:59.947994
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata, level) FROM stdin;
82903af2-5fbb-4ccd-bd73-6ca662e9c019	sponsors	0.5502431306244575.png	b36c1774-bcda-4e2e-9ccf-b20c23089c40	2025-12-06 17:22:07.723255+00	2025-12-06 17:22:07.723255+00	2025-12-06 17:22:07.723255+00	{"eTag": "\\"f3c42bc2013a704f9837831e1ba6837b\\"", "size": 1814952, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-12-06T17:22:08.000Z", "contentLength": 1814952, "httpStatusCode": 200}	d6e7c518-5e78-48ab-acff-fe72ad1ae1c2	b36c1774-bcda-4e2e-9ccf-b20c23089c40	{}	1
6d9bcdb7-3e93-42fb-abe9-6f981eaaed46	sponsors	0.2050567064247213.jpg	b36c1774-bcda-4e2e-9ccf-b20c23089c40	2025-12-06 18:50:41.644308+00	2025-12-06 18:50:41.644308+00	2025-12-06 18:50:41.644308+00	{"eTag": "\\"95b543f556266b4bfd75089d5b587aab\\"", "size": 6584, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-12-06T18:50:42.000Z", "contentLength": 6584, "httpStatusCode": 200}	a07e3bc8-e3a4-4659-9cdf-32b00907323d	b36c1774-bcda-4e2e-9ccf-b20c23089c40	{}	1
78a3eeaf-0621-4978-9fe2-afbe6b79d9c4	sponsors	0.02767023380548883.webp	b36c1774-bcda-4e2e-9ccf-b20c23089c40	2025-12-06 19:03:17.245393+00	2025-12-06 19:03:17.245393+00	2025-12-06 19:03:17.245393+00	{"eTag": "\\"7584079a77dd95e83b00e4bfbf887830\\"", "size": 261228, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2025-12-06T19:03:18.000Z", "contentLength": 261228, "httpStatusCode": 200}	7e273954-befc-4e3e-b394-b15814c01ba7	b36c1774-bcda-4e2e-9ccf-b20c23089c40	{}	1
3529166d-fb78-4b90-9602-03012940118c	sponsors	0.5331011689608338.jpg	b36c1774-bcda-4e2e-9ccf-b20c23089c40	2025-12-06 19:10:03.557295+00	2025-12-06 19:10:03.557295+00	2025-12-06 19:10:03.557295+00	{"eTag": "\\"95b543f556266b4bfd75089d5b587aab\\"", "size": 6584, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-12-06T19:10:04.000Z", "contentLength": 6584, "httpStatusCode": 200}	e727579e-3205-4264-857b-fc727b56ee2d	b36c1774-bcda-4e2e-9ccf-b20c23089c40	{}	1
9209cf98-525a-41cb-971c-ef03ed52cc36	sponsors	0.6717871597908088.jpg	b36c1774-bcda-4e2e-9ccf-b20c23089c40	2025-12-06 19:21:07.015182+00	2025-12-06 19:21:07.015182+00	2025-12-06 19:21:07.015182+00	{"eTag": "\\"7deea6f1df737811d5b122db450e7303\\"", "size": 41466, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-12-06T19:21:07.000Z", "contentLength": 41466, "httpStatusCode": 200}	65a7ad4e-d604-47a1-87c4-b3ebf4a8f568	b36c1774-bcda-4e2e-9ccf-b20c23089c40	{}	1
f1b1dd85-704e-4a0b-8658-0e8585d9ec31	sponsors	0.26313333254036364.jpg	b36c1774-bcda-4e2e-9ccf-b20c23089c40	2025-12-06 19:22:36.388783+00	2025-12-06 19:22:36.388783+00	2025-12-06 19:22:36.388783+00	{"eTag": "\\"7deea6f1df737811d5b122db450e7303\\"", "size": 41466, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2025-12-06T19:22:37.000Z", "contentLength": 41466, "httpStatusCode": 200}	462db28b-d459-4cc5-b218-22c30823ae45	b36c1774-bcda-4e2e-9ccf-b20c23089c40	{}	1
4772af3e-8cbc-4050-8f07-a1d8175cd265	sponsors	0.9446978724129629.png	b36c1774-bcda-4e2e-9ccf-b20c23089c40	2025-12-06 19:54:02.446998+00	2025-12-06 19:54:02.446998+00	2025-12-06 19:54:02.446998+00	{"eTag": "\\"c9a9b8f66b330e5132b86eafb37bdec5\\"", "size": 1976310, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2025-12-06T19:54:03.000Z", "contentLength": 1976310, "httpStatusCode": 200}	6dacf6ed-093c-430b-82ab-c815a6679e7f	b36c1774-bcda-4e2e-9ccf-b20c23089c40	{}	1
\.


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.prefixes (bucket_id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 471, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 9327, true);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: account_shares account_shares_owner_id_shared_with_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_shares
    ADD CONSTRAINT account_shares_owner_id_shared_with_email_key UNIQUE (owner_id, shared_with_email);


--
-- Name: account_shares account_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_shares
    ADD CONSTRAINT account_shares_pkey PRIMARY KEY (id);


--
-- Name: alert_logs alert_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_logs
    ADD CONSTRAINT alert_logs_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: consumption_log consumption_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumption_log
    ADD CONSTRAINT consumption_log_pkey PRIMARY KEY (id);


--
-- Name: consumption_log consumption_log_prescription_id_date_scheduled_time_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumption_log
    ADD CONSTRAINT consumption_log_prescription_id_date_scheduled_time_key UNIQUE (prescription_id, date, scheduled_time);


--
-- Name: health_logs health_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.health_logs
    ADD CONSTRAINT health_logs_pkey PRIMARY KEY (id);


--
-- Name: medication_library medication_library_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medication_library
    ADD CONSTRAINT medication_library_pkey PRIMARY KEY (id);


--
-- Name: medications medications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medications
    ADD CONSTRAINT medications_pkey PRIMARY KEY (id);


--
-- Name: motivation_messages motivation_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.motivation_messages
    ADD CONSTRAINT motivation_messages_pkey PRIMARY KEY (id);


--
-- Name: patient_shares patient_shares_patient_id_shared_with_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_shares
    ADD CONSTRAINT patient_shares_patient_id_shared_with_email_key UNIQUE (patient_id, shared_with_email);


--
-- Name: patient_shares patient_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_shares
    ADD CONSTRAINT patient_shares_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: sponsors sponsors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sponsors
    ADD CONSTRAINT sponsors_pkey PRIMARY KEY (id);


--
-- Name: stock_history stock_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_history
    ADD CONSTRAINT stock_history_pkey PRIMARY KEY (id);


--
-- Name: support_messages support_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_pkey PRIMARY KEY (id);


--
-- Name: motivation_messages unique_text_content; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.motivation_messages
    ADD CONSTRAINT unique_text_content UNIQUE (text);


--
-- Name: user_seen_messages user_seen_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_seen_messages
    ADD CONSTRAINT user_seen_messages_pkey PRIMARY KEY (id);


--
-- Name: user_seen_messages user_seen_messages_user_id_message_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_seen_messages
    ADD CONSTRAINT user_seen_messages_user_id_message_id_key UNIQUE (user_id, message_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_12_12 messages_2025_12_12_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_12_12
    ADD CONSTRAINT messages_2025_12_12_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_12_13 messages_2025_12_13_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_12_13
    ADD CONSTRAINT messages_2025_12_13_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_12_14 messages_2025_12_14_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_12_14
    ADD CONSTRAINT messages_2025_12_14_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_12_15 messages_2025_12_15_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_12_15
    ADD CONSTRAINT messages_2025_12_15_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_12_16 messages_2025_12_16_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_12_16
    ADD CONSTRAINT messages_2025_12_16_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_12_17 messages_2025_12_17_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_12_17
    ADD CONSTRAINT messages_2025_12_17_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_12_18 messages_2025_12_18_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_12_18
    ADD CONSTRAINT messages_2025_12_18_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: alert_logs_lookup_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX alert_logs_lookup_idx ON public.alert_logs USING btree (prescription_id, alert_date, alert_time);


--
-- Name: health_logs_measured_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX health_logs_measured_at_idx ON public.health_logs USING btree (measured_at);


--
-- Name: health_logs_patient_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX health_logs_patient_id_idx ON public.health_logs USING btree (patient_id);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_risk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_risk ON public.audit_logs USING btree (risk_level) WHERE (risk_level = ANY (ARRAY['high'::text, 'critical'::text]));


--
-- Name: idx_audit_logs_suspicious; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_suspicious ON public.audit_logs USING btree (is_suspicious) WHERE (is_suspicious = true);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_consumption_log_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consumption_log_date ON public.consumption_log USING btree (date);


--
-- Name: idx_consumption_log_prescription_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consumption_log_prescription_id ON public.consumption_log USING btree (prescription_id);


--
-- Name: idx_consumption_log_taken_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consumption_log_taken_by ON public.consumption_log USING btree (taken_by);


--
-- Name: idx_medications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_medications_user_id ON public.medications USING btree (user_id);


--
-- Name: idx_patients_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_user_id ON public.patients USING btree (user_id);


--
-- Name: idx_prescriptions_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prescriptions_patient_id ON public.prescriptions USING btree (patient_id);


--
-- Name: idx_prescriptions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prescriptions_user_id ON public.prescriptions USING btree (user_id);


--
-- Name: medication_search_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX medication_search_idx ON public.medication_library USING gin (search_vector);


--
-- Name: stock_history_medication_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stock_history_medication_id_idx ON public.stock_history USING btree (medication_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2025_12_12_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_12_12_inserted_at_topic_idx ON realtime.messages_2025_12_12 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2025_12_13_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_12_13_inserted_at_topic_idx ON realtime.messages_2025_12_13 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2025_12_14_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_12_14_inserted_at_topic_idx ON realtime.messages_2025_12_14 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2025_12_15_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_12_15_inserted_at_topic_idx ON realtime.messages_2025_12_15 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2025_12_16_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_12_16_inserted_at_topic_idx ON realtime.messages_2025_12_16 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2025_12_17_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_12_17_inserted_at_topic_idx ON realtime.messages_2025_12_17 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2025_12_18_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_12_18_inserted_at_topic_idx ON realtime.messages_2025_12_18 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_name_bucket_level_unique; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);


--
-- Name: idx_prefixes_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: objects_bucket_id_level_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: messages_2025_12_12_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_12_inserted_at_topic_idx;


--
-- Name: messages_2025_12_12_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_12_pkey;


--
-- Name: messages_2025_12_13_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_13_inserted_at_topic_idx;


--
-- Name: messages_2025_12_13_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_13_pkey;


--
-- Name: messages_2025_12_14_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_14_inserted_at_topic_idx;


--
-- Name: messages_2025_12_14_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_14_pkey;


--
-- Name: messages_2025_12_15_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_15_inserted_at_topic_idx;


--
-- Name: messages_2025_12_15_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_15_pkey;


--
-- Name: messages_2025_12_16_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_16_inserted_at_topic_idx;


--
-- Name: messages_2025_12_16_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_16_pkey;


--
-- Name: messages_2025_12_17_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_17_inserted_at_topic_idx;


--
-- Name: messages_2025_12_17_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_17_pkey;


--
-- Name: messages_2025_12_18_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_18_inserted_at_topic_idx;


--
-- Name: messages_2025_12_18_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_18_pkey;


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: patient_shares ensure_lowercase_email; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER ensure_lowercase_email BEFORE INSERT OR UPDATE ON public.patient_shares FOR EACH ROW EXECUTE FUNCTION public.lowercase_share_email();


--
-- Name: medications update_medications_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON public.medications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patients update_patients_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: prescriptions update_prescriptions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: objects objects_delete_delete_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects objects_insert_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();


--
-- Name: objects objects_update_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();


--
-- Name: prefixes prefixes_create_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();


--
-- Name: prefixes prefixes_delete_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: alert_logs alert_logs_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_logs
    ADD CONSTRAINT alert_logs_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: alert_logs alert_logs_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_logs
    ADD CONSTRAINT alert_logs_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: consumption_log consumption_log_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumption_log
    ADD CONSTRAINT consumption_log_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id) ON DELETE CASCADE;


--
-- Name: consumption_log consumption_log_taken_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumption_log
    ADD CONSTRAINT consumption_log_taken_by_fkey FOREIGN KEY (taken_by) REFERENCES public.profiles(id);


--
-- Name: health_logs health_logs_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.health_logs
    ADD CONSTRAINT health_logs_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: health_logs health_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.health_logs
    ADD CONSTRAINT health_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: medications medications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medications
    ADD CONSTRAINT medications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: patient_shares patient_shares_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_shares
    ADD CONSTRAINT patient_shares_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: patient_shares patient_shares_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_shares
    ADD CONSTRAINT patient_shares_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patient_shares patient_shares_shared_with_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_shares
    ADD CONSTRAINT patient_shares_shared_with_id_fkey FOREIGN KEY (shared_with_id) REFERENCES auth.users(id);


--
-- Name: patients patients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_medication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.medications(id) ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: stock_history stock_history_medication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_history
    ADD CONSTRAINT stock_history_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.medications(id) ON DELETE CASCADE;


--
-- Name: stock_history stock_history_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_history
    ADD CONSTRAINT stock_history_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;


--
-- Name: stock_history stock_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_history
    ADD CONSTRAINT stock_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: support_messages support_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: user_seen_messages user_seen_messages_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_seen_messages
    ADD CONSTRAINT user_seen_messages_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.motivation_messages(id) ON DELETE CASCADE;


--
-- Name: user_seen_messages user_seen_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_seen_messages
    ADD CONSTRAINT user_seen_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: prefixes prefixes_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: sponsors Admin can do everything; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin can do everything" ON public.sponsors USING (((auth.jwt() ->> 'email'::text) = 'sigsis@gmail.com'::text)) WITH CHECK (((auth.jwt() ->> 'email'::text) = 'sigsis@gmail.com'::text));


--
-- Name: support_messages Admins update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins update" ON public.support_messages FOR UPDATE USING (((auth.jwt() ->> 'email'::text) = ANY (ARRAY['sigsis@gmail.com'::text, 'sigremedios@gmail.com'::text, 'silviogregorio@gmail.com'::text])));


--
-- Name: support_messages Admins view all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins view all" ON public.support_messages FOR SELECT USING (((auth.jwt() ->> 'email'::text) = ANY (ARRAY['sigsis@gmail.com'::text, 'sigremedios@gmail.com'::text, 'silviogregorio@gmail.com'::text])));


--
-- Name: motivation_messages Anyone can read active messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can read active messages" ON public.motivation_messages FOR SELECT USING ((is_active = true));


--
-- Name: patient_shares Convidado aceita convites; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Convidado aceita convites" ON public.patient_shares FOR UPDATE USING ((lower(shared_with_email) = lower((auth.jwt() ->> 'email'::text))));


--
-- Name: patient_shares Convidado vê seus convites; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Convidado vê seus convites" ON public.patient_shares FOR SELECT USING ((lower(shared_with_email) = lower((auth.jwt() ->> 'email'::text))));


--
-- Name: patient_shares Dono gerencia convites; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Dono gerencia convites" ON public.patient_shares USING ((auth.uid() = owner_id));


--
-- Name: patients Dono ve seus pacientes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Dono ve seus pacientes" ON public.patients USING ((user_id = auth.uid()));


--
-- Name: account_shares Guest View; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Guest View" ON public.account_shares FOR SELECT USING ((lower(shared_with_email) = lower((auth.jwt() ->> 'email'::text))));


--
-- Name: account_shares Owner Manage; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owner Manage" ON public.account_shares USING ((auth.uid() = owner_id));


--
-- Name: patient_shares Owner access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owner access" ON public.patient_shares USING ((owner_id = auth.uid()));


--
-- Name: medication_library Public Read Access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public Read Access" ON public.medication_library FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: sponsors Public can view all sponsors; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can view all sponsors" ON public.sponsors FOR SELECT USING (true);


--
-- Name: patients Safe Patient Access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Safe Patient Access" ON public.patients FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.patient_shares
  WHERE ((patient_shares.patient_id = patients.id) AND ((patient_shares.shared_with_id = auth.uid()) OR (lower(patient_shares.shared_with_email) = lower((auth.jwt() ->> 'email'::text)))) AND (patient_shares.accepted_at IS NOT NULL))))));


--
-- Name: patient_shares Safe Share Access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Safe Share Access" ON public.patient_shares TO authenticated USING (((auth.uid() = owner_id) OR (auth.uid() = shared_with_id) OR (lower(shared_with_email) = lower((auth.jwt() ->> 'email'::text)))));


--
-- Name: consumption_log Shared editor modifies log; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Shared editor modifies log" ON public.consumption_log USING ((EXISTS ( SELECT 1
   FROM (public.prescriptions
     JOIN public.patient_shares ON ((patient_shares.patient_id = prescriptions.patient_id)))
  WHERE ((prescriptions.id = consumption_log.prescription_id) AND ((patient_shares.shared_with_id = auth.uid()) OR (lower(patient_shares.shared_with_email) = lower((auth.jwt() ->> 'email'::text)))) AND (patient_shares.permission = 'edit'::text) AND (patient_shares.accepted_at IS NOT NULL)))));


--
-- Name: medications Shared editor modifies medications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Shared editor modifies medications" ON public.medications USING ((EXISTS ( SELECT 1
   FROM public.patient_shares
  WHERE ((patient_shares.owner_id = medications.user_id) AND ((patient_shares.shared_with_id = auth.uid()) OR (lower(patient_shares.shared_with_email) = lower((auth.jwt() ->> 'email'::text)))) AND (patient_shares.permission = 'edit'::text) AND (patient_shares.accepted_at IS NOT NULL)))));


--
-- Name: prescriptions Shared editor modifies prescriptions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Shared editor modifies prescriptions" ON public.prescriptions USING ((EXISTS ( SELECT 1
   FROM public.patient_shares
  WHERE ((patient_shares.patient_id = prescriptions.patient_id) AND ((patient_shares.shared_with_id = auth.uid()) OR (lower(patient_shares.shared_with_email) = lower((auth.jwt() ->> 'email'::text)))) AND (patient_shares.permission = 'edit'::text) AND (patient_shares.accepted_at IS NOT NULL)))));


--
-- Name: consumption_log Shared user views log; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Shared user views log" ON public.consumption_log FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.prescriptions
     JOIN public.patient_shares ON ((patient_shares.patient_id = prescriptions.patient_id)))
  WHERE ((prescriptions.id = consumption_log.prescription_id) AND ((patient_shares.shared_with_id = auth.uid()) OR (lower(patient_shares.shared_with_email) = lower((auth.jwt() ->> 'email'::text)))) AND (patient_shares.accepted_at IS NOT NULL)))));


--
-- Name: medications Shared user views medications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Shared user views medications" ON public.medications FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.patient_shares
  WHERE ((patient_shares.owner_id = medications.user_id) AND ((patient_shares.shared_with_id = auth.uid()) OR (lower(patient_shares.shared_with_email) = lower((auth.jwt() ->> 'email'::text)))) AND (patient_shares.accepted_at IS NOT NULL)))));


--
-- Name: prescriptions Shared user views prescriptions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Shared user views prescriptions" ON public.prescriptions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.patient_shares
  WHERE ((patient_shares.patient_id = prescriptions.patient_id) AND ((patient_shares.shared_with_id = auth.uid()) OR (lower(patient_shares.shared_with_email) = lower((auth.jwt() ->> 'email'::text)))) AND (patient_shares.accepted_at IS NOT NULL)))));


--
-- Name: consumption_log Strict Privacy Policy - Logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Strict Privacy Policy - Logs" ON public.consumption_log USING ((EXISTS ( SELECT 1
   FROM public.prescriptions
  WHERE ((prescriptions.id = consumption_log.prescription_id) AND public.check_access(prescriptions.user_id)))));


--
-- Name: medications Strict Privacy Policy - Medications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Strict Privacy Policy - Medications" ON public.medications USING (public.check_access(user_id));


--
-- Name: patients Strict Privacy Policy - Patients; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Strict Privacy Policy - Patients" ON public.patients USING (public.check_access(user_id));


--
-- Name: prescriptions Strict Privacy Policy - Prescriptions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Strict Privacy Policy - Prescriptions" ON public.prescriptions USING (public.check_access(user_id));


--
-- Name: health_logs Users can delete health logs (Owner & Shared); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete health logs (Owner & Shared)" ON public.health_logs FOR DELETE USING (public.has_patient_access(patient_id));


--
-- Name: consumption_log Users can delete own consumption logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete own consumption logs" ON public.consumption_log FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.prescriptions
  WHERE ((prescriptions.id = consumption_log.prescription_id) AND (prescriptions.user_id = auth.uid())))));


--
-- Name: medications Users can delete own medications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete own medications" ON public.medications FOR DELETE USING ((user_id = auth.uid()));


--
-- Name: patients Users can delete own patients; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete own patients" ON public.patients FOR DELETE USING ((user_id = auth.uid()));


--
-- Name: prescriptions Users can delete own prescriptions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete own prescriptions" ON public.prescriptions FOR DELETE USING ((user_id = auth.uid()));


--
-- Name: health_logs Users can insert health logs (Owner & Shared); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert health logs (Owner & Shared)" ON public.health_logs FOR INSERT WITH CHECK (((auth.uid() = user_id) AND public.has_patient_access(patient_id)));


--
-- Name: consumption_log Users can insert own consumption logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own consumption logs" ON public.consumption_log FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.prescriptions
  WHERE ((prescriptions.id = consumption_log.prescription_id) AND (prescriptions.user_id = auth.uid())))));


--
-- Name: medications Users can insert own medications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own medications" ON public.medications FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: patients Users can insert own patients; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own patients" ON public.patients FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: prescriptions Users can insert own prescriptions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own prescriptions" ON public.prescriptions FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: stock_history Users can insert stock history (Owner & Shared); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert stock history (Owner & Shared)" ON public.stock_history FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (((patient_id IS NOT NULL) AND public.has_patient_access(patient_id)) OR ((patient_id IS NULL) AND (EXISTS ( SELECT 1
   FROM public.prescriptions p
  WHERE ((p.medication_id = stock_history.medication_id) AND public.has_patient_access(p.patient_id))))))));


--
-- Name: user_seen_messages Users can insert their own seen logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own seen logs" ON public.user_seen_messages FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: account_shares Users can manage their own shares; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage their own shares" ON public.account_shares TO authenticated USING ((auth.uid() = owner_id)) WITH CHECK ((auth.uid() = owner_id));


--
-- Name: user_seen_messages Users can select their own seen logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can select their own seen logs" ON public.user_seen_messages FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: health_logs Users can update health logs (Owner & Shared); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update health logs (Owner & Shared)" ON public.health_logs FOR UPDATE USING (public.has_patient_access(patient_id));


--
-- Name: consumption_log Users can update own consumption logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own consumption logs" ON public.consumption_log FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.prescriptions
  WHERE ((prescriptions.id = consumption_log.prescription_id) AND (prescriptions.user_id = auth.uid())))));


--
-- Name: medications Users can update own medications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own medications" ON public.medications FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: patients Users can update own patients; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own patients" ON public.patients FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: prescriptions Users can update own prescriptions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own prescriptions" ON public.prescriptions FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: alert_logs Users can view alerts for their patients; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view alerts for their patients" ON public.alert_logs FOR SELECT USING (public.has_patient_access(patient_id));


--
-- Name: health_logs Users can view health logs (Owner & Shared); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view health logs (Owner & Shared)" ON public.health_logs FOR SELECT USING (public.has_patient_access(patient_id));


--
-- Name: audit_logs Users can view own audit logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: consumption_log Users can view own consumption logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own consumption logs" ON public.consumption_log FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.prescriptions
  WHERE ((prescriptions.id = consumption_log.prescription_id) AND (prescriptions.user_id = auth.uid())))));


--
-- Name: medications Users can view own medications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own medications" ON public.medications FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: patients Users can view own patients; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own patients" ON public.patients FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: prescriptions Users can view own prescriptions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own prescriptions" ON public.prescriptions FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: stock_history Users can view stock history (Owner & Shared); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view stock history (Owner & Shared)" ON public.stock_history FOR SELECT USING ((((patient_id IS NOT NULL) AND public.has_patient_access(patient_id)) OR ((patient_id IS NULL) AND (EXISTS ( SELECT 1
   FROM public.prescriptions p
  WHERE ((p.medication_id = stock_history.medication_id) AND public.has_patient_access(p.patient_id)))))));


--
-- Name: support_messages Users insert own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users insert own" ON public.support_messages FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: consumption_log Ver Histórico (Dono e Família); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Ver Histórico (Dono e Família)" ON public.consumption_log FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.prescriptions
  WHERE ((prescriptions.id = consumption_log.prescription_id) AND public.has_patient_access(prescriptions.patient_id)))));


--
-- Name: medications Ver Medicamentos (Dono e Família); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Ver Medicamentos (Dono e Família)" ON public.medications FOR SELECT USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.patient_shares
  WHERE ((patient_shares.owner_id = medications.user_id) AND (lower(patient_shares.shared_with_email) = lower((auth.jwt() ->> 'email'::text))) AND (patient_shares.status = 'accepted'::text))))));


--
-- Name: patients Ver Pacientes (Dono e Família); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Ver Pacientes (Dono e Família)" ON public.patients FOR SELECT USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.patient_shares
  WHERE ((patient_shares.patient_id = patients.id) AND (lower(patient_shares.shared_with_email) = lower((auth.jwt() ->> 'email'::text))) AND (patient_shares.status = 'accepted'::text))))));


--
-- Name: prescriptions Ver Receitas (Dono e Família); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Ver Receitas (Dono e Família)" ON public.prescriptions FOR SELECT USING (public.has_patient_access(patient_id));


--
-- Name: patient_shares Ver meus compartilhamentos (Recebidos); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Ver meus compartilhamentos (Recebidos)" ON public.patient_shares FOR SELECT USING ((shared_with_email = (auth.jwt() ->> 'email'::text)));


--
-- Name: account_shares; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.account_shares ENABLE ROW LEVEL SECURITY;

--
-- Name: alert_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: consumption_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.consumption_log ENABLE ROW LEVEL SECURITY;

--
-- Name: health_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: medication_library; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.medication_library ENABLE ROW LEVEL SECURITY;

--
-- Name: medications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

--
-- Name: motivation_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.motivation_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_shares; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.patient_shares ENABLE ROW LEVEL SECURITY;

--
-- Name: patients; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

--
-- Name: prescriptions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: sponsors; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_history; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;

--
-- Name: support_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: user_seen_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_seen_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Admin can delete sponsor logos; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Admin can delete sponsor logos" ON storage.objects FOR DELETE USING (((bucket_id = 'sponsors'::text) AND ((auth.jwt() ->> 'email'::text) = 'sigsis@gmail.com'::text)));


--
-- Name: objects Admin can update sponsor logos; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Admin can update sponsor logos" ON storage.objects FOR UPDATE USING (((bucket_id = 'sponsors'::text) AND ((auth.jwt() ->> 'email'::text) = 'sigsis@gmail.com'::text)));


--
-- Name: objects Admin can upload sponsor logos; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Admin can upload sponsor logos" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'sponsors'::text) AND ((auth.jwt() ->> 'email'::text) = 'sigsis@gmail.com'::text)));


--
-- Name: objects Avatars are publicly accessible; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Avatars are publicly accessible" ON storage.objects FOR SELECT USING ((bucket_id = 'avatars'::text));


--
-- Name: objects Public can view sponsor logos; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Public can view sponsor logos" ON storage.objects FOR SELECT USING ((bucket_id = 'sponsors'::text));


--
-- Name: objects Users can upload own avatar; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: prefixes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.prefixes ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: supabase_admin
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime_messages_publication OWNER TO supabase_admin;

--
-- Name: supabase_realtime consumption_log; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.consumption_log;


--
-- Name: supabase_realtime medications; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.medications;


--
-- Name: supabase_realtime patient_shares; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.patient_shares;


--
-- Name: supabase_realtime patients; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.patients;


--
-- Name: supabase_realtime prescriptions; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.prescriptions;


--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: supabase_admin
--

ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;


--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION pg_reload_conf(); Type: ACL; Schema: pg_catalog; Owner: supabase_admin
--

GRANT ALL ON FUNCTION pg_catalog.pg_reload_conf() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- Name: FUNCTION check_access(resource_owner_id uuid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.check_access(resource_owner_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.check_access(resource_owner_id uuid) TO anon;
GRANT ALL ON FUNCTION public.check_access(resource_owner_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.check_access(resource_owner_id uuid) TO service_role;


--
-- Name: TABLE motivation_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.motivation_messages TO anon;
GRANT ALL ON TABLE public.motivation_messages TO authenticated;
GRANT ALL ON TABLE public.motivation_messages TO service_role;


--
-- Name: FUNCTION get_daily_motivation(p_period text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_daily_motivation(p_period text) TO anon;
GRANT ALL ON FUNCTION public.get_daily_motivation(p_period text) TO authenticated;
GRANT ALL ON FUNCTION public.get_daily_motivation(p_period text) TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION has_full_access(resource_owner_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.has_full_access(resource_owner_id uuid) TO anon;
GRANT ALL ON FUNCTION public.has_full_access(resource_owner_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.has_full_access(resource_owner_id uuid) TO service_role;


--
-- Name: FUNCTION has_patient_access(target_patient_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.has_patient_access(target_patient_id uuid) TO anon;
GRANT ALL ON FUNCTION public.has_patient_access(target_patient_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.has_patient_access(target_patient_id uuid) TO service_role;


--
-- Name: FUNCTION lowercase_share_email(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.lowercase_share_email() TO anon;
GRANT ALL ON FUNCTION public.lowercase_share_email() TO authenticated;
GRANT ALL ON FUNCTION public.lowercase_share_email() TO service_role;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE account_shares; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.account_shares TO authenticated;
GRANT ALL ON TABLE public.account_shares TO service_role;
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.account_shares TO anon;


--
-- Name: TABLE alert_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.alert_logs TO anon;
GRANT ALL ON TABLE public.alert_logs TO authenticated;
GRANT ALL ON TABLE public.alert_logs TO service_role;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.audit_logs TO anon;
GRANT ALL ON TABLE public.audit_logs TO authenticated;
GRANT ALL ON TABLE public.audit_logs TO service_role;


--
-- Name: TABLE consumption_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.consumption_log TO authenticated;
GRANT ALL ON TABLE public.consumption_log TO service_role;
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.consumption_log TO anon;


--
-- Name: TABLE health_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.health_logs TO anon;
GRANT ALL ON TABLE public.health_logs TO authenticated;
GRANT ALL ON TABLE public.health_logs TO service_role;


--
-- Name: TABLE medication_library; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.medication_library TO anon;
GRANT ALL ON TABLE public.medication_library TO authenticated;
GRANT ALL ON TABLE public.medication_library TO service_role;


--
-- Name: TABLE medications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.medications TO authenticated;
GRANT ALL ON TABLE public.medications TO service_role;
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.medications TO anon;


--
-- Name: TABLE patient_shares; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.patient_shares TO anon;
GRANT ALL ON TABLE public.patient_shares TO authenticated;
GRANT ALL ON TABLE public.patient_shares TO service_role;


--
-- Name: TABLE patients; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.patients TO authenticated;
GRANT ALL ON TABLE public.patients TO service_role;
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.patients TO anon;


--
-- Name: TABLE prescriptions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.prescriptions TO authenticated;
GRANT ALL ON TABLE public.prescriptions TO service_role;
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.prescriptions TO anon;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE sponsors; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sponsors TO anon;
GRANT ALL ON TABLE public.sponsors TO authenticated;
GRANT ALL ON TABLE public.sponsors TO service_role;


--
-- Name: TABLE stock_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.stock_history TO anon;
GRANT ALL ON TABLE public.stock_history TO authenticated;
GRANT ALL ON TABLE public.stock_history TO service_role;


--
-- Name: TABLE support_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.support_messages TO anon;
GRANT ALL ON TABLE public.support_messages TO authenticated;
GRANT ALL ON TABLE public.support_messages TO service_role;


--
-- Name: TABLE suspicious_activities; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.suspicious_activities TO anon;
GRANT ALL ON TABLE public.suspicious_activities TO authenticated;
GRANT ALL ON TABLE public.suspicious_activities TO service_role;


--
-- Name: TABLE user_seen_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_seen_messages TO anon;
GRANT ALL ON TABLE public.user_seen_messages TO authenticated;
GRANT ALL ON TABLE public.user_seen_messages TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE messages_2025_12_12; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_12_12 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_12_12 TO dashboard_user;


--
-- Name: TABLE messages_2025_12_13; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_12_13 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_12_13 TO dashboard_user;


--
-- Name: TABLE messages_2025_12_14; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_12_14 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_12_14 TO dashboard_user;


--
-- Name: TABLE messages_2025_12_15; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_12_15 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_12_15 TO dashboard_user;


--
-- Name: TABLE messages_2025_12_16; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_12_16 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_12_16 TO dashboard_user;


--
-- Name: TABLE messages_2025_12_17; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_12_17 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_12_17 TO dashboard_user;


--
-- Name: TABLE messages_2025_12_18; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_12_18 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_12_18 TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE prefixes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.prefixes TO service_role;
GRANT ALL ON TABLE storage.prefixes TO authenticated;
GRANT ALL ON TABLE storage.prefixes TO anon;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

