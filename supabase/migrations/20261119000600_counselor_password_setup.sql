begin;

alter table public.profiles add column must_change_password boolean not null default false;

create or replace function club_private.role() returns public.club_role
language sql stable security definer set search_path = '' as $$
  select r.role from public.user_roles r join public.profiles p on p.id = r.user_id
  where r.user_id = (select auth.uid()) and r.active and not p.must_change_password
    and not coalesce((auth.jwt()->>'is_anonymous') = 'true', false)
$$;

create function public.password_change_required() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p join public.user_roles r on r.user_id = p.id
    where p.id = (select auth.uid()) and r.active and r.role = 'COUNSELOR' and p.must_change_password
      and not coalesce((auth.jwt()->>'is_anonymous') = 'true', false)
  )
$$;
revoke all on function public.password_change_required() from public, anon, authenticated;
grant execute on function public.password_change_required() to authenticated;

-- Invalidate pending provisioning nonces from the retired invitation flow.
delete from club_private.counselor_invites;
alter table club_private.counselor_invites rename to counselor_provisioning;
drop function public.prepare_counselor_invite(uuid, text, text, uuid[]);

create function public.prepare_counselor_account(actor uuid, email_address text, counselor_name text, targets uuid[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  nonce uuid;
begin
  if not exists (
    select 1 from public.user_roles r join public.profiles p on p.id = r.user_id
    where r.user_id = actor and r.active and not p.must_change_password and r.role in ('ADMIN','DIRECTOR')
  ) then
    raise exception 'Provisioning access denied' using errcode = '42501';
  end if;
  if email_address is null or char_length(email_address) not between 3 and 254
    or counselor_name is null or char_length(btrim(counselor_name)) not between 1 and 100
    or coalesce(cardinality(targets), 0) not between 1 and 50
    or (select count(*) from public.units where id = any(targets) and active) <> cardinality(targets) then
    raise exception 'Invalid counselor account' using errcode = '23514';
  end if;
  if exists (select 1 from auth.users where lower(email) = lower(email_address)) then
    raise exception 'Email already registered' using errcode = '23505';
  end if;
  delete from club_private.counselor_provisioning where expires_at <= now();
  insert into club_private.counselor_provisioning (actor_id, email, display_name, unit_ids)
    values (actor, lower(email_address), btrim(counselor_name), targets) returning token into nonce;
  return nonce;
end;
$$;
revoke all on function public.prepare_counselor_account(uuid, text, text, uuid[]) from public, anon, authenticated;
grant execute on function public.prepare_counselor_account(uuid, text, text, uuid[]) to service_role;

drop trigger provision_club_counselor on auth.users;
drop function club_private.provision_invited_counselor();

create function club_private.provision_counselor() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  pending club_private.counselor_provisioning%rowtype;
  nonce text := new.raw_app_meta_data ->> 'club_counselor_provisioning';
  unit uuid;
begin
  if nonce is null then return new; end if;
  if tg_op = 'UPDATE' and nonce is not distinct from (old.raw_app_meta_data ->> 'club_counselor_provisioning') then
    return new;
  end if;
  if nonce !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'Invalid counselor provisioning' using errcode = '23514';
  end if;
  delete from club_private.counselor_provisioning
    where token = nonce::uuid and email = lower(new.email) and expires_at > now()
    returning * into pending;
  if not found or nullif(new.encrypted_password, '') is null then
    raise exception 'Invalid counselor provisioning' using errcode = '23514';
  end if;

  perform 1 from public.user_roles r join public.profiles p on p.id = r.user_id
    where r.user_id = pending.actor_id and r.active and not p.must_change_password and r.role in ('ADMIN','DIRECTOR') for share of r, p;
  if not found then raise exception 'Provisioning issuer no longer authorized' using errcode = '42501'; end if;
  foreach unit in array pending.unit_ids loop
    perform 1 from public.units where id = unit and active for share;
    if not found then raise exception 'Provisioning unit is inactive' using errcode = '23514'; end if;
  end loop;
  insert into public.profiles (id, display_name, must_change_password) values (new.id, pending.display_name, true);
  insert into public.user_roles (user_id, role) values (new.id, 'COUNSELOR');
  insert into public.unit_staff (unit_id, user_id) select unnest(pending.unit_ids), new.id;
  insert into public.directory_audit (entity, record_id, operation, actor_id, changed_fields)
    values ('leadership', new.id::text, 'INSERT', pending.actor_id, array['role','unit_ids','must_change_password']);
  return new;
end;
$$;
revoke all on function club_private.provision_counselor() from public, anon, authenticated;
create trigger provision_club_counselor after insert or update of raw_app_meta_data on auth.users
  for each row execute function club_private.provision_counselor();

create function club_private.complete_password_setup() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set must_change_password = false
  where id = new.id and must_change_password;
  return new;
end;
$$;
revoke all on function club_private.complete_password_setup() from public, anon, authenticated;
create trigger complete_club_password_setup after update of encrypted_password on auth.users
  for each row when (
    old.encrypted_password is distinct from new.encrypted_password and new.encrypted_password is not null
    and new.encrypted_password <> ''
  ) execute function club_private.complete_password_setup();

create or replace view public.leadership_directory with (security_barrier = true) as
  select p.id, p.display_name, u.email::text as email, r.active,
    u.email_confirmed_at is not null as confirmed, p.must_change_password
  from public.profiles p
  join public.user_roles r on r.user_id = p.id
  join auth.users u on u.id = p.id
  where r.role = 'COUNSELOR' and (select club_private.role()) in ('ADMIN','DIRECTOR');

create function public.rename_counselor(target uuid, counselor_name text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not coalesce(club_private.role() in ('ADMIN','DIRECTOR'), false) then
    raise exception 'Leadership access denied' using errcode = '42501';
  end if;
  if counselor_name is null or char_length(btrim(counselor_name)) not between 1 and 100 then
    raise exception 'Invalid name' using errcode = '23514';
  end if;
  perform 1 from public.user_roles where user_id = target and role = 'COUNSELOR' for share;
  if not found then raise exception 'Counselor unavailable' using errcode = '42501'; end if;
  update public.profiles set display_name = btrim(counselor_name)
    where id = target and display_name is distinct from btrim(counselor_name);
  if found then
    insert into public.directory_audit (entity, record_id, operation, actor_id, changed_fields)
      values ('leadership', target::text, 'UPDATE', auth.uid(), array['display_name']);
  end if;
end;
$$;
revoke all on function public.rename_counselor(uuid, text) from public, anon, authenticated;
grant execute on function public.rename_counselor(uuid, text) to authenticated;

commit;
