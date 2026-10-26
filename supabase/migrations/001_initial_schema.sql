create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  full_name text,
  role text not null check (role in ('farmer', 'buyer', 'facility_operator', 'transport_provider', 'operations_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.farms (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  county text not null,
  location text,
  created_at timestamptz not null default now()
);

create table if not exists public.harvests (
  id uuid primary key default uuid_generate_v4(),
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  farm_id uuid references public.farms(id),
  crop text not null,
  quantity numeric(10,2) not null check (quantity > 0),
  unit text not null check (unit in ('kg', 'g', 'tonne', 'litre', 'bag', 'sack', 'crate', 'bucket', 'box', 'carton', 'bunch', 'piece', 'head', 'dozen', 'bale')),
  harvest_date timestamptz not null,
  location text not null,
  status text not null check (status in ('draft', 'submitted', 'assessed', 'listed', 'sold', 'cancelled')) default 'draft',
  handling_notes text,
  demo_data boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.harvest_photos (
  id uuid primary key default uuid_generate_v4(),
  harvest_id uuid not null references public.harvests(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id uuid primary key default uuid_generate_v4(),
  harvest_id uuid not null unique references public.harvests(id) on delete cascade,
  crop text not null,
  confidence numeric(4,3) check (confidence between 0 and 1),
  observations jsonb not null default '[]'::jsonb,
  defects jsonb not null default '[]'::jsonb,
  limitations jsonb not null default '[]'::jsonb,
  provider text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.facilities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  operator_id uuid references public.profiles(id),
  county text not null,
  location text not null,
  type text not null,
  demo_data boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.capacity_slots (
  id uuid primary key default uuid_generate_v4(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  capacity_kg numeric(10,2) not null check (capacity_kg > 0),
  reserved_kg numeric(10,2) not null default 0,
  window_start timestamptz not null,
  window_end timestamptz not null,
  check (window_end > window_start)
);

create table if not exists public.reservations (
  id uuid primary key default uuid_generate_v4(),
  harvest_id uuid not null references public.harvests(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  quantity_kg numeric(10,2) not null check (quantity_kg > 0),
  status text not null check (status in ('pending', 'confirmed', 'released', 'completed')) default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.transport_jobs (
  id uuid primary key default uuid_generate_v4(),
  harvest_id uuid not null references public.harvests(id) on delete cascade,
  provider_id uuid references public.profiles(id),
  status text not null check (status in ('scheduled', 'in_transit', 'delivered', 'cancelled')) default 'scheduled',
  origin text not null,
  destination text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.buyers (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  company_name text not null,
  location text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default uuid_generate_v4(),
  harvest_id uuid not null references public.harvests(id) on delete cascade,
  buyer_id uuid not null references public.buyers(id) on delete cascade,
  price_per_kg numeric(10,2) not null check (price_per_kg >= 0),
  status text not null check (status in ('pending', 'accepted', 'rejected', 'expired')) default 'pending',
  source text not null check (source in ('provider_confirmed', 'provider_reported', 'manually_entered', 'demo_data')) default 'demo_data',
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_batches (
  id uuid primary key default uuid_generate_v4(),
  harvest_id uuid not null references public.harvests(id) on delete cascade,
  actual_received_kg numeric(10,2) not null default 0 check (actual_received_kg >= 0),
  received_at timestamptz not null default now(),
  status text not null check (status in ('received', 'sorted', 'packed', 'sold')) default 'received'
);

create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  harvest_id uuid not null references public.harvests(id) on delete cascade,
  buyer_id uuid not null references public.buyers(id) on delete cascade,
  offer_id uuid references public.offers(id),
  agreed_price numeric(10,2),
  actual_received_kg numeric(10,2),
  status text not null check (status in ('pending', 'confirmed', 'completed', 'reversed')) default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.payment_records (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  status text not null check (status in ('pending', 'paid', 'failed', 'reversed')) default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default uuid_generate_v4(),
  harvest_id uuid references public.harvests(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_harvests_farmer_id on public.harvests (farmer_id);
create index if not exists idx_reservations_facility_id on public.reservations (facility_id);
create index if not exists idx_offers_harvest_id on public.offers (harvest_id);
create index if not exists idx_activity_events_harvest_id on public.activity_events (harvest_id);

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
alter table public.activity_events enable row level security;

create policy "profiles_select_own_record" on public.profiles for select using (auth.uid() = id);
create policy "harvests_select_own" on public.harvests for select using (auth.uid() = farmer_id);
create policy "harvests_insert_own" on public.harvests for insert with check (auth.uid() = farmer_id);
create policy "harvests_update_own" on public.harvests for update using (auth.uid() = farmer_id);
create policy "offers_select_own" on public.offers for select using (true);
create policy "offers_insert_own" on public.offers for insert with check (true);
create policy "offers_update_own" on public.offers for update using (true);
