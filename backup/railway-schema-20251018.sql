--
-- PostgreSQL database dump
--

\restrict H94cnriMrq43vgp1AhEBDyIQfUNHAPovyj5Ln8tgAy31jKIeSNVYMdPQ54ffHWO

-- Dumped from database version 16.10 (Debian 16.10-1.pgdg13+1)
-- Dumped by pg_dump version 16.10 (Homebrew)

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: log_expense_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_expense_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Log only if not a soft delete (soft deletes log separately)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO expense_audit (
      expense_id, 
      action, 
      username,
      changes
    ) VALUES (
      NEW.id,
      'CREATE',
      current_user,
      jsonb_build_object('new', row_to_json(NEW))
    );
    
  ELSIF TG_OP = 'UPDATE' AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NULL THEN
    -- Regular update (not soft delete)
    INSERT INTO expense_audit (
      expense_id,
      action,
      username,
      changes
    ) VALUES (
      NEW.id,
      'UPDATE',
      current_user,
      jsonb_build_object(
        'old', row_to_json(OLD),
        'new', row_to_json(NEW)
      )
    );
    
  ELSIF TG_OP = 'UPDATE' AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    -- Soft delete
    INSERT INTO expense_audit (
      expense_id,
      action,
      username,
      changes
    ) VALUES (
      NEW.id,
      'DELETE',
      NEW.deleted_by,
      jsonb_build_object('deleted_at', NEW.deleted_at)
    );
    
  ELSIF TG_OP = 'UPDATE' AND OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    -- Restore
    INSERT INTO expense_audit (
      expense_id,
      action,
      username,
      changes
    ) VALUES (
      NEW.id,
      'RESTORE',
      current_user,
      jsonb_build_object('restored_at', NOW())
    );
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION log_expense_change(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.log_expense_change() IS 'Automaticky loguje všetky zmeny v expenses do expense_audit';


--
-- Name: normalize_text(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.normalize_text(text_input text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    RETURN LOWER(unaccent(text_input));
END;
$$;


--
-- Name: set_initial_next_generation_date(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_initial_next_generation_date() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Nastav prvý generation date
    IF NEW.next_generation_date IS NULL THEN
        NEW.next_generation_date = NEW.start_date;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: update_company_investors_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_company_investors_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


--
-- Name: update_investor_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_investor_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_leasings_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_leasings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$;


--
-- Name: update_notification_prefs_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_notification_prefs_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_recurring_expenses_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_recurring_expenses_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    -- Automaticky prepočítaj next_generation_date pri zmene
    IF NEW.frequency = 'monthly' THEN
        NEW.next_generation_date = NEW.start_date + INTERVAL '1 month' * NEW.total_generated;
    ELSIF NEW.frequency = 'quarterly' THEN
        NEW.next_generation_date = NEW.start_date + INTERVAL '3 months' * NEW.total_generated;
    ELSIF NEW.frequency = 'yearly' THEN
        NEW.next_generation_date = NEW.start_date + INTERVAL '1 year' * NEW.total_generated;
    END IF;
    
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: blacklist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blacklist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    is_active boolean DEFAULT true
);


--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.companies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id integer DEFAULT nextval('public.companies_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    address text,
    phone character varying(20),
    email character varying(100),
    ic character varying(20),
    dic character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    business_id character varying(50),
    tax_id character varying(50),
    contact_person character varying(255),
    contract_start_date date,
    contract_end_date date,
    commission_rate numeric(5,2) DEFAULT 20.00,
    is_active boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    platform_id uuid,
    personal_iban character varying(34),
    business_iban character varying(34),
    owner_name character varying(255),
    contact_email character varying(255),
    contact_phone character varying(50),
    default_commission_rate numeric(5,2) DEFAULT 20.00,
    protocol_display_name character varying(255)
);


--
-- Name: company_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id integer NOT NULL,
    document_type character varying(20) NOT NULL,
    document_month integer,
    document_year integer,
    document_name character varying(255) NOT NULL,
    description text,
    file_path text NOT NULL,
    file_size bigint,
    file_type character varying(100),
    original_filename character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    CONSTRAINT company_documents_document_month_check CHECK (((document_month >= 1) AND (document_month <= 12))),
    CONSTRAINT company_documents_document_type_check CHECK (((document_type)::text = ANY (ARRAY[('contract'::character varying)::text, ('invoice'::character varying)::text]))),
    CONSTRAINT company_documents_document_year_check CHECK (((document_year >= 2020) AND (document_year <= 2099)))
);


--
-- Name: company_investor_shares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_investor_shares (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id integer NOT NULL,
    investor_id uuid NOT NULL,
    ownership_percentage numeric(5,2) NOT NULL,
    investment_amount numeric(12,2),
    investment_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_primary_contact boolean DEFAULT false,
    profit_share_percentage numeric(5,2),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT company_investor_shares_ownership_percentage_check CHECK (((ownership_percentage >= (0)::numeric) AND (ownership_percentage <= (100)::numeric))),
    CONSTRAINT company_investor_shares_profit_share_percentage_check CHECK (((profit_share_percentage >= (0)::numeric) AND (profit_share_percentage <= (100)::numeric)))
);


--
-- Name: company_investor_shares_old; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_investor_shares_old (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id integer NOT NULL,
    investor_id uuid NOT NULL,
    share_percentage numeric(5,2) NOT NULL,
    share_amount numeric(12,2) NOT NULL,
    valid_from date NOT NULL,
    valid_to date,
    last_settlement_date date,
    total_settlements_paid numeric(12,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT investor_shares_amount_check CHECK ((share_amount > (0)::numeric)),
    CONSTRAINT investor_shares_dates_check CHECK (((valid_to IS NULL) OR (valid_to > valid_from))),
    CONSTRAINT investor_shares_percentage_check CHECK (((share_percentage > (0)::numeric) AND (share_percentage <= (100)::numeric)))
);


--
-- Name: company_investors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_investors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(100),
    phone character varying(50),
    personal_id character varying(50),
    address text,
    is_active boolean DEFAULT true,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: company_investors_old; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_investors_old (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id integer NOT NULL,
    investor_name character varying(255) NOT NULL,
    investor_email character varying(255),
    investor_phone character varying(50),
    investor_type character varying(50) DEFAULT 'individual'::character varying,
    investment_amount numeric(12,2) NOT NULL,
    investment_date date NOT NULL,
    investment_currency character varying(10) DEFAULT 'EUR'::character varying,
    contract_number character varying(100),
    contract_date date,
    legal_entity_id character varying(50),
    status character varying(30) DEFAULT 'active'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    CONSTRAINT company_investors_amount_check CHECK ((investment_amount > (0)::numeric)),
    CONSTRAINT company_investors_email_check CHECK ((((investor_email)::text ~ '^[^@]+@[^@]+\.[^@]+$'::text) OR (investor_email IS NULL)))
);


--
-- Name: TABLE company_investors_old; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.company_investors_old IS 'Investori do autopožičovní - spoluinvestorský systém';


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer DEFAULT nextval('public.customers_id_seq'::regclass) NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    email character varying(100),
    phone character varying(30),
    address text,
    birth_date date,
    id_number character varying(20),
    driver_license character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    name character varying(100) DEFAULT 'Unknown'::character varying,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    name character varying(255) NOT NULL,
    description text,
    parent_department_id uuid,
    manager_id uuid,
    monthly_budget numeric(12,2),
    vehicle_limit integer,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: email_action_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_action_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email_type character varying(50) NOT NULL,
    recipient_email character varying(255) NOT NULL,
    sender_email character varying(255),
    subject character varying(500),
    rental_id uuid,
    protocol_id uuid,
    user_id uuid,
    company_id integer,
    action character varying(50) NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying,
    message_id character varying(255),
    error_message text,
    retry_count integer DEFAULT 0,
    scheduled_at timestamp without time zone,
    sent_at timestamp without time zone,
    delivered_at timestamp without time zone,
    opened_at timestamp without time zone,
    clicked_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: email_blacklist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_blacklist (
    id integer NOT NULL,
    order_number character varying(500) NOT NULL,
    reason character varying(500) DEFAULT 'rejected'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255),
    notes text
);


--
-- Name: email_blacklist_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_blacklist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_blacklist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_blacklist_id_seq OWNED BY public.email_blacklist.id;


--
-- Name: email_processing_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_processing_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email_log_id uuid,
    step character varying(100) NOT NULL,
    status character varying(30) NOT NULL,
    started_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone,
    duration_ms integer,
    input_data jsonb,
    output_data jsonb,
    error_details text,
    server_instance character varying(100),
    process_id character varying(50),
    archived_at timestamp without time zone,
    auto_archive_after_days integer DEFAULT 30,
    email_id text,
    message_id text,
    subject text,
    sender text,
    recipient text DEFAULT 'info@blackrent.sk'::text,
    email_content text,
    email_html text,
    received_at timestamp without time zone,
    processed_at timestamp without time zone,
    action_taken text,
    processed_by uuid,
    parsed_data jsonb,
    confidence_score numeric(3,2) DEFAULT 0.0,
    error_message text,
    notes text,
    tags text[],
    rental_id integer,
    is_blacklisted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: expense_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_audit (
    id integer NOT NULL,
    expense_id integer NOT NULL,
    action character varying(20) NOT NULL,
    user_id integer,
    username character varying(255),
    changes jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE expense_audit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.expense_audit IS 'Audit log pre všetky expense operácie - immutable';


--
-- Name: COLUMN expense_audit.changes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.expense_audit.changes IS 'JSON s old/new hodnotami: {"old": {...}, "new": {...}}';


--
-- Name: expense_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expense_audit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expense_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expense_audit_id_seq OWNED BY public.expense_audit.id;


--
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(255) NOT NULL,
    description text,
    icon character varying(50) DEFAULT 'receipt'::character varying NOT NULL,
    color character varying(20) DEFAULT 'primary'::character varying NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    CONSTRAINT expense_categories_color_check CHECK (((color)::text = ANY ((ARRAY['primary'::character varying, 'secondary'::character varying, 'success'::character varying, 'error'::character varying, 'warning'::character varying, 'info'::character varying])::text[])))
);


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    rental_id integer,
    vehicle_id integer,
    category character varying(50),
    description text,
    amount numeric(10,2),
    date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    company character varying(100),
    note text,
    company_id uuid,
    category_id uuid,
    receipt_url text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    deleted_by character varying(255) DEFAULT NULL::character varying
);


--
-- Name: COLUMN expenses.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.expenses.deleted_at IS 'Soft delete timestamp - NULL = active, NOT NULL = deleted';


--
-- Name: COLUMN expenses.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.expenses.deleted_by IS 'Username who deleted the expense';


--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    flag_name character varying(100) NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    percentage integer DEFAULT 0,
    allowed_users text[],
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT feature_flags_percentage_check CHECK (((percentage >= 0) AND (percentage <= 100)))
);


--
-- Name: handover_protocols; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.handover_protocols (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rental_id integer NOT NULL,
    type character varying(20) DEFAULT 'handover'::character varying,
    status character varying(20) DEFAULT 'completed'::character varying,
    location character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone,
    odometer integer DEFAULT 0,
    fuel_level integer DEFAULT 100,
    fuel_type character varying(50) DEFAULT 'Benzín'::character varying,
    exterior_condition character varying(100) DEFAULT 'Dobrý'::character varying,
    interior_condition character varying(100) DEFAULT 'Dobrý'::character varying,
    condition_notes text,
    vehicle_images_urls jsonb DEFAULT '[]'::jsonb,
    vehicle_videos_urls jsonb DEFAULT '[]'::jsonb,
    document_images_urls jsonb DEFAULT '[]'::jsonb,
    damage_images_urls jsonb DEFAULT '[]'::jsonb,
    damages jsonb DEFAULT '[]'::jsonb,
    signatures jsonb DEFAULT '[]'::jsonb,
    rental_data jsonb,
    pdf_url character varying(500),
    email_sent boolean DEFAULT false,
    notes text,
    created_by character varying(100)
);


--
-- Name: insurance_claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insurance_claims (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vehicle_id uuid NOT NULL,
    insurance_id uuid,
    incident_date timestamp without time zone NOT NULL,
    reported_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    claim_number character varying(100),
    description text NOT NULL,
    location character varying(255),
    incident_type character varying(50) DEFAULT 'other'::character varying NOT NULL,
    estimated_damage numeric(10,2),
    deductible numeric(10,2),
    payout_amount numeric(10,2),
    status character varying(50) DEFAULT 'reported'::character varying NOT NULL,
    file_paths text[],
    police_report_number character varying(100),
    other_party_info text,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: insurances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insurances (
    id integer NOT NULL,
    rental_id integer,
    insurer_id integer,
    policy_number character varying(100),
    type character varying(50),
    coverage_amount numeric(10,2),
    premium numeric(10,2),
    start_date date,
    end_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    payment_frequency character varying(20) DEFAULT 'yearly'::character varying NOT NULL,
    file_path text,
    file_paths text[],
    provider character varying(255),
    coverage_type character varying(100),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    km_state integer,
    vehicle_id integer,
    deductible_amount numeric(10,2) DEFAULT NULL::numeric,
    deductible_percentage numeric(5,2) DEFAULT NULL::numeric
);


--
-- Name: COLUMN insurances.deductible_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurances.deductible_amount IS 'Výška spoluúčasti v EUR (voliteľné)';


--
-- Name: COLUMN insurances.deductible_percentage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insurances.deductible_percentage IS 'Percentuálna spoluúčasť (voliteľné)';


--
-- Name: insurances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.insurances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: insurances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.insurances_id_seq OWNED BY public.insurances.id;


--
-- Name: insurers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.insurers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: insurers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insurers (
    id integer DEFAULT nextval('public.insurers_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    address text,
    phone character varying(20),
    email character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: leasing_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leasing_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    leasing_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    file_name character varying(500) NOT NULL,
    file_url text NOT NULL,
    file_size bigint NOT NULL,
    mime_type character varying(100) NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT leasing_documents_file_size_check CHECK ((file_size > 0)),
    CONSTRAINT leasing_documents_type_check CHECK (((type)::text = ANY ((ARRAY['contract'::character varying, 'payment_schedule'::character varying, 'photo'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT valid_file_name CHECK ((length((file_name)::text) > 0)),
    CONSTRAINT valid_file_url CHECK ((length(file_url) > 0))
);


--
-- Name: leasings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leasings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vehicle_id character varying(50) NOT NULL,
    leasing_company character varying(255) NOT NULL,
    loan_category character varying(50) NOT NULL,
    payment_type character varying(20) DEFAULT 'anuita'::character varying NOT NULL,
    initial_loan_amount numeric(10,2) NOT NULL,
    current_balance numeric(10,2) NOT NULL,
    interest_rate numeric(5,3),
    rpmn numeric(5,3),
    monthly_payment numeric(10,2),
    monthly_fee numeric(10,2) DEFAULT 0 NOT NULL,
    processing_fee numeric(10,2) DEFAULT 0 NOT NULL,
    total_monthly_payment numeric(10,2),
    total_installments integer NOT NULL,
    remaining_installments integer NOT NULL,
    paid_installments integer DEFAULT 0 NOT NULL,
    first_payment_date date NOT NULL,
    last_payment_date date,
    last_paid_date date,
    early_repayment_penalty numeric(5,2) DEFAULT 0 NOT NULL,
    early_repayment_penalty_type character varying(20) DEFAULT 'percent_principal'::character varying NOT NULL,
    acquisition_price_without_vat numeric(10,2),
    acquisition_price_with_vat numeric(10,2),
    is_non_deductible boolean DEFAULT false NOT NULL,
    contract_document_url text,
    payment_schedule_url text,
    photos_zip_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    platform_id uuid,
    CONSTRAINT check_balance_positive CHECK ((current_balance >= (0)::numeric)),
    CONSTRAINT check_paid_installments CHECK ((paid_installments <= total_installments)),
    CONSTRAINT check_remaining_installments CHECK ((remaining_installments <= total_installments)),
    CONSTRAINT leasings_early_repayment_penalty_type_check CHECK (((early_repayment_penalty_type)::text = ANY ((ARRAY['percent_principal'::character varying, 'fixed_amount'::character varying])::text[]))),
    CONSTRAINT leasings_loan_category_check CHECK (((loan_category)::text = ANY ((ARRAY['autoúver'::character varying, 'operatívny_leasing'::character varying, 'pôžička'::character varying])::text[]))),
    CONSTRAINT leasings_paid_installments_check CHECK ((paid_installments >= 0)),
    CONSTRAINT leasings_payment_type_check CHECK (((payment_type)::text = ANY ((ARRAY['anuita'::character varying, 'lineárne'::character varying, 'len_úrok'::character varying])::text[]))),
    CONSTRAINT leasings_remaining_installments_check CHECK ((remaining_installments >= 0)),
    CONSTRAINT leasings_total_installments_check CHECK ((total_installments > 0))
);


--
-- Name: migration_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migration_history (
    id integer NOT NULL,
    migration_name character varying(255) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    success boolean DEFAULT true
);


--
-- Name: migration_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migration_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migration_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migration_history_id_seq OWNED BY public.migration_history.id;


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(100) NOT NULL,
    domain character varying(255),
    business_id character varying(50),
    tax_id character varying(50),
    address text,
    phone character varying(50),
    email character varying(255),
    website character varying(255),
    logo_url text,
    subscription_plan character varying(50) DEFAULT 'basic'::character varying,
    subscription_status character varying(30) DEFAULT 'active'::character varying,
    subscription_expires_at timestamp without time zone,
    max_users integer DEFAULT 10,
    max_vehicles integer DEFAULT 50,
    settings jsonb DEFAULT '{}'::jsonb,
    branding jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    CONSTRAINT organizations_slug_check CHECK (((slug)::text ~ '^[a-z0-9-]+$'::text))
);


--
-- Name: payment_schedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_schedule (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    leasing_id uuid NOT NULL,
    installment_number integer NOT NULL,
    due_date date NOT NULL,
    principal numeric(10,2) NOT NULL,
    interest numeric(10,2) NOT NULL,
    monthly_fee numeric(10,2) DEFAULT 0 NOT NULL,
    total_payment numeric(10,2) NOT NULL,
    remaining_balance numeric(10,2) NOT NULL,
    is_paid boolean DEFAULT false NOT NULL,
    paid_date date,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_paid_date CHECK ((((is_paid = true) AND (paid_date IS NOT NULL)) OR ((is_paid = false) AND (paid_date IS NULL)))),
    CONSTRAINT payment_schedule_installment_number_check CHECK ((installment_number > 0)),
    CONSTRAINT payment_schedule_interest_check CHECK ((interest >= (0)::numeric)),
    CONSTRAINT payment_schedule_monthly_fee_check CHECK ((monthly_fee >= (0)::numeric)),
    CONSTRAINT payment_schedule_principal_check CHECK ((principal >= (0)::numeric)),
    CONSTRAINT payment_schedule_remaining_balance_check CHECK ((remaining_balance >= (0)::numeric)),
    CONSTRAINT payment_schedule_total_payment_check CHECK ((total_payment >= (0)::numeric))
);


--
-- Name: pdf_protocols; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pdf_protocols (
    id integer NOT NULL,
    protocol_id character varying(100) NOT NULL,
    rental_id integer,
    customer_id integer,
    vehicle_id integer,
    type character varying(20) NOT NULL,
    pdf_data text NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: pdf_protocols_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pdf_protocols_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pdf_protocols_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pdf_protocols_id_seq OWNED BY public.pdf_protocols.id;


--
-- Name: photo_derivatives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photo_derivatives (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    photo_id uuid NOT NULL,
    derivative_type character varying(20) NOT NULL,
    url text NOT NULL,
    file_size integer DEFAULT 0 NOT NULL,
    width integer,
    height integer,
    format character varying(10) DEFAULT 'jpeg'::character varying NOT NULL,
    quality integer DEFAULT 80,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT photo_derivatives_derivative_type_check CHECK (((derivative_type)::text = ANY (ARRAY[('thumb'::character varying)::text, ('gallery'::character varying)::text, ('pdf'::character varying)::text])))
);


--
-- Name: photo_metadata_v2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photo_metadata_v2 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    photo_id uuid NOT NULL,
    hash_sha256 character varying(64),
    original_size integer DEFAULT 0 NOT NULL,
    processing_time integer,
    savings_percentage numeric(5,2),
    device_info jsonb DEFAULT '{}'::jsonb,
    exif_data jsonb DEFAULT '{}'::jsonb,
    processing_config jsonb DEFAULT '{}'::jsonb,
    version integer DEFAULT 2,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: platforms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platforms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(255),
    subdomain character varying(50),
    logo_url text,
    settings jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: protocol_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.protocol_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    protocol_id uuid,
    photo_url text NOT NULL,
    category character varying(50),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: protocol_processing_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.protocol_processing_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    protocol_id uuid NOT NULL,
    job_type character varying(50) NOT NULL,
    job_id character varying(100),
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    progress integer DEFAULT 0,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT protocol_processing_jobs_job_type_check CHECK (((job_type)::text = ANY (ARRAY[('photo_processing'::character varying)::text, ('pdf_generation'::character varying)::text, ('derivative_generation'::character varying)::text]))),
    CONSTRAINT protocol_processing_jobs_progress_check CHECK (((progress >= 0) AND (progress <= 100))),
    CONSTRAINT protocol_processing_jobs_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('processing'::character varying)::text, ('completed'::character varying)::text, ('failed'::character varying)::text, ('cancelled'::character varying)::text])))
);


--
-- Name: protocol_signatures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.protocol_signatures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    protocol_id uuid,
    signature_type character varying(50) NOT NULL,
    signature_data text NOT NULL,
    signer_name character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: protocol_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.protocol_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    protocol_id uuid NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    migrated_at timestamp without time zone,
    migration_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT protocol_versions_version_check CHECK ((version = ANY (ARRAY[1, 2])))
);


--
-- Name: protocols; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.protocols (
    id integer NOT NULL,
    rental_id integer,
    type character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    location character varying(255),
    odometer integer,
    fuel_level integer,
    notes text,
    media_urls text[],
    damages jsonb,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data jsonb,
    CONSTRAINT protocols_status_check CHECK (((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('completed'::character varying)::text]))),
    CONSTRAINT protocols_type_check CHECK (((type)::text = ANY (ARRAY[('handover'::character varying)::text, ('return'::character varying)::text])))
);


--
-- Name: protocols_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.protocols_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: protocols_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.protocols_id_seq OWNED BY public.protocols.id;


--
-- Name: recurring_expense_generations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_expense_generations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recurring_expense_id uuid NOT NULL,
    generated_expense_id integer NOT NULL,
    generation_date date NOT NULL,
    generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    generated_by character varying(50) DEFAULT 'system'::character varying
);


--
-- Name: recurring_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    category character varying(100) NOT NULL,
    company character varying(100) NOT NULL,
    vehicle_id character varying(50),
    note text,
    frequency character varying(20) DEFAULT 'monthly'::character varying,
    start_date date NOT NULL,
    end_date date,
    day_of_month integer DEFAULT 1,
    is_active boolean DEFAULT true,
    last_generated_date date,
    next_generation_date date,
    total_generated integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    deleted_at timestamp without time zone,
    deleted_by character varying(255) DEFAULT NULL::character varying,
    CONSTRAINT recurring_expenses_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT recurring_expenses_dates_check CHECK (((end_date IS NULL) OR (end_date > start_date))),
    CONSTRAINT recurring_expenses_day_check CHECK (((day_of_month >= 1) AND (day_of_month <= 28)))
);


--
-- Name: TABLE recurring_expenses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.recurring_expenses IS 'Pravidelné náklady ktoré sa automaticky generujú každý mesiac/štvrťrok/rok';


--
-- Name: COLUMN recurring_expenses.frequency; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recurring_expenses.frequency IS 'Frekvencia generovania: monthly, quarterly, yearly';


--
-- Name: COLUMN recurring_expenses.day_of_month; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recurring_expenses.day_of_month IS 'Deň v mesiaci kedy sa má vygenerovať (1-28)';


--
-- Name: COLUMN recurring_expenses.next_generation_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recurring_expenses.next_generation_date IS 'Dátum kedy sa má vygenerovať ďalší náklad';


--
-- Name: rental_backups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rental_backups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    original_rental_id uuid NOT NULL,
    backup_data jsonb NOT NULL,
    backup_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    backup_reason character varying(100) DEFAULT 'pre_update'::character varying
);


--
-- Name: rentals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rentals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rentals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rentals (
    id integer DEFAULT nextval('public.rentals_id_seq'::regclass) NOT NULL,
    customer_id integer,
    vehicle_id integer,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    total_price numeric(10,2),
    deposit numeric(10,2),
    currency character varying(10) DEFAULT 'EUR'::character varying,
    allowed_kilometers integer DEFAULT 0,
    extra_kilometer_rate numeric(10,2) DEFAULT 0,
    customer_name character varying(500),
    order_number character varying(500),
    handover_place character varying(500),
    payment_method character varying(500),
    discount_percent numeric(5,2),
    discount_amount numeric(10,2),
    commission_percent numeric(5,2),
    commission_amount numeric(10,2),
    paid boolean DEFAULT false,
    status character varying(30) DEFAULT 'active'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    commission numeric(10,2) DEFAULT 0,
    discount text,
    custom_commission text,
    extra_km_charge numeric(10,2),
    payments jsonb,
    history jsonb,
    confirmed boolean DEFAULT false,
    daily_kilometers integer,
    return_conditions text,
    fuel_level integer,
    odometer integer,
    return_fuel_level integer,
    return_odometer integer,
    actual_kilometers integer,
    fuel_refill_cost numeric(10,2),
    handover_protocol_id uuid,
    return_protocol_id uuid,
    company character varying(255),
    rental_type character varying(20) DEFAULT 'standard'::character varying,
    is_flexible boolean DEFAULT false,
    flexible_end_date date,
    can_be_overridden boolean DEFAULT false,
    override_priority integer DEFAULT 5,
    notification_threshold integer DEFAULT 3,
    auto_extend boolean DEFAULT false,
    override_history jsonb DEFAULT '[]'::jsonb,
    customer_email character varying(255),
    customer_phone character varying(500),
    vehicle_name character varying(500),
    vehicle_code character varying(500),
    approval_status character varying(30) DEFAULT 'pending'::character varying,
    auto_processed_at timestamp without time zone,
    email_content text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: return_protocols; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.return_protocols (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rental_id integer NOT NULL,
    handover_protocol_id uuid,
    type character varying(20) DEFAULT 'return'::character varying,
    status character varying(20) DEFAULT 'draft'::character varying,
    location character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone,
    odometer integer DEFAULT 0,
    fuel_level integer DEFAULT 100,
    fuel_type character varying(50) DEFAULT 'Benzín'::character varying,
    exterior_condition character varying(100) DEFAULT 'Dobrý'::character varying,
    interior_condition character varying(100) DEFAULT 'Dobrý'::character varying,
    condition_notes text,
    vehicle_images_urls jsonb DEFAULT '[]'::jsonb,
    vehicle_videos_urls jsonb DEFAULT '[]'::jsonb,
    document_images_urls jsonb DEFAULT '[]'::jsonb,
    damage_images_urls jsonb DEFAULT '[]'::jsonb,
    damages jsonb DEFAULT '[]'::jsonb,
    new_damages jsonb DEFAULT '[]'::jsonb,
    signatures jsonb DEFAULT '[]'::jsonb,
    kilometers_used integer DEFAULT 0,
    kilometer_overage integer DEFAULT 0,
    kilometer_fee numeric(10,2) DEFAULT 0,
    fuel_used integer DEFAULT 0,
    fuel_fee numeric(10,2) DEFAULT 0,
    total_extra_fees numeric(10,2) DEFAULT 0,
    deposit_refund numeric(10,2) DEFAULT 0,
    additional_charges numeric(10,2) DEFAULT 0,
    final_refund numeric(10,2) DEFAULT 0,
    rental_data jsonb,
    pdf_url character varying(500),
    email_sent boolean DEFAULT false,
    email_sent_at timestamp without time zone,
    notes text,
    created_by character varying(100)
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    name character varying(100) NOT NULL,
    display_name character varying(255) NOT NULL,
    description text,
    level integer DEFAULT 1,
    parent_role_id uuid,
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_system boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid
);


--
-- Name: settlements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settlements (
    id integer NOT NULL,
    period_from date NOT NULL,
    period_to date NOT NULL,
    vehicle_id integer,
    rental_ids integer[] DEFAULT '{}'::integer[],
    expense_ids integer[] DEFAULT '{}'::integer[],
    total_income numeric(10,2) DEFAULT 0,
    total_expenses numeric(10,2) DEFAULT 0,
    total_commission numeric(10,2) DEFAULT 0,
    profit numeric(10,2) DEFAULT 0,
    description text,
    status character varying(20) DEFAULT 'draft'::character varying,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    rental_id uuid,
    amount numeric(10,2),
    commission numeric(10,2),
    net_amount numeric(10,2),
    paid_at timestamp without time zone,
    notes text,
    company character varying(100) DEFAULT 'Default Company'::character varying,
    period character varying(50) DEFAULT 'Current Period'::character varying,
    from_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    to_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total_to_owner numeric(10,2) DEFAULT 0,
    CONSTRAINT settlements_status_check CHECK (((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('completed'::character varying)::text])))
);


--
-- Name: settlements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.settlements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: settlements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.settlements_id_seq OWNED BY public.settlements.id;


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    team_role character varying(100) DEFAULT 'member'::character varying,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    left_at timestamp without time zone,
    is_active boolean DEFAULT true,
    created_by uuid
);


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    department_id uuid,
    name character varying(255) NOT NULL,
    description text,
    team_lead_id uuid,
    max_members integer DEFAULT 20,
    team_type character varying(50) DEFAULT 'operational'::character varying,
    is_active boolean DEFAULT true,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid
);


--
-- Name: user_notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email_protocol_handover boolean DEFAULT true,
    email_protocol_return boolean DEFAULT true,
    email_rental_reminders boolean DEFAULT true,
    email_payment_notifications boolean DEFAULT true,
    email_system_alerts boolean DEFAULT true,
    email_marketing boolean DEFAULT false,
    sms_urgent_alerts boolean DEFAULT false,
    sms_rental_reminders boolean DEFAULT false,
    push_enabled boolean DEFAULT false,
    push_rental_updates boolean DEFAULT false,
    push_system_alerts boolean DEFAULT false,
    digest_frequency character varying(20) DEFAULT 'daily'::character varying,
    quiet_hours_start time without time zone DEFAULT '22:00:00'::time without time zone,
    quiet_hours_end time without time zone DEFAULT '08:00:00'::time without time zone,
    timezone character varying(50) DEFAULT 'Europe/Bratislava'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_permissions_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_permissions_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    role_hierarchy jsonb DEFAULT '{}'::jsonb,
    cached_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone NOT NULL,
    cache_version integer DEFAULT 1,
    source_role_id uuid,
    source_permissions_hash character varying(64)
);


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    session_token character varying(255) NOT NULL,
    refresh_token character varying(255),
    device_type character varying(50),
    browser character varying(100),
    os character varying(100),
    ip_address inet,
    user_agent text,
    country character varying(100),
    city character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_activity_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone NOT NULL,
    logged_out_at timestamp without time zone,
    is_active boolean DEFAULT true,
    logout_reason character varying(50)
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(30) DEFAULT 'user'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    company_id uuid,
    employee_number character varying(20),
    hire_date date,
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    first_name character varying(100),
    last_name character varying(100),
    signature_template text,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    linked_investor_id uuid,
    permissions jsonb DEFAULT '[]'::jsonb,
    platform_id uuid
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vehicle_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicle_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_type character varying(20) NOT NULL,
    valid_from date,
    valid_to date NOT NULL,
    document_number character varying(100),
    price numeric(10,2),
    notes text,
    file_path text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    vehicle_id integer,
    country character varying(2),
    is_required boolean DEFAULT false
);


--
-- Name: vehicle_unavailability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicle_unavailability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vehicle_id integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text NOT NULL,
    type character varying(50) DEFAULT 'maintenance'::character varying NOT NULL,
    notes text,
    priority integer DEFAULT 2,
    recurring boolean DEFAULT false,
    recurring_config jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(100) DEFAULT 'system'::character varying,
    CONSTRAINT valid_date_range CHECK ((end_date >= start_date))
);


--
-- Name: vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vehicles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id integer DEFAULT nextval('public.vehicles_id_seq'::regclass) NOT NULL,
    company_id integer,
    brand character varying(50) NOT NULL,
    model character varying(50) NOT NULL,
    year integer,
    license_plate character varying(50) NOT NULL,
    vin character varying(50),
    color character varying(30),
    fuel_type character varying(20),
    transmission character varying(20),
    category character varying(30),
    daily_rate numeric(10,2),
    status character varying(30) DEFAULT 'available'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    company character varying(100) DEFAULT 'Default Company'::character varying NOT NULL,
    pricing jsonb DEFAULT '[]'::jsonb,
    commission jsonb DEFAULT '{"type": "percentage", "value": 20}'::jsonb,
    stk date,
    owner_company_id uuid,
    stk_expiry date,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    platform_id uuid
);


--
-- Name: email_blacklist id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_blacklist ALTER COLUMN id SET DEFAULT nextval('public.email_blacklist_id_seq'::regclass);


--
-- Name: expense_audit id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_audit ALTER COLUMN id SET DEFAULT nextval('public.expense_audit_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: insurances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurances ALTER COLUMN id SET DEFAULT nextval('public.insurances_id_seq'::regclass);


--
-- Name: migration_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migration_history ALTER COLUMN id SET DEFAULT nextval('public.migration_history_id_seq'::regclass);


--
-- Name: pdf_protocols id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdf_protocols ALTER COLUMN id SET DEFAULT nextval('public.pdf_protocols_id_seq'::regclass);


--
-- Name: protocols id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.protocols ALTER COLUMN id SET DEFAULT nextval('public.protocols_id_seq'::regclass);


--
-- Name: settlements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlements ALTER COLUMN id SET DEFAULT nextval('public.settlements_id_seq'::regclass);


--
-- Name: blacklist blacklist_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blacklist
    ADD CONSTRAINT blacklist_email_key UNIQUE (email);


--
-- Name: blacklist blacklist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blacklist
    ADD CONSTRAINT blacklist_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_documents company_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_documents
    ADD CONSTRAINT company_documents_pkey PRIMARY KEY (id);


--
-- Name: company_investor_shares company_investor_shares_company_id_investor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_investor_shares
    ADD CONSTRAINT company_investor_shares_company_id_investor_id_key UNIQUE (company_id, investor_id);


--
-- Name: company_investor_shares_old company_investor_shares_company_id_investor_id_valid_from_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_investor_shares_old
    ADD CONSTRAINT company_investor_shares_company_id_investor_id_valid_from_key UNIQUE (company_id, investor_id, valid_from);


--
-- Name: company_investor_shares_old company_investor_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_investor_shares_old
    ADD CONSTRAINT company_investor_shares_pkey PRIMARY KEY (id);


--
-- Name: company_investor_shares company_investor_shares_pkey1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_investor_shares
    ADD CONSTRAINT company_investor_shares_pkey1 PRIMARY KEY (id);


--
-- Name: company_investors_old company_investors_old_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_investors_old
    ADD CONSTRAINT company_investors_old_pkey PRIMARY KEY (id);


--
-- Name: company_investors company_investors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_investors
    ADD CONSTRAINT company_investors_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: departments departments_organization_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_organization_id_name_key UNIQUE (organization_id, name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: email_action_logs email_action_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_action_logs
    ADD CONSTRAINT email_action_logs_pkey PRIMARY KEY (id);


--
-- Name: email_blacklist email_blacklist_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_blacklist
    ADD CONSTRAINT email_blacklist_order_number_key UNIQUE (order_number);


--
-- Name: email_blacklist email_blacklist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_blacklist
    ADD CONSTRAINT email_blacklist_pkey PRIMARY KEY (id);


--
-- Name: email_processing_history email_processing_history_email_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_processing_history
    ADD CONSTRAINT email_processing_history_email_id_unique UNIQUE (email_id);


--
-- Name: email_processing_history email_processing_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_processing_history
    ADD CONSTRAINT email_processing_history_pkey PRIMARY KEY (id);


--
-- Name: expense_audit expense_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_audit
    ADD CONSTRAINT expense_audit_pkey PRIMARY KEY (id);


--
-- Name: expense_categories expense_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_name_key UNIQUE (name);


--
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_flag_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_flag_name_key UNIQUE (flag_name);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: handover_protocols handover_protocols_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.handover_protocols
    ADD CONSTRAINT handover_protocols_pkey PRIMARY KEY (id);


--
-- Name: insurance_claims insurance_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_pkey PRIMARY KEY (id);


--
-- Name: insurances insurances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurances
    ADD CONSTRAINT insurances_pkey PRIMARY KEY (id);


--
-- Name: insurers insurers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurers
    ADD CONSTRAINT insurers_pkey PRIMARY KEY (id);


--
-- Name: leasing_documents leasing_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leasing_documents
    ADD CONSTRAINT leasing_documents_pkey PRIMARY KEY (id);


--
-- Name: leasings leasings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leasings
    ADD CONSTRAINT leasings_pkey PRIMARY KEY (id);


--
-- Name: migration_history migration_history_migration_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migration_history
    ADD CONSTRAINT migration_history_migration_name_key UNIQUE (migration_name);


--
-- Name: migration_history migration_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migration_history
    ADD CONSTRAINT migration_history_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- Name: payment_schedule payment_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_schedule
    ADD CONSTRAINT payment_schedule_pkey PRIMARY KEY (id);


--
-- Name: pdf_protocols pdf_protocols_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdf_protocols
    ADD CONSTRAINT pdf_protocols_pkey PRIMARY KEY (id);


--
-- Name: pdf_protocols pdf_protocols_protocol_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdf_protocols
    ADD CONSTRAINT pdf_protocols_protocol_id_key UNIQUE (protocol_id);


--
-- Name: photo_derivatives photo_derivatives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_derivatives
    ADD CONSTRAINT photo_derivatives_pkey PRIMARY KEY (id);


--
-- Name: photo_metadata_v2 photo_metadata_v2_photo_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_metadata_v2
    ADD CONSTRAINT photo_metadata_v2_photo_id_key UNIQUE (photo_id);


--
-- Name: photo_metadata_v2 photo_metadata_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_metadata_v2
    ADD CONSTRAINT photo_metadata_v2_pkey PRIMARY KEY (id);


--
-- Name: platforms platforms_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platforms
    ADD CONSTRAINT platforms_name_key UNIQUE (name);


--
-- Name: platforms platforms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platforms
    ADD CONSTRAINT platforms_pkey PRIMARY KEY (id);


--
-- Name: platforms platforms_subdomain_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platforms
    ADD CONSTRAINT platforms_subdomain_key UNIQUE (subdomain);


--
-- Name: protocol_photos protocol_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.protocol_photos
    ADD CONSTRAINT protocol_photos_pkey PRIMARY KEY (id);


--
-- Name: protocol_processing_jobs protocol_processing_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.protocol_processing_jobs
    ADD CONSTRAINT protocol_processing_jobs_pkey PRIMARY KEY (id);


--
-- Name: protocol_signatures protocol_signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.protocol_signatures
    ADD CONSTRAINT protocol_signatures_pkey PRIMARY KEY (id);


--
-- Name: protocol_versions protocol_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.protocol_versions
    ADD CONSTRAINT protocol_versions_pkey PRIMARY KEY (id);


--
-- Name: protocol_versions protocol_versions_protocol_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.protocol_versions
    ADD CONSTRAINT protocol_versions_protocol_id_key UNIQUE (protocol_id);


--
-- Name: protocols protocols_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.protocols
    ADD CONSTRAINT protocols_pkey PRIMARY KEY (id);


--
-- Name: recurring_expense_generations recurring_expense_generations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expense_generations
    ADD CONSTRAINT recurring_expense_generations_pkey PRIMARY KEY (id);


--
-- Name: recurring_expense_generations recurring_expense_generations_recurring_expense_id_generati_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expense_generations
    ADD CONSTRAINT recurring_expense_generations_recurring_expense_id_generati_key UNIQUE (recurring_expense_id, generation_date);


--
-- Name: recurring_expenses recurring_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_pkey PRIMARY KEY (id);


--
-- Name: rental_backups rental_backups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_backups
    ADD CONSTRAINT rental_backups_pkey PRIMARY KEY (id);


--
-- Name: rentals rentals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_pkey PRIMARY KEY (id);


--
-- Name: return_protocols return_protocols_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_protocols
    ADD CONSTRAINT return_protocols_pkey PRIMARY KEY (id);


--
-- Name: roles roles_organization_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_organization_id_name_key UNIQUE (organization_id, name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: settlements settlements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT settlements_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_team_id_user_id_joined_at_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_user_id_joined_at_key UNIQUE (team_id, user_id, joined_at);


--
-- Name: teams teams_organization_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_organization_id_name_key UNIQUE (organization_id, name);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: payment_schedule unique_leasing_installment; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_schedule
    ADD CONSTRAINT unique_leasing_installment UNIQUE (leasing_id, installment_number);


--
-- Name: vehicle_unavailability unique_vehicle_period; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_unavailability
    ADD CONSTRAINT unique_vehicle_period UNIQUE (vehicle_id, start_date, end_date, type);


--
-- Name: user_notification_preferences user_notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_notification_preferences user_notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_user_id_key UNIQUE (user_id);


--
-- Name: user_permissions_cache user_permissions_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions_cache
    ADD CONSTRAINT user_permissions_cache_pkey PRIMARY KEY (id);


--
-- Name: user_permissions_cache user_permissions_cache_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions_cache
    ADD CONSTRAINT user_permissions_cache_user_id_key UNIQUE (user_id);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_user_id_company_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_company_id_key UNIQUE (user_id, company_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_refresh_token_key UNIQUE (refresh_token);


--
-- Name: user_sessions user_sessions_session_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_session_token_key UNIQUE (session_token);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: vehicle_documents vehicle_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_documents
    ADD CONSTRAINT vehicle_documents_pkey PRIMARY KEY (id);


--
-- Name: vehicle_unavailability vehicle_unavailability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_unavailability
    ADD CONSTRAINT vehicle_unavailability_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_license_plate_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_license_plate_key UNIQUE (license_plate);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: idx_companies_platform; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_companies_platform ON public.companies USING btree (platform_id);


--
-- Name: idx_company_documents_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_documents_company_id ON public.company_documents USING btree (company_id);


--
-- Name: idx_company_documents_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_documents_date ON public.company_documents USING btree (document_year, document_month);


--
-- Name: idx_company_documents_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_documents_type ON public.company_documents USING btree (document_type);


--
-- Name: idx_company_investors_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_investors_active ON public.company_investors USING btree (is_active);


--
-- Name: idx_company_investors_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_investors_email ON public.company_investors USING btree (email);


--
-- Name: idx_company_investors_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_investors_name ON public.company_investors USING btree (last_name, first_name);


--
-- Name: idx_company_investors_old_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_investors_old_company ON public.company_investors_old USING btree (company_id);


--
-- Name: idx_company_investors_old_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_investors_old_date ON public.company_investors_old USING btree (investment_date);


--
-- Name: idx_company_investors_old_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_investors_old_status ON public.company_investors_old USING btree (status);


--
-- Name: idx_departments_manager; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_departments_manager ON public.departments USING btree (manager_id);


--
-- Name: idx_departments_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_departments_org ON public.departments USING btree (organization_id);


--
-- Name: idx_departments_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_departments_parent ON public.departments USING btree (parent_department_id);


--
-- Name: idx_email_blacklist_order_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_blacklist_order_number ON public.email_blacklist USING btree (order_number);


--
-- Name: idx_email_history_archived_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_history_archived_at ON public.email_processing_history USING btree (archived_at);


--
-- Name: idx_email_history_email_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_history_email_id ON public.email_processing_history USING btree (email_id);


--
-- Name: idx_email_history_processed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_history_processed_by ON public.email_processing_history USING btree (processed_by);


--
-- Name: idx_email_history_received_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_history_received_at ON public.email_processing_history USING btree (received_at DESC);


--
-- Name: idx_email_history_rental_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_history_rental_id ON public.email_processing_history USING btree (rental_id);


--
-- Name: idx_email_history_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_history_search ON public.email_processing_history USING gin (to_tsvector('english'::regconfig, ((subject || ' '::text) || COALESCE(email_content, ''::text))));


--
-- Name: idx_email_history_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_history_sender ON public.email_processing_history USING btree (sender);


--
-- Name: idx_email_history_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_history_status ON public.email_processing_history USING btree (status);


--
-- Name: idx_email_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_created ON public.email_action_logs USING btree (created_at);


--
-- Name: idx_email_logs_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_recipient ON public.email_action_logs USING btree (recipient_email);


--
-- Name: idx_email_logs_rental; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_rental ON public.email_action_logs USING btree (rental_id);


--
-- Name: idx_email_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_status ON public.email_action_logs USING btree (status);


--
-- Name: idx_email_logs_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_type ON public.email_action_logs USING btree (email_type);


--
-- Name: idx_email_processing_history_email_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_processing_history_email_id ON public.email_processing_history USING btree (email_id);


--
-- Name: idx_email_processing_history_rental_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_processing_history_rental_id ON public.email_processing_history USING btree (rental_id);


--
-- Name: idx_email_processing_log_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_processing_log_id ON public.email_processing_history USING btree (email_log_id);


--
-- Name: idx_email_processing_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_processing_status ON public.email_processing_history USING btree (status);


--
-- Name: idx_email_processing_step; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_processing_step ON public.email_processing_history USING btree (step);


--
-- Name: idx_expense_audit_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_audit_action ON public.expense_audit USING btree (action);


--
-- Name: idx_expense_audit_changes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_audit_changes ON public.expense_audit USING gin (changes);


--
-- Name: idx_expense_audit_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_audit_created_at ON public.expense_audit USING btree (created_at DESC);


--
-- Name: idx_expense_audit_expense_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_audit_expense_id ON public.expense_audit USING btree (expense_id);


--
-- Name: idx_expense_audit_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_audit_user_id ON public.expense_audit USING btree (user_id);


--
-- Name: idx_expense_categories_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_categories_active ON public.expense_categories USING btree (is_active);


--
-- Name: idx_expense_categories_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_categories_name ON public.expense_categories USING btree (name);


--
-- Name: idx_expense_categories_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_categories_sort ON public.expense_categories USING btree (sort_order);


--
-- Name: idx_expenses_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_category ON public.expenses USING btree (category);


--
-- Name: idx_expenses_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_company ON public.expenses USING btree (company);


--
-- Name: idx_expenses_company_category_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_company_category_date ON public.expenses USING btree (company, category, date DESC);


--
-- Name: idx_expenses_company_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_company_date ON public.expenses USING btree (company, date DESC);


--
-- Name: idx_expenses_date_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_date_desc ON public.expenses USING btree (date DESC);


--
-- Name: idx_expenses_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_deleted_at ON public.expenses USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: idx_expenses_vehicle_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_vehicle_id ON public.expenses USING btree (vehicle_id);


--
-- Name: idx_investor_shares_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_investor_shares_active ON public.company_investor_shares_old USING btree (valid_from, valid_to) WHERE (valid_to IS NULL);


--
-- Name: idx_investor_shares_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_investor_shares_company ON public.company_investor_shares USING btree (company_id);


--
-- Name: idx_investor_shares_investor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_investor_shares_investor ON public.company_investor_shares USING btree (investor_id);


--
-- Name: idx_investor_shares_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_investor_shares_primary ON public.company_investor_shares USING btree (is_primary_contact);


--
-- Name: idx_leasing_documents_leasing_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leasing_documents_leasing_id ON public.leasing_documents USING btree (leasing_id);


--
-- Name: idx_leasing_documents_leasing_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leasing_documents_leasing_type ON public.leasing_documents USING btree (leasing_id, type);


--
-- Name: idx_leasing_documents_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leasing_documents_type ON public.leasing_documents USING btree (type);


--
-- Name: idx_leasing_documents_uploaded_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leasing_documents_uploaded_at ON public.leasing_documents USING btree (uploaded_at);


--
-- Name: idx_leasings_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leasings_company ON public.leasings USING btree (leasing_company);


--
-- Name: idx_leasings_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leasings_created_at ON public.leasings USING btree (created_at);


--
-- Name: idx_leasings_first_payment_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leasings_first_payment_date ON public.leasings USING btree (first_payment_date);


--
-- Name: idx_leasings_platform; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leasings_platform ON public.leasings USING btree (platform_id);


--
-- Name: idx_leasings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leasings_status ON public.leasings USING btree (remaining_installments);


--
-- Name: idx_leasings_vehicle_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leasings_vehicle_id ON public.leasings USING btree (vehicle_id);


--
-- Name: idx_organizations_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizations_slug ON public.organizations USING btree (slug);


--
-- Name: idx_organizations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizations_status ON public.organizations USING btree (subscription_status);


--
-- Name: idx_payment_schedule_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_schedule_due_date ON public.payment_schedule USING btree (due_date);


--
-- Name: idx_payment_schedule_is_paid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_schedule_is_paid ON public.payment_schedule USING btree (is_paid);


--
-- Name: idx_payment_schedule_is_paid_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_schedule_is_paid_due_date ON public.payment_schedule USING btree (is_paid, due_date);


--
-- Name: idx_payment_schedule_leasing_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_schedule_leasing_id ON public.payment_schedule USING btree (leasing_id);


--
-- Name: idx_payment_schedule_leasing_installment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_schedule_leasing_installment ON public.payment_schedule USING btree (leasing_id, installment_number);


--
-- Name: idx_pdf_protocols_rental; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pdf_protocols_rental ON public.pdf_protocols USING btree (rental_id);


--
-- Name: idx_photo_derivatives_photo_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_photo_derivatives_photo_id ON public.photo_derivatives USING btree (photo_id);


--
-- Name: idx_photo_derivatives_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_photo_derivatives_unique ON public.photo_derivatives USING btree (photo_id, derivative_type);


--
-- Name: idx_protocol_jobs_protocol_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_protocol_jobs_protocol_id ON public.protocol_processing_jobs USING btree (protocol_id);


--
-- Name: idx_protocol_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_protocol_jobs_status ON public.protocol_processing_jobs USING btree (status);


--
-- Name: idx_protocol_photos_protocol_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_protocol_photos_protocol_id ON public.protocol_photos USING btree (protocol_id);


--
-- Name: idx_protocol_signatures_protocol_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_protocol_signatures_protocol_id ON public.protocol_signatures USING btree (protocol_id);


--
-- Name: idx_protocols_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_protocols_created_by ON public.protocols USING btree (created_by);


--
-- Name: idx_protocols_rental_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_protocols_rental_id ON public.protocols USING btree (rental_id);


--
-- Name: idx_protocols_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_protocols_status ON public.protocols USING btree (status);


--
-- Name: idx_protocols_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_protocols_type ON public.protocols USING btree (type);


--
-- Name: idx_recurring_expenses_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_active ON public.recurring_expenses USING btree (is_active);


--
-- Name: idx_recurring_expenses_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_category ON public.recurring_expenses USING btree (category);


--
-- Name: idx_recurring_expenses_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_company ON public.recurring_expenses USING btree (company);


--
-- Name: idx_recurring_expenses_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_deleted_at ON public.recurring_expenses USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: idx_recurring_expenses_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_is_active ON public.recurring_expenses USING btree (is_active);


--
-- Name: idx_recurring_expenses_next_generation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_next_generation ON public.recurring_expenses USING btree (next_generation_date) WHERE (is_active = true);


--
-- Name: idx_recurring_expenses_vehicle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_vehicle ON public.recurring_expenses USING btree (vehicle_id);


--
-- Name: idx_recurring_expenses_vehicle_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_vehicle_id ON public.recurring_expenses USING btree (vehicle_id);


--
-- Name: idx_recurring_generations_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_generations_date ON public.recurring_expense_generations USING btree (generation_date);


--
-- Name: idx_recurring_generations_recurring_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_generations_recurring_id ON public.recurring_expense_generations USING btree (recurring_expense_id);


--
-- Name: idx_rentals_approval_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rentals_approval_status ON public.rentals USING btree (approval_status);


--
-- Name: idx_rentals_auto_processed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rentals_auto_processed_at ON public.rentals USING btree (auto_processed_at DESC);


--
-- Name: idx_rentals_created_at_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rentals_created_at_desc ON public.rentals USING btree (created_at DESC);


--
-- Name: idx_rentals_customer_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rentals_customer_email ON public.rentals USING btree (customer_email);


--
-- Name: idx_rentals_flexible; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rentals_flexible ON public.rentals USING btree (is_flexible, rental_type) WHERE (is_flexible = true);


--
-- Name: idx_rentals_order_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rentals_order_number ON public.rentals USING btree (order_number);


--
-- Name: idx_rentals_override_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rentals_override_priority ON public.rentals USING btree (override_priority, can_be_overridden) WHERE (can_be_overridden = true);


--
-- Name: idx_rentals_vehicle_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rentals_vehicle_id ON public.rentals USING btree (vehicle_id);


--
-- Name: idx_roles_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_roles_active ON public.roles USING btree (is_active);


--
-- Name: idx_roles_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_roles_org ON public.roles USING btree (organization_id);


--
-- Name: idx_roles_system; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_roles_system ON public.roles USING btree (is_system);


--
-- Name: idx_settlements_rental_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_settlements_rental_id ON public.settlements USING btree (rental_id);


--
-- Name: idx_teams_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_active ON public.teams USING btree (is_active);


--
-- Name: idx_teams_department; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_department ON public.teams USING btree (department_id);


--
-- Name: idx_teams_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_org ON public.teams USING btree (organization_id);


--
-- Name: idx_user_permissions_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_permissions_company_id ON public.user_permissions USING btree (company_id);


--
-- Name: idx_user_permissions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_permissions_user_id ON public.user_permissions USING btree (user_id);


--
-- Name: idx_user_sessions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_active ON public.user_sessions USING btree (is_active, expires_at);


--
-- Name: idx_user_sessions_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_token ON public.user_sessions USING btree (session_token);


--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- Name: idx_users_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_company_id ON public.users USING btree (company_id);


--
-- Name: idx_users_platform; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_platform ON public.users USING btree (platform_id);


--
-- Name: idx_users_platform_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_platform_role ON public.users USING btree (platform_id, role);


--
-- Name: idx_vehicle_documents_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicle_documents_country ON public.vehicle_documents USING btree (country);


--
-- Name: idx_vehicle_unavailability_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicle_unavailability_dates ON public.vehicle_unavailability USING btree (start_date, end_date);


--
-- Name: idx_vehicle_unavailability_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicle_unavailability_type ON public.vehicle_unavailability USING btree (type);


--
-- Name: idx_vehicle_unavailability_vehicle_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicle_unavailability_vehicle_id ON public.vehicle_unavailability USING btree (vehicle_id);


--
-- Name: idx_vehicles_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicles_company_id ON public.vehicles USING btree (company_id);


--
-- Name: idx_vehicles_created_at_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicles_created_at_desc ON public.vehicles USING btree (created_at DESC);


--
-- Name: idx_vehicles_owner_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicles_owner_company_id ON public.vehicles USING btree (owner_company_id);


--
-- Name: idx_vehicles_platform; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicles_platform ON public.vehicles USING btree (platform_id);


--
-- Name: expenses trg_expense_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_expense_audit AFTER INSERT OR UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.log_expense_change();


--
-- Name: company_investors_old trigger_company_investors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_company_investors_updated_at BEFORE UPDATE ON public.company_investors_old FOR EACH ROW EXECUTE FUNCTION public.update_investor_updated_at();


--
-- Name: company_investor_shares_old trigger_investor_shares_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_investor_shares_updated_at BEFORE UPDATE ON public.company_investor_shares_old FOR EACH ROW EXECUTE FUNCTION public.update_investor_updated_at();


--
-- Name: recurring_expenses trigger_recurring_expenses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_recurring_expenses_updated_at BEFORE UPDATE ON public.recurring_expenses FOR EACH ROW EXECUTE FUNCTION public.update_recurring_expenses_updated_at();


--
-- Name: recurring_expenses trigger_set_initial_next_generation; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_initial_next_generation BEFORE INSERT ON public.recurring_expenses FOR EACH ROW EXECUTE FUNCTION public.set_initial_next_generation_date();


--
-- Name: leasings trigger_update_leasings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_leasings_updated_at BEFORE UPDATE ON public.leasings FOR EACH ROW EXECUTE FUNCTION public.update_leasings_updated_at();


--
-- Name: blacklist blacklist_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blacklist
    ADD CONSTRAINT blacklist_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: companies companies_platform_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_platform_id_fkey FOREIGN KEY (platform_id) REFERENCES public.platforms(id) ON DELETE CASCADE;


--
-- Name: company_documents company_documents_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_documents
    ADD CONSTRAINT company_documents_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_documents company_documents_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_documents
    ADD CONSTRAINT company_documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: company_investor_shares_old company_investor_shares_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_investor_shares_old
    ADD CONSTRAINT company_investor_shares_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_investor_shares_old company_investor_shares_investor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_investor_shares_old
    ADD CONSTRAINT company_investor_shares_investor_id_fkey FOREIGN KEY (investor_id) REFERENCES public.company_investors_old(id) ON DELETE CASCADE;


--
-- Name: company_investor_shares company_investor_shares_investor_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_investor_shares
    ADD CONSTRAINT company_investor_shares_investor_id_fkey1 FOREIGN KEY (investor_id) REFERENCES public.company_investors(id) ON DELETE CASCADE;


--
-- Name: company_investors_old company_investors_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_investors_old
    ADD CONSTRAINT company_investors_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: departments departments_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: departments departments_parent_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_parent_department_id_fkey FOREIGN KEY (parent_department_id) REFERENCES public.departments(id);


--
-- Name: email_processing_history email_processing_history_email_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_processing_history
    ADD CONSTRAINT email_processing_history_email_log_id_fkey FOREIGN KEY (email_log_id) REFERENCES public.email_action_logs(id) ON DELETE CASCADE;


--
-- Name: expenses expenses_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(id);


--
-- Name: expense_audit fk_audit_expense; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_audit
    ADD CONSTRAINT fk_audit_expense FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE CASCADE;


--
-- Name: expenses fk_expenses_category; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT fk_expenses_category FOREIGN KEY (category) REFERENCES public.expense_categories(name) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CONSTRAINT fk_expenses_category ON expenses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT fk_expenses_category ON public.expenses IS 'Hard reference - kategóriu nemožno zmazať ak sa používa';


--
-- Name: expenses fk_expenses_vehicle; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT fk_expenses_vehicle FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CONSTRAINT fk_expenses_vehicle ON expenses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT fk_expenses_vehicle ON public.expenses IS 'Soft reference - expense zostáva pri delete vehicle';


--
-- Name: insurances insurances_insurer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurances
    ADD CONSTRAINT insurances_insurer_id_fkey FOREIGN KEY (insurer_id) REFERENCES public.insurers(id);


--
-- Name: insurances insurances_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurances
    ADD CONSTRAINT insurances_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(id);


--
-- Name: leasing_documents leasing_documents_leasing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leasing_documents
    ADD CONSTRAINT leasing_documents_leasing_id_fkey FOREIGN KEY (leasing_id) REFERENCES public.leasings(id) ON DELETE CASCADE;


--
-- Name: leasings leasings_platform_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leasings
    ADD CONSTRAINT leasings_platform_id_fkey FOREIGN KEY (platform_id) REFERENCES public.platforms(id) ON DELETE SET NULL;


--
-- Name: payment_schedule payment_schedule_leasing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_schedule
    ADD CONSTRAINT payment_schedule_leasing_id_fkey FOREIGN KEY (leasing_id) REFERENCES public.leasings(id) ON DELETE CASCADE;


--
-- Name: pdf_protocols pdf_protocols_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdf_protocols
    ADD CONSTRAINT pdf_protocols_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: pdf_protocols pdf_protocols_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdf_protocols
    ADD CONSTRAINT pdf_protocols_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(id);


--
-- Name: pdf_protocols pdf_protocols_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdf_protocols
    ADD CONSTRAINT pdf_protocols_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);


--
-- Name: recurring_expense_generations recurring_expense_generations_recurring_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expense_generations
    ADD CONSTRAINT recurring_expense_generations_recurring_expense_id_fkey FOREIGN KEY (recurring_expense_id) REFERENCES public.recurring_expenses(id) ON DELETE CASCADE;


--
-- Name: rentals rentals_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: rentals rentals_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;


--
-- Name: roles roles_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: roles roles_parent_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_parent_role_id_fkey FOREIGN KEY (parent_role_id) REFERENCES public.roles(id);


--
-- Name: team_members team_members_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: teams teams_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: teams teams_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: users users_platform_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_platform_id_fkey FOREIGN KEY (platform_id) REFERENCES public.platforms(id) ON DELETE CASCADE;


--
-- Name: vehicles vehicles_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: vehicles vehicles_platform_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_platform_id_fkey FOREIGN KEY (platform_id) REFERENCES public.platforms(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict H94cnriMrq43vgp1AhEBDyIQfUNHAPovyj5Ln8tgAy31jKIeSNVYMdPQ54ffHWO

