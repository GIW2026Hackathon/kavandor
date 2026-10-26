begin;

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

alter table public.profiles
  alter column email drop not null,
  add column if not exists phone text,
  add column if not exists requested_role text
    check (requested_role is null or requested_role in ('farmer', 'buyer', 'facility_operator', 'transport_provider'));

alter table public.harvests
  add column if not exists photo_path text,
  add column if not exists availability text,
  add column if not exists variety text,
  add column if not exists idempotency_key text;

alter table public.assessments
  add column if not exists assessment_mode text not null default 'manual_fallback'
    check (assessment_mode in ('provider', 'manual_fallback')),
  add column if not exists recommendations jsonb not null default '[]'::jsonb,
  add column if not exists model text;

create unique index if not exists harvests_farmer_idempotency_key
  on public.harvests (farmer_id, idempotency_key)
  where idempotency_key is not null;
create unique index if not exists harvest_photos_storage_path_unique
  on public.harvest_photos (storage_path);

alter table public.offers
  add column if not exists quantity_kg numeric(10,2) check (quantity_kg is null or quantity_kg > 0),
  add column if not exists expires_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists idempotency_key text;
alter table public.offers drop constraint if exists offers_status_check;
alter table public.offers add constraint offers_status_check
  check (status in ('pending', 'accepted', 'rejected', 'expired', 'withdrawn'));

create unique index if not exists offers_buyer_idempotency_key
  on public.offers (buyer_id, idempotency_key)
  where idempotency_key is not null;

alter table public.reservations
  add column if not exists idempotency_key text,
  add column if not exists handling_notes text;

update public.reservations r set farmer_id = h.farmer_id
from public.harvests h
where r.harvest_id = h.id and r.farmer_id is null;

update public.transport_jobs j set farmer_id = h.farmer_id
from public.harvests h
where j.harvest_id = h.id and j.farmer_id is null;

create unique index if not exists reservations_farmer_idempotency_key
  on public.reservations (farmer_id, idempotency_key)
  where idempotency_key is not null;

alter table public.transport_jobs
  add column if not exists actual_received_kg numeric(10,2) check (actual_received_kg is null or actual_received_kg >= 0),
  add column if not exists discrepancy_notes text,
  add column if not exists loading_instructions text,
  add column if not exists last_known_location text,
  add column if not exists idempotency_key text;

create unique index if not exists transport_jobs_farmer_idempotency_key
  on public.transport_jobs (farmer_id, idempotency_key)
  where idempotency_key is not null;

alter table public.transport_jobs drop constraint if exists transport_jobs_status_check;
alter table public.transport_jobs add constraint transport_jobs_status_check
  check (status in ('quote_pending', 'scheduled', 'in_transit', 'delivered', 'cancelled'));
alter table public.transport_jobs drop constraint if exists transport_jobs_integration_mode_check;
alter table public.transport_jobs add constraint transport_jobs_integration_mode_check
  check (integration_mode in ('demo', 'api', 'manual'));

alter table public.inventory_batches
  add column if not exists facility_id uuid references public.facilities(id),
  add column if not exists reservation_id uuid references public.reservations(id),
  add column if not exists idempotency_key text,
  add column if not exists discrepancy_kg numeric(10,2),
  add column if not exists discrepancy_notes text;

create unique index if not exists inventory_batches_facility_idempotency_key
  on public.inventory_batches (facility_id, idempotency_key)
  where idempotency_key is not null;

alter table public.transactions
  add column if not exists currency text not null default 'KES',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists agreed_quantity_kg numeric(10,2)
    check (agreed_quantity_kg is null or agreed_quantity_kg > 0);

alter table public.payment_records
  add column if not exists currency text not null default 'KES',
  add column if not exists recorded_by uuid references public.profiles(id),
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'provider_confirmed', 'provider_reported'));

create unique index if not exists transactions_offer_id_unique
  on public.transactions (offer_id);

update public.transactions t set
  agreed_price = coalesce(t.agreed_price, o.price_per_kg),
  agreed_quantity_kg = coalesce(t.agreed_quantity_kg, o.quantity_kg, h.quantity)
from public.offers o
join public.harvests h on h.id = o.harvest_id
where t.offer_id = o.id and t.agreed_quantity_kg is null;

create table if not exists public.transaction_costs (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  cost_type text not null check (length(trim(cost_type)) between 2 and 80),
  description text not null check (length(trim(description)) between 2 and 500),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'KES' check (currency ~ '^[A-Z]{3}$'),
  source text not null default 'manual' check (source in ('manual', 'provider_confirmed', 'provider_reported')),
  recorded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_transaction_costs_transaction on public.transaction_costs (transaction_id, created_at);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  harvest_id uuid not null unique references public.harvests(id) on delete cascade,
  crop text not null,
  quantity_kg numeric(10,2) not null check (quantity_kg > 0),
  unit_price numeric(10,2) not null check (unit_price > 0),
  currency text not null default 'KES',
  status text not null default 'active' check (status in ('active', 'closed')),
  county text not null,
  source text not null default 'manually_entered'
    check (source in ('provider_confirmed', 'provider_reported', 'manually_entered', 'demo_data')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  message text not null,
  resource_type text,
  resource_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.harvest_recommendations (
  id uuid primary key default gen_random_uuid(),
  harvest_id uuid not null references public.harvests(id) on delete cascade,
  option_type text not null check (option_type in ('immediate_sale', 'storage', 'drying', 'aggregation')),
  label text not null,
  description text not null,
  estimated_net numeric(12,2) not null,
  currency text not null default 'KES',
  assumptions jsonb not null default '[]'::jsonb,
  feasible boolean not null,
  input_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_listings_status_created on public.listings (status, created_at desc);
create index if not exists idx_listings_crop_county on public.listings (crop, county);
create index if not exists idx_offers_harvest_status on public.offers (harvest_id, status);
create index if not exists idx_reservations_facility_status on public.reservations (facility_id, status);
create index if not exists idx_transport_jobs_provider_status on public.transport_jobs (provider_id, status);
create index if not exists idx_inventory_batches_harvest on public.inventory_batches (harvest_id, received_at desc);
create index if not exists idx_notifications_user_unread on public.notifications (user_id, created_at desc) where read_at is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'capacity_slots_no_overlapping_windows'
      and conrelid = 'public.capacity_slots'::regclass
  ) then
    alter table public.capacity_slots
      add constraint capacity_slots_no_overlapping_windows
      exclude using gist (
        facility_id with =,
        tstzrange(window_start, window_end, '[)') with &&
      );
  end if;
end;
$$;

create or replace function public.kavandor_current_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.role from public.profiles p where p.id = auth.uid()
$$;

create or replace function public.kavandor_harvest_is_public(p_harvest_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.listings l
    where l.harvest_id = p_harvest_id and l.status = 'active'
  )
$$;

create or replace function public.kavandor_create_harvest(
  p_crop text,
  p_quantity numeric,
  p_unit text,
  p_harvest_date timestamptz,
  p_location text,
  p_handling_notes text default null,
  p_variety text default null,
  p_availability text default null,
  p_idempotency_key text default null
)
returns public.harvests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_harvest public.harvests%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if public.kavandor_current_role() <> 'farmer' then raise exception 'Farmer role required' using errcode = '42501'; end if;
  if length(trim(p_crop)) < 2 or length(trim(p_location)) < 2 or p_quantity <= 0
     or p_unit not in ('kg', 'g', 'tonne', 'litre', 'bag', 'sack', 'crate', 'bucket', 'box', 'carton', 'bunch', 'piece', 'head', 'dozen', 'bale') then
    raise exception 'Invalid harvest data' using errcode = '22023';
  end if;
  if p_idempotency_key is not null then
    select * into v_harvest from public.harvests
      where farmer_id = auth.uid() and idempotency_key = p_idempotency_key;
    if found then
      if v_harvest.crop <> trim(p_crop) or v_harvest.quantity <> p_quantity
         or v_harvest.unit <> p_unit or v_harvest.harvest_date <> p_harvest_date
         or v_harvest.location <> trim(p_location)
         or v_harvest.handling_notes is distinct from p_handling_notes
         or v_harvest.variety is distinct from nullif(trim(p_variety), '')
         or v_harvest.availability is distinct from p_availability then
        raise exception 'Idempotency key was already used with different harvest data' using errcode = '23505';
      end if;
      return v_harvest;
    end if;
  end if;

  insert into public.harvests (
    farmer_id, crop, variety, quantity, unit, harvest_date, location,
    handling_notes, availability, status, demo_data, idempotency_key
  )
  values (
    auth.uid(), trim(p_crop), nullif(trim(p_variety), ''), p_quantity, p_unit,
    p_harvest_date, trim(p_location), p_handling_notes, p_availability, 'draft', false, p_idempotency_key
  )
  on conflict (farmer_id, idempotency_key) where idempotency_key is not null do nothing
  returning * into v_harvest;
  if not found then
    select * into v_harvest from public.harvests
      where farmer_id = auth.uid() and idempotency_key = p_idempotency_key;
    if v_harvest.crop <> trim(p_crop) or v_harvest.quantity <> p_quantity
       or v_harvest.unit <> p_unit or v_harvest.harvest_date <> p_harvest_date
       or v_harvest.location <> trim(p_location)
       or v_harvest.handling_notes is distinct from p_handling_notes
       or v_harvest.variety is distinct from nullif(trim(p_variety), '')
       or v_harvest.availability is distinct from p_availability then
      raise exception 'Idempotency key was already used with different harvest data' using errcode = '23505';
    end if;
    return v_harvest;
  end if;
  insert into public.activity_events (harvest_id, actor_id, event_type, details)
  values (v_harvest.id, auth.uid(), 'harvest_created', jsonb_build_object('crop', v_harvest.crop, 'quantity', v_harvest.quantity, 'unit', v_harvest.unit));
  insert into public.notifications (user_id, event_type, message, resource_type, resource_id)
  values (auth.uid(), 'harvest_created', 'Your harvest has been registered.', 'harvest', v_harvest.id);
  return v_harvest;
end;
$$;

create or replace function public.kavandor_create_offer(
  p_harvest_id uuid,
  p_price_per_kg numeric,
  p_quantity_kg numeric,
  p_idempotency_key text default null
)
returns public.offers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_buyer public.buyers%rowtype;
  v_offer public.offers%rowtype;
  v_harvest public.harvests%rowtype;
  v_listing public.listings%rowtype;
begin
  if auth.uid() is null or public.kavandor_current_role() <> 'buyer' then
    raise exception 'Buyer authentication required' using errcode = '42501';
  end if;
  select * into v_buyer from public.buyers where profile_id = auth.uid();
  if not found then raise exception 'Approved buyer profile required' using errcode = '42501'; end if;
  if p_idempotency_key is not null then
    select * into v_offer from public.offers
      where buyer_id = v_buyer.id and idempotency_key = p_idempotency_key;
    if found then
      if v_offer.harvest_id <> p_harvest_id or v_offer.price_per_kg <> p_price_per_kg
         or v_offer.quantity_kg <> p_quantity_kg then
        raise exception 'Idempotency key was already used with different offer data' using errcode = '23505';
      end if;
      return v_offer;
    end if;
  end if;
  select h.* into v_harvest from public.harvests h
    join public.listings l on l.harvest_id = h.id
    where h.id = p_harvest_id and l.status = 'active'
    for update of h, l;
  if not found then raise exception 'Listing not found' using errcode = 'P0002'; end if;
  select * into v_listing from public.listings where harvest_id = p_harvest_id and status = 'active';
  if not found then raise exception 'Listing not found' using errcode = 'P0002'; end if;
  if p_price_per_kg <= 0 or p_quantity_kg <= 0 then raise exception 'Invalid offer values' using errcode = '22023'; end if;
  if p_quantity_kg > v_listing.quantity_kg then raise exception 'Offer quantity exceeds listed quantity' using errcode = '23514'; end if;
  if p_idempotency_key is not null then
    select * into v_offer from public.offers
      where buyer_id = v_buyer.id and idempotency_key = p_idempotency_key;
    if found then
      if v_offer.harvest_id <> p_harvest_id or v_offer.price_per_kg <> p_price_per_kg
         or v_offer.quantity_kg <> p_quantity_kg then
        raise exception 'Idempotency key was already used with different offer data' using errcode = '23505';
      end if;
      return v_offer;
    end if;
  end if;

  insert into public.offers (harvest_id, buyer_id, price_per_kg, quantity_kg, status, source, expires_at, idempotency_key)
  values (p_harvest_id, v_buyer.id, p_price_per_kg, p_quantity_kg, 'pending', 'manually_entered', now() + interval '72 hours', p_idempotency_key)
  on conflict (buyer_id, idempotency_key) where idempotency_key is not null do nothing
  returning * into v_offer;
  if not found then
    select * into v_offer from public.offers
      where buyer_id = v_buyer.id and idempotency_key = p_idempotency_key;
    if v_offer.harvest_id <> p_harvest_id or v_offer.price_per_kg <> p_price_per_kg
       or v_offer.quantity_kg <> p_quantity_kg then
      raise exception 'Idempotency key was already used with different offer data' using errcode = '23505';
    end if;
    return v_offer;
  end if;
  insert into public.activity_events (harvest_id, actor_id, event_type, details)
  values (p_harvest_id, auth.uid(), 'offer_submitted', jsonb_build_object('offer_id', v_offer.id));
  insert into public.notifications (user_id, event_type, message, resource_type, resource_id)
  values (v_harvest.farmer_id, 'offer_submitted', 'A buyer submitted an offer for your listing.', 'offer', v_offer.id);
  return v_offer;
end;
$$;

create or replace function public.kavandor_create_transport_job(
  p_harvest_id uuid,
  p_storage_request_id uuid,
  p_origin text,
  p_destination text,
  p_requested_quantity numeric,
  p_requested_pickup_at timestamptz,
  p_loading_instructions text,
  p_idempotency_key text default null
)
returns public.transport_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_harvest public.harvests%rowtype;
  v_job public.transport_jobs%rowtype;
begin
  if auth.uid() is null or public.kavandor_current_role() <> 'farmer' then
    raise exception 'Farmer authentication required' using errcode = '42501';
  end if;
  select * into v_harvest from public.harvests where id = p_harvest_id and farmer_id = auth.uid() for update;
  if not found then raise exception 'Harvest not found' using errcode = 'P0002'; end if;
  if length(trim(p_origin)) < 2 or length(trim(p_destination)) < 2
     or (p_requested_quantity is not null and (p_requested_quantity <= 0 or p_requested_quantity > v_harvest.quantity)) then
    raise exception 'Invalid transport locations, quantity, or pickup time' using errcode = '22023';
  end if;
  if p_storage_request_id is not null and not exists (
    select 1 from public.reservations r
    where r.id = p_storage_request_id and r.harvest_id = p_harvest_id and r.farmer_id = auth.uid()
      and r.status = 'confirmed'
  ) then
    raise exception 'Reservation does not match harvest' using errcode = '23514';
  end if;
  if p_idempotency_key is not null then
    select * into v_job from public.transport_jobs
      where farmer_id = auth.uid() and idempotency_key = p_idempotency_key;
    if found then
      if v_job.harvest_id <> p_harvest_id or v_job.origin <> trim(p_origin)
         or v_job.destination <> trim(p_destination)
         or v_job.requested_quantity is distinct from p_requested_quantity
         or v_job.requested_pickup_at is distinct from p_requested_pickup_at
         or v_job.storage_request_id is distinct from p_storage_request_id then
        raise exception 'Idempotency key was already used with different transport data' using errcode = '23505';
      end if;
      return v_job;
    end if;
  end if;
  if p_requested_pickup_at is not null and p_requested_pickup_at < now() then
    raise exception 'Requested pickup time must not be in the past' using errcode = '22023';
  end if;
  insert into public.transport_jobs (
    harvest_id, farmer_id, storage_request_id, status, origin, destination,
    pickup_location, destination_location, requested_quantity, quantity_unit,
    requested_pickup_at, loading_instructions, integration_mode, source, idempotency_key
  )
  values (
    p_harvest_id, auth.uid(), p_storage_request_id, 'quote_pending', trim(p_origin), trim(p_destination),
    trim(p_origin), trim(p_destination), p_requested_quantity, case when p_requested_quantity is null then null else 'kg' end,
    p_requested_pickup_at, p_loading_instructions, 'manual', 'manually_entered', p_idempotency_key
  )
  on conflict (farmer_id, idempotency_key) where idempotency_key is not null do nothing
  returning * into v_job;
  if not found then
    select * into v_job from public.transport_jobs
      where farmer_id = auth.uid() and idempotency_key = p_idempotency_key;
    if v_job.harvest_id <> p_harvest_id or v_job.origin <> trim(p_origin)
       or v_job.destination <> trim(p_destination)
       or v_job.requested_quantity is distinct from p_requested_quantity
       or v_job.requested_pickup_at is distinct from p_requested_pickup_at
       or v_job.storage_request_id is distinct from p_storage_request_id then
      raise exception 'Idempotency key was already used with different transport data' using errcode = '23505';
    end if;
    return v_job;
  end if;
  insert into public.transport_events (transport_request_id, event_type, event_time, notes, recorded_by, source)
  values (v_job.id, 'request_created', now(), p_loading_instructions, auth.uid(), 'manual');
  insert into public.activity_events (harvest_id, actor_id, event_type, details)
  values (p_harvest_id, auth.uid(), 'transport_requested', jsonb_build_object('transport_job_id', v_job.id));
  return v_job;
end;
$$;

create or replace function public.kavandor_record_inventory(
  p_harvest_id uuid,
  p_facility_id uuid,
  p_actual_received_kg numeric,
  p_reservation_id uuid default null,
  p_status text default 'received',
  p_discrepancy_notes text default null,
  p_idempotency_key text default null
)
returns public.inventory_batches
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_harvest public.harvests%rowtype;
  v_batch public.inventory_batches%rowtype;
  v_reservation public.reservations%rowtype;
  v_facility_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_status <> 'received' then raise exception 'A new inventory batch must start in received status' using errcode = '23514'; end if;
  if p_actual_received_kg is null or p_actual_received_kg < 0 then
    raise exception 'Invalid received quantity' using errcode = '22023';
  end if;
  select f.id into v_facility_id from public.facilities f
    where f.id = p_facility_id and (
      public.kavandor_is_admin() or
      (public.kavandor_current_role() = 'facility_operator' and f.operator_id = auth.uid())
    )
    for update;
  if not found then raise exception 'Assigned facility operator required' using errcode = '42501'; end if;
  if p_idempotency_key is not null then
    select * into v_batch from public.inventory_batches
      where facility_id = p_facility_id and idempotency_key = p_idempotency_key;
    if found then
      if v_batch.harvest_id <> p_harvest_id
         or v_batch.reservation_id is distinct from p_reservation_id
         or v_batch.actual_received_kg <> p_actual_received_kg
         or v_batch.status <> p_status
         or v_batch.discrepancy_notes is distinct from p_discrepancy_notes then
        raise exception 'Idempotency key was already used with different intake data' using errcode = '23505';
      end if;
      return v_batch;
    end if;
  end if;
  select * into v_harvest from public.harvests where id = p_harvest_id;
  if not found then raise exception 'Harvest not found' using errcode = 'P0002'; end if;
  if v_harvest.unit <> 'kg' or p_actual_received_kg < 0 then
    raise exception 'Invalid received quantity' using errcode = '22023';
  end if;
  if p_reservation_id is not null then
    select * into v_reservation from public.reservations r
      where r.id = p_reservation_id and r.harvest_id = p_harvest_id
        and r.facility_id = p_facility_id and r.status = 'confirmed'
      for update;
    if not found then raise exception 'A matching confirmed reservation is required' using errcode = '23514'; end if;
    if p_actual_received_kg > v_reservation.quantity_kg then
      raise exception 'Received quantity exceeds the confirmed reservation' using errcode = '23514';
    end if;
  end if;

  insert into public.inventory_batches (
    harvest_id, facility_id, reservation_id, actual_received_kg, discrepancy_kg, discrepancy_notes, status, idempotency_key
  )
  values (
    p_harvest_id, p_facility_id, p_reservation_id, p_actual_received_kg,
    v_harvest.quantity - p_actual_received_kg, p_discrepancy_notes, p_status, p_idempotency_key
  )
  returning * into v_batch;
  insert into public.activity_events (harvest_id, actor_id, event_type, details)
  values (p_harvest_id, auth.uid(), 'inventory_received',
    jsonb_build_object('batch_id', v_batch.id, 'declared_quantity', v_harvest.quantity, 'actual_received_kg', p_actual_received_kg));
  if p_reservation_id is not null then
    update public.reservations set status = 'completed', updated_at = now() where id = p_reservation_id;
    update public.capacity_slots set reserved_kg = greatest(0, reserved_kg - v_reservation.quantity_kg)
      where facility_id = p_facility_id
        and window_start <= v_reservation.requested_start_at
        and window_end >= v_reservation.expected_end_at;
  end if;
  update public.transactions t set
    actual_received_kg = (
      select coalesce(sum(i.actual_received_kg), 0) from public.inventory_batches i where i.harvest_id = p_harvest_id
    ),
    status = case
      when t.agreed_quantity_kg is null or (
        select coalesce(sum(i.actual_received_kg), 0)
        from public.inventory_batches i where i.harvest_id = p_harvest_id
      ) >= t.agreed_quantity_kg then 'completed'
      else t.status
    end
  where t.harvest_id = p_harvest_id and t.status = 'confirmed';
  return v_batch;
end;
$$;

create or replace function public.kavandor_admin_assign_role(
  p_profile_id uuid,
  p_role text,
  p_company_name text default null,
  p_location text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles%rowtype;
begin
  if auth.uid() is null or not public.kavandor_is_admin() then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;
  if p_role not in ('farmer', 'buyer', 'facility_operator', 'transport_provider') then
    raise exception 'Role cannot be assigned through this operation' using errcode = '22023';
  end if;
  if p_role = 'buyer' and (nullif(trim(p_company_name), '') is null or nullif(trim(p_location), '') is null) then
    raise exception 'Buyer company name and location are required' using errcode = '22023';
  end if;
  update public.profiles
    set role = p_role, requested_role = null, updated_at = now()
    where id = p_profile_id
    returning * into v_profile;
  if not found then raise exception 'Profile not found' using errcode = 'P0002'; end if;
  if p_role = 'buyer' then
    insert into public.buyers (profile_id, company_name, location)
      values (p_profile_id, trim(p_company_name), trim(p_location))
      on conflict (profile_id) do update set company_name = excluded.company_name, location = excluded.location;
  end if;
  return v_profile;
end;
$$;

create or replace function public.kavandor_save_assessment(
  p_harvest_id uuid,
  p_crop text,
  p_confidence numeric,
  p_observations jsonb,
  p_defects jsonb,
  p_limitations jsonb,
  p_provider text,
  p_mode text,
  p_model text
)
returns public.assessments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_assessment public.assessments%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if public.kavandor_current_role() not in ('farmer', 'operations_admin')
     or not exists (select 1 from public.harvests h where h.id = p_harvest_id and (h.farmer_id = auth.uid() or public.kavandor_is_admin())) then
    raise exception 'Harvest access denied' using errcode = '42501';
  end if;
  if p_confidence < 0 or p_confidence > 1 or p_mode not in ('provider', 'manual_fallback') then
    raise exception 'Invalid assessment output' using errcode = '22023';
  end if;

  insert into public.assessments (
    harvest_id, crop, confidence, observations, defects, limitations, provider, assessment_mode, model, recommendations
  )
  values (p_harvest_id, p_crop, p_confidence, p_observations, p_defects, p_limitations, p_provider, p_mode, p_model, '[]'::jsonb)
  on conflict (harvest_id) do update set
    crop = excluded.crop, confidence = excluded.confidence, observations = excluded.observations,
    defects = excluded.defects, limitations = excluded.limitations, provider = excluded.provider,
    assessment_mode = excluded.assessment_mode, model = excluded.model, created_at = now()
  returning * into v_assessment;
  update public.harvests set status = 'assessed', updated_at = now() where id = p_harvest_id;
  insert into public.activity_events (harvest_id, actor_id, event_type, details)
  values (p_harvest_id, auth.uid(), 'assessment_completed',
    jsonb_build_object('assessment_id', v_assessment.id, 'assessment_mode', p_mode, 'provider', p_provider));
  return v_assessment;
end;
$$;

create or replace function public.kavandor_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(public.kavandor_current_role() = 'operations_admin', false)
$$;

create or replace function public.kavandor_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', '')
    ),
    'farmer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists kavandor_auth_user_created on auth.users;
create trigger kavandor_auth_user_created
  after insert on auth.users
  for each row execute function public.kavandor_auth_user_created();

create or replace function public.kavandor_ensure_profile()
returns setof public.profiles
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user auth.users%rowtype;
begin
  select * into v_user from auth.users where id = auth.uid();
  if not found then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (v_user.id, v_user.email, nullif(v_user.raw_user_meta_data ->> 'full_name', ''), 'farmer')
  on conflict (id) do nothing;

  return query select p.* from public.profiles p where p.id = auth.uid();
end;
$$;

create or replace function public.kavandor_create_listing(
  p_harvest_id uuid,
  p_unit_price numeric,
  p_source text default 'manually_entered'
)
returns public.listings
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_harvest public.harvests%rowtype;
  v_listing public.listings%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if public.kavandor_current_role() not in ('farmer', 'operations_admin') then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  if p_unit_price <= 0 then
    raise exception 'Price must be greater than zero' using errcode = '22023';
  end if;

  select * into v_harvest from public.harvests
  where id = p_harvest_id
    and (farmer_id = auth.uid() or public.kavandor_is_admin())
  for update;
  if not found then
    raise exception 'Harvest not found or access denied' using errcode = 'P0002';
  end if;
  if v_harvest.unit <> 'kg' then
    raise exception 'Listings require quantity in kilograms' using errcode = '22023';
  end if;
  if v_harvest.status not in ('assessed', 'listed') then
    raise exception 'Harvest is not ready to list' using errcode = '23514';
  end if;

  insert into public.listings (harvest_id, crop, quantity_kg, unit_price, county, source)
  values (v_harvest.id, v_harvest.crop, v_harvest.quantity, p_unit_price, v_harvest.location, p_source)
  on conflict (harvest_id) do update
    set unit_price = excluded.unit_price, updated_at = now()
    where public.listings.status = 'active'
  returning * into v_listing;
  if not found then
    raise exception 'Listing is closed' using errcode = '23514';
  end if;

  update public.harvests set status = 'listed', updated_at = now() where id = v_harvest.id;
  insert into public.activity_events (harvest_id, actor_id, event_type, details)
  values (v_harvest.id, auth.uid(), 'listing_created', jsonb_build_object('listing_id', v_listing.id));
  return v_listing;
end;
$$;

create or replace function public.kavandor_accept_offer(p_offer_id uuid)
returns public.offers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_offer public.offers%rowtype;
  v_harvest public.harvests%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_offer from public.offers where id = p_offer_id;
  if not found then
    raise exception 'Offer not found' using errcode = 'P0002';
  end if;

  select * into v_harvest from public.harvests
    where id = v_offer.harvest_id and (farmer_id = auth.uid() or public.kavandor_is_admin())
    for update;
  if not found then raise exception 'Offer not found or access denied' using errcode = 'P0002'; end if;

  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then raise exception 'Offer not found' using errcode = 'P0002'; end if;
  if v_offer.status <> 'pending' or (v_offer.expires_at is not null and v_offer.expires_at <= now()) then
    raise exception 'Offer is no longer pending' using errcode = '23514';
  end if;

  update public.offers set status = 'accepted', updated_at = now() where id = v_offer.id returning * into v_offer;
  update public.offers set status = 'rejected', updated_at = now()
    where harvest_id = v_offer.harvest_id and id <> v_offer.id and status = 'pending';
  update public.listings set status = 'closed', updated_at = now() where harvest_id = v_offer.harvest_id;
  update public.harvests set status = 'sold', updated_at = now() where id = v_offer.harvest_id;
  insert into public.transactions (harvest_id, buyer_id, offer_id, agreed_price, agreed_quantity_kg, status)
  values (v_offer.harvest_id, v_offer.buyer_id, v_offer.id, v_offer.price_per_kg, v_offer.quantity_kg, 'confirmed')
  on conflict (offer_id) do nothing;
  insert into public.activity_events (harvest_id, actor_id, event_type, details)
  values (v_offer.harvest_id, auth.uid(), 'offer_accepted', jsonb_build_object('offer_id', v_offer.id));
  insert into public.notifications (user_id, event_type, message, resource_type, resource_id)
  select b.profile_id, 'offer_accepted', 'Your offer was accepted.', 'offer', v_offer.id
  from public.buyers b where b.id = v_offer.buyer_id;
  return v_offer;
end;
$$;

create or replace function public.kavandor_transition_offer(p_offer_id uuid, p_next_status text)
returns public.offers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_offer public.offers%rowtype;
  v_is_farmer boolean;
  v_is_buyer boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_next_status not in ('rejected', 'withdrawn', 'expired') then
    raise exception 'Invalid offer transition' using errcode = '22023';
  end if;
  select o.* into v_offer from public.offers o where o.id = p_offer_id for update;
  if not found then raise exception 'Offer not found' using errcode = 'P0002'; end if;
  select exists(select 1 from public.harvests h where h.id = v_offer.harvest_id and h.farmer_id = auth.uid()),
         exists(select 1 from public.buyers b where b.id = v_offer.buyer_id and b.profile_id = auth.uid())
    into v_is_farmer, v_is_buyer;
  if p_next_status = 'rejected' and not (v_is_farmer or public.kavandor_is_admin()) then
    raise exception 'Only the farmer can reject an offer' using errcode = '42501';
  end if;
  if p_next_status = 'withdrawn' and not (v_is_buyer or public.kavandor_is_admin()) then
    raise exception 'Only the submitting buyer can withdraw an offer' using errcode = '42501';
  end if;
  if p_next_status = 'expired' and not (v_is_farmer or v_is_buyer or public.kavandor_is_admin()) then
    raise exception 'Only offer participants can expire an offer' using errcode = '42501';
  end if;
  if p_next_status = 'expired' and (v_offer.expires_at is null or v_offer.expires_at > now()) then
    raise exception 'Offer has not expired' using errcode = '23514';
  end if;
  if v_offer.status <> 'pending' then raise exception 'Offer is no longer pending' using errcode = '23514'; end if;

  update public.offers set status = p_next_status, updated_at = now()
    where id = p_offer_id returning * into v_offer;
  insert into public.activity_events (harvest_id, actor_id, event_type, details)
  values (v_offer.harvest_id, auth.uid(), 'offer_' || p_next_status, jsonb_build_object('offer_id', v_offer.id));
  if p_next_status in ('rejected', 'expired') then
    insert into public.notifications (user_id, event_type, message, resource_type, resource_id)
    select b.profile_id, 'offer_' || p_next_status, 'Your offer was ' || p_next_status || '.', 'offer', v_offer.id
      from public.buyers b where b.id = v_offer.buyer_id;
  elsif p_next_status = 'withdrawn' then
    insert into public.notifications (user_id, event_type, message, resource_type, resource_id)
    select h.farmer_id, 'offer_withdrawn', 'A buyer withdrew an offer.', 'offer', v_offer.id
      from public.harvests h where h.id = v_offer.harvest_id;
  end if;
  return v_offer;
end;
$$;

create or replace function public.kavandor_assign_transport_provider(
  p_transport_job_id uuid,
  p_provider_id uuid
)
returns public.transport_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.transport_jobs%rowtype;
begin
  if auth.uid() is null or not public.kavandor_is_admin() then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.profiles p where p.id = p_provider_id and p.role = 'transport_provider'
  ) then
    raise exception 'Transport provider profile required' using errcode = '23514';
  end if;
  select * into v_job from public.transport_jobs where id = p_transport_job_id for update;
  if not found then raise exception 'Transport job not found' using errcode = 'P0002'; end if;
  if v_job.status <> 'quote_pending' then
    raise exception 'Only unconfirmed transport requests can be assigned' using errcode = '23514';
  end if;
  update public.transport_jobs set provider_id = p_provider_id, updated_at = now()
    where id = p_transport_job_id returning * into v_job;
  insert into public.activity_events (harvest_id, actor_id, event_type, details)
  values (v_job.harvest_id, auth.uid(), 'transport_assigned',
    jsonb_build_object('transport_job_id', v_job.id, 'provider_id', p_provider_id));
  insert into public.notifications (user_id, event_type, message, resource_type, resource_id)
  values (p_provider_id, 'transport_assigned', 'A transport request has been assigned to you.', 'transport_job', v_job.id);
  return v_job;
end;
$$;

create or replace function public.kavandor_reserve_capacity(
  p_harvest_id uuid,
  p_facility_id uuid,
  p_quantity_kg numeric,
  p_requested_start timestamptz,
  p_expected_end timestamptz,
  p_handling_notes text default null,
  p_transport_preference text default null,
  p_idempotency_key text default null
)
returns public.reservations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_harvest public.harvests%rowtype;
  v_slot public.capacity_slots%rowtype;
  v_reservation public.reservations%rowtype;
  v_locked_facility uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if public.kavandor_current_role() not in ('farmer', 'operations_admin') then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  if p_quantity_kg <= 0 or p_expected_end <= p_requested_start then
    raise exception 'Invalid reservation quantity or dates' using errcode = '22023';
  end if;
  if p_idempotency_key is not null then
    select * into v_reservation from public.reservations
      where farmer_id = auth.uid() and idempotency_key = p_idempotency_key;
    if found then
      if v_reservation.harvest_id <> p_harvest_id or v_reservation.facility_id <> p_facility_id
         or v_reservation.quantity_kg <> p_quantity_kg
         or v_reservation.requested_start_at <> p_requested_start
         or v_reservation.expected_end_at <> p_expected_end then
        raise exception 'Idempotency key was already used with different reservation data' using errcode = '23505';
      end if;
      return v_reservation;
    end if;
  end if;

  select id into v_locked_facility from public.facilities where id = p_facility_id for update;
  if not found then raise exception 'Facility not found' using errcode = 'P0002'; end if;
  if p_idempotency_key is not null then
    select * into v_reservation from public.reservations
      where farmer_id = auth.uid() and idempotency_key = p_idempotency_key;
    if found then
      if v_reservation.harvest_id <> p_harvest_id or v_reservation.facility_id <> p_facility_id
         or v_reservation.quantity_kg <> p_quantity_kg
         or v_reservation.requested_start_at <> p_requested_start
         or v_reservation.expected_end_at <> p_expected_end then
        raise exception 'Idempotency key was already used with different reservation data' using errcode = '23505';
      end if;
      return v_reservation;
    end if;
  end if;
  if p_requested_start < now() then
    raise exception 'Reservation start must be in the future' using errcode = '22023';
  end if;

  select * into v_harvest from public.harvests
    where id = p_harvest_id and (farmer_id = auth.uid() or public.kavandor_is_admin())
    for update;
  if not found then
    raise exception 'Harvest not found or access denied' using errcode = 'P0002';
  end if;
  if v_harvest.unit <> 'kg' or p_quantity_kg > v_harvest.quantity then
    raise exception 'Requested quantity exceeds harvest quantity or unit is unsupported' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.facilities f
    where f.id = p_facility_id and case
      when jsonb_typeof(f.accepted_commodities) = 'array' then exists (
        select 1 from jsonb_array_elements_text(f.accepted_commodities) as accepted(commodity)
        where lower(accepted.commodity) = lower(v_harvest.crop)
      )
      else false
    end
  ) then
    raise exception 'Facility does not accept this commodity' using errcode = '23514';
  end if;

  select * into v_slot from public.capacity_slots
    where facility_id = p_facility_id
      and window_start <= p_requested_start
      and window_end >= p_expected_end
    order by window_start
    limit 1
    for update;
  if not found then
    raise exception 'No facility capacity slot covers the requested dates' using errcode = 'P0002';
  end if;
  if v_slot.reserved_kg + p_quantity_kg > v_slot.capacity_kg then
    raise exception 'Facility capacity exceeded' using errcode = '23514';
  end if;

  update public.capacity_slots set reserved_kg = reserved_kg + p_quantity_kg where id = v_slot.id;
  insert into public.reservations (
    harvest_id, facility_id, farmer_id, quantity_kg, quantity_unit,
    requested_start_at, expected_end_at, handling_notes, transport_preference,
    status, source, idempotency_key
  )
  values (
    p_harvest_id, p_facility_id, auth.uid(), p_quantity_kg, 'kg',
    p_requested_start, p_expected_end, p_handling_notes, p_transport_preference,
    'pending', 'manually_entered', p_idempotency_key
  )
  returning * into v_reservation;
  insert into public.activity_events (harvest_id, actor_id, event_type, details)
  values (p_harvest_id, auth.uid(), 'reservation_created', jsonb_build_object('reservation_id', v_reservation.id, 'quantity_kg', p_quantity_kg));
  insert into public.notifications (user_id, event_type, message, resource_type, resource_id)
  select f.operator_id, 'reservation_requested', 'A facility reservation request was submitted.', 'reservation', v_reservation.id
    from public.facilities f where f.id = p_facility_id and f.operator_id is not null;
  return v_reservation;
end;
$$;

create or replace function public.kavandor_reservation_status(
  p_reservation_id uuid,
  p_next_status text
)
returns public.reservations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reservation public.reservations%rowtype;
  v_role text;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  v_role := public.kavandor_current_role();
  select * into v_reservation from public.reservations where id = p_reservation_id for update;
  if not found then raise exception 'Reservation not found' using errcode = 'P0002'; end if;

  if p_next_status = 'confirmed' then
    if v_role <> 'operations_admin' and (
      v_role <> 'facility_operator' or not exists (
        select 1 from public.facilities f where f.id = v_reservation.facility_id and f.operator_id = auth.uid()
      )
    ) then raise exception 'Assigned facility operator required' using errcode = '42501'; end if;
  elsif p_next_status = 'released' then
    if v_role not in ('farmer', 'facility_operator', 'operations_admin')
       or (v_role = 'farmer' and v_reservation.farmer_id <> auth.uid()) then
      raise exception 'Forbidden' using errcode = '42501';
    end if;
  elsif p_next_status = 'completed' then
    if v_role <> 'operations_admin' and (
      v_role <> 'facility_operator' or not exists (
        select 1 from public.facilities f where f.id = v_reservation.facility_id and f.operator_id = auth.uid()
      )
    ) then raise exception 'Assigned facility operator required' using errcode = '42501'; end if;
  else
    raise exception 'Invalid reservation status' using errcode = '22023';
  end if;

  if v_reservation.status <> 'pending' and not (v_reservation.status = 'confirmed' and p_next_status in ('released', 'completed')) then
    raise exception 'Invalid reservation transition' using errcode = '23514';
  end if;
  update public.reservations set status = p_next_status, updated_at = now()
    where id = p_reservation_id returning * into v_reservation;
  if p_next_status in ('released', 'completed') then
    update public.capacity_slots set reserved_kg = greatest(0, reserved_kg - v_reservation.quantity_kg)
      where facility_id = v_reservation.facility_id
        and window_start <= v_reservation.requested_start_at
        and window_end >= v_reservation.expected_end_at;
  end if;
  insert into public.activity_events (harvest_id, actor_id, event_type, details)
  values (v_reservation.harvest_id, auth.uid(), 'reservation_' || p_next_status, jsonb_build_object('reservation_id', p_reservation_id));
  if p_next_status in ('confirmed', 'released', 'completed') then
    insert into public.notifications (user_id, event_type, message, resource_type, resource_id)
    values (v_reservation.farmer_id, 'reservation_' || p_next_status,
      'Your facility reservation was marked ' || p_next_status || '.', 'reservation', p_reservation_id);
  end if;
  return v_reservation;
end;
$$;

create or replace function public.kavandor_create_capacity_slot(
  p_facility_id uuid,
  p_capacity_kg numeric,
  p_window_start timestamptz,
  p_window_end timestamptz
)
returns public.capacity_slots
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_facility public.facilities%rowtype;
  v_slot public.capacity_slots%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  select * into v_facility from public.facilities where id = p_facility_id for update;
  if not found then raise exception 'Facility not found' using errcode = 'P0002'; end if;
  if public.kavandor_current_role() <> 'operations_admin'
     and (public.kavandor_current_role() <> 'facility_operator' or v_facility.operator_id <> auth.uid()) then
    raise exception 'Assigned facility operator required' using errcode = '42501';
  end if;
  if p_capacity_kg <= 0 or p_window_end <= p_window_start then
    raise exception 'Invalid capacity or time window' using errcode = '22023';
  end if;
  insert into public.capacity_slots (facility_id, capacity_kg, reserved_kg, window_start, window_end)
  values (p_facility_id, p_capacity_kg, 0, p_window_start, p_window_end)
  returning * into v_slot;
  return v_slot;
end;
$$;

create or replace function public.kavandor_touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.kavandor_validate_harvest_photo()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_harvest_id uuid;
  v_photo_count integer;
begin
  if new.storage_path not like new.harvest_id::text || '/%' then
    raise exception 'Photo path must be scoped to its harvest' using errcode = '23514';
  end if;
  select id into v_harvest_id from public.harvests where id = new.harvest_id for update;
  if not found then raise exception 'Harvest not found' using errcode = '23503'; end if;
  select count(*) into v_photo_count from public.harvest_photos where harvest_id = new.harvest_id;
  if v_photo_count >= 5 then
    raise exception 'A harvest may have no more than five photos' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists harvest_photos_validate_insert on public.harvest_photos;
create trigger harvest_photos_validate_insert before insert on public.harvest_photos
for each row execute function public.kavandor_validate_harvest_photo();

create or replace function public.kavandor_clear_deleted_harvest_photo()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.harvests set photo_path = (
    select p.storage_path from public.harvest_photos p
    where p.harvest_id = old.harvest_id
    order by p.created_at desc limit 1
  ), updated_at = now()
  where id = old.harvest_id and photo_path = old.storage_path;
  return old;
end;
$$;

drop trigger if exists harvest_photos_clear_pointer on public.harvest_photos;
create trigger harvest_photos_clear_pointer after delete on public.harvest_photos
for each row execute function public.kavandor_clear_deleted_harvest_photo();

create or replace function public.kavandor_guard_protected_updates()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_table_name = 'harvests' then
    if (new.id, new.farmer_id, new.farm_id, new.availability, new.variety,
        new.idempotency_key, new.demo_data, new.created_at)
       is distinct from
       (old.id, old.farmer_id, old.farm_id, old.availability, old.variety,
        old.idempotency_key, old.demo_data, old.created_at) then
      raise exception 'Protected harvest fields cannot be changed' using errcode = '42501';
    end if;
    if new.photo_path is distinct from old.photo_path and new.photo_path is not null and not exists (
      select 1 from public.harvest_photos p
      where p.harvest_id = old.id and p.storage_path = new.photo_path
    ) then
      raise exception 'A harvest photo must have a matching stored metadata record' using errcode = '23514';
    end if;
    if old.status not in ('draft', 'submitted') and
       (new.crop, new.quantity, new.unit, new.harvest_date, new.location, new.handling_notes)
       is distinct from
       (old.crop, old.quantity, old.unit, old.harvest_date, old.location, old.handling_notes) then
      raise exception 'Harvest details cannot be changed after assessment' using errcode = '23514';
    end if;
    if new.status is distinct from old.status and not (
      (old.status = 'draft' and new.status in ('submitted', 'assessed', 'cancelled')) or
      (old.status = 'submitted' and new.status in ('assessed', 'cancelled')) or
      (old.status = 'assessed' and new.status in ('listed', 'cancelled')) or
      (old.status = 'listed' and new.status in ('sold', 'cancelled'))
    ) then
      raise exception 'Invalid harvest state transition' using errcode = '23514';
    end if;
  elsif tg_table_name = 'profiles' then
    if new.role is distinct from old.role and auth.uid() is not null and not public.kavandor_is_admin() then
      raise exception 'Role changes require administrator approval' using errcode = '42501';
    end if;
  elsif tg_table_name = 'facilities' then
    if (new.operator_id, new.verification_status, new.verified_at)
       is distinct from (old.operator_id, old.verification_status, old.verified_at)
       and not public.kavandor_is_admin() then
      raise exception 'Facility assignment and verification require an administrator' using errcode = '42501';
    end if;
    if new.verification_status is distinct from old.verification_status then
      new.verified_at := case when new.verification_status = 'verified' then now() else null end;
    end if;
  elsif tg_table_name = 'transport_jobs' then
    if (new.id, new.harvest_id, new.farmer_id, new.provider_id, new.origin, new.destination,
        new.storage_request_id, new.requested_quantity, new.quoted_price, new.confirmed_price)
       is distinct from
       (old.id, old.harvest_id, old.farmer_id, old.provider_id, old.origin, old.destination,
        old.storage_request_id, old.requested_quantity, old.quoted_price, old.confirmed_price)
       and not public.kavandor_is_admin() then
      raise exception 'Protected transport fields cannot be changed' using errcode = '42501';
    end if;
    if new.status <> old.status and not (
      (old.status = 'quote_pending' and new.status in ('scheduled', 'cancelled')) or
      (old.status = 'scheduled' and new.status in ('in_transit', 'cancelled')) or
      (old.status = 'in_transit' and new.status in ('delivered', 'cancelled'))
    ) then
      raise exception 'Invalid transport state transition' using errcode = '23514';
    end if;
    if new.status = 'scheduled' and (
      public.kavandor_current_role() not in ('transport_provider', 'operations_admin')
      or (old.provider_id is distinct from auth.uid() and not public.kavandor_is_admin())
    ) then
      raise exception 'Only a transport provider can confirm scheduling' using errcode = '42501';
    end if;
    if new.status in ('in_transit', 'delivered')
       and (old.provider_id is distinct from auth.uid())
       and not public.kavandor_is_admin() then
      raise exception 'Only the assigned transport provider can update delivery status' using errcode = '42501';
    end if;
    if new.status = 'delivered' and new.actual_received_kg is null then
      raise exception 'Delivered transport requires an actual received quantity' using errcode = '23514';
    end if;
    if new.status = 'delivered' and old.requested_quantity is not null
       and new.actual_received_kg is distinct from old.requested_quantity
       and nullif(trim(new.discrepancy_notes), '') is null then
      raise exception 'Delivery quantity discrepancy requires notes' using errcode = '23514';
    end if;
    if new.status = 'cancelled'
       and old.farmer_id is distinct from auth.uid()
       and old.provider_id is distinct from auth.uid()
       and not public.kavandor_is_admin() then
      raise exception 'Only a transport participant can cancel this job' using errcode = '42501';
    end if;
    if new.actual_received_kg is distinct from old.actual_received_kg and (
      new.status <> 'delivered'
      or (old.provider_id is distinct from auth.uid() and not public.kavandor_is_admin())
    ) then
      raise exception 'Only the assigned provider can record delivered quantity' using errcode = '42501';
    end if;
    if new.discrepancy_notes is distinct from old.discrepancy_notes
       and old.farmer_id is distinct from auth.uid()
       and old.provider_id is distinct from auth.uid()
       and not public.kavandor_is_admin() then
      raise exception 'Only a transport participant can record discrepancies' using errcode = '42501';
    end if;
    if new.last_known_location is distinct from old.last_known_location
       and old.provider_id is distinct from auth.uid()
       and not public.kavandor_is_admin() then
      raise exception 'Only the assigned provider can update transport location' using errcode = '42501';
    end if;
  elsif tg_table_name = 'notifications' then
    if (new.id, new.user_id, new.event_type, new.message, new.resource_type, new.resource_id, new.created_at)
       is distinct from
       (old.id, old.user_id, old.event_type, old.message, old.resource_type, old.resource_id, old.created_at) then
      raise exception 'Notification contents are immutable' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.kavandor_record_row_activity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event_type text;
begin
  if tg_table_name = 'harvests' then
    if new.status is distinct from old.status then
      v_event_type := 'harvest_' || new.status;
    else
      v_event_type := 'harvest_updated';
    end if;
    insert into public.activity_events (harvest_id, actor_id, event_type, details)
    values (new.id, auth.uid(), v_event_type, jsonb_build_object('status', new.status));
  elsif tg_table_name = 'transport_jobs' and new.status is distinct from old.status then
    insert into public.activity_events (harvest_id, actor_id, event_type, details)
    values (new.harvest_id, auth.uid(), 'transport_' || new.status,
      jsonb_build_object('transport_job_id', new.id, 'actual_received_kg', new.actual_received_kg));
    insert into public.transport_events (
      transport_request_id, event_type, event_time, location, notes, quantity, quantity_unit, recorded_by, source
    ) values (
      new.id, new.status, now(), new.last_known_location, new.discrepancy_notes, new.actual_received_kg,
      case when new.actual_received_kg is null then null else 'kg' end, auth.uid(), 'manual'
    );
    if new.status = 'delivered' and new.storage_request_id is null then
      update public.transactions t set
        actual_received_kg = new.actual_received_kg,
        status = 'completed'
      where t.harvest_id = new.harvest_id and t.status = 'confirmed';
    end if;
    if new.farmer_id = auth.uid() and new.provider_id is not null then
      insert into public.notifications (user_id, event_type, message, resource_type, resource_id)
      values (new.provider_id, 'transport_' || new.status, 'A transport request was updated.', 'transport_job', new.id);
    elsif new.farmer_id is not null then
      insert into public.notifications (user_id, event_type, message, resource_type, resource_id)
      values (new.farmer_id, 'transport_' || new.status, 'Your transport request was updated.', 'transport_job', new.id);
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.kavandor_record_financial_activity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_harvest_id uuid;
  v_actor_id uuid;
  v_event_type text;
  v_resource_id uuid;
  v_details jsonb;
begin
  if tg_table_name = 'transaction_costs' then
    select t.harvest_id into v_harvest_id from public.transactions t where t.id = new.transaction_id;
    v_actor_id := new.recorded_by;
    v_event_type := 'transaction_cost_recorded';
    v_resource_id := new.transaction_id;
    v_details := jsonb_build_object('transaction_id', v_resource_id);
  elsif tg_table_name = 'transactions' then
    v_harvest_id := new.harvest_id;
    v_actor_id := auth.uid();
    v_event_type := 'transaction_' || new.status;
    v_resource_id := new.id;
    v_details := jsonb_build_object('transaction_id', v_resource_id, 'actual_received_kg', new.actual_received_kg);
  else
    select t.harvest_id into v_harvest_id from public.transactions t where t.id = new.transaction_id;
    v_actor_id := coalesce(new.recorded_by, auth.uid());
    v_event_type := case
      when tg_op = 'INSERT' then 'payment_recorded'
      else 'payment_status_' || new.status
    end;
    v_resource_id := new.transaction_id;
    v_details := jsonb_build_object('transaction_id', v_resource_id, 'status', new.status);
  end if;
  insert into public.activity_events (harvest_id, actor_id, event_type, details)
  values (v_harvest_id, v_actor_id, v_event_type, v_details);
  return new;
end;
$$;

drop trigger if exists harvests_guard_protected_updates on public.harvests;
create trigger harvests_guard_protected_updates before update on public.harvests
for each row execute function public.kavandor_guard_protected_updates();
drop trigger if exists harvests_record_activity on public.harvests;
create trigger harvests_record_activity after update on public.harvests
for each row execute function public.kavandor_record_row_activity();
drop trigger if exists transport_jobs_guard_protected_updates on public.transport_jobs;
create trigger transport_jobs_guard_protected_updates before update on public.transport_jobs
for each row execute function public.kavandor_guard_protected_updates();
drop trigger if exists transport_jobs_record_activity on public.transport_jobs;
create trigger transport_jobs_record_activity after update on public.transport_jobs
for each row execute function public.kavandor_record_row_activity();
drop trigger if exists transaction_costs_record_activity on public.transaction_costs;
create trigger transaction_costs_record_activity after insert on public.transaction_costs
for each row execute function public.kavandor_record_financial_activity();
drop trigger if exists transactions_record_activity on public.transactions;
create trigger transactions_record_activity after update of status, actual_received_kg on public.transactions
for each row execute function public.kavandor_record_financial_activity();
drop trigger if exists payment_records_record_activity on public.payment_records;
create trigger payment_records_record_activity after insert or update on public.payment_records
for each row execute function public.kavandor_record_financial_activity();
drop trigger if exists facilities_guard_protected_updates on public.facilities;
create trigger facilities_guard_protected_updates before update on public.facilities
for each row execute function public.kavandor_guard_protected_updates();
drop trigger if exists profiles_guard_protected_updates on public.profiles;
create trigger profiles_guard_protected_updates before update on public.profiles
for each row execute function public.kavandor_guard_protected_updates();
drop trigger if exists notifications_guard_protected_updates on public.notifications;
create trigger notifications_guard_protected_updates before update on public.notifications
for each row execute function public.kavandor_guard_protected_updates();

drop trigger if exists listings_touch_updated_at on public.listings;
create trigger listings_touch_updated_at before update on public.listings
for each row execute function public.kavandor_touch_updated_at();
drop trigger if exists offers_touch_updated_at on public.offers;
create trigger offers_touch_updated_at before update on public.offers
for each row execute function public.kavandor_touch_updated_at();
drop trigger if exists reservations_touch_updated_at on public.reservations;
create trigger reservations_touch_updated_at before update on public.reservations
for each row execute function public.kavandor_touch_updated_at();
drop trigger if exists transactions_touch_updated_at on public.transactions;
create trigger transactions_touch_updated_at before update on public.transactions
for each row execute function public.kavandor_touch_updated_at();

alter table public.profiles enable row level security;
alter table public.farms enable row level security;
alter table public.harvests enable row level security;
alter table public.harvest_photos enable row level security;
alter table public.assessments enable row level security;
alter table public.facilities enable row level security;
alter table public.capacity_slots enable row level security;
alter table public.reservations enable row level security;
alter table public.transport_jobs enable row level security;
alter table public.buyers enable row level security;
alter table public.offers enable row level security;
alter table public.inventory_batches enable row level security;
alter table public.transactions enable row level security;
alter table public.payment_records enable row level security;
alter table public.transaction_costs enable row level security;
alter table public.activity_events enable row level security;
alter table public.storage_capacity_snapshots enable row level security;
alter table public.storage_inventory_batches enable row level security;
alter table public.storage_condition_readings enable row level security;
alter table public.storage_inspections enable row level security;
alter table public.storage_incidents enable row level security;
alter table public.storage_alerts enable row level security;
alter table public.transport_events enable row level security;
alter table public.listings enable row level security;
alter table public.notifications enable row level security;
alter table public.harvest_recommendations enable row level security;

drop policy if exists profiles_select_own_record on public.profiles;
drop policy if exists profiles_read_self_or_admin on public.profiles;
create policy profiles_read_self_or_admin on public.profiles for select to authenticated
  using (id = auth.uid() or public.kavandor_is_admin());
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = public.kavandor_current_role());

drop policy if exists farms_owner_all on public.farms;
create policy farms_owner_all on public.farms for all to authenticated
  using (owner_id = auth.uid() or public.kavandor_is_admin())
  with check (owner_id = auth.uid() or public.kavandor_is_admin());

drop policy if exists harvests_select_own on public.harvests;
drop policy if exists harvests_insert_own on public.harvests;
drop policy if exists harvests_update_own on public.harvests;
drop policy if exists harvests_owner_select on public.harvests;
create policy harvests_owner_select on public.harvests for select to authenticated
  using (farmer_id = auth.uid() or public.kavandor_is_admin() or public.kavandor_harvest_is_public(id));
drop policy if exists harvests_owner_insert on public.harvests;
drop policy if exists harvests_owner_update on public.harvests;
create policy harvests_owner_update on public.harvests for update to authenticated
  using (farmer_id = auth.uid() or public.kavandor_is_admin())
  with check (farmer_id = auth.uid() or public.kavandor_is_admin());

drop policy if exists harvest_photos_owner_access on public.harvest_photos;
drop policy if exists harvest_photos_owner_select on public.harvest_photos;
create policy harvest_photos_owner_select on public.harvest_photos for select to authenticated
  using (exists (select 1 from public.harvests h where h.id = harvest_id and (h.farmer_id = auth.uid() or public.kavandor_is_admin())));
drop policy if exists harvest_photos_owner_insert on public.harvest_photos;
create policy harvest_photos_owner_insert on public.harvest_photos for insert to authenticated
  with check (exists (select 1 from public.harvests h where h.id = harvest_id and h.farmer_id = auth.uid()));
drop policy if exists harvest_photos_owner_delete on public.harvest_photos;
create policy harvest_photos_owner_delete on public.harvest_photos for delete to authenticated
  using (exists (select 1 from public.harvests h where h.id = harvest_id and h.farmer_id = auth.uid()));

drop policy if exists assessments_owner_select on public.assessments;
create policy assessments_owner_select on public.assessments for select to authenticated
  using (exists (select 1 from public.harvests h where h.id = harvest_id and (h.farmer_id = auth.uid() or public.kavandor_is_admin())));
drop policy if exists assessments_owner_insert on public.assessments;
drop policy if exists assessments_owner_update on public.assessments;

drop policy if exists facilities_public_read on public.facilities;
create policy facilities_public_read on public.facilities for select to anon, authenticated using (true);
drop policy if exists facilities_operator_manage on public.facilities;
drop policy if exists facilities_operator_update on public.facilities;
drop policy if exists facilities_admin_insert on public.facilities;
create policy facilities_operator_update on public.facilities for update to authenticated
  using ((operator_id = auth.uid() and public.kavandor_current_role() = 'facility_operator') or public.kavandor_is_admin())
  with check ((operator_id = auth.uid() and public.kavandor_current_role() = 'facility_operator') or public.kavandor_is_admin());
create policy facilities_admin_insert on public.facilities for insert to authenticated
  with check (public.kavandor_is_admin());

drop policy if exists capacity_slots_read on public.capacity_slots;
create policy capacity_slots_read on public.capacity_slots for select to authenticated using (true);
drop policy if exists capacity_slots_operator_manage on public.capacity_slots;

drop policy if exists reservations_participant_read on public.reservations;
create policy reservations_participant_read on public.reservations for select to authenticated
  using (farmer_id = auth.uid() or public.kavandor_is_admin() or exists (
    select 1 from public.facilities f where f.id = facility_id and f.operator_id = auth.uid()
  ));
drop policy if exists reservations_owner_insert on public.reservations;
drop policy if exists reservations_participant_update on public.reservations;

drop policy if exists transport_participant_read on public.transport_jobs;
create policy transport_participant_read on public.transport_jobs for select to authenticated
  using (farmer_id = auth.uid() or provider_id = auth.uid() or public.kavandor_is_admin());
drop policy if exists transport_farmer_insert on public.transport_jobs;
drop policy if exists transport_participant_update on public.transport_jobs;
create policy transport_participant_update on public.transport_jobs for update to authenticated
  using (farmer_id = auth.uid() or provider_id = auth.uid() or public.kavandor_is_admin())
  with check (farmer_id = auth.uid() or provider_id = auth.uid() or public.kavandor_is_admin());

drop policy if exists buyers_participant_access on public.buyers;
create policy buyers_participant_access on public.buyers for select to authenticated
  using (profile_id = auth.uid() or public.kavandor_is_admin());
drop policy if exists buyers_self_insert on public.buyers;
drop policy if exists buyers_self_update on public.buyers;

drop policy if exists offers_select_own on public.offers;
drop policy if exists offers_insert_own on public.offers;
drop policy if exists offers_update_own on public.offers;
drop policy if exists offers_participant_read on public.offers;
create policy offers_participant_read on public.offers for select to authenticated
  using (public.kavandor_is_admin()
    or exists (select 1 from public.harvests h where h.id = harvest_id and h.farmer_id = auth.uid())
    or exists (select 1 from public.buyers b where b.id = buyer_id and b.profile_id = auth.uid()));
drop policy if exists offers_buyer_insert on public.offers;
drop policy if exists offers_farmer_update on public.offers;

drop policy if exists listings_public_active on public.listings;
create policy listings_public_active on public.listings for select to anon, authenticated
  using (status = 'active' or public.kavandor_is_admin() or exists (
    select 1 from public.harvests h where h.id = harvest_id and h.farmer_id = auth.uid()
  ));
drop policy if exists listings_owner_insert on public.listings;
drop policy if exists listings_owner_update on public.listings;

drop policy if exists inventory_participant_read on public.inventory_batches;
create policy inventory_participant_read on public.inventory_batches for select to authenticated
  using (public.kavandor_is_admin() or exists (
    select 1 from public.harvests h where h.id = harvest_id and h.farmer_id = auth.uid()
  ) or exists (select 1 from public.facilities f where f.operator_id = auth.uid() and f.id in (
    select s.facility_id from public.storage_inventory_batches s where s.harvest_id = inventory_batches.harvest_id
  )) or exists (
    select 1 from public.facilities f where f.id = inventory_batches.facility_id and f.operator_id = auth.uid()
  ));
drop policy if exists inventory_intake_insert on public.inventory_batches;
drop policy if exists inventory_intake_update on public.inventory_batches;

drop policy if exists transactions_participant_read on public.transactions;
create policy transactions_participant_read on public.transactions for select to authenticated
  using (public.kavandor_is_admin()
    or exists (select 1 from public.harvests h where h.id = harvest_id and h.farmer_id = auth.uid())
    or exists (select 1 from public.buyers b where b.id = buyer_id and b.profile_id = auth.uid()));
drop policy if exists transactions_system_insert on public.transactions;
drop policy if exists transactions_admin_update on public.transactions;
create policy transactions_admin_update on public.transactions for update to authenticated
  using (public.kavandor_is_admin()) with check (public.kavandor_is_admin());

drop policy if exists payments_participant_read on public.payment_records;
create policy payments_participant_read on public.payment_records for select to authenticated
  using (public.kavandor_is_admin() or exists (
    select 1 from public.transactions t
    where t.id = transaction_id
      and (exists (select 1 from public.harvests h where h.id = t.harvest_id and h.farmer_id = auth.uid())
        or exists (select 1 from public.buyers b where b.id = t.buyer_id and b.profile_id = auth.uid()))
  ));
drop policy if exists payments_admin_manage on public.payment_records;
create policy payments_admin_manage on public.payment_records for all to authenticated
  using (public.kavandor_is_admin()) with check (public.kavandor_is_admin());

drop policy if exists transaction_costs_participant_read on public.transaction_costs;
create policy transaction_costs_participant_read on public.transaction_costs for select to authenticated
  using (public.kavandor_is_admin() or exists (
    select 1 from public.transactions t
    where t.id = transaction_id
      and (exists (select 1 from public.harvests h where h.id = t.harvest_id and h.farmer_id = auth.uid())
        or exists (select 1 from public.buyers b where b.id = t.buyer_id and b.profile_id = auth.uid()))
  ));
drop policy if exists transaction_costs_admin_manage on public.transaction_costs;
create policy transaction_costs_admin_manage on public.transaction_costs for all to authenticated
  using (public.kavandor_is_admin()) with check (public.kavandor_is_admin());

drop policy if exists activity_participant_read on public.activity_events;
create policy activity_participant_read on public.activity_events for select to authenticated
  using (public.kavandor_is_admin() or exists (
    select 1 from public.harvests h where h.id = harvest_id and h.farmer_id = auth.uid()
  ) or exists (
    select 1 from public.offers o join public.buyers b on b.id = o.buyer_id
    where o.harvest_id = activity_events.harvest_id and b.profile_id = auth.uid()
  ) or exists (
    select 1 from public.reservations r join public.facilities f on f.id = r.facility_id
    where r.harvest_id = activity_events.harvest_id and f.operator_id = auth.uid()
  ) or exists (
    select 1 from public.transport_jobs j
    where j.harvest_id = activity_events.harvest_id and j.provider_id = auth.uid()
  ));
drop policy if exists activity_authenticated_insert on public.activity_events;

drop policy if exists notifications_owner_access on public.notifications;
create policy notifications_owner_access on public.notifications for select to authenticated
  using (user_id = auth.uid() or public.kavandor_is_admin());
drop policy if exists notifications_owner_update on public.notifications;
create policy notifications_owner_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists notifications_system_insert on public.notifications;

drop policy if exists recommendation_owner_access on public.harvest_recommendations;
drop policy if exists recommendation_owner_read on public.harvest_recommendations;
create policy recommendation_owner_read on public.harvest_recommendations for select to authenticated
  using (exists (select 1 from public.harvests h where h.id = harvest_id and (h.farmer_id = auth.uid() or public.kavandor_is_admin())));

drop policy if exists storage_inventory_participant_access on public.storage_inventory_batches;
create policy storage_inventory_participant_access on public.storage_inventory_batches for select to authenticated
  using (public.kavandor_is_admin() or exists (
    select 1 from public.harvests h where h.id = harvest_id and h.farmer_id = auth.uid()
  ) or exists (
    select 1 from public.facilities f where f.id = facility_id and f.operator_id = auth.uid()
  ));
drop policy if exists storage_inventory_operator_manage on public.storage_inventory_batches;

drop policy if exists storage_operator_select on public.storage_capacity_snapshots;
create policy storage_operator_select on public.storage_capacity_snapshots for select to authenticated using (true);
drop policy if exists storage_operator_manage on public.storage_capacity_snapshots;

drop policy if exists storage_readings_select on public.storage_condition_readings;
create policy storage_readings_select on public.storage_condition_readings for select to authenticated
  using (public.kavandor_is_admin() or exists (select 1 from public.facilities f where f.id = facility_id and f.operator_id = auth.uid())
    or exists (select 1 from public.storage_inventory_batches b join public.harvests h on h.id = b.harvest_id
      where b.id = inventory_batch_id and h.farmer_id = auth.uid()));
drop policy if exists storage_readings_operator_insert on public.storage_condition_readings;
create policy storage_readings_operator_insert on public.storage_condition_readings for insert to authenticated
  with check (recorded_by = auth.uid() and (public.kavandor_is_admin() or exists (
    select 1 from public.facilities f where f.id = facility_id and f.operator_id = auth.uid()
  )));

drop policy if exists storage_inspections_select on public.storage_inspections;
create policy storage_inspections_select on public.storage_inspections for select to authenticated
  using (public.kavandor_is_admin() or inspector_id = auth.uid()
    or exists (select 1 from public.facilities f where f.id = facility_id and f.operator_id = auth.uid()));
drop policy if exists storage_inspections_operator_insert on public.storage_inspections;
create policy storage_inspections_operator_insert on public.storage_inspections for insert to authenticated
  with check (inspector_id = auth.uid() and (public.kavandor_is_admin() or exists (
    select 1 from public.facilities f where f.id = facility_id and f.operator_id = auth.uid()
  )));

drop policy if exists storage_incidents_select on public.storage_incidents;
create policy storage_incidents_select on public.storage_incidents for select to authenticated
  using (public.kavandor_is_admin() or exists (select 1 from public.facilities f where f.id = facility_id and f.operator_id = auth.uid())
    or exists (select 1 from public.storage_inventory_batches b join public.harvests h on h.id = b.harvest_id
      where b.id = inventory_batch_id and h.farmer_id = auth.uid()));
drop policy if exists storage_incidents_operator_insert on public.storage_incidents;
create policy storage_incidents_operator_insert on public.storage_incidents for insert to authenticated
  with check (public.kavandor_is_admin() or exists (
    select 1 from public.facilities f where f.id = facility_id and f.operator_id = auth.uid()
  ));

drop policy if exists storage_alerts_participant_select on public.storage_alerts;
create policy storage_alerts_participant_select on public.storage_alerts for select to authenticated
  using (farmer_id = auth.uid() or public.kavandor_is_admin()
    or exists (select 1 from public.facilities f where f.id = facility_id and f.operator_id = auth.uid()));
drop policy if exists storage_alerts_operator_manage on public.storage_alerts;

drop policy if exists transport_events_participant_read on public.transport_events;
create policy transport_events_participant_read on public.transport_events for select to authenticated
  using (public.kavandor_is_admin() or exists (
    select 1 from public.transport_jobs j where j.id = transport_request_id
      and (j.farmer_id = auth.uid() or j.provider_id = auth.uid())
  ));
drop policy if exists transport_events_participant_insert on public.transport_events;

drop policy if exists capacity_slots_operator_access on public.capacity_slots;
drop policy if exists storage_conditions_select on public.storage_condition_readings;
drop policy if exists storage_inspections_manage on public.storage_inspections;
drop policy if exists storage_incidents_manage on public.storage_incidents;
drop policy if exists transport_events_manage on public.transport_events;

drop policy if exists storage_private_harvest_photos_select on storage.objects;
create policy storage_private_harvest_photos_select on storage.objects for select to authenticated
  using (bucket_id = 'harvest-photos' and exists (
    select 1 from public.harvests h
    where (h.farmer_id = auth.uid() or public.kavandor_is_admin())
      and name like h.id::text || '/%'
  ));
drop policy if exists storage_private_harvest_photos_insert on storage.objects;
create policy storage_private_harvest_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'harvest-photos' and exists (
    select 1 from public.harvests h where h.id::text = split_part(name, '/', 1) and h.farmer_id = auth.uid()
  ));
drop policy if exists storage_private_harvest_photos_delete on storage.objects;
create policy storage_private_harvest_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'harvest-photos' and exists (
    select 1 from public.harvests h where h.id::text = split_part(name, '/', 1) and h.farmer_id = auth.uid()
  ));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('harvest-photos', 'harvest-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

revoke all on function public.kavandor_ensure_profile() from public, anon;
grant execute on function public.kavandor_ensure_profile() to authenticated;
revoke all on function public.kavandor_current_role() from public, anon;
grant execute on function public.kavandor_current_role() to authenticated;
grant execute on function public.kavandor_current_role() to anon;
revoke all on function public.kavandor_harvest_is_public(uuid) from public, anon;
grant execute on function public.kavandor_harvest_is_public(uuid) to authenticated;
grant execute on function public.kavandor_harvest_is_public(uuid) to anon;
revoke all on function public.kavandor_is_admin() from public, anon;
grant execute on function public.kavandor_is_admin() to authenticated;
grant execute on function public.kavandor_is_admin() to anon;
revoke all on function public.kavandor_create_listing(uuid, numeric, text) from public, anon;
grant execute on function public.kavandor_create_listing(uuid, numeric, text) to authenticated;
revoke all on function public.kavandor_accept_offer(uuid) from public, anon;
grant execute on function public.kavandor_accept_offer(uuid) to authenticated;
revoke all on function public.kavandor_transition_offer(uuid, text) from public, anon;
grant execute on function public.kavandor_transition_offer(uuid, text) to authenticated;
revoke all on function public.kavandor_reserve_capacity(uuid, uuid, numeric, timestamptz, timestamptz, text, text, text) from public, anon;
grant execute on function public.kavandor_reserve_capacity(uuid, uuid, numeric, timestamptz, timestamptz, text, text, text) to authenticated;
revoke all on function public.kavandor_reservation_status(uuid, text) from public, anon;
grant execute on function public.kavandor_reservation_status(uuid, text) to authenticated;
revoke all on function public.kavandor_create_capacity_slot(uuid, numeric, timestamptz, timestamptz) from public, anon;
grant execute on function public.kavandor_create_capacity_slot(uuid, numeric, timestamptz, timestamptz) to authenticated;
revoke all on function public.kavandor_create_harvest(text, numeric, text, timestamptz, text, text, text, text, text) from public, anon;
grant execute on function public.kavandor_create_harvest(text, numeric, text, timestamptz, text, text, text, text, text) to authenticated;
revoke all on function public.kavandor_create_offer(uuid, numeric, numeric, text) from public, anon;
grant execute on function public.kavandor_create_offer(uuid, numeric, numeric, text) to authenticated;
revoke all on function public.kavandor_create_transport_job(uuid, uuid, text, text, numeric, timestamptz, text, text) from public, anon;
grant execute on function public.kavandor_create_transport_job(uuid, uuid, text, text, numeric, timestamptz, text, text) to authenticated;
revoke all on function public.kavandor_assign_transport_provider(uuid, uuid) from public, anon;
grant execute on function public.kavandor_assign_transport_provider(uuid, uuid) to authenticated;
revoke all on function public.kavandor_record_inventory(uuid, uuid, numeric, uuid, text, text, text) from public, anon;
grant execute on function public.kavandor_record_inventory(uuid, uuid, numeric, uuid, text, text, text) to authenticated;
revoke all on function public.kavandor_save_assessment(uuid, text, numeric, jsonb, jsonb, jsonb, text, text, text) from public, anon;
grant execute on function public.kavandor_save_assessment(uuid, text, numeric, jsonb, jsonb, jsonb, text, text, text) to authenticated;
revoke all on function public.kavandor_admin_assign_role(uuid, text, text, text) from public, anon;
grant execute on function public.kavandor_admin_assign_role(uuid, text, text, text) to authenticated;

commit;
