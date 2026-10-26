create extension if not exists pgtap with schema extensions;

begin;
set local search_path = public, extensions;

select plan(15);

insert into public.profiles (id, email, full_name, role)
values
  ('90000000-0000-0000-0000-000000000001', 'db-test-farmer@example.test', 'DB Test Farmer', 'farmer'),
  ('90000000-0000-0000-0000-000000000002', 'db-test-other@example.test', 'DB Test Other Farmer', 'farmer'),
  ('90000000-0000-0000-0000-000000000003', 'db-test-buyer@example.test', 'DB Test Buyer', 'buyer');

insert into public.buyers (id, profile_id, company_name, location)
values (
  '90000000-0000-0000-0000-000000000004',
  '90000000-0000-0000-0000-000000000003',
  'DB Test Buyer',
  'Kisii'
);

insert into public.harvests (id, farmer_id, crop, quantity, unit, harvest_date, location, status)
values
  ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'Tomato', 100, 'kg', now(), 'Kisii', 'listed'),
  ('91000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000002', 'Tomato', 100, 'kg', now(), 'Nyamira', 'draft');

insert into public.facilities (id, name, county, location, type, demo_data)
values (
  '92000000-0000-0000-0000-000000000001',
  'DB Test Store',
  'Kisii',
  'Kisii',
  'cold_storage',
  true
);

insert into public.capacity_slots (id, facility_id, capacity_kg, window_start, window_end)
values (
  '93000000-0000-0000-0000-000000000001',
  '92000000-0000-0000-0000-000000000001',
  100,
  now(),
  now() + interval '1 day'
);

select has_column('public', 'reservations', 'capacity_slot_id', 'reservations identify their capacity slot');
select ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'idx_offers_one_accepted_per_harvest'
  ),
  'accepted offers are unique per harvest'
);
select throws_ok(
  $$insert into public.harvests (farmer_id, crop, quantity, unit, harvest_date, location)
    values ('90000000-0000-0000-0000-000000000001', 'Tomato', 0, 'kg', now(), 'Kisii')$$,
  '23514',
  null,
  'non-positive harvest quantities are rejected'
);
select throws_ok(
  $$insert into public.harvests (farmer_id, crop, quantity, unit, harvest_date, location)
    values ('99999999-0000-0000-0000-000000000001', 'Tomato', 1, 'kg', now(), 'Kisii')$$,
  '23503',
  null,
  'unknown farmer foreign keys are rejected'
);

insert into public.reservations (
  id, harvest_id, facility_id, capacity_slot_id, quantity_kg
)
values (
  '94000000-0000-0000-0000-000000000001',
  '91000000-0000-0000-0000-000000000001',
  '92000000-0000-0000-0000-000000000001',
  '93000000-0000-0000-0000-000000000001',
  80
);

select throws_ok(
  $$insert into public.reservations (
      id, harvest_id, facility_id, capacity_slot_id, quantity_kg
    ) values (
      '94000000-0000-0000-0000-000000000002',
      '91000000-0000-0000-0000-000000000002',
      '92000000-0000-0000-0000-000000000001',
      '93000000-0000-0000-0000-000000000001',
      21
    )$$,
  'P0001',
  'Capacity slot is full',
  'reservations that exceed remaining capacity are rejected'
);
select is(
  (select reserved_kg from public.capacity_slots where id = '93000000-0000-0000-0000-000000000001'),
  80::numeric,
  'successful reservations update the capacity counter'
);
update public.reservations
set status = 'released'
where id = '94000000-0000-0000-0000-000000000001';
select is(
  (select reserved_kg from public.capacity_slots where id = '93000000-0000-0000-0000-000000000001'),
  0::numeric,
  'released reservations return capacity'
);

insert into public.offers (id, harvest_id, buyer_id, price_per_kg, status, source)
values
  ('95000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000004', 45, 'pending', 'demo_data'),
  ('95000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000004', 46, 'pending', 'demo_data');
update public.offers set status = 'accepted' where id = '95000000-0000-0000-0000-000000000001';
select throws_ok(
  $$update public.offers set status = 'accepted' where id = '95000000-0000-0000-0000-000000000002'$$,
  '23505',
  null,
  'a harvest cannot have two accepted offers'
);
select ok(
  exists (select 1 from public.activity_events where event_type = 'reservations.status_changed'),
  'reservation status changes are recorded'
);
select ok(
  exists (select 1 from public.activity_events where event_type = 'offers.created'),
  'new offers are recorded'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000001', true);
select is(
  (select count(*)::integer from public.harvests),
  1,
  'farmers cannot read another farmer harvest'
);
select throws_ok(
  $$update public.profiles set role = 'operations_admin'
    where id = '90000000-0000-0000-0000-000000000001'$$,
  'P0001',
  'Profile roles can only be changed by a privileged server operation',
  'authenticated users cannot elevate their profile role'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000003', true);
select lives_ok(
  $$insert into public.offers (id, harvest_id, buyer_id, price_per_kg, status, source)
    values (
      '96000000-0000-0000-0000-000000000001',
      '91000000-0000-0000-0000-000000000001',
      '90000000-0000-0000-0000-000000000004',
      45,
      'pending',
      'demo_data'
    )$$,
  'buyers can make offers on listed harvests'
);
select throws_ok(
  $$insert into public.offers (id, harvest_id, buyer_id, price_per_kg, status, source)
    values (
      '96000000-0000-0000-0000-000000000002',
      '91000000-0000-0000-0000-000000000002',
      '90000000-0000-0000-0000-000000000004',
      45,
      'pending',
      'demo_data'
    )$$,
  '42501',
  null,
  'buyers cannot make offers on unlisted harvests'
);
select throws_ok(
  $$insert into public.harvests (farmer_id, crop, quantity, unit, harvest_date, location)
    values ('90000000-0000-0000-0000-000000000003', 'Tomato', 1, 'kg', now(), 'Kisii')$$,
  '42501',
  null,
  'buyers cannot create farmer harvest records'
);
reset role;

select * from finish();
rollback;
