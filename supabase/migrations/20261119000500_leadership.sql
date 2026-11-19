begin;

alter table public.user_roles add column active boolean not null default true;
create or replace function club_private.role() returns public.club_role
language sql stable security definer set search_path = '' as $$
  select role from public.user_roles where user_id = (select auth.uid()) and active
    and not coalesce((auth.jwt()->>'is_anonymous') = 'true', false)
$$;

create function club_private.prevent_self_role_change() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (tg_op <> 'INSERT' and old.user_id = auth.uid())
    or (tg_op <> 'DELETE' and new.user_id = auth.uid()) then
    raise exception 'Users cannot change their own access' using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function club_private.prevent_self_role_change() from public, anon, authenticated;
create trigger prevent_self_role_change before insert or update or delete on public.user_roles
  for each row execute function club_private.prevent_self_role_change();

create view public.leadership_directory with (security_barrier = true) as
  select p.id, p.display_name, u.email::text as email, r.active,
    u.email_confirmed_at is not null as confirmed
  from public.profiles p
  join public.user_roles r on r.user_id = p.id
  join auth.users u on u.id = p.id
  where r.role = 'COUNSELOR' and (select club_private.role()) in ('ADMIN','DIRECTOR');
revoke all on public.leadership_directory from public, anon, authenticated;
grant select on public.leadership_directory to authenticated;

alter table public.directory_audit drop constraint directory_audit_entity_check;
alter table public.directory_audit add constraint directory_audit_entity_check
  check (entity in ('units','members','unit_staff','club_settings','leadership'));

create table club_private.counselor_invites (
  token uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  email text not null,
  display_name text not null,
  unit_ids uuid[] not null,
  expires_at timestamptz not null default now() + interval '15 minutes'
);
alter table club_private.counselor_invites enable row level security;
revoke all on club_private.counselor_invites from public, anon, authenticated;

-- Only the trusted server can issue a nonce for a new Auth account.
create function public.prepare_counselor_invite(actor uuid, email_address text, counselor_name text, targets uuid[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  nonce uuid;
begin
  if not exists (select 1 from public.user_roles where user_id = actor and active and role in ('ADMIN','DIRECTOR')) then
    raise exception 'Invite access denied' using errcode = '42501';
  end if;
  if email_address is null or char_length(email_address) not between 3 and 254
    or counselor_name is null or char_length(btrim(counselor_name)) not between 1 and 100
    or coalesce(cardinality(targets), 0) not between 1 and 50
    or (select count(*) from public.units where id = any(targets) and active) <> cardinality(targets) then
    raise exception 'Invalid counselor invite' using errcode = '23514';
  end if;
  if exists (select 1 from auth.users where lower(email) = lower(email_address)) then
    raise exception 'Email already registered' using errcode = '23505';
  end if;
  delete from club_private.counselor_invites where expires_at <= now();
  insert into club_private.counselor_invites (actor_id, email, display_name, unit_ids)
    values (actor, lower(email_address), btrim(counselor_name), targets) returning token into nonce;
  return nonce;
end;
$$;
revoke all on function public.prepare_counselor_invite(uuid, text, text, uuid[]) from public, anon, authenticated;
grant execute on function public.prepare_counselor_invite(uuid, text, text, uuid[]) to service_role;

create function club_private.provision_invited_counselor() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  invitation club_private.counselor_invites%rowtype;
  nonce text := new.raw_user_meta_data ->> 'club_counselor_invite';
  unit uuid;
begin
  if nonce is null or nonce !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return new; end if;
  delete from club_private.counselor_invites
    where token = nonce::uuid and email = lower(new.email) and expires_at > now()
    returning * into invitation;
  if not found then return new; end if;
  perform 1 from public.user_roles where user_id = invitation.actor_id and active and role in ('ADMIN','DIRECTOR') for share;
  if not found then raise exception 'Invite issuer no longer authorized' using errcode = '42501'; end if;
  foreach unit in array invitation.unit_ids loop
    perform 1 from public.units where id = unit and active for share;
    if not found then raise exception 'Invite unit is inactive' using errcode = '23514'; end if;
  end loop;
  insert into public.profiles (id, display_name) values (new.id, invitation.display_name);
  insert into public.user_roles (user_id, role) values (new.id, 'COUNSELOR');
  insert into public.unit_staff (unit_id, user_id) select unnest(invitation.unit_ids), new.id;
  insert into public.directory_audit (entity, record_id, operation, actor_id, changed_fields)
    values ('leadership', new.id::text, 'INSERT', invitation.actor_id, array['role','unit_ids']);
  return new;
end;
$$;
revoke all on function club_private.provision_invited_counselor() from public, anon, authenticated;
create trigger provision_club_counselor after insert on auth.users
  for each row execute function club_private.provision_invited_counselor();

create function public.manage_counselor(target uuid, targets uuid[], enabled boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  previous boolean;
  links_changed boolean;
  changes text[] := array[]::text[];
begin
  if not coalesce(club_private.role() in ('ADMIN','DIRECTOR'), false) then
    raise exception 'Leadership access denied' using errcode = '42501';
  end if;
  select active into previous from public.user_roles where user_id = target and role = 'COUNSELOR' for update;
  if not found or target = auth.uid() then raise exception 'Counselor unavailable' using errcode = '42501'; end if;
  if targets is not null then
    if cardinality(targets) > 50 or (select count(*) from public.units where id = any(targets)) <> cardinality(targets) then
      raise exception 'Invalid counselor units' using errcode = '23514';
    end if;
    links_changed := exists (
      select unit_id from public.unit_staff where user_id = target and not (unit_id = any(targets))
    ) or exists (
      select 1 from unnest(targets) as unit(id)
      where not exists (select 1 from public.unit_staff where user_id = target and unit_id = unit.id)
    );
    if links_changed then
      delete from public.unit_staff where user_id = target and not (unit_id = any(targets));
      insert into public.unit_staff (unit_id, user_id)
        select id, target from unnest(targets) as unit(id) on conflict do nothing;
      changes := array_append(changes, 'unit_ids');
    end if;
  end if;
  if enabled is not null and enabled is distinct from previous then
    update public.user_roles set active = enabled where user_id = target;
    changes := array_append(changes, 'active');
  end if;
  if cardinality(changes) > 0 then
    insert into public.directory_audit (entity, record_id, operation, actor_id, changed_fields)
      values ('leadership', target::text, 'UPDATE', auth.uid(), changes);
  end if;
end;
$$;
revoke all on function public.manage_counselor(uuid, uuid[], boolean) from public, anon, authenticated;
grant execute on function public.manage_counselor(uuid, uuid[], boolean) to authenticated;

commit;
