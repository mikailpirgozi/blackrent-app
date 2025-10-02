-- BlackRent Database Backup
-- Created: 2025-09-03T23:22:07.341Z
-- Tables: 51


-- Štruktúra tabuľky: vehicle_unavailability_backup
--
-- PostgreSQL database dump
--

\restrict lZfCr2odeDzwuzcUs6QsapzHOyyIHXall9P2u0VWyJ4UEZKZ2CggcffMIPjvCVa

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: vehicle_unavailability_backup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle_unavailability_backup (
    id uuid,
    vehicle_id uuid,
    start_date date,
    end_date date,
    reason text,
    type character varying(50),
    notes text,
    priority integer,
    recurring boolean,
    recurring_config jsonb,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    created_by character varying(100)
);


ALTER TABLE public.vehicle_unavailability_backup OWNER TO postgres;

--
-- PostgreSQL database dump complete
--

\unrestrict lZfCr2odeDzwuzcUs6QsapzHOyyIHXall9P2u0VWyJ4UEZKZ2CggcffMIPjvCVa



-- Dáta tabuľky: vehicle_unavailability_backup (4 záznamov)
-- COPY vehicle_unavailability_backup FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: insurance_claims
--
-- PostgreSQL database dump
--

\restrict fkRdgLZ9c8aK1wRzsQEHBhyBzyMbAlNIRuTefpCRj6Ko38PyO4mgrUc08DE3qmz

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
-- Name: insurance_claims insurance_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict fkRdgLZ9c8aK1wRzsQEHBhyBzyMbAlNIRuTefpCRj6Ko38PyO4mgrUc08DE3qmz



-- Tabuľka insurance_claims je prázdna

-- Štruktúra tabuľky: company_investors
--
-- PostgreSQL database dump
--

\restrict kakOwUJcWfL7WsJ0nSrPFeM7wUXp7Z4UELPEeKr77JCewB9zCBKDPODgWCF79Q5

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: company_investors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_investors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255),
    phone character varying(50),
    personal_id character varying(20),
    address text,
    is_active boolean DEFAULT true,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.company_investors OWNER TO postgres;

--
-- Name: company_investors company_investors_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_investors
    ADD CONSTRAINT company_investors_email_key UNIQUE (email);


--
-- Name: company_investors company_investors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_investors
    ADD CONSTRAINT company_investors_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict kakOwUJcWfL7WsJ0nSrPFeM7wUXp7Z4UELPEeKr77JCewB9zCBKDPODgWCF79Q5



-- Dáta tabuľky: company_investors (8 záznamov)
-- COPY company_investors FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: insurers
--
-- PostgreSQL database dump
--

\restrict B915nlB6vvsvdov7YB0Y0EDzITQSf7xdvbjfnQzGNz2a5d8tcz257iIbea69Bzu

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
-- Name: insurers insurers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurers
    ADD CONSTRAINT insurers_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict B915nlB6vvsvdov7YB0Y0EDzITQSf7xdvbjfnQzGNz2a5d8tcz257iIbea69Bzu



-- Dáta tabuľky: insurers (3 záznamov)
-- COPY insurers FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: organizations
--
-- PostgreSQL database dump
--

\restrict pSdUcDHTEj63UebcFJvtH1leS2s2xAF2OSiEyilJDvRuobsoAm0caDdWDABpsba

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
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
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT organizations_slug_check CHECK (((slug)::text ~ '^[a-z0-9-]+$'::text))
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- Name: organizations update_organizations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- PostgreSQL database dump complete
--

\unrestrict pSdUcDHTEj63UebcFJvtH1leS2s2xAF2OSiEyilJDvRuobsoAm0caDdWDABpsba



-- Dáta tabuľky: organizations (1 záznamov)
-- COPY organizations FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: departments
--
-- PostgreSQL database dump
--

\restrict zOJY76kiUqp1AM6c034N206LezXumCNWKLVhheYJWFVhfRNOUDcOY1HZ5x4flTa

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    parent_department_id uuid,
    manager_id uuid,
    monthly_budget numeric(12,2),
    vehicle_limit integer,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments departments_organization_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_organization_id_name_key UNIQUE (organization_id, name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: idx_departments_manager_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_departments_manager_id ON public.departments USING btree (manager_id);


--
-- Name: idx_departments_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_departments_organization_id ON public.departments USING btree (organization_id);


--
-- Name: idx_departments_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_departments_parent_id ON public.departments USING btree (parent_department_id);


--
-- Name: departments update_departments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: departments departments_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: departments departments_parent_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_parent_department_id_fkey FOREIGN KEY (parent_department_id) REFERENCES public.departments(id);


--
-- Name: departments fk_departments_manager; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT fk_departments_manager FOREIGN KEY (manager_id) REFERENCES public.users_advanced(id);


--
-- PostgreSQL database dump complete
--

\unrestrict zOJY76kiUqp1AM6c034N206LezXumCNWKLVhheYJWFVhfRNOUDcOY1HZ5x4flTa



-- Dáta tabuľky: departments (4 záznamov)
-- COPY departments FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: customers
--
-- PostgreSQL database dump
--

\restrict VWUs03W5eyh3FTtk9Evntx8dZbjzDSLA5oPcXkp7gihwMjaNgMSu42EXddv0D3N

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict VWUs03W5eyh3FTtk9Evntx8dZbjzDSLA5oPcXkp7gihwMjaNgMSu42EXddv0D3N



-- Dáta tabuľky: customers (367 záznamov)
-- COPY customers FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: automatic_processing_log
--
-- PostgreSQL database dump
--

\restrict SfA4B0sj5t8uofcElhQBAGXwpiAtSujMmjyXdCfahY3cje63vSgeJulBHgI5Ihi

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: automatic_processing_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.automatic_processing_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rental_id uuid,
    action character varying(50) NOT NULL,
    details jsonb,
    user_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.automatic_processing_log OWNER TO postgres;

--
-- Name: automatic_processing_log automatic_processing_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automatic_processing_log
    ADD CONSTRAINT automatic_processing_log_pkey PRIMARY KEY (id);


--
-- Name: idx_auto_log_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auto_log_action ON public.automatic_processing_log USING btree (action);


--
-- Name: idx_auto_log_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auto_log_created_at ON public.automatic_processing_log USING btree (created_at);


--
-- Name: idx_auto_log_rental_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auto_log_rental_id ON public.automatic_processing_log USING btree (rental_id);


--
-- PostgreSQL database dump complete
--

\unrestrict SfA4B0sj5t8uofcElhQBAGXwpiAtSujMmjyXdCfahY3cje63vSgeJulBHgI5Ihi



-- Tabuľka automatic_processing_log je prázdna

-- Štruktúra tabuľky: vehicle_unavailability
--
-- PostgreSQL database dump
--

\restrict NegkxZMIS7r35y4iVUXhtRJmWcTRANKQDpZkpBB1L2c13nhQraLIRSKtIzPPiS5

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: vehicle_unavailability; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.vehicle_unavailability OWNER TO postgres;

--
-- Name: vehicle_unavailability unique_vehicle_period; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_unavailability
    ADD CONSTRAINT unique_vehicle_period UNIQUE (vehicle_id, start_date, end_date, type);


--
-- Name: vehicle_unavailability vehicle_unavailability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_unavailability
    ADD CONSTRAINT vehicle_unavailability_pkey PRIMARY KEY (id);


--
-- Name: idx_unavailability_active_recent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unavailability_active_recent ON public.vehicle_unavailability USING btree (vehicle_id, type, start_date, end_date);


--
-- Name: idx_unavailability_current_month_optimized; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unavailability_current_month_optimized ON public.vehicle_unavailability USING btree (start_date, end_date, vehicle_id, type) INCLUDE (reason, priority);


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
-- Name: vehicle_unavailability fk_vehicle_unavailability_vehicle_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_unavailability
    ADD CONSTRAINT fk_vehicle_unavailability_vehicle_id FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict NegkxZMIS7r35y4iVUXhtRJmWcTRANKQDpZkpBB1L2c13nhQraLIRSKtIzPPiS5



-- Dáta tabuľky: vehicle_unavailability (6 záznamov)
-- COPY vehicle_unavailability FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: user_permissions
--
-- PostgreSQL database dump
--

\restrict 0YXoqNXOS38l8PUEvsToVRDRn0ladbPcbcdjEKfAfKavU7OZd57FnthnVvAmTMG

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
-- Name: idx_user_permissions_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_permissions_company_id ON public.user_permissions USING btree (company_id);


--
-- Name: idx_user_permissions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_permissions_user_id ON public.user_permissions USING btree (user_id);


--
-- PostgreSQL database dump complete
--

\unrestrict 0YXoqNXOS38l8PUEvsToVRDRn0ladbPcbcdjEKfAfKavU7OZd57FnthnVvAmTMG



-- Dáta tabuľky: user_permissions (17 záznamov)
-- COPY user_permissions FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: protocols
--
-- PostgreSQL database dump
--

\restrict NPxptXV89AatTAysPoaFxdKN6NOjneFuKGC8gnrNiZd64Y2wDakqaPoEcdIgF8t

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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


ALTER SEQUENCE public.protocols_id_seq OWNER TO postgres;

--
-- Name: protocols_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.protocols_id_seq OWNED BY public.protocols.id;


--
-- Name: protocols id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.protocols ALTER COLUMN id SET DEFAULT nextval('public.protocols_id_seq'::regclass);


--
-- Name: protocols protocols_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.protocols
    ADD CONSTRAINT protocols_pkey PRIMARY KEY (id);


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
-- PostgreSQL database dump complete
--

\unrestrict NPxptXV89AatTAysPoaFxdKN6NOjneFuKGC8gnrNiZd64Y2wDakqaPoEcdIgF8t



-- Tabuľka protocols je prázdna

-- Štruktúra tabuľky: customers_backup
--
-- PostgreSQL database dump
--

\restrict 7cTP0hW03oIFQKD3owro7JEDvlBoDQyKRDGS9CSeekvPtcK9l2QdQ5b3Na8Acec

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: customers_backup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers_backup (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100),
    phone character varying(30),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customers_backup OWNER TO postgres;

--
-- Name: customers_backup customers_backup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers_backup
    ADD CONSTRAINT customers_backup_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict 7cTP0hW03oIFQKD3owro7JEDvlBoDQyKRDGS9CSeekvPtcK9l2QdQ5b3Na8Acec



-- Tabuľka customers_backup je prázdna

-- Štruktúra tabuľky: roles
--
-- PostgreSQL database dump
--

\restrict sShIkCVCfvkw8hFrVp4bLNPK6bzcsbG7Vo7uyrOQK9yljP6n0IGbnP44rAGAp8o

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(255) NOT NULL,
    description text,
    level integer DEFAULT 1,
    parent_role_id uuid,
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_system boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by uuid
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles roles_organization_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_organization_id_name_key UNIQUE (organization_id, name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: idx_roles_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roles_level ON public.roles USING btree (level);


--
-- Name: idx_roles_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roles_organization_id ON public.roles USING btree (organization_id);


--
-- Name: idx_roles_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roles_parent_id ON public.roles USING btree (parent_role_id);


--
-- Name: roles update_roles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: roles roles_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: roles roles_parent_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_parent_role_id_fkey FOREIGN KEY (parent_role_id) REFERENCES public.roles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict sShIkCVCfvkw8hFrVp4bLNPK6bzcsbG7Vo7uyrOQK9yljP6n0IGbnP44rAGAp8o



-- Dáta tabuľky: roles (7 záznamov)
-- COPY roles FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: vehicle_ownership_history
--
-- PostgreSQL database dump
--

\restrict PaQtYP8Y7bvgG7SJsh6wdbc7bdtRowYiOzoHc27sHsoc98e49SdY5TSxboIfIzs

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: vehicle_ownership_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle_ownership_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vehicle_id uuid NOT NULL,
    owner_company_id uuid NOT NULL,
    owner_company_name character varying(255) NOT NULL,
    valid_from timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    valid_to timestamp without time zone,
    transfer_reason character varying(255) DEFAULT 'initial_setup'::character varying,
    transfer_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.vehicle_ownership_history OWNER TO postgres;

--
-- Name: vehicle_ownership_history vehicle_ownership_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_ownership_history
    ADD CONSTRAINT vehicle_ownership_history_pkey PRIMARY KEY (id);


--
-- Name: idx_vehicle_ownership_history_owner_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicle_ownership_history_owner_company_id ON public.vehicle_ownership_history USING btree (owner_company_id);


--
-- Name: idx_vehicle_ownership_history_valid_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicle_ownership_history_valid_period ON public.vehicle_ownership_history USING btree (valid_from, valid_to);


--
-- Name: idx_vehicle_ownership_history_vehicle_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicle_ownership_history_vehicle_id ON public.vehicle_ownership_history USING btree (vehicle_id);


--
-- Name: idx_vehicle_ownership_one_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_vehicle_ownership_one_active ON public.vehicle_ownership_history USING btree (vehicle_id) WHERE (valid_to IS NULL);


--
-- PostgreSQL database dump complete
--

\unrestrict PaQtYP8Y7bvgG7SJsh6wdbc7bdtRowYiOzoHc27sHsoc98e49SdY5TSxboIfIzs



-- Dáta tabuľky: vehicle_ownership_history (110 záznamov)
-- COPY vehicle_ownership_history FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: settlements
--
-- PostgreSQL database dump
--

\restrict hk9qfztJgGZ0glls6QrBb8V8f4x0fwHuCwuucBTcCbcnENGtqcg7v4TCxsmo2S8

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: settlements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settlements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company character varying(100) DEFAULT 'Default Company'::character varying,
    period character varying(50) DEFAULT 'Current Period'::character varying,
    from_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    to_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total_income numeric(10,2) DEFAULT 0,
    total_expenses numeric(10,2) DEFAULT 0,
    commission numeric(10,2) DEFAULT 0,
    profit numeric(10,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.settlements OWNER TO postgres;

--
-- Name: settlements settlements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT settlements_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict hk9qfztJgGZ0glls6QrBb8V8f4x0fwHuCwuucBTcCbcnENGtqcg7v4TCxsmo2S8



-- Dáta tabuľky: settlements (4 záznamov)
-- COPY settlements FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: email_blacklist
--
-- PostgreSQL database dump
--

\restrict yTvTHm9fwgQnZ9qPVfUWqAWtlOs50n7rxBr6VGPcRLoNdBt6DUf4swnwKOv9eAM

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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


ALTER SEQUENCE public.email_blacklist_id_seq OWNER TO postgres;

--
-- Name: email_blacklist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_blacklist_id_seq OWNED BY public.email_blacklist.id;


--
-- Name: email_blacklist id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_blacklist ALTER COLUMN id SET DEFAULT nextval('public.email_blacklist_id_seq'::regclass);


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
-- Name: idx_email_blacklist_order_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_blacklist_order_number ON public.email_blacklist USING btree (order_number);


--
-- PostgreSQL database dump complete
--

\unrestrict yTvTHm9fwgQnZ9qPVfUWqAWtlOs50n7rxBr6VGPcRLoNdBt6DUf4swnwKOv9eAM



-- Dáta tabuľky: email_blacklist (5 záznamov)
-- COPY email_blacklist FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: migration_history
--
-- PostgreSQL database dump
--

\restrict jrKtDU8LdlUwwaL3wyG0CTmgRwbwmch4vlhfsef4TXMbv6ANPfIfeTmQCppFcEw

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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


ALTER SEQUENCE public.migration_history_id_seq OWNER TO postgres;

--
-- Name: migration_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migration_history_id_seq OWNED BY public.migration_history.id;


--
-- Name: migration_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migration_history ALTER COLUMN id SET DEFAULT nextval('public.migration_history_id_seq'::regclass);


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
-- PostgreSQL database dump complete
--

\unrestrict jrKtDU8LdlUwwaL3wyG0CTmgRwbwmch4vlhfsef4TXMbv6ANPfIfeTmQCppFcEw



-- Dáta tabuľky: migration_history (1 záznamov)
-- COPY migration_history FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: pdf_protocols
--
-- PostgreSQL database dump
--

\restrict QVRIEKc0GkGUmzqOgnJMoDzJExD7wbQN63yGQdfpXkDzYgdNhgdKLypSKS4fox7

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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


ALTER SEQUENCE public.pdf_protocols_id_seq OWNER TO postgres;

--
-- Name: pdf_protocols_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pdf_protocols_id_seq OWNED BY public.pdf_protocols.id;


--
-- Name: pdf_protocols id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_protocols ALTER COLUMN id SET DEFAULT nextval('public.pdf_protocols_id_seq'::regclass);


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
-- Name: idx_pdf_protocols_rental; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pdf_protocols_rental ON public.pdf_protocols USING btree (rental_id);


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
-- PostgreSQL database dump complete
--

\unrestrict QVRIEKc0GkGUmzqOgnJMoDzJExD7wbQN63yGQdfpXkDzYgdNhgdKLypSKS4fox7



-- Tabuľka pdf_protocols je prázdna

-- Štruktúra tabuľky: users_advanced
--
-- PostgreSQL database dump
--

\restrict G7v9DKlgUId3bZdD0BUYYUkmJUxBW6T67T7oaoFhpVoPckqTYTg5UcXRFRL6jWa

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users_advanced; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_advanced (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    department_id uuid,
    username character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    middle_name character varying(255),
    phone character varying(50),
    avatar_url text,
    employee_number character varying(50),
    job_title character varying(255),
    hire_date date,
    termination_date date,
    salary numeric(12,2),
    manager_id uuid,
    role_id uuid NOT NULL,
    custom_permissions jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    email_verified_at timestamp without time zone,
    last_login_at timestamp without time zone,
    last_login_ip inet,
    login_count integer DEFAULT 0,
    failed_login_attempts integer DEFAULT 0,
    locked_until timestamp without time zone,
    two_factor_enabled boolean DEFAULT false,
    two_factor_secret character varying(255),
    backup_codes text[],
    language character varying(10) DEFAULT 'sk'::character varying,
    timezone character varying(100) DEFAULT 'Europe/Bratislava'::character varying,
    theme character varying(20) DEFAULT 'light'::character varying,
    preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by uuid
);


ALTER TABLE public.users_advanced OWNER TO postgres;

--
-- Name: users_advanced users_advanced_organization_id_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_advanced
    ADD CONSTRAINT users_advanced_organization_id_email_key UNIQUE (organization_id, email);


--
-- Name: users_advanced users_advanced_organization_id_employee_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_advanced
    ADD CONSTRAINT users_advanced_organization_id_employee_number_key UNIQUE (organization_id, employee_number);


--
-- Name: users_advanced users_advanced_organization_id_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_advanced
    ADD CONSTRAINT users_advanced_organization_id_username_key UNIQUE (organization_id, username);


--
-- Name: users_advanced users_advanced_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_advanced
    ADD CONSTRAINT users_advanced_pkey PRIMARY KEY (id);


--
-- Name: idx_users_advanced_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_advanced_active ON public.users_advanced USING btree (is_active);


--
-- Name: idx_users_advanced_department_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_advanced_department_id ON public.users_advanced USING btree (department_id);


--
-- Name: idx_users_advanced_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_advanced_email ON public.users_advanced USING btree (email);


--
-- Name: idx_users_advanced_last_login; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_advanced_last_login ON public.users_advanced USING btree (last_login_at);


--
-- Name: idx_users_advanced_manager_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_advanced_manager_id ON public.users_advanced USING btree (manager_id);


--
-- Name: idx_users_advanced_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_advanced_organization_id ON public.users_advanced USING btree (organization_id);


--
-- Name: idx_users_advanced_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_advanced_role_id ON public.users_advanced USING btree (role_id);


--
-- Name: users_advanced update_users_advanced_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_advanced_updated_at BEFORE UPDATE ON public.users_advanced FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users_advanced users_advanced_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_advanced
    ADD CONSTRAINT users_advanced_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: users_advanced users_advanced_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_advanced
    ADD CONSTRAINT users_advanced_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users_advanced(id);


--
-- Name: users_advanced users_advanced_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_advanced
    ADD CONSTRAINT users_advanced_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: users_advanced users_advanced_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_advanced
    ADD CONSTRAINT users_advanced_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict G7v9DKlgUId3bZdD0BUYYUkmJUxBW6T67T7oaoFhpVoPckqTYTg5UcXRFRL6jWa



-- Dáta tabuľky: users_advanced (3 záznamov)
-- COPY users_advanced FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: teams
--
-- PostgreSQL database dump
--

\restrict aTmtEqL2pjzhNOzXw1xQdIejvC28vBe9WeusaLTDKCcF7TJ7tuMuysrV2ijMfL0

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    team_lead_id uuid,
    is_active boolean DEFAULT true,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by uuid
);


ALTER TABLE public.teams OWNER TO postgres;

--
-- Name: teams teams_organization_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_organization_id_name_key UNIQUE (organization_id, name);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: teams update_teams_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: teams teams_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: teams teams_team_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_team_lead_id_fkey FOREIGN KEY (team_lead_id) REFERENCES public.users_advanced(id);


--
-- PostgreSQL database dump complete
--

\unrestrict aTmtEqL2pjzhNOzXw1xQdIejvC28vBe9WeusaLTDKCcF7TJ7tuMuysrV2ijMfL0



-- Dáta tabuľky: teams (3 záznamov)
-- COPY teams FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: team_members
--
-- PostgreSQL database dump
--

\restrict ItsNVjPbjNh2Y4tqZFgbiifOLb23GVIS1vgQEVMPUXR7OZdB10lf96T0P8zsPZA

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: team_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying(100) DEFAULT 'member'::character varying,
    joined_at timestamp without time zone DEFAULT now(),
    left_at timestamp without time zone,
    is_active boolean DEFAULT true
);


ALTER TABLE public.team_members OWNER TO postgres;

--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_team_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_user_id_key UNIQUE (team_id, user_id);


--
-- Name: team_members team_members_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users_advanced(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ItsNVjPbjNh2Y4tqZFgbiifOLb23GVIS1vgQEVMPUXR7OZdB10lf96T0P8zsPZA



-- Tabuľka team_members je prázdna

-- Štruktúra tabuľky: company_investor_shares
--
-- PostgreSQL database dump
--

\restrict Ke9rhBnsgX6N1Wx0y0gkC7gt82vJTSmmtkcms10I1BTIVKwxG7veldiefSyiOZ6

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: company_investor_shares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_investor_shares (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id integer NOT NULL,
    investor_id uuid NOT NULL,
    ownership_percentage numeric(5,2) NOT NULL,
    investment_amount numeric(12,2),
    investment_date date DEFAULT CURRENT_DATE,
    is_primary_contact boolean DEFAULT false,
    profit_share_percentage numeric(5,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_percentage CHECK (((ownership_percentage >= (0)::numeric) AND (ownership_percentage <= (100)::numeric)))
);


ALTER TABLE public.company_investor_shares OWNER TO postgres;

--
-- Name: company_investor_shares company_investor_shares_company_id_investor_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_investor_shares
    ADD CONSTRAINT company_investor_shares_company_id_investor_id_key UNIQUE (company_id, investor_id);


--
-- Name: company_investor_shares company_investor_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_investor_shares
    ADD CONSTRAINT company_investor_shares_pkey PRIMARY KEY (id);


--
-- Name: company_investor_shares company_investor_shares_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_investor_shares
    ADD CONSTRAINT company_investor_shares_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_investor_shares company_investor_shares_investor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_investor_shares
    ADD CONSTRAINT company_investor_shares_investor_id_fkey FOREIGN KEY (investor_id) REFERENCES public.company_investors(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Ke9rhBnsgX6N1Wx0y0gkC7gt82vJTSmmtkcms10I1BTIVKwxG7veldiefSyiOZ6



-- Dáta tabuľky: company_investor_shares (19 záznamov)
-- COPY company_investor_shares FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: user_permissions_cache
--
-- PostgreSQL database dump
--

\restrict g3ki1lSdzX7kxDnfLTcIMvawuRKnCiG3leU5ohDnUfbYrSfrU4dU09pT0ATTDc3

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: user_permissions_cache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_permissions_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    permissions jsonb NOT NULL,
    computed_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone NOT NULL
);


ALTER TABLE public.user_permissions_cache OWNER TO postgres;

--
-- Name: user_permissions_cache user_permissions_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions_cache
    ADD CONSTRAINT user_permissions_cache_pkey PRIMARY KEY (id);


--
-- Name: user_permissions_cache user_permissions_cache_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions_cache
    ADD CONSTRAINT user_permissions_cache_user_id_key UNIQUE (user_id);


--
-- Name: user_permissions_cache user_permissions_cache_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions_cache
    ADD CONSTRAINT user_permissions_cache_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users_advanced(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict g3ki1lSdzX7kxDnfLTcIMvawuRKnCiG3leU5ohDnUfbYrSfrU4dU09pT0ATTDc3



-- Tabuľka user_permissions_cache je prázdna

-- Štruktúra tabuľky: user_notification_preferences
--
-- PostgreSQL database dump
--

\restrict 0WIt3WvsL1lG5OARLkyI7cViGgL6ytC3rUzoJsCJsJ7L0wlET0lsOIA1FPr2n7o

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: user_notification_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email_enabled boolean DEFAULT true,
    push_enabled boolean DEFAULT true,
    sms_enabled boolean DEFAULT false,
    rental_requests boolean DEFAULT true,
    rental_approvals boolean DEFAULT true,
    rental_reminders boolean DEFAULT true,
    maintenance_alerts boolean DEFAULT true,
    payment_reminders boolean DEFAULT true,
    team_mentions boolean DEFAULT true,
    system_updates boolean DEFAULT true,
    quiet_hours_start time without time zone DEFAULT '22:00:00'::time without time zone,
    quiet_hours_end time without time zone DEFAULT '08:00:00'::time without time zone,
    weekend_notifications boolean DEFAULT false,
    daily_digest boolean DEFAULT false,
    weekly_digest boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_notification_preferences OWNER TO postgres;

--
-- Name: user_notification_preferences user_notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_notification_preferences user_notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_user_id_key UNIQUE (user_id);


--
-- Name: user_notification_preferences update_user_notification_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_notification_preferences_updated_at BEFORE UPDATE ON public.user_notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_notification_preferences user_notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users_advanced(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 0WIt3WvsL1lG5OARLkyI7cViGgL6ytC3rUzoJsCJsJ7L0wlET0lsOIA1FPr2n7o



-- Tabuľka user_notification_preferences je prázdna

-- Štruktúra tabuľky: email_action_logs
--
-- PostgreSQL database dump
--

\restrict PkWOibFYHz3alohTLEWePjBFMRThrRgLAZZymgV5A0vRT5jDQgO11eSobKfKQlL

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: email_action_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_action_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email_id uuid,
    user_id uuid,
    action text NOT NULL,
    old_values jsonb,
    new_values jsonb,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.email_action_logs OWNER TO postgres;

--
-- Name: email_action_logs email_action_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_action_logs
    ADD CONSTRAINT email_action_logs_pkey PRIMARY KEY (id);


--
-- Name: idx_email_action_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_action_logs_created_at ON public.email_action_logs USING btree (created_at DESC);


--
-- Name: idx_email_action_logs_email_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_action_logs_email_id ON public.email_action_logs USING btree (email_id);


--
-- Name: idx_email_action_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_action_logs_user_id ON public.email_action_logs USING btree (user_id);


--
-- Name: email_action_logs email_action_logs_email_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_action_logs
    ADD CONSTRAINT email_action_logs_email_id_fkey FOREIGN KEY (email_id) REFERENCES public.email_processing_history(id);


--
-- PostgreSQL database dump complete
--

\unrestrict PkWOibFYHz3alohTLEWePjBFMRThrRgLAZZymgV5A0vRT5jDQgO11eSobKfKQlL



-- Dáta tabuľky: email_action_logs (71 záznamov)
-- COPY email_action_logs FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: vehicle_documents_backup
--
-- PostgreSQL database dump
--

\restrict cJoNtUmYRKLVzleqvnDeeZMmMw0KyVBddc26gmv6SfmQBBapHxrlFcEgOrfAjwo

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: vehicle_documents_backup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle_documents_backup (
    id uuid,
    vehicle_id uuid,
    document_type character varying(20),
    valid_from date,
    valid_to date,
    document_number character varying(100),
    price numeric(10,2),
    notes text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    file_path text
);


ALTER TABLE public.vehicle_documents_backup OWNER TO postgres;

--
-- PostgreSQL database dump complete
--

\unrestrict cJoNtUmYRKLVzleqvnDeeZMmMw0KyVBddc26gmv6SfmQBBapHxrlFcEgOrfAjwo



-- Tabuľka vehicle_documents_backup je prázdna

-- Štruktúra tabuľky: vehicles
--
-- PostgreSQL database dump
--

\restrict 3H6VgytXmz8P8NwZn6jTGbXCkBo2O47Cwmwcpgeg4hfQaF9UQquVRwPMVneztJ8

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
-- Name: idx_vehicles_available_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicles_available_status ON public.vehicles USING btree (id, brand, model, license_plate) WHERE ((status)::text = 'available'::text);


--
-- Name: idx_vehicles_calendar_lookup_fixed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicles_calendar_lookup_fixed ON public.vehicles USING btree (id, status, brand, model) INCLUDE (license_plate, company);


--
-- Name: idx_vehicles_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicles_company_id ON public.vehicles USING btree (company_id);


--
-- Name: vehicles vehicles_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 3H6VgytXmz8P8NwZn6jTGbXCkBo2O47Cwmwcpgeg4hfQaF9UQquVRwPMVneztJ8



-- Dáta tabuľky: vehicles (102 záznamov)
-- COPY vehicles FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: vehicle_documents
--
-- PostgreSQL database dump
--

\restrict kREMCrW9ZGaiC8rasoQQdVbzqkrLGl5egOhcTeXNKjZTgW5dcGDe0NEJRVREB9g

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: vehicle_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vehicle_id integer NOT NULL,
    document_type character varying(30) NOT NULL,
    valid_from date,
    valid_to date NOT NULL,
    document_number character varying(100),
    price numeric(10,2),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    file_path text
);


ALTER TABLE public.vehicle_documents OWNER TO postgres;

--
-- Name: vehicle_documents vehicle_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_documents
    ADD CONSTRAINT vehicle_documents_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict kREMCrW9ZGaiC8rasoQQdVbzqkrLGl5egOhcTeXNKjZTgW5dcGDe0NEJRVREB9g



-- Dáta tabuľky: vehicle_documents (209 záznamov)
-- COPY vehicle_documents FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: expenses
--
-- PostgreSQL database dump
--

\restrict WibWBv4UCLpailaOuPvH5yhhKnRjZDVjEjEfNG0yWQuNgiyVbLZ6CuwfVgOYZsQ

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    company character varying(255),
    note text
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


ALTER SEQUENCE public.expenses_id_seq OWNER TO postgres;

--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(id);


--
-- Name: expenses fk_expenses_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT fk_expenses_category FOREIGN KEY (category) REFERENCES public.expense_categories(name) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict WibWBv4UCLpailaOuPvH5yhhKnRjZDVjEjEfNG0yWQuNgiyVbLZ6CuwfVgOYZsQ



-- Dáta tabuľky: expenses (487 záznamov)
-- COPY expenses FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: user_sessions
--
-- PostgreSQL database dump
--

\restrict y2gR1kxsC2nRJfgil8uLJQenShXjv2U65yGRdvKCrkpbkTCT9F8fXrM4g2bhpZY

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    ip_address inet,
    user_agent text,
    device_info jsonb,
    location jsonb,
    created_at timestamp without time zone DEFAULT now(),
    last_used_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone NOT NULL,
    is_active boolean DEFAULT true
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: idx_user_sessions_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_active ON public.user_sessions USING btree (is_active);


--
-- Name: idx_user_sessions_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions USING btree (expires_at);


--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users_advanced(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict y2gR1kxsC2nRJfgil8uLJQenShXjv2U65yGRdvKCrkpbkTCT9F8fXrM4g2bhpZY



-- Tabuľka user_sessions je prázdna

-- Štruktúra tabuľky: insurances
--
-- PostgreSQL database dump
--

\restrict AbU2qPqIfOUnouTpot0m6MKaOIadqfQBiIxg84LlmpYSNm3GVH3NY05xhG2aSkE

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
    price numeric(10,2),
    valid_from date,
    valid_to date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    payment_frequency character varying(20) DEFAULT 'yearly'::character varying NOT NULL,
    file_path text,
    vehicle_id integer,
    green_card_valid_from date,
    green_card_valid_to date,
    file_paths text[]
);


ALTER TABLE public.insurances OWNER TO postgres;

--
-- Name: TABLE insurances; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.insurances IS 'Poistky vozidiel - opravená schéma pre TypeScript kompatibilitu';


--
-- Name: COLUMN insurances.rental_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.insurances.rental_id IS 'ID prenájmu (legacy, môže byť NULL)';


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


ALTER SEQUENCE public.insurances_id_seq OWNER TO postgres;

--
-- Name: insurances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.insurances_id_seq OWNED BY public.insurances.id;


--
-- Name: insurances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurances ALTER COLUMN id SET DEFAULT nextval('public.insurances_id_seq'::regclass);


--
-- Name: insurances insurances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurances
    ADD CONSTRAINT insurances_pkey PRIMARY KEY (id);


--
-- Name: insurances fk_insurances_vehicle_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurances
    ADD CONSTRAINT fk_insurances_vehicle_id FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;


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
-- PostgreSQL database dump complete
--

\unrestrict AbU2qPqIfOUnouTpot0m6MKaOIadqfQBiIxg84LlmpYSNm3GVH3NY05xhG2aSkE



-- Dáta tabuľky: insurances (4 záznamov)
-- COPY insurances FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: expense_categories
--
-- PostgreSQL database dump
--

\restrict 7bmqmh8Zl1GVWMUwpHeumlEEpeDeqytmFRt3lX5S3IR91fPbVexj43jl9PTJ65C

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(100) NOT NULL,
    description text,
    icon character varying(50) DEFAULT 'receipt'::character varying,
    color character varying(20) DEFAULT 'primary'::character varying,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid
);


ALTER TABLE public.expense_categories OWNER TO postgres;

--
-- Name: TABLE expense_categories; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.expense_categories IS 'Vlastné kategórie nákladov - umožňuje používateľom vytvárať a spravovať vlastné kategórie';


--
-- Name: COLUMN expense_categories.name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.expense_categories.name IS 'Jedinečný identifikátor kategórie (používa sa ako FK)';


--
-- Name: COLUMN expense_categories.display_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.expense_categories.display_name IS 'Zobrazovaný názov kategórie v UI';


--
-- Name: COLUMN expense_categories.icon; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.expense_categories.icon IS 'Material UI icon name pre zobrazenie';


--
-- Name: COLUMN expense_categories.color; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.expense_categories.color IS 'MUI farba pre štýlovanie (primary, secondary, success, error, warning, info)';


--
-- Name: COLUMN expense_categories.is_default; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.expense_categories.is_default IS 'Označuje základné kategórie ktoré nemožno zmazať';


--
-- Name: COLUMN expense_categories.sort_order; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.expense_categories.sort_order IS 'Poradie zobrazovania v UI';


--
-- Name: expense_categories expense_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_name_key UNIQUE (name);


--
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- Name: idx_expense_categories_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expense_categories_active ON public.expense_categories USING btree (is_active);


--
-- Name: idx_expense_categories_default; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expense_categories_default ON public.expense_categories USING btree (is_default);


--
-- Name: idx_expense_categories_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expense_categories_name ON public.expense_categories USING btree (name);


--
-- Name: idx_expense_categories_sort; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expense_categories_sort ON public.expense_categories USING btree (sort_order, name);


--
-- Name: expense_categories trigger_expense_categories_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_expense_categories_updated_at BEFORE UPDATE ON public.expense_categories FOR EACH ROW EXECUTE FUNCTION public.update_expense_categories_updated_at();


--
-- PostgreSQL database dump complete
--

\unrestrict 7bmqmh8Zl1GVWMUwpHeumlEEpeDeqytmFRt3lX5S3IR91fPbVexj43jl9PTJ65C



-- Dáta tabuľky: expense_categories (14 záznamov)
-- COPY expense_categories FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: recurring_expenses
--
-- PostgreSQL database dump
--

\restrict Y0K3j2DbYYb7htkK4btsPaQR9G16xj6WzReQnZBhIq4BiM0nQTdTPQjbjJVrhdp

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: recurring_expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recurring_expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    category character varying(100) NOT NULL,
    company character varying(100) NOT NULL,
    vehicle_id uuid,
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
    CONSTRAINT recurring_expenses_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT recurring_expenses_dates_check CHECK (((end_date IS NULL) OR (end_date > start_date))),
    CONSTRAINT recurring_expenses_day_check CHECK (((day_of_month >= 1) AND (day_of_month <= 28)))
);


ALTER TABLE public.recurring_expenses OWNER TO postgres;

--
-- Name: TABLE recurring_expenses; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.recurring_expenses IS 'Pravidelné náklady ktoré sa automaticky generujú každý mesiac/štvrťrok/rok';


--
-- Name: COLUMN recurring_expenses.frequency; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recurring_expenses.frequency IS 'Frekvencia generovania: monthly, quarterly, yearly';


--
-- Name: COLUMN recurring_expenses.day_of_month; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recurring_expenses.day_of_month IS 'Deň v mesiaci kedy sa má vygenerovať (1-28)';


--
-- Name: COLUMN recurring_expenses.last_generated_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recurring_expenses.last_generated_date IS 'Dátum kedy sa naposledy vygeneroval náklad';


--
-- Name: COLUMN recurring_expenses.next_generation_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recurring_expenses.next_generation_date IS 'Dátum kedy sa má vygenerovať ďalší náklad';


--
-- Name: recurring_expenses recurring_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_pkey PRIMARY KEY (id);


--
-- Name: idx_recurring_expenses_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recurring_expenses_active ON public.recurring_expenses USING btree (is_active);


--
-- Name: idx_recurring_expenses_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recurring_expenses_category ON public.recurring_expenses USING btree (category);


--
-- Name: idx_recurring_expenses_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recurring_expenses_company ON public.recurring_expenses USING btree (company);


--
-- Name: idx_recurring_expenses_next_generation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recurring_expenses_next_generation ON public.recurring_expenses USING btree (next_generation_date) WHERE (is_active = true);


--
-- Name: idx_recurring_expenses_vehicle; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recurring_expenses_vehicle ON public.recurring_expenses USING btree (vehicle_id);


--
-- Name: recurring_expenses trigger_recurring_expenses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_recurring_expenses_updated_at BEFORE UPDATE ON public.recurring_expenses FOR EACH ROW EXECUTE FUNCTION public.update_recurring_expenses_updated_at();


--
-- Name: recurring_expenses trigger_set_initial_next_generation; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_set_initial_next_generation BEFORE INSERT ON public.recurring_expenses FOR EACH ROW EXECUTE FUNCTION public.set_initial_next_generation_date();


--
-- PostgreSQL database dump complete
--

\unrestrict Y0K3j2DbYYb7htkK4btsPaQR9G16xj6WzReQnZBhIq4BiM0nQTdTPQjbjJVrhdp



-- Tabuľka recurring_expenses je prázdna

-- Štruktúra tabuľky: rental_backups
--
-- PostgreSQL database dump
--

\restrict BzuNodptjwJmB30f1NbO2ojv0PJNT0oANjgAgboXQ4glpv2cEQFYoqukfjtfrnN

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: rental_backups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rental_backups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    original_rental_id uuid NOT NULL,
    backup_data jsonb NOT NULL,
    backup_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    backup_reason character varying(100) DEFAULT 'pre_update'::character varying
);


ALTER TABLE public.rental_backups OWNER TO postgres;

--
-- Name: rental_backups rental_backups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rental_backups
    ADD CONSTRAINT rental_backups_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict BzuNodptjwJmB30f1NbO2ojv0PJNT0oANjgAgboXQ4glpv2cEQFYoqukfjtfrnN



-- Dáta tabuľky: rental_backups (55 záznamov)
-- COPY rental_backups FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: companies
--
-- PostgreSQL database dump
--

\restrict YfldBTQH9P3prAf7kjALaoUS7oyS0x2f0UbpBHUWj0ymZrmV9UPCWAJukyRTg1N

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    personal_iban character varying(34),
    business_iban character varying(34),
    owner_name character varying(255),
    contact_email character varying(255),
    contact_phone character varying(50),
    default_commission_rate numeric(5,2) DEFAULT 20.00,
    is_active boolean DEFAULT true,
    protocol_display_name character varying(255)
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict YfldBTQH9P3prAf7kjALaoUS7oyS0x2f0UbpBHUWj0ymZrmV9UPCWAJukyRTg1N



-- Dáta tabuľky: companies (45 záznamov)
-- COPY companies FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: complete_backup_20250823
--
-- PostgreSQL database dump
--

\restrict HdjJVx4tt8XDoSsNpyiLDrKwoi1Yor5vJpFJv1YDkdxtNgtuVSOO4Rwe0Ju0I0w

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: complete_backup_20250823; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.complete_backup_20250823 (
    table_name text,
    count text
);


ALTER TABLE public.complete_backup_20250823 OWNER TO postgres;

--
-- PostgreSQL database dump complete
--

\unrestrict HdjJVx4tt8XDoSsNpyiLDrKwoi1Yor5vJpFJv1YDkdxtNgtuVSOO4Rwe0Ju0I0w



-- Dáta tabuľky: complete_backup_20250823 (7 záznamov)
-- COPY complete_backup_20250823 FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: rentals
--
-- PostgreSQL database dump
--

\restrict SoMe6sJPhITE6s0ZMAPM8V9tYzxU4NhXSAz29oHPPfhMIFK3L8pyokWnu8acjGz

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
    extra_kilometer_rate numeric(10,2) DEFAULT 0.30 NOT NULL,
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
    is_flexible boolean DEFAULT false,
    flexible_end_date date,
    customer_email character varying(255),
    customer_phone character varying(500),
    vehicle_name character varying(500),
    vehicle_code character varying(500),
    approval_status character varying(30) DEFAULT 'pending'::character varying,
    auto_processed_at timestamp without time zone,
    email_content text,
    rental_type character varying(20) DEFAULT 'standard'::character varying,
    can_be_overridden boolean DEFAULT false,
    override_priority integer DEFAULT 5,
    notification_threshold integer DEFAULT 3,
    auto_extend boolean DEFAULT false,
    override_history jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT rentals_extra_kilometer_rate_check CHECK ((extra_kilometer_rate >= (0)::numeric))
);


ALTER TABLE public.rentals OWNER TO postgres;

--
-- Name: COLUMN rentals.extra_kilometer_rate; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.rentals.extra_kilometer_rate IS 'Cena za extra kilometre pri prenájme (alias: extra_km_price)';


--
-- Name: rentals rentals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_pkey PRIMARY KEY (id);


--
-- Name: idx_rentals_active_recent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rentals_active_recent ON public.rentals USING btree (vehicle_id, start_date, end_date) WHERE ((status)::text = ANY (ARRAY[('active'::character varying)::text, ('confirmed'::character varying)::text]));


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
-- Name: idx_rentals_flexible_optimized; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rentals_flexible_optimized ON public.rentals USING btree (vehicle_id, is_flexible, start_date, end_date) WHERE (is_flexible = true);


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
-- PostgreSQL database dump complete
--

\unrestrict SoMe6sJPhITE6s0ZMAPM8V9tYzxU4NhXSAz29oHPPfhMIFK3L8pyokWnu8acjGz



-- Dáta tabuľky: rentals (544 záznamov)
-- COPY rentals FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: company_documents
--
-- PostgreSQL database dump
--

\restrict yuETcROIaA45zsKIn5NMqhoSffyx0lRbADstcWWXHhCz76uZxpY1hMNw0pPIgVj

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
-- Name: company_documents company_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_documents
    ADD CONSTRAINT company_documents_pkey PRIMARY KEY (id);


--
-- Name: idx_company_documents_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_documents_company_id ON public.company_documents USING btree (company_id);


--
-- Name: idx_company_documents_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_documents_created_at ON public.company_documents USING btree (created_at);


--
-- Name: idx_company_documents_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_documents_date ON public.company_documents USING btree (document_year, document_month);


--
-- Name: idx_company_documents_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_documents_type ON public.company_documents USING btree (document_type);


--
-- Name: company_documents trigger_company_documents_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_company_documents_updated_at BEFORE UPDATE ON public.company_documents FOR EACH ROW EXECUTE FUNCTION public.update_company_documents_updated_at();


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
-- PostgreSQL database dump complete
--

\unrestrict yuETcROIaA45zsKIn5NMqhoSffyx0lRbADstcWWXHhCz76uZxpY1hMNw0pPIgVj



-- Tabuľka company_documents je prázdna

-- Štruktúra tabuľky: flexible_rentals_backup_20250819
--
-- PostgreSQL database dump
--

\restrict r9Sib8yB7pXTkJWaSP2QcVqiHYd5SAistfRnLpuVN6ZyagBJ56lkzFwunWWL4aU

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: flexible_rentals_backup_20250819; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flexible_rentals_backup_20250819 (
    id integer,
    rental_type character varying(20),
    is_flexible boolean,
    flexible_end_date date,
    can_be_overridden boolean,
    override_priority integer,
    notification_threshold integer,
    auto_extend boolean,
    override_history text
);


ALTER TABLE public.flexible_rentals_backup_20250819 OWNER TO postgres;

--
-- PostgreSQL database dump complete
--

\unrestrict r9Sib8yB7pXTkJWaSP2QcVqiHYd5SAistfRnLpuVN6ZyagBJ56lkzFwunWWL4aU



-- Tabuľka flexible_rentals_backup_20250819 je prázdna

-- Štruktúra tabuľky: email_processing_history
--
-- PostgreSQL database dump
--

\restrict pgbg4G2hopKtRhMlSFEgDuE1drDBpLjGprKJchgbaghSmR2aaIJTVkY5r5UPqdV

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: email_processing_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_processing_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email_id text NOT NULL,
    message_id text,
    subject text NOT NULL,
    sender text NOT NULL,
    recipient text DEFAULT 'info@blackrent.sk'::text,
    email_content text,
    email_html text,
    received_at timestamp without time zone NOT NULL,
    processed_at timestamp without time zone,
    status text DEFAULT 'new'::text NOT NULL,
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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    archived_at timestamp without time zone,
    auto_archive_after_days integer DEFAULT 30,
    CONSTRAINT email_processing_history_action_taken_check CHECK ((action_taken = ANY (ARRAY['approved'::text, 'rejected'::text, 'edited'::text, 'deleted'::text, 'archived'::text, 'duplicate'::text]))),
    CONSTRAINT email_processing_history_status_check CHECK ((status = ANY (ARRAY['new'::text, 'processing'::text, 'processed'::text, 'rejected'::text, 'archived'::text, 'duplicate'::text])))
);


ALTER TABLE public.email_processing_history OWNER TO postgres;

--
-- Name: email_processing_history email_processing_history_email_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_processing_history
    ADD CONSTRAINT email_processing_history_email_id_key UNIQUE (email_id);


--
-- Name: email_processing_history email_processing_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_processing_history
    ADD CONSTRAINT email_processing_history_pkey PRIMARY KEY (id);


--
-- Name: idx_email_history_archived_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_history_archived_at ON public.email_processing_history USING btree (archived_at);


--
-- Name: idx_email_history_email_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_history_email_id ON public.email_processing_history USING btree (email_id);


--
-- Name: idx_email_history_processed_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_history_processed_by ON public.email_processing_history USING btree (processed_by);


--
-- Name: idx_email_history_received_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_history_received_at ON public.email_processing_history USING btree (received_at DESC);


--
-- Name: idx_email_history_rental_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_history_rental_id ON public.email_processing_history USING btree (rental_id);


--
-- Name: idx_email_history_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_history_search ON public.email_processing_history USING gin (to_tsvector('english'::regconfig, ((subject || ' '::text) || COALESCE(email_content, ''::text))));


--
-- Name: idx_email_history_sender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_history_sender ON public.email_processing_history USING btree (sender);


--
-- Name: idx_email_history_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_history_status ON public.email_processing_history USING btree (status);


--
-- Name: email_processing_history trigger_email_history_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_email_history_updated_at BEFORE UPDATE ON public.email_processing_history FOR EACH ROW EXECUTE FUNCTION public.update_email_history_updated_at();


--
-- Name: email_processing_history email_processing_history_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_processing_history
    ADD CONSTRAINT email_processing_history_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(id);


--
-- PostgreSQL database dump complete
--

\unrestrict pgbg4G2hopKtRhMlSFEgDuE1drDBpLjGprKJchgbaghSmR2aaIJTVkY5r5UPqdV



-- Dáta tabuľky: email_processing_history (32 záznamov)
-- COPY email_processing_history FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: vehicles_backup_20250823
--
-- PostgreSQL database dump
--

\restrict PnWmNWE5cEZhuRXRj87MTyrloBqZN53ik1OIU5gmoZ2VnSXUI7HfTfRBAU7uOk9

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: vehicles_backup_20250823; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles_backup_20250823 (
    id integer,
    company_id integer,
    brand character varying(50),
    model character varying(50),
    year integer,
    license_plate character varying(50),
    vin character varying(50),
    color character varying(30),
    fuel_type character varying(20),
    transmission character varying(20),
    category character varying(30),
    daily_rate numeric(10,2),
    status character varying(30),
    created_at timestamp without time zone,
    company character varying(100),
    pricing jsonb,
    commission jsonb,
    stk date
);


ALTER TABLE public.vehicles_backup_20250823 OWNER TO postgres;

--
-- PostgreSQL database dump complete
--

\unrestrict PnWmNWE5cEZhuRXRj87MTyrloBqZN53ik1OIU5gmoZ2VnSXUI7HfTfRBAU7uOk9



-- Dáta tabuľky: vehicles_backup_20250823 (125 záznamov)
-- COPY vehicles_backup_20250823 FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: rentals_backup_20250823
--
-- PostgreSQL database dump
--

\restrict 6K4fjZuHftwl2IydJ9ZN2cD1twk2hA8XJCFhdyaoQvADJyG7CYMlPte1OEweTpk

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: rentals_backup_20250823; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rentals_backup_20250823 (
    id integer,
    customer_id integer,
    vehicle_id integer,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    total_price numeric(10,2),
    deposit numeric(10,2),
    currency character varying(10),
    allowed_kilometers integer,
    extra_kilometer_rate numeric(10,2),
    customer_name character varying(500),
    order_number character varying(500),
    handover_place character varying(500),
    payment_method character varying(500),
    discount_percent numeric(5,2),
    discount_amount numeric(10,2),
    commission_percent numeric(5,2),
    commission_amount numeric(10,2),
    paid boolean,
    status character varying(30),
    notes text,
    created_at timestamp without time zone,
    commission numeric(10,2),
    discount text,
    custom_commission text,
    extra_km_charge numeric(10,2),
    payments jsonb,
    history jsonb,
    confirmed boolean,
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
    is_flexible boolean,
    flexible_end_date date,
    customer_email character varying(255),
    customer_phone character varying(500),
    vehicle_name character varying(500),
    vehicle_code character varying(500),
    approval_status character varying(30),
    auto_processed_at timestamp without time zone,
    email_content text,
    rental_type character varying(20),
    can_be_overridden boolean,
    override_priority integer,
    notification_threshold integer,
    auto_extend boolean,
    override_history jsonb
);


ALTER TABLE public.rentals_backup_20250823 OWNER TO postgres;

--
-- PostgreSQL database dump complete
--

\unrestrict 6K4fjZuHftwl2IydJ9ZN2cD1twk2hA8XJCFhdyaoQvADJyG7CYMlPte1OEweTpk



-- Dáta tabuľky: rentals_backup_20250823 (874 záznamov)
-- COPY rentals_backup_20250823 FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: photo_metadata_v2
--
-- PostgreSQL database dump
--

\restrict VOz8aIsNfhr33EhTULpmJ6sTu0JR87grVdKgGWItc0nlygE7Beh7e66KIvEhyew

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
-- PostgreSQL database dump complete
--

\unrestrict VOz8aIsNfhr33EhTULpmJ6sTu0JR87grVdKgGWItc0nlygE7Beh7e66KIvEhyew



-- Tabuľka photo_metadata_v2 je prázdna

-- Štruktúra tabuľky: photo_derivatives
--
-- PostgreSQL database dump
--

\restrict ODX1zChl3Gy8gyLTL4Ku0rTkWw2lEfRRgGfZk8ErZ48Sv7lE9dygG4RXt93Ve1T

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
-- Name: photo_derivatives photo_derivatives_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photo_derivatives
    ADD CONSTRAINT photo_derivatives_pkey PRIMARY KEY (id);


--
-- Name: idx_photo_derivatives_photo_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_photo_derivatives_photo_id ON public.photo_derivatives USING btree (photo_id);


--
-- Name: idx_photo_derivatives_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_photo_derivatives_unique ON public.photo_derivatives USING btree (photo_id, derivative_type);


--
-- PostgreSQL database dump complete
--

\unrestrict ODX1zChl3Gy8gyLTL4Ku0rTkWw2lEfRRgGfZk8ErZ48Sv7lE9dygG4RXt93Ve1T



-- Tabuľka photo_derivatives je prázdna

-- Štruktúra tabuľky: recurring_expense_generations
--
-- PostgreSQL database dump
--

\restrict ZHz7qgxqZkTNjyw0VM0E7nOih8VjZe0PSIxrNEMtLsipaibV4MGfZuZiQphC2MI

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: recurring_expense_generations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recurring_expense_generations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recurring_expense_id uuid NOT NULL,
    generated_expense_id integer NOT NULL,
    generation_date date NOT NULL,
    generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    generated_by character varying(50) DEFAULT 'system'::character varying
);


ALTER TABLE public.recurring_expense_generations OWNER TO postgres;

--
-- Name: TABLE recurring_expense_generations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.recurring_expense_generations IS 'Log všetkých vygenerovaných nákladov z pravidelných šablón - opravené typy';


--
-- Name: COLUMN recurring_expense_generations.generated_expense_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recurring_expense_generations.generated_expense_id IS 'INTEGER ID z expenses tabuľky';


--
-- Name: recurring_expense_generations recurring_expense_generations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_expense_generations
    ADD CONSTRAINT recurring_expense_generations_pkey PRIMARY KEY (id);


--
-- Name: recurring_expense_generations recurring_expense_generations_recurring_expense_id_generati_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_expense_generations
    ADD CONSTRAINT recurring_expense_generations_recurring_expense_id_generati_key UNIQUE (recurring_expense_id, generation_date);


--
-- Name: idx_recurring_generations_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recurring_generations_date ON public.recurring_expense_generations USING btree (generation_date);


--
-- Name: idx_recurring_generations_expense_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recurring_generations_expense_id ON public.recurring_expense_generations USING btree (generated_expense_id);


--
-- Name: idx_recurring_generations_recurring_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recurring_generations_recurring_id ON public.recurring_expense_generations USING btree (recurring_expense_id);


--
-- Name: recurring_expense_generations recurring_expense_generations_recurring_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_expense_generations
    ADD CONSTRAINT recurring_expense_generations_recurring_expense_id_fkey FOREIGN KEY (recurring_expense_id) REFERENCES public.recurring_expenses(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ZHz7qgxqZkTNjyw0VM0E7nOih8VjZe0PSIxrNEMtLsipaibV4MGfZuZiQphC2MI



-- Tabuľka recurring_expense_generations je prázdna

-- Štruktúra tabuľky: protocol_processing_jobs
--
-- PostgreSQL database dump
--

\restrict VMbOb68q7EkVm17vTDvE37YBGfhMPKh9pFrQ4EgLHYPURXgG5dHNSA27avMI85t

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
-- Name: protocol_processing_jobs protocol_processing_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.protocol_processing_jobs
    ADD CONSTRAINT protocol_processing_jobs_pkey PRIMARY KEY (id);


--
-- Name: idx_protocol_jobs_protocol_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_protocol_jobs_protocol_id ON public.protocol_processing_jobs USING btree (protocol_id);


--
-- Name: idx_protocol_jobs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_protocol_jobs_status ON public.protocol_processing_jobs USING btree (status);


--
-- PostgreSQL database dump complete
--

\unrestrict VMbOb68q7EkVm17vTDvE37YBGfhMPKh9pFrQ4EgLHYPURXgG5dHNSA27avMI85t



-- Tabuľka protocol_processing_jobs je prázdna

-- Štruktúra tabuľky: feature_flags
--
-- PostgreSQL database dump
--

\restrict ipr2YpelgapJMHcmXihcm8TGp66HoP9fvZgJmuQ8LLnnSqveS5qEkhbSNmuUgWS

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
-- PostgreSQL database dump complete
--

\unrestrict ipr2YpelgapJMHcmXihcm8TGp66HoP9fvZgJmuQ8LLnnSqveS5qEkhbSNmuUgWS



-- Dáta tabuľky: feature_flags (4 záznamov)
-- COPY feature_flags FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: protocol_versions
--
-- PostgreSQL database dump
--

\restrict a8Z2alzsOKhZ7NrjbKa4bGQB6XfGGbdL45LdeUgdymwpHNaGk7EUpZIcIGpLUvy

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
-- PostgreSQL database dump complete
--

\unrestrict a8Z2alzsOKhZ7NrjbKa4bGQB6XfGGbdL45LdeUgdymwpHNaGk7EUpZIcIGpLUvy



-- Tabuľka protocol_versions je prázdna

-- Štruktúra tabuľky: users
--
-- PostgreSQL database dump
--

\restrict RlP4LtghLVVbbqqcbqzBZ0KGHrrpM6aOsb7SAOWbngfK0bHyYcFwDuv0ecOi84c

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    linked_investor_id uuid
);


ALTER TABLE public.users OWNER TO postgres;

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
-- Name: users users_linked_investor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_linked_investor_id_fkey FOREIGN KEY (linked_investor_id) REFERENCES public.company_investors(id);


--
-- PostgreSQL database dump complete
--

\unrestrict RlP4LtghLVVbbqqcbqzBZ0KGHrrpM6aOsb7SAOWbngfK0bHyYcFwDuv0ecOi84c



-- Dáta tabuľky: users (10 záznamov)
-- COPY users FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: return_protocols
--
-- PostgreSQL database dump
--

\restrict HAz7TI9CTmm5j6pwR27sgtepygOgyTIGgoLFMMzxsPzSFEj21cBfh2iLxhqJQul

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: return_protocols; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.return_protocols OWNER TO postgres;

--
-- Name: return_protocols return_protocols_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_protocols
    ADD CONSTRAINT return_protocols_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict HAz7TI9CTmm5j6pwR27sgtepygOgyTIGgoLFMMzxsPzSFEj21cBfh2iLxhqJQul



-- Dáta tabuľky: return_protocols (15 záznamov)
-- COPY return_protocols FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií

-- Štruktúra tabuľky: handover_protocols
--
-- PostgreSQL database dump
--

\restrict KfspQVRyYDi3nRWHDFvoncYXlwU7up03cRkdXDRZfuWhTJdGxjkdfiZHke3o4cy

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg11+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: handover_protocols; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.handover_protocols OWNER TO postgres;

--
-- Name: handover_protocols handover_protocols_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.handover_protocols
    ADD CONSTRAINT handover_protocols_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict KfspQVRyYDi3nRWHDFvoncYXlwU7up03cRkdXDRZfuWhTJdGxjkdfiZHke3o4cy



-- Dáta tabuľky: handover_protocols (28 záznamov)
-- COPY handover_protocols FROM STDIN;
-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií
