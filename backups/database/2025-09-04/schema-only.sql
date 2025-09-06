--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

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
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: normalize_text(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.normalize_text(text_input text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    RETURN LOWER(unaccent(text_input));
END;
$$;


ALTER FUNCTION public.normalize_text(text_input text) OWNER TO postgres;

--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.companies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.companies_id_seq OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id integer DEFAULT nextval('public.companies_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    address text,
    phone character varying(20),
    email character varying(100),
    ic character varying(20),
    dic character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: company_documents; Type: TABLE; Schema: public; Owner: postgres
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
    CONSTRAINT company_documents_document_type_check CHECK (((document_type)::text = ANY ((ARRAY['contract'::character varying, 'invoice'::character varying])::text[]))),
    CONSTRAINT company_documents_document_year_check CHECK (((document_year >= 2020) AND (document_year <= 2099)))
);


ALTER TABLE public.company_documents OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customers_id_seq OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
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
    name character varying(100) DEFAULT 'Unknown'::character varying
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: email_blacklist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_blacklist (
    id integer NOT NULL,
    order_number character varying(500) NOT NULL,
    reason character varying(500) DEFAULT 'rejected'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255),
    notes text
);


ALTER TABLE public.email_blacklist OWNER TO postgres;

--
-- Name: email_blacklist_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_blacklist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.email_blacklist_id_seq OWNER TO postgres;

--
-- Name: email_blacklist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_blacklist_id_seq OWNED BY public.email_blacklist.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    rental_id integer,
    vehicle_id integer,
    category character varying(50),
    description text,
    amount numeric(10,2),
    date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.expenses_id_seq OWNER TO postgres;

--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.feature_flags OWNER TO postgres;

--
-- Name: handover_protocols; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.handover_protocols (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rental_id uuid NOT NULL,
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


ALTER TABLE public.handover_protocols OWNER TO postgres;

--
-- Name: insurance_claims; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.insurance_claims OWNER TO postgres;

--
-- Name: insurances; Type: TABLE; Schema: public; Owner: postgres
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
    file_paths text[]
);


ALTER TABLE public.insurances OWNER TO postgres;

--
-- Name: insurances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.insurances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.insurances_id_seq OWNER TO postgres;

--
-- Name: insurances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.insurances_id_seq OWNED BY public.insurances.id;


--
-- Name: insurers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.insurers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.insurers_id_seq OWNER TO postgres;

--
-- Name: insurers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.insurers (
    id integer DEFAULT nextval('public.insurers_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    address text,
    phone character varying(20),
    email character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.insurers OWNER TO postgres;

--
-- Name: migration_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migration_history (
    id integer NOT NULL,
    migration_name character varying(255) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    success boolean DEFAULT true
);


ALTER TABLE public.migration_history OWNER TO postgres;

--
-- Name: migration_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migration_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.migration_history_id_seq OWNER TO postgres;

--
-- Name: migration_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migration_history_id_seq OWNED BY public.migration_history.id;


--
-- Name: pdf_protocols; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.pdf_protocols OWNER TO postgres;

--
-- Name: pdf_protocols_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pdf_protocols_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pdf_protocols_id_seq OWNER TO postgres;

--
-- Name: pdf_protocols_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pdf_protocols_id_seq OWNED BY public.pdf_protocols.id;


--
-- Name: photo_derivatives; Type: TABLE; Schema: public; Owner: postgres
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
    CONSTRAINT photo_derivatives_derivative_type_check CHECK (((derivative_type)::text = ANY ((ARRAY['thumb'::character varying, 'gallery'::character varying, 'pdf'::character varying])::text[])))
);


ALTER TABLE public.photo_derivatives OWNER TO postgres;

--
-- Name: photo_metadata_v2; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.photo_metadata_v2 OWNER TO postgres;

--
-- Name: protocol_processing_jobs; Type: TABLE; Schema: public; Owner: postgres
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
    CONSTRAINT protocol_processing_jobs_job_type_check CHECK (((job_type)::text = ANY ((ARRAY['photo_processing'::character varying, 'pdf_generation'::character varying, 'derivative_generation'::character varying])::text[]))),
    CONSTRAINT protocol_processing_jobs_progress_check CHECK (((progress >= 0) AND (progress <= 100))),
    CONSTRAINT protocol_processing_jobs_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.protocol_processing_jobs OWNER TO postgres;

--
-- Name: protocol_versions; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.protocol_versions OWNER TO postgres;

--
-- Name: protocols; Type: TABLE; Schema: public; Owner: postgres
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
    CONSTRAINT protocols_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'completed'::character varying])::text[]))),
    CONSTRAINT protocols_type_check CHECK (((type)::text = ANY ((ARRAY['handover'::character varying, 'return'::character varying])::text[])))
);


ALTER TABLE public.protocols OWNER TO postgres;

--
-- Name: protocols_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.protocols_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.protocols_id_seq OWNER TO postgres;

--
-- Name: protocols_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.protocols_id_seq OWNED BY public.protocols.id;


--
-- Name: rentals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rentals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rentals_id_seq OWNER TO postgres;

--
-- Name: rentals; Type: TABLE; Schema: public; Owner: postgres
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
    email_content text
);


ALTER TABLE public.rentals OWNER TO postgres;

--
-- Name: return_protocols; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.return_protocols (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rental_id uuid NOT NULL,
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


ALTER TABLE public.return_protocols OWNER TO postgres;

--
-- Name: settlements; Type: TABLE; Schema: public; Owner: postgres
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
    CONSTRAINT settlements_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'completed'::character varying])::text[])))
);


ALTER TABLE public.settlements OWNER TO postgres;

--
-- Name: settlements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settlements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.settlements_id_seq OWNER TO postgres;

--
-- Name: settlements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settlements_id_seq OWNED BY public.settlements.id;


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_permissions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
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
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: vehicle_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vehicle_id uuid NOT NULL,
    document_type character varying(20) NOT NULL,
    valid_from date,
    valid_to date NOT NULL,
    document_number character varying(100),
    price numeric(10,2),
    notes text,
    file_path text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.vehicle_documents OWNER TO postgres;

--
-- Name: vehicle_unavailability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle_unavailability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vehicle_id uuid NOT NULL,
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


ALTER TABLE public.vehicle_unavailability OWNER TO postgres;

--
-- Name: vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vehicles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.vehicles_id_seq OWNER TO postgres;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
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
    stk date
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- Name: email_blacklist id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_blacklist ALTER COLUMN id SET DEFAULT nextval('public.email_blacklist_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: insurances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurances ALTER COLUMN id SET DEFAULT nextval('public.insurances_id_seq'::regclass);


--
-- Name: migration_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migration_history ALTER COLUMN id SET DEFAULT nextval('public.migration_history_id_seq'::regclass);


--
-- Name: pdf_protocols id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_protocols ALTER COLUMN id SET DEFAULT nextval('public.pdf_protocols_id_seq'::regclass);


--
-- Name: protocols id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.protocols ALTER COLUMN id SET DEFAULT nextval('public.protocols_id_seq'::regclass);


--
-- Name: settlements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlements ALTER COLUMN id SET DEFAULT nextval('public.settlements_id_seq'::regclass);


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: company_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: email_blacklist; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: feature_flags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: handover_protocols; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: insurance_claims; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: insurances; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: insurers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: migration_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: pdf_protocols; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: photo_derivatives; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: photo_metadata_v2; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: protocol_processing_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: protocol_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: protocols; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rentals; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: return_protocols; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: settlements; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: vehicle_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: vehicle_unavailability; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.companies_id_seq', 14, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 17, true);


--
-- Name: email_blacklist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_blacklist_id_seq', 1, false);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expenses_id_seq', 1, false);


--
-- Name: insurances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.insurances_id_seq', 1, false);


--
-- Name: insurers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.insurers_id_seq', 10, true);


--
-- Name: migration_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migration_history_id_seq', 1, false);


--
-- Name: pdf_protocols_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pdf_protocols_id_seq', 1, false);


--
-- Name: protocols_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.protocols_id_seq', 1, false);


--
-- Name: rentals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rentals_id_seq', 8, true);


--
-- Name: settlements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settlements_id_seq', 6, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 17, true);


--
-- Name: vehicles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vehicles_id_seq', 22, true);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_documents company_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_documents
    ADD CONSTRAINT company_documents_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: email_blacklist email_blacklist_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_blacklist
    ADD CONSTRAINT email_blacklist_order_number_key UNIQUE (order_number);


--
-- Name: email_blacklist email_blacklist_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_blacklist
    ADD CONSTRAINT email_blacklist_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_flag_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_flag_name_key UNIQUE (flag_name);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: handover_protocols handover_protocols_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.handover_protocols
    ADD CONSTRAINT handover_protocols_pkey PRIMARY KEY (id);


--
-- Name: insurance_claims insurance_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_pkey PRIMARY KEY (id);


--
-- Name: insurances insurances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurances
    ADD CONSTRAINT insurances_pkey PRIMARY KEY (id);


--
-- Name: insurers insurers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurers
    ADD CONSTRAINT insurers_pkey PRIMARY KEY (id);


--
-- Name: migration_history migration_history_migration_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migration_history
    ADD CONSTRAINT migration_history_migration_name_key UNIQUE (migration_name);


--
-- Name: migration_history migration_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migration_history
    ADD CONSTRAINT migration_history_pkey PRIMARY KEY (id);


--
-- Name: pdf_protocols pdf_protocols_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_protocols
    ADD CONSTRAINT pdf_protocols_pkey PRIMARY KEY (id);


--
-- Name: pdf_protocols pdf_protocols_protocol_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_protocols
    ADD CONSTRAINT pdf_protocols_protocol_id_key UNIQUE (protocol_id);


--
-- Name: photo_derivatives photo_derivatives_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photo_derivatives
    ADD CONSTRAINT photo_derivatives_pkey PRIMARY KEY (id);


--
-- Name: photo_metadata_v2 photo_metadata_v2_photo_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photo_metadata_v2
    ADD CONSTRAINT photo_metadata_v2_photo_id_key UNIQUE (photo_id);


--
-- Name: photo_metadata_v2 photo_metadata_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photo_metadata_v2
    ADD CONSTRAINT photo_metadata_v2_pkey PRIMARY KEY (id);


--
-- Name: protocol_processing_jobs protocol_processing_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.protocol_processing_jobs
    ADD CONSTRAINT protocol_processing_jobs_pkey PRIMARY KEY (id);


--
-- Name: protocol_versions protocol_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.protocol_versions
    ADD CONSTRAINT protocol_versions_pkey PRIMARY KEY (id);


--
-- Name: protocol_versions protocol_versions_protocol_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.protocol_versions
    ADD CONSTRAINT protocol_versions_protocol_id_key UNIQUE (protocol_id);


--
-- Name: protocols protocols_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.protocols
    ADD CONSTRAINT protocols_pkey PRIMARY KEY (id);


--
-- Name: rentals rentals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_pkey PRIMARY KEY (id);


--
-- Name: return_protocols return_protocols_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_protocols
    ADD CONSTRAINT return_protocols_pkey PRIMARY KEY (id);


--
-- Name: settlements settlements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT settlements_pkey PRIMARY KEY (id);


--
-- Name: vehicle_unavailability unique_vehicle_period; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_unavailability
    ADD CONSTRAINT unique_vehicle_period UNIQUE (vehicle_id, start_date, end_date, type);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_user_id_company_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_company_id_key UNIQUE (user_id, company_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: vehicle_documents vehicle_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_documents
    ADD CONSTRAINT vehicle_documents_pkey PRIMARY KEY (id);


--
-- Name: vehicle_unavailability vehicle_unavailability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_unavailability
    ADD CONSTRAINT vehicle_unavailability_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_license_plate_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_license_plate_key UNIQUE (license_plate);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: idx_company_documents_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_documents_company_id ON public.company_documents USING btree (company_id);


--
-- Name: idx_company_documents_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_documents_date ON public.company_documents USING btree (document_year, document_month);


--
-- Name: idx_company_documents_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_documents_type ON public.company_documents USING btree (document_type);


--
-- Name: idx_email_blacklist_order_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_blacklist_order_number ON public.email_blacklist USING btree (order_number);


--
-- Name: idx_pdf_protocols_rental; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pdf_protocols_rental ON public.pdf_protocols USING btree (rental_id);


--
-- Name: idx_photo_derivatives_photo_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_photo_derivatives_photo_id ON public.photo_derivatives USING btree (photo_id);


--
-- Name: idx_photo_derivatives_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_photo_derivatives_unique ON public.photo_derivatives USING btree (photo_id, derivative_type);


--
-- Name: idx_protocol_jobs_protocol_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_protocol_jobs_protocol_id ON public.protocol_processing_jobs USING btree (protocol_id);


--
-- Name: idx_protocol_jobs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_protocol_jobs_status ON public.protocol_processing_jobs USING btree (status);


--
-- Name: idx_protocols_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_protocols_created_by ON public.protocols USING btree (created_by);


--
-- Name: idx_protocols_rental_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_protocols_rental_id ON public.protocols USING btree (rental_id);


--
-- Name: idx_protocols_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_protocols_status ON public.protocols USING btree (status);


--
-- Name: idx_protocols_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_protocols_type ON public.protocols USING btree (type);


--
-- Name: idx_rentals_approval_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rentals_approval_status ON public.rentals USING btree (approval_status);


--
-- Name: idx_rentals_auto_processed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rentals_auto_processed_at ON public.rentals USING btree (auto_processed_at DESC);


--
-- Name: idx_rentals_customer_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rentals_customer_email ON public.rentals USING btree (customer_email);


--
-- Name: idx_rentals_flexible; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rentals_flexible ON public.rentals USING btree (is_flexible, rental_type) WHERE (is_flexible = true);


--
-- Name: idx_rentals_order_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rentals_order_number ON public.rentals USING btree (order_number);


--
-- Name: idx_rentals_override_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rentals_override_priority ON public.rentals USING btree (override_priority, can_be_overridden) WHERE (can_be_overridden = true);


--
-- Name: idx_rentals_vehicle_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rentals_vehicle_id ON public.rentals USING btree (vehicle_id);


--
-- Name: idx_user_permissions_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_permissions_company_id ON public.user_permissions USING btree (company_id);


--
-- Name: idx_user_permissions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_permissions_user_id ON public.user_permissions USING btree (user_id);


--
-- Name: idx_vehicle_unavailability_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicle_unavailability_dates ON public.vehicle_unavailability USING btree (start_date, end_date);


--
-- Name: idx_vehicle_unavailability_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicle_unavailability_type ON public.vehicle_unavailability USING btree (type);


--
-- Name: idx_vehicle_unavailability_vehicle_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicle_unavailability_vehicle_id ON public.vehicle_unavailability USING btree (vehicle_id);


--
-- Name: company_documents company_documents_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_documents
    ADD CONSTRAINT company_documents_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_documents company_documents_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_documents
    ADD CONSTRAINT company_documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: expenses expenses_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(id);


--
-- Name: insurances insurances_insurer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurances
    ADD CONSTRAINT insurances_insurer_id_fkey FOREIGN KEY (insurer_id) REFERENCES public.insurers(id);


--
-- Name: insurances insurances_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurances
    ADD CONSTRAINT insurances_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(id);


--
-- Name: pdf_protocols pdf_protocols_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_protocols
    ADD CONSTRAINT pdf_protocols_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: pdf_protocols pdf_protocols_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_protocols
    ADD CONSTRAINT pdf_protocols_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(id);


--
-- Name: pdf_protocols pdf_protocols_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_protocols
    ADD CONSTRAINT pdf_protocols_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);


--
-- Name: rentals rentals_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: rentals rentals_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;


--
-- Name: vehicles vehicles_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- PostgreSQL database dump complete
--

