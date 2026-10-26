alter table public.reservations
  add column capacity_slot_id uuid references public.capacity_slots(id) on delete restrict;

alter table public.capacity_slots
  add constraint capacity_slots_reserved_nonnegative check (reserved_kg >= 0),
  add constraint capacity_slots_reserved_within_capacity check (reserved_kg <= capacity_kg);

alter table public.transactions
  add constraint transactions_agreed_price_nonnegative
    check (agreed_price is null or agreed_price >= 0),
  add constraint transactions_received_quantity_nonnegative
    check (actual_received_kg is null or actual_received_kg >= 0);

create index idx_farms_owner_id on public.farms (owner_id);
create index idx_harvests_farm_id on public.harvests (farm_id);
create index idx_harvest_photos_harvest_id on public.harvest_photos (harvest_id);
create index idx_facilities_operator_id on public.facilities (operator_id);
create index idx_capacity_slots_facility_window
  on public.capacity_slots (facility_id, window_start, window_end);
create index idx_reservations_harvest_id on public.reservations (harvest_id);
create index idx_reservations_capacity_slot_id on public.reservations (capacity_slot_id);
create index idx_transport_jobs_harvest_id on public.transport_jobs (harvest_id);
create index idx_transport_jobs_provider_id on public.transport_jobs (provider_id);
create index idx_offers_buyer_id on public.offers (buyer_id);
create index idx_inventory_batches_harvest_id on public.inventory_batches (harvest_id);
create index idx_transactions_harvest_id on public.transactions (harvest_id);
create index idx_transactions_buyer_id on public.transactions (buyer_id);
create unique index idx_transactions_offer_id
  on public.transactions (offer_id) where offer_id is not null;
create index idx_payment_records_transaction_id on public.payment_records (transaction_id);
create index idx_activity_events_actor_id on public.activity_events (actor_id);

create unique index idx_offers_one_accepted_per_harvest
  on public.offers (harvest_id) where status = 'accepted';

alter table public.transactions
  drop constraint transactions_harvest_id_fkey,
  add constraint transactions_harvest_id_fkey
    foreign key (harvest_id) references public.harvests(id) on delete restrict,
  drop constraint transactions_buyer_id_fkey,
  add constraint transactions_buyer_id_fkey
    foreign key (buyer_id) references public.buyers(id) on delete restrict,
  drop constraint transactions_offer_id_fkey,
  add constraint transactions_offer_id_fkey
    foreign key (offer_id) references public.offers(id) on delete restrict;

alter table public.payment_records
  drop constraint payment_records_transaction_id_fkey,
  add constraint payment_records_transaction_id_fkey
    foreign key (transaction_id) references public.transactions(id) on delete restrict;

alter table public.activity_events
  drop constraint activity_events_harvest_id_fkey,
  add constraint activity_events_harvest_id_fkey
    foreign key (harvest_id) references public.harvests(id) on delete set null;

drop policy offers_select_own on public.offers;
drop policy offers_insert_own on public.offers;
drop policy offers_update_own on public.offers;

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy farms_select_own on public.farms
  for select to authenticated
  using (owner_id = (select auth.uid()));
create policy farms_insert_own on public.farms
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'farmer'
    )
  );
create policy farms_update_own on public.farms
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy harvests_insert_own on public.harvests;
create policy harvests_insert_own on public.harvests
  for insert to authenticated
  with check (
    farmer_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'farmer'
    )
  );
create policy harvests_delete_own on public.harvests
  for delete to authenticated
  using (
    farmer_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'farmer'
    )
  );
create policy harvests_update_own on public.harvests
  for update to authenticated
  using (
    farmer_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'farmer'
    )
  )
  with check (
    farmer_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'farmer'
    )
  );

create policy harvest_photos_select_own on public.harvest_photos
  for select to authenticated
  using (exists (
    select 1 from public.harvests h
    where h.id = harvest_id and h.farmer_id = (select auth.uid())
  ));
create policy harvest_photos_insert_own on public.harvest_photos
  for insert to authenticated
  with check (exists (
    select 1 from public.harvests h
    where h.id = harvest_id and h.farmer_id = (select auth.uid())
  ));
create policy harvest_photos_delete_own on public.harvest_photos
  for delete to authenticated
  using (exists (
    select 1 from public.harvests h
    where h.id = harvest_id and h.farmer_id = (select auth.uid())
  ));

create policy assessments_select_own on public.assessments
  for select to authenticated
  using (exists (
    select 1 from public.harvests h
    where h.id = harvest_id and h.farmer_id = (select auth.uid())
  ));

create policy facilities_select_public on public.facilities
  for select to anon, authenticated
  using (true);
create policy facilities_insert_operator on public.facilities
  for insert to authenticated
  with check (
    operator_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'facility_operator'
    )
  );
create policy facilities_update_operator on public.facilities
  for update to authenticated
  using (operator_id = (select auth.uid()))
  with check (
    operator_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'facility_operator'
    )
  );

create policy capacity_slots_select_public on public.capacity_slots
  for select to anon, authenticated
  using (true);
create policy capacity_slots_insert_operator on public.capacity_slots
  for insert to authenticated
  with check (exists (
    select 1 from public.facilities f
    where f.id = facility_id and f.operator_id = (select auth.uid())
  ));
create policy capacity_slots_update_operator on public.capacity_slots
  for update to authenticated
  using (exists (
    select 1 from public.facilities f
    where f.id = facility_id and f.operator_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.facilities f
    where f.id = facility_id and f.operator_id = (select auth.uid())
  ));

create policy reservations_select_participant on public.reservations
  for select to authenticated
  using (
    exists (
      select 1 from public.harvests h
      where h.id = harvest_id and h.farmer_id = (select auth.uid())
    )
    or exists (
      select 1 from public.facilities f
      where f.id = facility_id and f.operator_id = (select auth.uid())
    )
  );
create policy reservations_insert_farmer on public.reservations
  for insert to authenticated
  with check (
    status = 'pending'
    and exists (
      select 1 from public.harvests h
      where h.id = harvest_id and h.farmer_id = (select auth.uid())
    )
  );
create policy reservations_update_operator on public.reservations
  for update to authenticated
  using (exists (
    select 1 from public.facilities f
    where f.id = facility_id and f.operator_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.facilities f
    where f.id = facility_id and f.operator_id = (select auth.uid())
  ));

create policy transport_jobs_select_participant on public.transport_jobs
  for select to authenticated
  using (
    exists (
      select 1 from public.harvests h
      where h.id = harvest_id and h.farmer_id = (select auth.uid())
    )
    or provider_id = (select auth.uid())
  );
create policy transport_jobs_update_provider on public.transport_jobs
  for update to authenticated
  using (
    provider_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'transport_provider'
    )
  )
  with check (provider_id = (select auth.uid()));

create policy buyers_select_own on public.buyers
  for select to authenticated
  using (profile_id = (select auth.uid()));
create policy buyers_insert_own on public.buyers
  for insert to authenticated
  with check (
    profile_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'buyer'
    )
  );
create policy buyers_update_own on public.buyers
  for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy offers_select_participant on public.offers
  for select to authenticated
  using (
    exists (
      select 1 from public.harvests h
      where h.id = harvest_id and h.farmer_id = (select auth.uid())
    )
    or exists (
      select 1 from public.buyers b
      where b.id = buyer_id and b.profile_id = (select auth.uid())
    )
  );

create or replace function public.is_listed_harvest(target_harvest_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.harvests h
    where h.id = target_harvest_id and h.status = 'listed'
  );
$$;

revoke all on function public.is_listed_harvest(uuid) from public, anon;
grant execute on function public.is_listed_harvest(uuid) to authenticated;

create policy offers_insert_buyer on public.offers
  for insert to authenticated
  with check (
    status = 'pending'
    and public.is_listed_harvest(harvest_id)
    and exists (
      select 1 from public.buyers b
      join public.profiles p on p.id = b.profile_id
      where b.id = buyer_id
        and b.profile_id = (select auth.uid())
        and p.role = 'buyer'
    )
  );
create policy offers_update_harvest_owner on public.offers
  for update to authenticated
  using (exists (
    select 1 from public.harvests h
    where h.id = harvest_id and h.farmer_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.harvests h
    where h.id = harvest_id and h.farmer_id = (select auth.uid())
  ));

create policy inventory_batches_select_participant on public.inventory_batches
  for select to authenticated
  using (
    exists (
      select 1 from public.harvests h
      where h.id = harvest_id and h.farmer_id = (select auth.uid())
    )
    or exists (
      select 1 from public.transactions t
      join public.buyers b on b.id = t.buyer_id
      where t.harvest_id = inventory_batches.harvest_id
        and b.profile_id = (select auth.uid())
    )
  );

create policy transactions_select_participant on public.transactions
  for select to authenticated
  using (
    exists (
      select 1 from public.harvests h
      where h.id = harvest_id and h.farmer_id = (select auth.uid())
    )
    or exists (
      select 1 from public.buyers b
      where b.id = buyer_id and b.profile_id = (select auth.uid())
    )
  );

create policy payment_records_select_participant on public.payment_records
  for select to authenticated
  using (exists (
    select 1 from public.transactions t
    where t.id = transaction_id
      and (
        exists (
          select 1 from public.harvests h
          where h.id = t.harvest_id and h.farmer_id = (select auth.uid())
        )
        or exists (
          select 1 from public.buyers b
          where b.id = t.buyer_id and b.profile_id = (select auth.uid())
        )
      )
  ));

create policy activity_events_select_own on public.activity_events
  for select to authenticated
  using (
    actor_id = (select auth.uid())
    or exists (
      select 1 from public.harvests h
      where h.id = harvest_id and h.farmer_id = (select auth.uid())
    )
  );

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.role is distinct from old.role
    and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'Profile roles can only be changed by a privileged server operation';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
before update of role on public.profiles
for each row execute function public.prevent_profile_role_change();

create or replace function public.guard_capacity_slot_counter()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin')
    and (
      (tg_op = 'INSERT' and new.reserved_kg <> 0)
      or (tg_op = 'UPDATE' and new.reserved_kg is distinct from old.reserved_kg)
    ) then
    raise exception 'reserved_kg is maintained by reservation operations';
  end if;
  return new;
end;
$$;

create trigger capacity_slots_guard_counter
before insert or update of reserved_kg on public.capacity_slots
for each row execute function public.guard_capacity_slot_counter();

create or replace function public.apply_reservation_capacity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  slot_facility_id uuid;
  old_active boolean := false;
  new_active boolean := false;
begin
  if tg_op <> 'INSERT' then
    old_active := old.status in ('pending', 'confirmed');
  end if;
  if tg_op <> 'DELETE' then
    new_active := new.status in ('pending', 'confirmed');
    if new.capacity_slot_id is null then
      raise exception 'A capacity slot is required for new reservations';
    end if;
    select facility_id into slot_facility_id
    from public.capacity_slots
    where id = new.capacity_slot_id
    for update;
    if not found or slot_facility_id <> new.facility_id then
      raise exception 'The capacity slot must belong to the reservation facility';
    end if;
  end if;

  if old_active then
    update public.capacity_slots
    set reserved_kg = reserved_kg - old.quantity_kg
    where id = old.capacity_slot_id
      and reserved_kg >= old.quantity_kg;
    if not found then
      raise exception 'Reservation capacity counter is inconsistent';
    end if;
  end if;

  if new_active then
    update public.capacity_slots
    set reserved_kg = reserved_kg + new.quantity_kg
    where id = new.capacity_slot_id
      and reserved_kg + new.quantity_kg <= capacity_kg;
    if not found then
      raise exception 'Capacity slot is full';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger reservations_apply_capacity
before insert or update of capacity_slot_id, facility_id, quantity_kg, status or delete
on public.reservations
for each row execute function public.apply_reservation_capacity();

create or replace function public.validate_offer_transition()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.id is distinct from old.id
    or new.harvest_id is distinct from old.harvest_id
    or new.buyer_id is distinct from old.buyer_id
    or new.price_per_kg is distinct from old.price_per_kg
    or new.source is distinct from old.source
    or new.created_at is distinct from old.created_at then
    raise exception 'Offer details are immutable after creation';
  end if;
  if new.status is distinct from old.status
    and not (old.status = 'pending' and new.status in ('accepted', 'rejected', 'expired')) then
    raise exception 'Invalid offer status transition: % to %', old.status, new.status;
  end if;
  return new;
end;
$$;

create trigger offers_validate_transition
before update on public.offers
for each row execute function public.validate_offer_transition();

create or replace function public.validate_reservation_transition()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.id is distinct from old.id
    or new.harvest_id is distinct from old.harvest_id
    or new.facility_id is distinct from old.facility_id
    or new.capacity_slot_id is distinct from old.capacity_slot_id
    or new.quantity_kg is distinct from old.quantity_kg
    or new.created_at is distinct from old.created_at then
    raise exception 'Reservation details are immutable after creation';
  end if;
  if new.status is distinct from old.status
    and not (
      (old.status = 'pending' and new.status in ('confirmed', 'released'))
      or (old.status = 'confirmed' and new.status in ('released', 'completed'))
    ) then
    raise exception 'Invalid reservation status transition: % to %', old.status, new.status;
  end if;
  return new;
end;
$$;

create trigger reservations_validate_transition
before update on public.reservations
for each row execute function public.validate_reservation_transition();

create or replace function public.validate_transport_job_transition()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.id is distinct from old.id
    or new.harvest_id is distinct from old.harvest_id
    or new.provider_id is distinct from old.provider_id
    or new.origin is distinct from old.origin
    or new.destination is distinct from old.destination
    or new.created_at is distinct from old.created_at then
    raise exception 'Transport job details are immutable after creation';
  end if;
  if new.status is distinct from old.status
    and not (
      (old.status = 'scheduled' and new.status in ('in_transit', 'cancelled'))
      or (old.status = 'in_transit' and new.status in ('delivered', 'cancelled'))
    ) then
    raise exception 'Invalid transport job status transition: % to %', old.status, new.status;
  end if;
  return new;
end;
$$;

create trigger transport_jobs_validate_transition
before update on public.transport_jobs
for each row execute function public.validate_transport_job_transition();

create or replace function public.record_status_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  related_harvest_id uuid;
  event_type text;
  event_details jsonb;
begin
  if tg_table_name = 'harvests' then
    related_harvest_id := new.id;
  else
    related_harvest_id := new.harvest_id;
  end if;

  if tg_op = 'INSERT' then
    event_type := tg_table_name || '.created';
    event_details := jsonb_build_object('status', new.status);
  elsif new.status is distinct from old.status then
    event_type := tg_table_name || '.status_changed';
    event_details := jsonb_build_object('from', old.status, 'to', new.status);
  else
    return new;
  end if;

  insert into public.activity_events (harvest_id, actor_id, event_type, details)
  values (related_harvest_id, auth.uid(), event_type, event_details);
  return new;
end;
$$;

create trigger harvests_record_status_change
after insert or update of status on public.harvests
for each row execute function public.record_status_change();
create trigger reservations_record_status_change
after insert or update of status on public.reservations
for each row execute function public.record_status_change();
create trigger transport_jobs_record_status_change
after insert or update of status on public.transport_jobs
for each row execute function public.record_status_change();
create trigger offers_record_status_change
after insert or update of status on public.offers
for each row execute function public.record_status_change();
create trigger transactions_record_status_change
after insert or update of status on public.transactions
for each row execute function public.record_status_change();
