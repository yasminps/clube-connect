begin;

alter table public.units add column description text not null default '' check (char_length(description) <= 600);

insert into public.club_settings (name) values ('Bravos Guerreiros')
on conflict (id) do update set name = excluded.name
where club_settings.name = 'Clube Connect';

-- The public login needs only the club display name.
create view public.club_identity with (security_barrier = true) as
  select name from public.club_settings where id = 1;
revoke all on public.club_identity from public, anon, authenticated;
grant select on public.club_identity to anon, authenticated;

revoke delete on public.units, public.members from authenticated;

create policy counselor_create_member on public.members for insert to authenticated
  with check (club_private.staff(unit_id));
create policy counselor_edit_member on public.members for update to authenticated
  using (club_private.staff(unit_id))
  with check (club_private.staff(unit_id));

create or replace function club_private.protect_member_account() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor_role public.club_role := club_private.role();
  new_link boolean;
begin
  if tg_op = 'INSERT' then
    new_link := new.user_id is not null;
  else
    if auth.uid() is not null and new.id is distinct from old.id then
      raise exception 'Member identifier is immutable' using errcode = '23514';
    end if;
    new_link := new.user_id is distinct from old.user_id;
  end if;
  if new_link and auth.uid() is not null and actor_role is distinct from 'ADMIN' then
    raise exception 'Only administrators can change a member account link' using errcode = '42501';
  end if;
  if new_link and new.user_id is not null and not exists (
    select 1 from public.user_roles where user_id = new.user_id and role = 'MEMBER'
  ) then
    raise exception 'The linked account must have the MEMBER role' using errcode = '23514';
  end if;
  return new;
end;
$$;

create function club_private.check_member_unit() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  active_unit boolean;
begin
  -- Check scope before a privileged lookup, including on direct API inserts.
  if auth.uid() is not null and not coalesce(
    club_private.role() in ('ADMIN','DIRECTOR') or club_private.staff(new.unit_id), false
  ) then
    raise exception 'Member unit access denied' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' or new.unit_id is distinct from old.unit_id or (new.active and not old.active) then
    select active into active_unit from public.units where id = new.unit_id for share;
    if not coalesce(active_unit, false) then
      raise exception 'An active unit is required' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function club_private.check_member_unit() from public, anon, authenticated;
create trigger check_member_unit before insert or update on public.members
  for each row execute function club_private.check_member_unit();

create policy director_assign_counselor on public.unit_staff for insert to authenticated
  with check ((select club_private.role()) = 'DIRECTOR');
create policy director_remove_counselor on public.unit_staff for delete to authenticated
  using ((select club_private.role()) = 'DIRECTOR');

create function club_private.check_unit_staff_role() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not coalesce(club_private.role() in ('ADMIN','DIRECTOR'), false) then
    raise exception 'Staff assignment denied' using errcode = '42501';
  end if;
  if not exists (select 1 from public.user_roles where user_id = new.user_id and role = 'COUNSELOR' for share) then
    raise exception 'The assigned account must have the COUNSELOR role' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function club_private.check_unit_staff_role() from public, anon, authenticated;
create trigger check_unit_staff_role before insert or update on public.unit_staff
  for each row execute function club_private.check_unit_staff_role();

create view public.counselor_directory with (security_barrier = true) as
  select p.id, p.display_name
  from public.profiles p join public.user_roles r on r.user_id = p.id
  where r.role = 'COUNSELOR' and (select club_private.role()) in ('ADMIN','DIRECTOR');
revoke all on public.counselor_directory from public, anon, authenticated;
grant select on public.counselor_directory to authenticated;

create view public.unit_directory with (security_invoker = true, security_barrier = true) as
  select u.id, u.code, u.name, u.description, u.color, u.active,
    (select count(*) from public.members m where m.unit_id = u.id) as member_count,
    (select count(*) from public.members m where m.unit_id = u.id and m.active) as active_member_count,
    (select coalesce(sum(p.amount), 0) from public.point_transactions p where p.unit_id = u.id and p.category = 'COLETIVA') as points
  from public.units u;
revoke all on public.unit_directory from public, anon, authenticated;
grant select on public.unit_directory to authenticated;

create table public.directory_audit (
  id uuid primary key default gen_random_uuid(),
  entity text not null check (entity in ('units','members','unit_staff','club_settings')),
  record_id text not null,
  related_user_id uuid,
  operation text not null check (operation in ('INSERT','UPDATE','DELETE')),
  actor_id uuid,
  changed_fields text[] not null,
  created_at timestamptz not null default now()
);
alter table public.directory_audit enable row level security;
revoke all on public.directory_audit from public, anon, authenticated;
grant select on public.directory_audit to authenticated;
create policy audit_leadership on public.directory_audit for select to authenticated
  using ((select club_private.role()) in ('ADMIN','DIRECTOR'));
create index directory_audit_record on public.directory_audit (entity, record_id, created_at desc);

create function club_private.audit_directory() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  before_row jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  after_row jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  row_data jsonb := coalesce(after_row, before_row);
  changed text[];
begin
  select coalesce(array_agg(key order by key), array[]::text[]) into changed
  from jsonb_object_keys(row_data) as keys(key)
  where key not in ('created_at','updated_at') and (before_row -> key) is distinct from (after_row -> key);
  if cardinality(changed) > 0 then
    insert into public.directory_audit (entity, record_id, related_user_id, operation, actor_id, changed_fields)
    values (tg_table_name, coalesce(row_data ->> 'id', row_data ->> 'unit_id'),
      case when tg_table_name = 'unit_staff' then (row_data ->> 'user_id')::uuid end,
      tg_op, auth.uid(), changed);
  end if;
  return null;
end;
$$;
revoke all on function club_private.audit_directory() from public, anon, authenticated;

create trigger audit_directory after insert or update or delete on public.units
  for each row execute function club_private.audit_directory();
create trigger audit_directory after insert or update or delete on public.members
  for each row execute function club_private.audit_directory();
create trigger audit_directory after insert or update or delete on public.unit_staff
  for each row execute function club_private.audit_directory();
create trigger audit_directory after insert or update or delete on public.club_settings
  for each row execute function club_private.audit_directory();

commit;