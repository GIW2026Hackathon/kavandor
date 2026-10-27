alter table public.facilities
  add column if not exists description text,
  add column if not exists address text,
  add column if not exists latitude numeric(9,6),
  add column if not exists longitude numeric(9,6),
  add column if not exists facility_type text,
  add column if not exists accepted_commodities jsonb not null default '[]'::jsonb,
  add column if not exists storage_types jsonb not null default '[]'::jsonb,
  add column if not exists price_per_unit numeric(10,2),
  add column if not exists price_unit text,
  add column if not exists price_period text,
  add column if not exists minimum_quantity numeric(10,2),
  add column if not exists capacity_unit text,
  add column if not exists condition_targets jsonb not null default '{}'::jsonb,
  add column if not exists verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'provider_reported', 'verified')),
  add column if not exists verified_at timestamptz,
  add column if not exists is_demo boolean not null default true;

alter table public.reservations
  add column if not exists farmer_id uuid references public.profiles(id),
  add column if not exists quantity_unit text,
  add column if not exists requested_start_at timestamptz,
  add column if not exists expected_end_at timestamptz,
  add column if not exists storage_requirements text,
  add column if not exists transport_preference text
    check (transport_preference in ('self_arranged', 'songa_demo', 'songa_provider')),
  add column if not exists estimated_storage_cost numeric(10,2),
  add column if not exists confirmed_storage_cost numeric(10,2),
  add column if not exists source text not null default 'demo_data'
    check (source in ('provider_confirmed', 'provider_reported', 'manually_entered', 'demo_data')),
  add column if not exists updated_at timestamptz not null default now();

update public.reservations set quantity_unit = 'kg' where quantity_unit is null;
alter table public.reservations alter column quantity_unit set not null;

alter table public.transport_jobs
  add column if not exists farmer_id uuid references public.profiles(id),
  add column if not exists storage_request_id uuid,
  add column if not exists provider_name text,
  add column if not exists provider_reference text,
  add column if not exists pickup_location text,
  add column if not exists destination_location text,
  add column if not exists requested_quantity numeric(10,2),
  add column if not exists quantity_unit text,
  add column if not exists requested_pickup_at timestamptz,
  add column if not exists quoted_price numeric(10,2),
  add column if not exists confirmed_price numeric(10,2),
  add column if not exists integration_mode text not null default 'demo'
    check (integration_mode in ('demo', 'api')),
  add column if not exists source text not null default 'demo_data'
    check (source in ('provider_confirmed', 'provider_reported', 'manually_entered', 'demo_data')),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.storage_capacity_snapshots (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  total_capacity numeric(10,2) not null check (total_capacity >= 0),
  occupied_capacity numeric(10,2) not null default 0 check (occupied_capacity >= 0),
  reserved_capacity numeric(10,2) not null default 0 check (reserved_capacity >= 0),
  available_capacity numeric(10,2) not null check (available_capacity >= 0),
  capacity_unit text not null,
  source text not null check (source in ('provider_confirmed', 'provider_reported', 'manual', 'demo')),
  recorded_at timestamptz not null default now()
);

create table if not exists public.storage_inventory_batches (
  id uuid primary key default gen_random_uuid(),
  storage_request_id uuid references public.reservations(id) on delete set null,
  harvest_id uuid not null references public.harvests(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  admitted_quantity numeric(10,2) not null check (admitted_quantity > 0),
  available_quantity numeric(10,2) not null check (available_quantity >= 0),
  quantity_unit text not null,
  intake_at timestamptz not null,
  release_at timestamptz,
  status text not null check (status in ('received', 'active_storage', 'partially_released', 'released')) default 'received',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.storage_condition_readings (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  inventory_batch_id uuid references public.storage_inventory_batches(id) on delete cascade,
  temperature_c numeric(5,2),
  relative_humidity numeric(5,2),
  ventilation_status text,
  cooling_status text,
  power_status text,
  source_type text not null check (source_type in ('sensor', 'inspection', 'operator')),
  observed_at timestamptz not null,
  recorded_by uuid references public.profiles(id),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.storage_inspections (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  inspector_id uuid references public.profiles(id),
  inspection_type text not null,
  condition_status text not null check (condition_status in ('good', 'warning', 'critical')),
  observations text,
  issues jsonb not null default '[]'::jsonb,
  inspected_at timestamptz not null,
  next_inspection_at timestamptz
);

create table if not exists public.storage_incidents (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  inventory_batch_id uuid references public.storage_inventory_batches(id) on delete cascade,
  incident_type text not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  description text not null,
  source text not null check (source in ('sensor', 'inspection', 'operator', 'demo')),
  status text not null check (status in ('open', 'investigating', 'resolved')) default 'open',
  reported_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.storage_alerts (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  farmer_id uuid references public.profiles(id),
  inventory_batch_id uuid references public.storage_inventory_batches(id) on delete cascade,
  alert_type text not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  title text not null,
  message text not null,
  source text not null,
  status text not null check (status in ('open', 'acknowledged', 'resolved')) default 'open',
  reported_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.transport_events (
  id uuid primary key default gen_random_uuid(),
  transport_request_id uuid not null references public.transport_jobs(id) on delete cascade,
  event_type text not null,
  event_time timestamptz not null,
  location text,
  quantity numeric(10,2),
  quantity_unit text,
  notes text,
  recorded_by uuid references public.profiles(id),
  source text not null check (source in ('provider_confirmed', 'provider_reported', 'manual', 'demo'))
);

alter table public.transport_jobs
  add constraint transport_jobs_storage_request_fk
  foreign key (storage_request_id) references public.reservations(id) on delete set null;

alter table public.capacity_slots
  add constraint capacity_slots_available_not_negative
  check (reserved_kg <= capacity_kg);

create index if not exists idx_storage_capacity_facility on public.storage_capacity_snapshots (facility_id, recorded_at desc);
create index if not exists idx_storage_inventory_harvest on public.storage_inventory_batches (harvest_id);
create index if not exists idx_storage_readings_observed on public.storage_condition_readings (facility_id, observed_at desc);
create index if not exists idx_storage_alerts_farmer_status on public.storage_alerts (farmer_id, status);
create index if not exists idx_transport_events_request on public.transport_events (transport_request_id, event_time);

alter table public.storage_capacity_snapshots enable row level security;
alter table public.storage_inventory_batches enable row level security;
alter table public.storage_condition_readings enable row level security;
alter table public.storage_inspections enable row level security;
alter table public.storage_incidents enable row level security;
alter table public.storage_alerts enable row level security;
alter table public.transport_events enable row level security;
