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
-- Name: CommissionType; Type: TYPE; Schema: public; Owner: blackrent
--

CREATE TYPE public."CommissionType" AS ENUM (
    'PERCENT',
    'FIXED'
);


ALTER TYPE public."CommissionType" OWNER TO blackrent;

--
-- Name: DiscountType; Type: TYPE; Schema: public; Owner: blackrent
--

CREATE TYPE public."DiscountType" AS ENUM (
    'PERCENT',
    'FIXED'
);


ALTER TYPE public."DiscountType" OWNER TO blackrent;

--
-- Name: RentalStatus; Type: TYPE; Schema: public; Owner: blackrent
--

CREATE TYPE public."RentalStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."RentalStatus" OWNER TO blackrent;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: blackrent
--

CREATE TYPE public."Role" AS ENUM (
    'USER',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO blackrent;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Car; Type: TABLE; Schema: public; Owner: blackrent
--

CREATE TABLE public."Car" (
    id text NOT NULL,
    name text NOT NULL,
    "licensePlate" text NOT NULL,
    owner text NOT NULL,
    location text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Car" OWNER TO blackrent;

--
-- Name: PriceList; Type: TABLE; Schema: public; Owner: blackrent
--

CREATE TABLE public."PriceList" (
    id text NOT NULL,
    "carId" text NOT NULL,
    days integer NOT NULL,
    price double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PriceList" OWNER TO blackrent;

--
-- Name: Rental; Type: TABLE; Schema: public; Owner: blackrent
--

CREATE TABLE public."Rental" (
    id text NOT NULL,
    "carId" text NOT NULL,
    "userId" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "basePrice" double precision NOT NULL,
    "discountType" public."DiscountType",
    "discountValue" double precision,
    "finalPrice" double precision NOT NULL,
    "commissionType" public."CommissionType" NOT NULL,
    "commissionValue" double precision NOT NULL,
    "commissionAmount" double precision NOT NULL,
    status public."RentalStatus" DEFAULT 'PENDING'::public."RentalStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Rental" OWNER TO blackrent;

--
-- Name: User; Type: TABLE; Schema: public; Owner: blackrent
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO blackrent;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100),
    phone character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    date timestamp without time zone NOT NULL,
    vehicle_id uuid,
    company character varying(100) NOT NULL,
    category character varying(50) NOT NULL,
    note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: insurances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.insurances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vehicle_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    valid_from timestamp without time zone NOT NULL,
    valid_to timestamp without time zone NOT NULL,
    price numeric(10,2) NOT NULL,
    company character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.insurances OWNER TO postgres;

--
-- Name: insurers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.insurers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.insurers OWNER TO postgres;

--
-- Name: rentals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rentals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vehicle_id uuid NOT NULL,
    customer_id uuid,
    customer_name character varying(100) NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    total_price numeric(10,2) NOT NULL,
    commission numeric(10,2) NOT NULL,
    payment_method character varying(50) NOT NULL,
    discount text,
    custom_commission text,
    extra_km_charge numeric(10,2),
    paid boolean DEFAULT false,
    status character varying(20) DEFAULT 'pending'::character varying,
    handover_place text,
    confirmed boolean DEFAULT false,
    payments jsonb,
    history jsonb,
    order_number character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.rentals OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand character varying(100) NOT NULL,
    model character varying(100) NOT NULL,
    license_plate character varying(20) NOT NULL,
    company character varying(100) NOT NULL,
    pricing jsonb NOT NULL,
    commission jsonb NOT NULL,
    status character varying(20) DEFAULT 'available'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- Data for Name: Car; Type: TABLE DATA; Schema: public; Owner: blackrent
--

COPY public."Car" (id, name, "licensePlate", owner, location, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PriceList; Type: TABLE DATA; Schema: public; Owner: blackrent
--

COPY public."PriceList" (id, "carId", days, price, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Rental; Type: TABLE DATA; Schema: public; Owner: blackrent
--

COPY public."Rental" (id, "carId", "userId", "startDate", "endDate", "basePrice", "discountType", "discountValue", "finalPrice", "commissionType", "commissionValue", "commissionAmount", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: blackrent
--

COPY public."User" (id, email, password, name, role, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, name, created_at, updated_at) FROM stdin;
23b44be0-6886-4fc2-882b-8b49320b9649	Marko	2025-07-13 22:33:30.159727	2025-07-13 22:33:30.159727
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, email, phone, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, description, amount, date, vehicle_id, company, category, note, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: insurances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.insurances (id, vehicle_id, type, valid_from, valid_to, price, company, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: insurers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.insurers (id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: rentals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rentals (id, vehicle_id, customer_id, customer_name, start_date, end_date, total_price, commission, payment_method, discount, custom_commission, extra_km_charge, paid, status, handover_place, confirmed, payments, history, order_number, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, role, created_at, updated_at) FROM stdin;
fa3ad0ca-235a-40f0-b6f6-1e179410958d	admin	admin@blackrent.sk	$2a$12$pVIcdB87Vq7VgxTEelhzhOdNqLjGKmLOvN2TfQ9APoayWC2PnD79u	admin	2025-07-13 22:21:56.609208	2025-07-13 22:21:56.609208
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicles (id, brand, model, license_plate, company, pricing, commission, status, created_at, updated_at) FROM stdin;
\.


--
-- Name: Car Car_pkey; Type: CONSTRAINT; Schema: public; Owner: blackrent
--

ALTER TABLE ONLY public."Car"
    ADD CONSTRAINT "Car_pkey" PRIMARY KEY (id);


--
-- Name: PriceList PriceList_pkey; Type: CONSTRAINT; Schema: public; Owner: blackrent
--

ALTER TABLE ONLY public."PriceList"
    ADD CONSTRAINT "PriceList_pkey" PRIMARY KEY (id);


--
-- Name: Rental Rental_pkey; Type: CONSTRAINT; Schema: public; Owner: blackrent
--

ALTER TABLE ONLY public."Rental"
    ADD CONSTRAINT "Rental_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: blackrent
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: companies companies_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_name_key UNIQUE (name);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: insurances insurances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurances
    ADD CONSTRAINT insurances_pkey PRIMARY KEY (id);


--
-- Name: insurers insurers_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurers
    ADD CONSTRAINT insurers_name_key UNIQUE (name);


--
-- Name: insurers insurers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurers
    ADD CONSTRAINT insurers_pkey PRIMARY KEY (id);


--
-- Name: rentals rentals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_pkey PRIMARY KEY (id);


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
-- Name: Car_licensePlate_key; Type: INDEX; Schema: public; Owner: blackrent
--

CREATE UNIQUE INDEX "Car_licensePlate_key" ON public."Car" USING btree ("licensePlate");


--
-- Name: PriceList_carId_days_key; Type: INDEX; Schema: public; Owner: blackrent
--

CREATE UNIQUE INDEX "PriceList_carId_days_key" ON public."PriceList" USING btree ("carId", days);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: blackrent
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: PriceList PriceList_carId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: blackrent
--

ALTER TABLE ONLY public."PriceList"
    ADD CONSTRAINT "PriceList_carId_fkey" FOREIGN KEY ("carId") REFERENCES public."Car"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Rental Rental_carId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: blackrent
--

ALTER TABLE ONLY public."Rental"
    ADD CONSTRAINT "Rental_carId_fkey" FOREIGN KEY ("carId") REFERENCES public."Car"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Rental Rental_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: blackrent
--

ALTER TABLE ONLY public."Rental"
    ADD CONSTRAINT "Rental_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: expenses expenses_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;


--
-- Name: insurances insurances_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurances
    ADD CONSTRAINT insurances_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- Name: rentals rentals_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: rentals rentals_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

