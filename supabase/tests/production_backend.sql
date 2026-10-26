begin;

do $$
declare
  v_farmer uuid := gen_random_uuid();
  v_buyer uuid := gen_random_uuid();
  v_operator uuid := gen_random_uuid();
  v_provider uuid := gen_random_uuid();
  v_admin uuid := gen_random_uuid();
  v_other uuid := gen_random_uuid();
  v_facility uuid := gen_random_uuid();
  v_harvest public.harvests%rowtype;
  v_listing public.listings%rowtype;
  v_offer public.offers%rowtype;
  v_second_offer public.offers%rowtype;
  v_second_offer_id uuid;
  v_reservation public.reservations%rowtype;
  v_duplicate_reservation public.reservations%rowtype;
  v_job public.transport_jobs%rowtype;
  v_batch public.inventory_batches%rowtype;
  v_duplicate_batch public.inventory_batches%rowtype;
  v_transaction public.transactions%rowtype;
  v_slot public.capacity_slots%rowtype;
  v_start timestamptz := now() + interval '2 hours';
  v_end timestamptz := now() + interval '4 hours';
begin
  insert into public.profiles (id, email, role) values
    (v_farmer, v_farmer::text || '@test.invalid', 'farmer'),
    (v_buyer, v_buyer::text || '@test.invalid', 'buyer'),
    (v_operator, v_operator::text || '@test.invalid', 'facility_operator'),
    (v_provider, v_provider::text || '@test.invalid', 'transport_provider'),
    (v_admin, v_admin::text || '@test.invalid', 'operations_admin'),
    (v_other, v_other::text || '@test.invalid', 'farmer');
  insert into public.buyers (profile_id, company_name, location)
  values (v_buyer, 'Test buyer', 'Test County');
  insert into public.facilities (
    name, operator_id, county, location, type, accepted_commodities, demo_data, is_demo
  ) values (
    'Test facility', v_operator, 'Test County', 'Test County', 'cold_storage',
    jsonb_build_array('Integration Tomato'), false, false
  ) returning id into v_facility;

  perform set_config('request.jwt.claim.sub', v_farmer::text, true);
  select * into v_harvest from public.kavandor_create_harvest(
    'Integration Tomato', 120, 'kg', now(), 'Test County', null, null, null, gen_random_uuid()::text
  );
  if not found then raise exception 'Harvest creation failed'; end if;
  perform set_config('kavandor.test.harvest_id', v_harvest.id::text, true);
  perform set_config('kavandor.test.other_user_id', v_other::text, true);

  perform public.kavandor_save_assessment(
    v_harvest.id, v_harvest.crop, 0, '[]'::jsonb, '[]'::jsonb,
    '["Provider credentials unavailable"]'::jsonb, 'manual', 'manual_fallback', null
  );
  select * into v_listing from public.kavandor_create_listing(v_harvest.id, 10, 'manually_entered');

  perform set_config('request.jwt.claim.sub', v_buyer::text, true);
  select * into v_offer from public.kavandor_create_offer(
    v_harvest.id, 10, 100, gen_random_uuid()::text
  );
  select * into v_second_offer from public.kavandor_create_offer(
    v_harvest.id, 9, 50, gen_random_uuid()::text
  );
  v_second_offer_id := v_second_offer.id;
  if v_listing.status <> 'active' or v_offer.status <> 'pending' or v_second_offer.status <> 'pending' then
    raise exception 'Listing or offer creation failed';
  end if;

  perform set_config('request.jwt.claim.sub', v_farmer::text, true);
  select * into v_offer from public.kavandor_accept_offer(v_offer.id);
  select * into v_second_offer from public.offers as o where o.id = v_second_offer_id;
  if v_offer.status <> 'accepted' or v_second_offer.status <> 'rejected' then
    raise exception 'Offer acceptance did not reject competing offers';
  end if;
  if not exists (
    select 1 from public.transactions
    where offer_id = v_offer.id and agreed_quantity_kg = 100 and status = 'confirmed'
  ) then raise exception 'Offer acceptance did not create the expected transaction'; end if;

  perform set_config('request.jwt.claim.sub', v_operator::text, true);
  select * into v_slot from public.kavandor_create_capacity_slot(v_facility, 100, v_start, v_end);

  perform set_config('request.jwt.claim.sub', v_farmer::text, true);
  select * into v_reservation from public.kavandor_reserve_capacity(
    v_harvest.id, v_facility, 100, v_start, v_end, null, null, gen_random_uuid()::text
  );
  select * into v_duplicate_reservation from public.kavandor_reserve_capacity(
    v_harvest.id, v_facility, 100, v_start, v_end, null, null, v_reservation.idempotency_key
  );
  if v_duplicate_reservation.id <> v_reservation.id then
    raise exception 'Reservation idempotency did not return the original reservation';
  end if;
  begin
    perform public.kavandor_reserve_capacity(
      v_harvest.id, v_facility, 1, v_start, v_end, null, null, gen_random_uuid()::text
    );
    raise exception 'Over-capacity reservation unexpectedly succeeded';
  exception when check_violation then null;
  end;

  perform set_config('request.jwt.claim.sub', v_operator::text, true);
  select * into v_reservation from public.kavandor_reservation_status(v_reservation.id, 'confirmed');
  perform set_config('request.jwt.claim.sub', v_farmer::text, true);
  select * into v_job from public.kavandor_create_transport_job(
    v_harvest.id, v_reservation.id, 'Farm', 'Facility', 100, v_start, 'Handle with care', gen_random_uuid()::text
  );
  perform set_config('request.jwt.claim.sub', v_admin::text, true);
  select * into v_job from public.kavandor_assign_transport_provider(v_job.id, v_provider);

  perform set_config('request.jwt.claim.sub', v_provider::text, true);
  update public.transport_jobs set status = 'scheduled' where id = v_job.id;
  update public.transport_jobs set status = 'in_transit' where id = v_job.id;
  update public.transport_jobs set status = 'delivered', actual_received_kg = 100 where id = v_job.id;

  perform set_config('request.jwt.claim.sub', v_operator::text, true);
  select * into v_batch from public.kavandor_record_inventory(
    v_harvest.id, v_facility, 100, v_reservation.id, 'received', null, gen_random_uuid()::text
  );
  select * into v_duplicate_batch from public.kavandor_record_inventory(
    v_harvest.id, v_facility, 100, v_reservation.id, 'received', null, v_batch.idempotency_key
  );
  if v_duplicate_batch.id <> v_batch.id then
    raise exception 'Intake idempotency did not return the original batch';
  end if;
  begin
    perform public.kavandor_record_inventory(
      v_harvest.id, v_facility, 99, v_reservation.id, 'received', null, v_batch.idempotency_key
    );
    raise exception 'Mismatched intake idempotency key unexpectedly succeeded';
  exception when unique_violation then null;
  end;

  select * into v_transaction from public.transactions where offer_id = v_offer.id;
  if v_transaction.status <> 'completed' or v_transaction.actual_received_kg <> 100 then
    raise exception 'Intake did not complete the transaction with actual received quantity';
  end if;
  if not exists (
    select 1 from public.activity_events
    where harvest_id = v_harvest.id and event_type = 'inventory_received'
  ) then raise exception 'Intake activity event was not recorded'; end if;
  if not exists (
    select 1 from public.capacity_slots
    where id = v_slot.id and reserved_kg = 0
  ) then raise exception 'Completed intake did not release reserved capacity'; end if;

  perform set_config('request.jwt.claim.sub', v_farmer::text, true);
  begin
    perform public.kavandor_accept_offer(v_second_offer_id);
    raise exception 'Accepting a rejected offer unexpectedly succeeded';
  exception when check_violation then null;
  end;

  perform set_config('request.jwt.claim.sub', v_buyer::text, true);
  begin
    perform public.kavandor_create_harvest(
      'Unauthorized crop', 1, 'kg', now(), 'Test County', null, null, null, null
    );
    raise exception 'Non-farmer harvest creation unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('kavandor.test.other_user_id'), true);
do $$
begin
  if exists (
    select 1 from public.harvests
    where id = current_setting('kavandor.test.harvest_id')::uuid
  ) then raise exception 'RLS exposed another farmer''s harvest'; end if;
  update public.harvests set location = 'Unauthorized edit'
  where id = current_setting('kavandor.test.harvest_id')::uuid;
  if found then raise exception 'RLS allowed another farmer to edit a harvest'; end if;
end;
$$;
reset role;

rollback;
