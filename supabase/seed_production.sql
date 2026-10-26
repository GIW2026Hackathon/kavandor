-- Production Certified Facilities and Capacity Slots
-- Kisii & Nyamira Agricultural Supply Network

insert into public.facilities (
  id, name, county, location, type, facility_type, description, address,
  latitude, longitude, accepted_commodities, storage_types,
  price_per_unit, price_unit, price_period, minimum_quantity, capacity_unit,
  condition_targets, verification_status, verified_at, is_demo, demo_data
)
values
(
  'f0000001-0000-0000-0000-000000000001',
  'Kisii Central Cold Store Hub',
  'Kisii',
  'Kisii Town',
  'cold_storage',
  'cold_storage',
  'Certified precision cold room operating at 11-13°C with solar backup power, digital intake scales, and active ethylene scrubbing.',
  'Hospital Road, Kisii Central, Kisii County',
  -0.681700,
  34.773100,
  '["Tomatoes", "Avocados", "Bananas"]'::jsonb,
  '["cold"]'::jsonb,
  3.20,
  'kg',
  'day',
  50.00,
  'kg',
  '{"temperature_min": 11, "temperature_max": 13, "humidity_min": 80, "humidity_max": 85}'::jsonb,
  'verified',
  now(),
  false,
  false
),
(
  'f0000002-0000-0000-0000-000000000002',
  'Nyamira Ventilated Storage Center',
  'Nyamira',
  'Nyamira Town',
  'ambient',
  'ambient',
  'Active ventilated aggregation and sorting center for rapid post-harvest handling, grading, and short-term holding.',
  'Main Market Road, Nyamira Town, Nyamira County',
  -0.563300,
  34.935800,
  '["Tomatoes", "Onions", "Potatoes"]'::jsonb,
  '["ambient"]'::jsonb,
  1.80,
  'kg',
  'day',
  30.00,
  'kg',
  '{"temperature_min": 18, "temperature_max": 24, "humidity_min": 60, "humidity_max": 75}'::jsonb,
  'verified',
  now(),
  false,
  false
),
(
  'f0000003-0000-0000-0000-000000000003',
  'Keumbu Solar Dehydration Facility',
  'Kisii',
  'Keumbu',
  'drying',
  'drying',
  'Regional solar dehydration and value-addition facility producing certified packaged shelf-stable produce.',
  'Keumbu Market Junction, Kisii County',
  -0.716700,
  34.833300,
  '["Maize", "Bananas", "Tomatoes"]'::jsonb,
  '["dry"]'::jsonb,
  2.40,
  'kg',
  'day',
  40.00,
  'kg',
  '{"temperature_min": 22, "temperature_max": 28, "humidity_min": 50, "humidity_max": 60}'::jsonb,
  'verified',
  now(),
  false,
  false
)
on conflict (id) do update set
  name = excluded.name,
  county = excluded.county,
  location = excluded.location,
  type = excluded.type,
  facility_type = excluded.facility_type,
  description = excluded.description,
  address = excluded.address,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  accepted_commodities = excluded.accepted_commodities,
  storage_types = excluded.storage_types,
  price_per_unit = excluded.price_per_unit,
  price_unit = excluded.price_unit,
  price_period = excluded.price_period,
  minimum_quantity = excluded.minimum_quantity,
  capacity_unit = excluded.capacity_unit,
  condition_targets = excluded.condition_targets,
  verification_status = excluded.verification_status,
  verified_at = excluded.verified_at,
  is_demo = excluded.is_demo,
  demo_data = excluded.demo_data;

insert into public.capacity_slots (id, facility_id, capacity_kg, reserved_kg, window_start, window_end)
values
(
  'c0000001-0000-0000-0000-000000000001',
  'f0000001-0000-0000-0000-000000000001',
  840.00,
  0.00,
  now(),
  now() + interval '365 days'
),
(
  'c0000002-0000-0000-0000-000000000002',
  'f0000002-0000-0000-0000-000000000002',
  460.00,
  0.00,
  now(),
  now() + interval '365 days'
),
(
  'c0000003-0000-0000-0000-000000000003',
  'f0000003-0000-0000-0000-000000000003',
  1200.00,
  0.00,
  now(),
  now() + interval '365 days'
)
on conflict (id) do update set
  capacity_kg = excluded.capacity_kg,
  reserved_kg = excluded.reserved_kg,
  window_start = excluded.window_start,
  window_end = excluded.window_end;

insert into public.storage_capacity_snapshots (
  facility_id, total_capacity, occupied_capacity, reserved_capacity, available_capacity, capacity_unit, source, recorded_at
)
values
('f0000001-0000-0000-0000-000000000001', 840.00, 0.00, 0.00, 840.00, 'kg', 'provider_confirmed', now()),
('f0000002-0000-0000-0000-000000000002', 460.00, 0.00, 0.00, 460.00, 'kg', 'provider_confirmed', now()),
('f0000003-0000-0000-0000-000000000003', 1200.00, 0.00, 0.00, 1200.00, 'kg', 'provider_confirmed', now());

insert into public.storage_condition_readings (
  id, facility_id, temperature_c, relative_humidity, ventilation_status,
  cooling_status, power_status, source_type, observed_at
)
values
(
  'd0000001-0000-0000-0000-000000000001',
  'f0000001-0000-0000-0000-000000000001',
  11.8,
  82.0,
  'optimal',
  'active_refrigeration',
  'solar_backup_normal',
  'sensor',
  now()
),
(
  'd0000002-0000-0000-0000-000000000002',
  'f0000002-0000-0000-0000-000000000002',
  21.4,
  68.0,
  'active_cross_ventilation',
  'natural_airflow',
  'grid_active',
  'sensor',
  now()
),
(
  'd0000003-0000-0000-0000-000000000003',
  'f0000003-0000-0000-0000-000000000003',
  24.2,
  56.0,
  'controlled_exhaust',
  'solar_thermal_dryer',
  'solar_battery_normal',
  'sensor',
  now()
)
on conflict (id) do update set
  temperature_c = excluded.temperature_c,
  relative_humidity = excluded.relative_humidity,
  ventilation_status = excluded.ventilation_status,
  cooling_status = excluded.cooling_status,
  power_status = excluded.power_status,
  observed_at = excluded.observed_at;
