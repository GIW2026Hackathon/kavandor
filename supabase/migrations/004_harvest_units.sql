alter table public.harvests
drop constraint if exists harvests_unit_check;

alter table public.harvests
add constraint harvests_unit_check
check (unit in (
  'kg', 'g', 'tonne', 'litre', 'bag', 'sack', 'crate',
  'bucket', 'box', 'carton', 'bunch', 'piece', 'head', 'dozen', 'bale'
));

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
