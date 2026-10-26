-- Demo seed for Kisii tomato workflow.
-- All values are simulated and must be clearly labelled as demo data.

insert into public.profiles (id, email, full_name, role)
values
  ('11111111-1111-1111-1111-111111111111', 'farmer@example.com', 'Demo Farmer', 'farmer')
on conflict (id) do nothing;

insert into public.farms (id, owner_id, name, county, location)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Kisii Tomato Plot', 'Kisii', 'Kisii County')
on conflict (id) do nothing;

insert into public.harvests (id, farmer_id, farm_id, crop, quantity, unit, harvest_date, location, status, handling_notes, demo_data)
values
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Tomato', 220, 'kg', now(), 'Kisii County', 'assessed', 'Demo harvest lot for planning only.', true)
on conflict (id) do nothing;

insert into public.facilities (id, name, county, location, type, demo_data)
values
  ('44444444-4444-4444-4444-444444444444', 'Kisii Cold Store Demo', 'Kisii', 'Kisii County', 'cold_storage', true)
on conflict (id) do nothing;

insert into public.capacity_slots (id, facility_id, capacity_kg, reserved_kg, window_start, window_end)
values
  ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 1200, 0, now(), now() + interval '48 hours')
on conflict (id) do nothing;

insert into public.buyers (id, profile_id, company_name, location)
values
  ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Demo Buyer Cooperative', 'Kisii')
on conflict (id) do nothing;

insert into public.offers (id, harvest_id, buyer_id, price_per_kg, status, source)
values
  ('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', 45, 'pending', 'demo_data')
on conflict (id) do nothing;
