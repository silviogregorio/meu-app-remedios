


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






CREATE OR REPLACE FUNCTION "public"."check_access"("resource_owner_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN (
        auth.uid() = resource_owner_id
        OR
        EXISTS (
            SELECT 1 FROM public.account_shares
            WHERE owner_id = resource_owner_id
            AND shared_with_email = (auth.jwt() ->> 'email')
        )
    );
END;
$$;


ALTER FUNCTION "public"."check_access"("resource_owner_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."motivation_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "text" "text" NOT NULL,
    "period" "text",
    "category" "text" DEFAULT 'general'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    CONSTRAINT "motivation_messages_period_check" CHECK (("period" = ANY (ARRAY['morning'::"text", 'afternoon'::"text", 'night'::"text", 'any'::"text"])))
);


ALTER TABLE "public"."motivation_messages" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_daily_motivation"("p_period" "text") RETURNS SETOF "public"."motivation_messages"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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

    -- If we have unseen messages, return one random unseen
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
        -- FALLBACK: If user saw EVERYTHING, return the ONE watched longest ago (Recycling)
        RETURN QUERY
        SELECT m.*
        FROM motivation_messages m
        JOIN user_seen_messages s ON s.message_id = m.id
        WHERE s.user_id = v_user_id
        AND (m.period = p_period OR m.period = 'any')
        ORDER BY s.seen_at ASC -- Oldest seen first
        LIMIT 1;
    END IF;
END;
$$;


ALTER FUNCTION "public"."get_daily_motivation"("p_period" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_full_access"("resource_owner_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN (
        -- Owner
        resource_owner_id = auth.uid()
        OR
        -- Shared
        EXISTS (
            SELECT 1 FROM public.account_shares
            WHERE owner_id = resource_owner_id
            -- Use JWT claim instead of selecting from auth.users (Security + Perf)
            AND shared_with_email = (auth.jwt() ->> 'email')
        )
    );
END;
$$;


ALTER FUNCTION "public"."has_full_access"("resource_owner_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_patient_access"("target_patient_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."has_patient_access"("target_patient_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lowercase_share_email"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.shared_with_email = LOWER(NEW.shared_with_email);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."lowercase_share_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."account_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "shared_with_email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."account_shares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."alert_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "prescription_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "alert_date" "date" NOT NULL,
    "alert_time" time without time zone NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "sent_to" "text"[]
);


ALTER TABLE "public"."alert_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "user_email" "text",
    "action" "text" NOT NULL,
    "resource_type" "text",
    "resource_id" "uuid",
    "ip_address" "text",
    "user_agent" "text",
    "metadata" "jsonb",
    "is_suspicious" boolean DEFAULT false,
    "risk_level" "text" DEFAULT 'low'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "audit_logs_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_logs" IS 'Security audit log tracking all significant user actions';



COMMENT ON COLUMN "public"."audit_logs"."action" IS 'Type of action performed (login, create, delete, share, etc.)';



COMMENT ON COLUMN "public"."audit_logs"."is_suspicious" IS 'Flag for potentially suspicious activity requiring review';



COMMENT ON COLUMN "public"."audit_logs"."risk_level" IS 'Severity level: low, medium, high, critical';



CREATE TABLE IF NOT EXISTS "public"."consumption_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prescription_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "scheduled_time" time without time zone NOT NULL,
    "taken_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "taken_by" "uuid",
    CONSTRAINT "consumption_log_status_check" CHECK (("status" = ANY (ARRAY['taken'::"text", 'missed'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."consumption_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."consumption_log" IS 'Histórico de consumo de medicamentos';



COMMENT ON COLUMN "public"."consumption_log"."taken_by" IS 'ID do usuário que registrou o consumo';



CREATE TABLE IF NOT EXISTS "public"."health_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "value" numeric(10,2) NOT NULL,
    "value_secondary" numeric(10,2),
    "measured_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    CONSTRAINT "health_logs_category_check" CHECK (("category" = ANY (ARRAY['pressure'::"text", 'glucose'::"text", 'weight'::"text", 'temperature'::"text", 'heart_rate'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."health_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medication_library" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "indications" "text",
    "warnings" "text",
    "search_vector" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"portuguese"'::"regconfig", (("name" || ' '::"text") || COALESCE("description", ''::"text")))) STORED,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."medication_library" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "dosage" "text" NOT NULL,
    "type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "quantity" integer DEFAULT 0,
    "last_alert_date" "date",
    "color" "text" DEFAULT 'white'::"text",
    "shape" "text" DEFAULT 'round'::"text"
);


ALTER TABLE "public"."medications" OWNER TO "postgres";


COMMENT ON TABLE "public"."medications" IS 'Medicamentos disponíveis';



CREATE TABLE IF NOT EXISTS "public"."patient_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "shared_with_email" "text" NOT NULL,
    "permission" "text" DEFAULT 'view'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "accepted_at" timestamp with time zone,
    "shared_with_id" "uuid"
);

ALTER TABLE ONLY "public"."patient_shares" REPLICA IDENTITY FULL;


ALTER TABLE "public"."patient_shares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "birth_date" "date" NOT NULL,
    "phone" "text",
    "condition" "text",
    "cep" "text",
    "street" "text",
    "number" "text",
    "complement" "text",
    "neighborhood" "text",
    "city" "text",
    "state" "text",
    "observations" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "email" "text",
    "blood_type" "text",
    "allergies" "text"
);


ALTER TABLE "public"."patients" OWNER TO "postgres";


COMMENT ON TABLE "public"."patients" IS 'Pacientes cadastrados no sistema';



COMMENT ON COLUMN "public"."patients"."email" IS 'Email address of the patient for notifications and contact.';



COMMENT ON COLUMN "public"."patients"."blood_type" IS 'Tipo Sanguíneo (Ex: A+, O-)';



COMMENT ON COLUMN "public"."patients"."allergies" IS 'Lista de alergias e intolerâncias';



CREATE TABLE IF NOT EXISTS "public"."prescriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "medication_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "frequency" "text" NOT NULL,
    "times" "jsonb" NOT NULL,
    "instructions" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "dose_amount" "text",
    "continuous_use" boolean DEFAULT false
);


ALTER TABLE "public"."prescriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."prescriptions" IS 'Prescrições médicas ativas';



COMMENT ON COLUMN "public"."prescriptions"."continuous_use" IS 'Flag para medicamentos de uso contínuo (sem data fim obrigatória)';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'Perfis de usuário estendidos';



CREATE TABLE IF NOT EXISTS "public"."sponsors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "logo_url" "text" NOT NULL,
    "website_url" "text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "description" "text",
    "whatsapp" "text",
    "tiktok" "text",
    "youtube" "text",
    "instagram" "text",
    "facebook" "text"
);

ALTER TABLE ONLY "public"."sponsors" REPLICA IDENTITY FULL;


ALTER TABLE "public"."sponsors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid" NOT NULL,
    "patient_id" "uuid",
    "medication_id" "uuid" NOT NULL,
    "quantity_change" numeric(10,2) NOT NULL,
    "previous_balance" numeric(10,2),
    "new_balance" numeric(10,2),
    "reason" "text" NOT NULL,
    "notes" "text"
);


ALTER TABLE "public"."stock_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "sender_name" "text",
    "sender_email" "text" NOT NULL,
    "subject" "text",
    "message" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."support_messages" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."suspicious_activities" WITH ("security_invoker"='true') AS
 SELECT "id",
    "user_id",
    "user_email",
    "action",
    "resource_type",
    "resource_id",
    "ip_address",
    "user_agent",
    "metadata",
    "is_suspicious",
    "risk_level",
    "created_at",
    "count"(*) OVER (PARTITION BY "user_id", ("date"("created_at"))) AS "daily_action_count",
    "count"(*) OVER (PARTITION BY "ip_address", ("date"("created_at"))) AS "daily_ip_count"
   FROM "public"."audit_logs" "al"
  WHERE (("is_suspicious" = true) OR ("risk_level" = ANY (ARRAY['high'::"text", 'critical'::"text"])) OR ("action" = ANY (ARRAY['failed_login'::"text", 'unauthorized_access'::"text", 'data_export'::"text"])))
  ORDER BY "created_at" DESC;


ALTER VIEW "public"."suspicious_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_seen_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "message_id" "uuid",
    "seen_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."user_seen_messages" OWNER TO "postgres";


ALTER TABLE ONLY "public"."account_shares"
    ADD CONSTRAINT "account_shares_owner_id_shared_with_email_key" UNIQUE ("owner_id", "shared_with_email");



ALTER TABLE ONLY "public"."account_shares"
    ADD CONSTRAINT "account_shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."alert_logs"
    ADD CONSTRAINT "alert_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consumption_log"
    ADD CONSTRAINT "consumption_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consumption_log"
    ADD CONSTRAINT "consumption_log_prescription_id_date_scheduled_time_key" UNIQUE ("prescription_id", "date", "scheduled_time");



ALTER TABLE ONLY "public"."health_logs"
    ADD CONSTRAINT "health_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medication_library"
    ADD CONSTRAINT "medication_library_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medications"
    ADD CONSTRAINT "medications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."motivation_messages"
    ADD CONSTRAINT "motivation_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_shares"
    ADD CONSTRAINT "patient_shares_patient_id_shared_with_email_key" UNIQUE ("patient_id", "shared_with_email");



ALTER TABLE ONLY "public"."patient_shares"
    ADD CONSTRAINT "patient_shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sponsors"
    ADD CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_history"
    ADD CONSTRAINT "stock_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_messages"
    ADD CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."motivation_messages"
    ADD CONSTRAINT "unique_text_content" UNIQUE ("text");



ALTER TABLE ONLY "public"."user_seen_messages"
    ADD CONSTRAINT "user_seen_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_seen_messages"
    ADD CONSTRAINT "user_seen_messages_user_id_message_id_key" UNIQUE ("user_id", "message_id");



CREATE INDEX "alert_logs_lookup_idx" ON "public"."alert_logs" USING "btree" ("prescription_id", "alert_date", "alert_time");



CREATE INDEX "health_logs_measured_at_idx" ON "public"."health_logs" USING "btree" ("measured_at");



CREATE INDEX "health_logs_patient_id_idx" ON "public"."health_logs" USING "btree" ("patient_id");



CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs" USING "btree" ("action");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_risk" ON "public"."audit_logs" USING "btree" ("risk_level") WHERE ("risk_level" = ANY (ARRAY['high'::"text", 'critical'::"text"]));



CREATE INDEX "idx_audit_logs_suspicious" ON "public"."audit_logs" USING "btree" ("is_suspicious") WHERE ("is_suspicious" = true);



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_consumption_log_date" ON "public"."consumption_log" USING "btree" ("date");



CREATE INDEX "idx_consumption_log_prescription_id" ON "public"."consumption_log" USING "btree" ("prescription_id");



CREATE INDEX "idx_consumption_log_taken_by" ON "public"."consumption_log" USING "btree" ("taken_by");



CREATE INDEX "idx_medications_user_id" ON "public"."medications" USING "btree" ("user_id");



CREATE INDEX "idx_patients_user_id" ON "public"."patients" USING "btree" ("user_id");



CREATE INDEX "idx_prescriptions_patient_id" ON "public"."prescriptions" USING "btree" ("patient_id");



CREATE INDEX "idx_prescriptions_user_id" ON "public"."prescriptions" USING "btree" ("user_id");



CREATE INDEX "medication_search_idx" ON "public"."medication_library" USING "gin" ("search_vector");



CREATE INDEX "stock_history_medication_id_idx" ON "public"."stock_history" USING "btree" ("medication_id");



CREATE OR REPLACE TRIGGER "ensure_lowercase_email" BEFORE INSERT OR UPDATE ON "public"."patient_shares" FOR EACH ROW EXECUTE FUNCTION "public"."lowercase_share_email"();



CREATE OR REPLACE TRIGGER "update_medications_updated_at" BEFORE UPDATE ON "public"."medications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_patients_updated_at" BEFORE UPDATE ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_prescriptions_updated_at" BEFORE UPDATE ON "public"."prescriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."alert_logs"
    ADD CONSTRAINT "alert_logs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."alert_logs"
    ADD CONSTRAINT "alert_logs_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."consumption_log"
    ADD CONSTRAINT "consumption_log_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consumption_log"
    ADD CONSTRAINT "consumption_log_taken_by_fkey" FOREIGN KEY ("taken_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."health_logs"
    ADD CONSTRAINT "health_logs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_logs"
    ADD CONSTRAINT "health_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medications"
    ADD CONSTRAINT "medications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_shares"
    ADD CONSTRAINT "patient_shares_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_shares"
    ADD CONSTRAINT "patient_shares_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_shares"
    ADD CONSTRAINT "patient_shares_shared_with_id_fkey" FOREIGN KEY ("shared_with_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_history"
    ADD CONSTRAINT "stock_history_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_history"
    ADD CONSTRAINT "stock_history_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stock_history"
    ADD CONSTRAINT "stock_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_messages"
    ADD CONSTRAINT "support_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_seen_messages"
    ADD CONSTRAINT "user_seen_messages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."motivation_messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_seen_messages"
    ADD CONSTRAINT "user_seen_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can do everything" ON "public"."sponsors" USING ((("auth"."jwt"() ->> 'email'::"text") = 'sigsis@gmail.com'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = 'sigsis@gmail.com'::"text"));



CREATE POLICY "Admins update" ON "public"."support_messages" FOR UPDATE USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['sigsis@gmail.com'::"text", 'sigremedios@gmail.com'::"text", 'silviogregorio@gmail.com'::"text"])));



CREATE POLICY "Admins view all" ON "public"."support_messages" FOR SELECT USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['sigsis@gmail.com'::"text", 'sigremedios@gmail.com'::"text", 'silviogregorio@gmail.com'::"text"])));



CREATE POLICY "Anyone can read active messages" ON "public"."motivation_messages" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Convidado aceita convites" ON "public"."patient_shares" FOR UPDATE USING (("lower"("shared_with_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))));



CREATE POLICY "Convidado vê seus convites" ON "public"."patient_shares" FOR SELECT USING (("lower"("shared_with_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))));



CREATE POLICY "Dono gerencia convites" ON "public"."patient_shares" USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Dono ve seus pacientes" ON "public"."patients" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Guest View" ON "public"."account_shares" FOR SELECT USING (("lower"("shared_with_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))));



CREATE POLICY "Owner Manage" ON "public"."account_shares" USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Owner access" ON "public"."patient_shares" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Public Read Access" ON "public"."medication_library" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Public can view all sponsors" ON "public"."sponsors" FOR SELECT USING (true);



CREATE POLICY "Safe Patient Access" ON "public"."patients" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."patient_shares"
  WHERE (("patient_shares"."patient_id" = "patients"."id") AND (("patient_shares"."shared_with_id" = "auth"."uid"()) OR ("lower"("patient_shares"."shared_with_email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))) AND ("patient_shares"."accepted_at" IS NOT NULL))))));



CREATE POLICY "Safe Share Access" ON "public"."patient_shares" TO "authenticated" USING ((("auth"."uid"() = "owner_id") OR ("auth"."uid"() = "shared_with_id") OR ("lower"("shared_with_email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "Shared editor modifies log" ON "public"."consumption_log" USING ((EXISTS ( SELECT 1
   FROM ("public"."prescriptions"
     JOIN "public"."patient_shares" ON (("patient_shares"."patient_id" = "prescriptions"."patient_id")))
  WHERE (("prescriptions"."id" = "consumption_log"."prescription_id") AND (("patient_shares"."shared_with_id" = "auth"."uid"()) OR ("lower"("patient_shares"."shared_with_email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))) AND ("patient_shares"."permission" = 'edit'::"text") AND ("patient_shares"."accepted_at" IS NOT NULL)))));



CREATE POLICY "Shared editor modifies medications" ON "public"."medications" USING ((EXISTS ( SELECT 1
   FROM "public"."patient_shares"
  WHERE (("patient_shares"."owner_id" = "medications"."user_id") AND (("patient_shares"."shared_with_id" = "auth"."uid"()) OR ("lower"("patient_shares"."shared_with_email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))) AND ("patient_shares"."permission" = 'edit'::"text") AND ("patient_shares"."accepted_at" IS NOT NULL)))));



CREATE POLICY "Shared editor modifies prescriptions" ON "public"."prescriptions" USING ((EXISTS ( SELECT 1
   FROM "public"."patient_shares"
  WHERE (("patient_shares"."patient_id" = "prescriptions"."patient_id") AND (("patient_shares"."shared_with_id" = "auth"."uid"()) OR ("lower"("patient_shares"."shared_with_email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))) AND ("patient_shares"."permission" = 'edit'::"text") AND ("patient_shares"."accepted_at" IS NOT NULL)))));



CREATE POLICY "Shared user views log" ON "public"."consumption_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."prescriptions"
     JOIN "public"."patient_shares" ON (("patient_shares"."patient_id" = "prescriptions"."patient_id")))
  WHERE (("prescriptions"."id" = "consumption_log"."prescription_id") AND (("patient_shares"."shared_with_id" = "auth"."uid"()) OR ("lower"("patient_shares"."shared_with_email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))) AND ("patient_shares"."accepted_at" IS NOT NULL)))));



CREATE POLICY "Shared user views medications" ON "public"."medications" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."patient_shares"
  WHERE (("patient_shares"."owner_id" = "medications"."user_id") AND (("patient_shares"."shared_with_id" = "auth"."uid"()) OR ("lower"("patient_shares"."shared_with_email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))) AND ("patient_shares"."accepted_at" IS NOT NULL)))));



CREATE POLICY "Shared user views prescriptions" ON "public"."prescriptions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."patient_shares"
  WHERE (("patient_shares"."patient_id" = "prescriptions"."patient_id") AND (("patient_shares"."shared_with_id" = "auth"."uid"()) OR ("lower"("patient_shares"."shared_with_email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))) AND ("patient_shares"."accepted_at" IS NOT NULL)))));



CREATE POLICY "Strict Privacy Policy - Logs" ON "public"."consumption_log" USING ((EXISTS ( SELECT 1
   FROM "public"."prescriptions"
  WHERE (("prescriptions"."id" = "consumption_log"."prescription_id") AND "public"."check_access"("prescriptions"."user_id")))));



CREATE POLICY "Strict Privacy Policy - Medications" ON "public"."medications" USING ("public"."check_access"("user_id"));



CREATE POLICY "Strict Privacy Policy - Patients" ON "public"."patients" USING ("public"."check_access"("user_id"));



CREATE POLICY "Strict Privacy Policy - Prescriptions" ON "public"."prescriptions" USING ("public"."check_access"("user_id"));



CREATE POLICY "Users can delete health logs (Owner & Shared)" ON "public"."health_logs" FOR DELETE USING ("public"."has_patient_access"("patient_id"));



CREATE POLICY "Users can delete own consumption logs" ON "public"."consumption_log" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."prescriptions"
  WHERE (("prescriptions"."id" = "consumption_log"."prescription_id") AND ("prescriptions"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own medications" ON "public"."medications" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own patients" ON "public"."patients" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own prescriptions" ON "public"."prescriptions" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert health logs (Owner & Shared)" ON "public"."health_logs" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND "public"."has_patient_access"("patient_id")));



CREATE POLICY "Users can insert own consumption logs" ON "public"."consumption_log" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."prescriptions"
  WHERE (("prescriptions"."id" = "consumption_log"."prescription_id") AND ("prescriptions"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own medications" ON "public"."medications" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own patients" ON "public"."patients" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own prescriptions" ON "public"."prescriptions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert stock history (Owner & Shared)" ON "public"."stock_history" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND ((("patient_id" IS NOT NULL) AND "public"."has_patient_access"("patient_id")) OR (("patient_id" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."prescriptions" "p"
  WHERE (("p"."medication_id" = "stock_history"."medication_id") AND "public"."has_patient_access"("p"."patient_id"))))))));



CREATE POLICY "Users can insert their own seen logs" ON "public"."user_seen_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own shares" ON "public"."account_shares" TO "authenticated" USING (("auth"."uid"() = "owner_id")) WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can select their own seen logs" ON "public"."user_seen_messages" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update health logs (Owner & Shared)" ON "public"."health_logs" FOR UPDATE USING ("public"."has_patient_access"("patient_id"));



CREATE POLICY "Users can update own consumption logs" ON "public"."consumption_log" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."prescriptions"
  WHERE (("prescriptions"."id" = "consumption_log"."prescription_id") AND ("prescriptions"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own medications" ON "public"."medications" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own patients" ON "public"."patients" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own prescriptions" ON "public"."prescriptions" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view alerts for their patients" ON "public"."alert_logs" FOR SELECT USING ("public"."has_patient_access"("patient_id"));



CREATE POLICY "Users can view health logs (Owner & Shared)" ON "public"."health_logs" FOR SELECT USING ("public"."has_patient_access"("patient_id"));



CREATE POLICY "Users can view own audit logs" ON "public"."audit_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own consumption logs" ON "public"."consumption_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."prescriptions"
  WHERE (("prescriptions"."id" = "consumption_log"."prescription_id") AND ("prescriptions"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own medications" ON "public"."medications" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own patients" ON "public"."patients" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own prescriptions" ON "public"."prescriptions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view stock history (Owner & Shared)" ON "public"."stock_history" FOR SELECT USING (((("patient_id" IS NOT NULL) AND "public"."has_patient_access"("patient_id")) OR (("patient_id" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."prescriptions" "p"
  WHERE (("p"."medication_id" = "stock_history"."medication_id") AND "public"."has_patient_access"("p"."patient_id")))))));



CREATE POLICY "Users insert own" ON "public"."support_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários veem compartilhamentos recebidos" ON "public"."account_shares" FOR SELECT USING (("shared_with_email" = ("auth"."jwt"() ->> 'email'::"text")));



CREATE POLICY "Ver Histórico (Dono e Família)" ON "public"."consumption_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."prescriptions"
  WHERE (("prescriptions"."id" = "consumption_log"."prescription_id") AND "public"."has_patient_access"("prescriptions"."patient_id")))));



CREATE POLICY "Ver Medicamentos (Dono e Família)" ON "public"."medications" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."patient_shares"
  WHERE (("patient_shares"."owner_id" = "medications"."user_id") AND ("lower"("patient_shares"."shared_with_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) AND ("patient_shares"."status" = 'accepted'::"text"))))));



CREATE POLICY "Ver Pacientes (Dono e Família)" ON "public"."patients" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."patient_shares"
  WHERE (("patient_shares"."patient_id" = "patients"."id") AND ("lower"("patient_shares"."shared_with_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) AND ("patient_shares"."status" = 'accepted'::"text"))))));



CREATE POLICY "Ver Receitas (Dono e Família)" ON "public"."prescriptions" FOR SELECT USING ("public"."has_patient_access"("patient_id"));



CREATE POLICY "Ver meus compartilhamentos (Recebidos)" ON "public"."patient_shares" FOR SELECT USING (("shared_with_email" = ("auth"."jwt"() ->> 'email'::"text")));



ALTER TABLE "public"."account_shares" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."alert_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consumption_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medication_library" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."motivation_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_shares" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prescriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_seen_messages" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."consumption_log";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."medications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."patient_shares";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."patients";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."prescriptions";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































REVOKE ALL ON FUNCTION "public"."check_access"("resource_owner_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_access"("resource_owner_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_access"("resource_owner_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_access"("resource_owner_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."motivation_messages" TO "anon";
GRANT ALL ON TABLE "public"."motivation_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."motivation_messages" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_daily_motivation"("p_period" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_daily_motivation"("p_period" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_daily_motivation"("p_period" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."has_full_access"("resource_owner_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_full_access"("resource_owner_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_full_access"("resource_owner_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_full_access"("resource_owner_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_patient_access"("target_patient_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_patient_access"("target_patient_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_patient_access"("target_patient_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."lowercase_share_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."lowercase_share_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."lowercase_share_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."account_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."account_shares" TO "service_role";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."account_shares" TO "anon";



GRANT ALL ON TABLE "public"."alert_logs" TO "anon";
GRANT ALL ON TABLE "public"."alert_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."alert_logs" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."consumption_log" TO "authenticated";
GRANT ALL ON TABLE "public"."consumption_log" TO "service_role";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."consumption_log" TO "anon";



GRANT ALL ON TABLE "public"."health_logs" TO "anon";
GRANT ALL ON TABLE "public"."health_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."health_logs" TO "service_role";



GRANT ALL ON TABLE "public"."medication_library" TO "anon";
GRANT ALL ON TABLE "public"."medication_library" TO "authenticated";
GRANT ALL ON TABLE "public"."medication_library" TO "service_role";



GRANT ALL ON TABLE "public"."medications" TO "authenticated";
GRANT ALL ON TABLE "public"."medications" TO "service_role";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."medications" TO "anon";



GRANT ALL ON TABLE "public"."patient_shares" TO "anon";
GRANT ALL ON TABLE "public"."patient_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_shares" TO "service_role";



GRANT ALL ON TABLE "public"."patients" TO "authenticated";
GRANT ALL ON TABLE "public"."patients" TO "service_role";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."patients" TO "anon";



GRANT ALL ON TABLE "public"."prescriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."prescriptions" TO "service_role";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."prescriptions" TO "anon";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."sponsors" TO "anon";
GRANT ALL ON TABLE "public"."sponsors" TO "authenticated";
GRANT ALL ON TABLE "public"."sponsors" TO "service_role";



GRANT ALL ON TABLE "public"."stock_history" TO "anon";
GRANT ALL ON TABLE "public"."stock_history" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_history" TO "service_role";



GRANT ALL ON TABLE "public"."support_messages" TO "anon";
GRANT ALL ON TABLE "public"."support_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."support_messages" TO "service_role";



GRANT ALL ON TABLE "public"."suspicious_activities" TO "anon";
GRANT ALL ON TABLE "public"."suspicious_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."suspicious_activities" TO "service_role";



GRANT ALL ON TABLE "public"."user_seen_messages" TO "anon";
GRANT ALL ON TABLE "public"."user_seen_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."user_seen_messages" TO "service_role";









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































