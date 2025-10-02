COPY public.companies (id, name, address, phone, email, ic, dic, created_at) FROM stdin;
11	Lubka	\N	\N	\N	\N	\N	2025-08-06 02:13:42.048938
12	ABC Rent	\N	\N	\N	\N	\N	2025-08-22 19:58:05.128471
13	Premium Cars	\N	\N	\N	\N	\N	2025-08-22 19:58:05.128471
14	City Rent	\N	\N	\N	\N	\N	2025-08-22 19:58:05.128471
\.


--
-- Data for Name: company_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_documents (id, company_id, document_type, document_month, document_year, document_name, description, file_path, file_size, file_type, original_filename, created_at, updated_at, created_by) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, first_name, last_name, email, phone, address, birth_date, id_number, driver_license, created_at, name) FROM stdin;
\.


--
-- Data for Name: email_blacklist; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_blacklist (id, order_number, reason, created_at, created_by, notes) FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, rental_id, vehicle_id, category, description, amount, date, created_at) FROM stdin;
\.


--
-- Data for Name: feature_flags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feature_flags (id, flag_name, enabled, percentage, allowed_users, start_date, end_date, description, metadata, created_at, updated_at) FROM stdin;
ea4da937-c0c1-4074-953a-deaac2d4dce0	PROTOCOL_V2	f	0	\N	\N	\N	Hlavný V2 protokol systém	{}	2025-08-31 19:18:39.074788	2025-08-31 19:18:39.074788
adbec47e-41e6-44aa-831a-454007f5b10b	PROTOCOL_V2_PHOTO_PROCESSING	f	0	\N	\N	\N	V2 photo processing s derivatívami	{}	2025-08-31 19:18:39.074788	2025-08-31 19:18:39.074788
c1aabe1d-7ef2-4c4c-84dc-6eab59e221e2	PROTOCOL_V2_PDF_GENERATION	f	0	\N	\N	\N	V2 PDF generovanie s queue	{}	2025-08-31 19:18:39.074788	2025-08-31 19:18:39.074788
3c417d2a-7a07-4142-bd40-2764f3362a6e	PROTOCOL_V2_QUEUE_SYSTEM	f	0	\N	\N	\N	Background queue processing	{}	2025-08-31 19:18:39.074788	2025-08-31 19:18:39.074788
\.


--
-- Data for Name: handover_protocols; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.handover_protocols (id, rental_id, type, status, location, created_at, completed_at, odometer, fuel_level, fuel_type, exterior_condition, interior_condition, condition_notes, vehicle_images_urls, vehicle_videos_urls, document_images_urls, damage_images_urls, damages, signatures, rental_data, pdf_url, email_sent, notes, created_by) FROM stdin;
\.


--
-- Data for Name: insurance_claims; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.insurance_claims (id, vehicle_id, insurance_id, incident_date, reported_date, claim_number, description, location, incident_type, estimated_damage, deductible, payout_amount, status, file_paths, police_report_number, other_party_info, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: insurances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.insurances (id, rental_id, insurer_id, policy_number, type, coverage_amount, premium, start_date, end_date, created_at, payment_frequency, file_path, file_paths) FROM stdin;
\.


--
-- Data for Name: insurers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.insurers (id, name, address, phone, email, created_at) FROM stdin;
9	Allianz	\N	\N	\N	2025-08-22 19:58:05.131624
10	Generali	\N	\N	\N	2025-08-22 19:58:05.131624
\.


--
-- Data for Name: migration_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migration_history (id, migration_name, executed_at, success) FROM stdin;
\.


--
-- Data for Name: pdf_protocols; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pdf_protocols (id, protocol_id, rental_id, customer_id, vehicle_id, type, pdf_data, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: photo_derivatives; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.photo_derivatives (id, photo_id, derivative_type, url, file_size, width, height, format, quality, created_at) FROM stdin;
\.


--
-- Data for Name: photo_metadata_v2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.photo_metadata_v2 (id, photo_id, hash_sha256, original_size, processing_time, savings_percentage, device_info, exif_data, processing_config, version, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: protocol_processing_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.protocol_processing_jobs (id, protocol_id, job_type, job_id, status, progress, started_at, completed_at, error_message, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: protocol_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.protocol_versions (id, protocol_id, version, migrated_at, migration_reason, created_at) FROM stdin;
\.


--
-- Data for Name: protocols; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.protocols (id, rental_id, type, status, location, odometer, fuel_level, notes, media_urls, damages, created_by, created_at, completed_at, updated_at) FROM stdin;
\.


--
-- Data for Name: rentals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rentals (id, customer_id, vehicle_id, start_date, end_date, total_price, deposit, currency, allowed_kilometers, extra_kilometer_rate, customer_name, order_number, handover_place, payment_method, discount_percent, discount_amount, commission_percent, commission_amount, paid, status, notes, created_at, commission, discount, custom_commission, extra_km_charge, payments, history, confirmed, daily_kilometers, return_conditions, fuel_level, odometer, return_fuel_level, return_odometer, actual_kilometers, fuel_refill_cost, handover_protocol_id, return_protocol_id, company, rental_type, is_flexible, flexible_end_date, can_be_overridden, override_priority, notification_threshold, auto_extend, override_history, customer_email, customer_phone, vehicle_name, vehicle_code, approval_status, auto_processed_at, email_content) FROM stdin;
\.


--
-- Data for Name: return_protocols; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.return_protocols (id, rental_id, handover_protocol_id, type, status, location, created_at, completed_at, odometer, fuel_level, fuel_type, exterior_condition, interior_condition, condition_notes, vehicle_images_urls, vehicle_videos_urls, document_images_urls, damage_images_urls, damages, new_damages, signatures, kilometers_used, kilometer_overage, kilometer_fee, fuel_used, fuel_fee, total_extra_fees, deposit_refund, additional_charges, final_refund, rental_data, pdf_url, email_sent, email_sent_at, notes, created_by) FROM stdin;
\.


--
-- Data for Name: settlements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settlements (id, period_from, period_to, vehicle_id, rental_ids, expense_ids, total_income, total_expenses, total_commission, profit, description, status, created_by, created_at, updated_at) FROM stdin;
1	2025-01-01	2025-01-15	\N	{1,6}	{1,6,12}	425.00	85.50	63.75	276.25	Vyúčtovanie pre AutoRent Slovakia - 1. polrok januára	completed	1	2025-07-18 22:02:34.361939	2025-07-18 22:02:34.361939
2	2025-01-01	2025-01-31	\N	{2,7}	{2,9}	1085.00	60.00	217.00	808.00	Vyúčtovanie pre Európsku autopožičovňu - január	completed	1	2025-07-18 22:02:34.361939	2025-07-18 22:02:34.361939
3	2025-01-20	2025-01-31	\N	{3}	{3}	195.00	25.00	23.40	146.60	Vyúčtovanie pre Rent A Car Plus - koniec januára	draft	1	2025-07-18 22:02:34.361939	2025-07-18 22:02:34.361939
4	2025-01-12	2025-01-19	\N	{4,8}	{4,7,13}	575.00	108.00	86.25	380.75	Vyúčtovanie pre Budget Car Slovakia - stred januára	completed	1	2025-07-18 22:02:34.361939	2025-07-18 22:02:34.361939
5	2025-01-22	2025-01-31	\N	{5}	{5,8,11}	840.00	655.00	210.00	-25.00	Vyúčtovanie pre Luxury Cars Rent - koniec januára	draft	1	2025-07-18 22:02:34.361939	2025-07-18 22:02:34.361939
6	2025-01-01	2025-01-31	\N	{1,2,3,4,5,6,7,8}	{1,2,3,4,5,6,7,8,9,10,11,12,13,14}	3915.00	1246.50	695.35	1973.15	Celkové vyúčtovanie za január 2025	completed	1	2025-07-18 22:02:34.361939	2025-07-18 22:02:34.361939
\.


--
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_permissions (id, user_id, company_id, permissions, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (username, email, password_hash, role, created_at, updated_at, company_id, employee_number, hire_date, is_active, last_login, first_name, last_name, signature_template, id) FROM stdin;
admin	admin@blackrent.sk	$2a$12$5MNIbKw.qY00xnir0GIMBOGL14yBrRXXeAegbD8/qT7zWk07.fzYS	admin	2025-08-22 19:56:38.57993	2025-08-22 19:56:38.57993	\N	\N	\N	t	\N	\N	\N	\N	7fb45928-4672-4001-98eb-2e7054f5456b
\.


--
-- Data for Name: vehicle_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicle_documents (id, vehicle_id, document_type, valid_from, valid_to, document_number, price, notes, file_path, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: vehicle_unavailability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicle_unavailability (id, vehicle_id, start_date, end_date, reason, type, notes, priority, recurring, recurring_config, created_at, updated_at, created_by) FROM stdin;
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicles (id, company_id, brand, model, year, license_plate, vin, color, fuel_type, transmission, category, daily_rate, status, created_at, company, pricing, commission, stk) FROM stdin;
20	\N	BMW	X5	\N	BA123AB	\N	\N	\N	\N	\N	\N	available	2025-08-22 19:58:05.133335	ABC Rent	[{"id": "1", "maxDays": 1, "minDays": 0, "pricePerDay": 104}, {"id": "2", "maxDays": 3, "minDays": 2, "pricePerDay": 98}, {"id": "3", "maxDays": 7, "minDays": 4, "pricePerDay": 91}, {"id": "4", "maxDays": 14, "minDays": 8, "pricePerDay": 78}, {"id": "5", "maxDays": 22, "minDays": 15, "pricePerDay": 72}, {"id": "6", "maxDays": 30, "minDays": 23, "pricePerDay": 65}, {"id": "7", "maxDays": 365, "minDays": 31, "pricePerDay": 59}]	{"type": "percentage", "value": 20}	\N
21	\N	Mercedes	E-Class	\N	BA456CD	\N	\N	\N	\N	\N	\N	available	2025-08-22 19:58:05.133335	Premium Cars	[{"id": "1", "maxDays": 1, "minDays": 0, "pricePerDay": 104}, {"id": "2", "maxDays": 3, "minDays": 2, "pricePerDay": 98}, {"id": "3", "maxDays": 7, "minDays": 4, "pricePerDay": 91}, {"id": "4", "maxDays": 14, "minDays": 8, "pricePerDay": 78}, {"id": "5", "maxDays": 22, "minDays": 15, "pricePerDay": 72}, {"id": "6", "maxDays": 30, "minDays": 23, "pricePerDay": 65}, {"id": "7", "maxDays": 365, "minDays": 31, "pricePerDay": 59}]	{"type": "percentage", "value": 20}	\N
22	\N	Audi	A4	\N	BA789EF	\N	\N	\N	\N	\N	\N	available	2025-08-22 19:58:05.133335	City Rent	[{"id": "1", "maxDays": 1, "minDays": 0, "pricePerDay": 80}, {"id": "2", "maxDays": 3, "minDays": 2, "pricePerDay": 75}, {"id": "3", "maxDays": 7, "minDays": 4, "pricePerDay": 70}, {"id": "4", "maxDays": 14, "minDays": 8, "pricePerDay": 60}, {"id": "5", "maxDays": 22, "minDays": 15, "pricePerDay": 55}, {"id": "6", "maxDays": 30, "minDays": 23, "pricePerDay": 50}, {"id": "7", "maxDays": 365, "minDays": 31, "pricePerDay": 45}]	{"type": "percentage", "value": 20}	\N
\.
