begin;

create function club_private.role() returns public.club_role language sql stable security definer set search_path = '' as $$
  select role from public.user_roles where user_id = (select auth.uid())
    and not coalesce((auth.jwt()->>'is_anonymous') = 'true', false)
$$;

create function club_private.staff(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select (select club_private.role()) = 'COUNSELOR' and exists (
    select 1 from public.unit_staff where unit_id = target and user_id = (select auth.uid())
  )
$$;

create function club_private.own_unit(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select (select club_private.role()) = 'MEMBER' and exists (
    select 1 from public.members where unit_id = target and user_id = (select auth.uid()) and active
  )
$$;

create function club_private.owns_member(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select (select club_private.role()) = 'MEMBER' and exists (
    select 1 from public.members where id = target and user_id = (select auth.uid())
  )
$$;

create function club_private.staff_member(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.members where id = target and club_private.staff(unit_id))
$$;

revoke all on all functions in schema club_private from public, anon, authenticated;
grant execute on function club_private.role(), club_private.staff(uuid), club_private.own_unit(uuid),
  club_private.owns_member(uuid), club_private.staff_member(uuid) to authenticated;

grant select on public.club_settings to authenticated;
create policy read_scope on public.club_settings for select to authenticated using (((select club_private.role()) in ('ADMIN','DIRECTOR')) or (club_private.role() is not null));

grant select on public.profiles to authenticated;
create policy read_scope on public.profiles for select to authenticated using (((select club_private.role()) in ('ADMIN','DIRECTOR')) or (club_private.role() is not null and id = (select auth.uid())));

grant select on public.user_roles to authenticated;
create policy read_scope on public.user_roles for select to authenticated using (((select club_private.role()) = 'ADMIN') or (user_id = (select auth.uid()) and (select club_private.role()) is not null));

grant select on public.units to authenticated;
create policy read_scope on public.units for select to authenticated using (((select club_private.role()) in ('ADMIN','DIRECTOR')) or (club_private.staff(id) or club_private.own_unit(id)));

grant select on public.members to authenticated;
create policy read_scope on public.members for select to authenticated using (((select club_private.role()) in ('ADMIN','DIRECTOR')) or (club_private.staff(unit_id) or club_private.owns_member(id)));

grant select on public.unit_staff to authenticated;
create policy read_scope on public.unit_staff for select to authenticated using (((select club_private.role()) in ('ADMIN','DIRECTOR')) or (club_private.staff(unit_id)));

grant select on public.guardians to authenticated;
create policy read_scope on public.guardians for select to authenticated using (((select club_private.role()) in ('ADMIN','DIRECTOR')) or (false));

grant select on public.member_guardians to authenticated;
create policy read_scope on public.member_guardians for select to authenticated using (((select club_private.role()) in ('ADMIN','DIRECTOR')) or (false));

grant select on public.events to authenticated;
create policy read_scope on public.events for select to authenticated using (((select club_private.role()) in ('ADMIN','DIRECTOR')) or ((unit_id is null and club_private.role() is not null) or club_private.staff(unit_id) or club_private.own_unit(unit_id)));

grant select on public.attendance to authenticated;
create policy read_scope on public.attendance for select to authenticated using (((select club_private.role()) in ('ADMIN','DIRECTOR')) or (club_private.staff(unit_id) or club_private.owns_member(member_id)));

grant select on public.challenges to authenticated;
create policy read_scope on public.challenges for select to authenticated using (((select club_private.role()) in ('ADMIN','DIRECTOR')) or (published_at <= now() and club_private.role() is not null));

grant select on public.challenge_submissions to authenticated;
create policy read_scope on public.challenge_submissions for select to authenticated using (((select club_private.role()) in ('ADMIN','DIRECTOR')) or (club_private.staff(unit_id)));

grant select on public.point_transactions to authenticated;
create policy read_scope on public.point_transactions for select to authenticated using (((select club_private.role()) in ('ADMIN','DIRECTOR')) or (club_private.staff(unit_id) or club_private.owns_member(member_id) or club_private.staff_member(member_id)));

grant select on public.announcements to authenticated;
create policy read_scope on public.announcements for select to authenticated using (((select club_private.role()) in ('ADMIN','DIRECTOR')) or (published_at <= now() and ((unit_id is null and club_private.role() is not null) or club_private.staff(unit_id) or club_private.own_unit(unit_id))));

grant insert, update, delete on public.profiles to authenticated;
create policy manage_scope on public.profiles for all to authenticated using ((select club_private.role()) = 'ADMIN') with check ((select club_private.role()) = 'ADMIN');

grant insert, update, delete on public.user_roles to authenticated;
create policy manage_scope on public.user_roles for all to authenticated using ((select club_private.role()) = 'ADMIN') with check ((select club_private.role()) = 'ADMIN');

grant insert, update, delete on public.units to authenticated;
create policy manage_scope on public.units for all to authenticated using ((select club_private.role()) in ('ADMIN','DIRECTOR')) with check ((select club_private.role()) in ('ADMIN','DIRECTOR'));

grant insert, update, delete on public.members to authenticated;
create policy manage_scope on public.members for all to authenticated using ((select club_private.role()) in ('ADMIN','DIRECTOR')) with check ((select club_private.role()) in ('ADMIN','DIRECTOR'));

create function club_private.protect_member_account() returns trigger language plpgsql set search_path = '' as $$
begin
  if club_private.role() = 'DIRECTOR' then
    if (tg_op = 'INSERT' and new.user_id is not null)
      or (tg_op = 'UPDATE' and new.user_id is distinct from old.user_id) then
      raise exception 'Only administrators can change a member account link' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function club_private.protect_member_account() from public, anon, authenticated;
create trigger protect_member_account before insert or update on public.members
  for each row execute function club_private.protect_member_account();

grant insert, update, delete on public.unit_staff to authenticated;
create policy manage_scope on public.unit_staff for all to authenticated using ((select club_private.role()) = 'ADMIN') with check ((select club_private.role()) = 'ADMIN');

grant insert, update, delete on public.guardians to authenticated;
create policy manage_scope on public.guardians for all to authenticated using ((select club_private.role()) in ('ADMIN','DIRECTOR')) with check ((select club_private.role()) in ('ADMIN','DIRECTOR'));

grant insert, update, delete on public.member_guardians to authenticated;
create policy manage_scope on public.member_guardians for all to authenticated using ((select club_private.role()) in ('ADMIN','DIRECTOR')) with check ((select club_private.role()) in ('ADMIN','DIRECTOR'));

grant insert, update, delete on public.events to authenticated;
create policy manage_scope on public.events for all to authenticated using ((select club_private.role()) in ('ADMIN','DIRECTOR')) with check ((select club_private.role()) in ('ADMIN','DIRECTOR'));

grant insert, update, delete on public.challenges to authenticated;
create policy manage_scope on public.challenges for all to authenticated using ((select club_private.role()) in ('ADMIN','DIRECTOR')) with check ((select club_private.role()) in ('ADMIN','DIRECTOR'));

grant insert, update, delete on public.announcements to authenticated;
create policy manage_scope on public.announcements for all to authenticated using ((select club_private.role()) in ('ADMIN','DIRECTOR')) with check ((select club_private.role()) in ('ADMIN','DIRECTOR'));

grant insert, update on public.club_settings to authenticated;
create policy manage_scope on public.club_settings for all to authenticated
  using ((select club_private.role()) in ('ADMIN','DIRECTOR')) with check ((select club_private.role()) in ('ADMIN','DIRECTOR'));

grant insert (event_id, member_id, status, justification), update (status, justification) on public.attendance to authenticated;
create policy record_presence on public.attendance for insert to authenticated
  with check ((select club_private.role()) in ('ADMIN','DIRECTOR') or club_private.staff(unit_id));
create policy revise_presence on public.attendance for update to authenticated
  using ((select club_private.role()) in ('ADMIN','DIRECTOR') or club_private.staff(unit_id))
  with check ((select club_private.role()) in ('ADMIN','DIRECTOR') or club_private.staff(unit_id));

create function club_private.record_attendance() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  event_unit uuid;
  actor_role public.club_role := club_private.role();
begin
  if actor_role is null or actor_role not in ('ADMIN','DIRECTOR','COUNSELOR') then
    raise exception 'Attendance access denied' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' then
    select unit_id into new.unit_id from public.members
      where id = new.member_id and active for share;
    if not found or (actor_role = 'COUNSELOR' and not club_private.staff(new.unit_id)) then
      raise exception 'Attendance access denied' using errcode = '42501';
    end if;
    select unit_id into event_unit from public.events where id = new.event_id for share;
    if not found or (actor_role = 'COUNSELOR' and event_unit is not null and not club_private.staff(event_unit)) then
      raise exception 'Attendance access denied' using errcode = '42501';
    end if;
    if event_unit is not null and event_unit <> new.unit_id then
      raise exception 'Member is outside the event unit' using errcode = '23514';
    end if;
  end if;
  new.recorded_by := auth.uid();
  return new;
end;
$$;

create function club_private.keep_event_scope() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.unit_id is distinct from old.unit_id then
    raise exception 'Event scope is immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger record_attendance before insert or update on public.attendance for each row execute function club_private.record_attendance();
create trigger keep_event_scope before update on public.events for each row execute function club_private.keep_event_scope();

grant insert (challenge_id, unit_id, notes), update (notes, status) on public.challenge_submissions to authenticated;
create policy submit_challenge on public.challenge_submissions for insert to authenticated
  with check ((select club_private.role()) in ('ADMIN','DIRECTOR') or (club_private.staff(unit_id) and exists (
    select 1 from public.challenges where id = challenge_id and published_at <= now() and deadline >= now()
  )));
create policy review_submission on public.challenge_submissions for update to authenticated
  using ((select club_private.role()) in ('ADMIN','DIRECTOR')) with check ((select club_private.role()) in ('ADMIN','DIRECTOR'));

create function club_private.submission_actor() returns trigger language plpgsql set search_path = '' as $$
begin
  new.submitted_by := auth.uid();
  return new;
end;
$$;
create trigger submission_actor before insert on public.challenge_submissions for each row execute function club_private.submission_actor();

grant insert (category, member_id, unit_id, amount, reason, origin, event_id, challenge_id, reversal_of)
  on public.point_transactions to authenticated;
create policy post_points on public.point_transactions for insert to authenticated with check ((select club_private.role()) in ('ADMIN','DIRECTOR'));

create function club_private.validate_points() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  original public.point_transactions%rowtype;
begin
  if not coalesce(club_private.role() in ('ADMIN','DIRECTOR'), false) then
    raise exception 'Point posting denied' using errcode = '42501';
  end if;
  new.recorded_by := auth.uid();
  if new.reversal_of is not null then
    select * into strict original from public.point_transactions where id = new.reversal_of;
    if original.reversal_of is not null or new.category <> original.category
      or new.member_id is distinct from original.member_id
      or new.unit_id is distinct from original.unit_id or new.amount <> -original.amount then
      raise exception 'Invalid reversal' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create function club_private.protect_ledger() returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'Point transactions are append-only' using errcode = '23514';
end;
$$;
create trigger validate_points before insert on public.point_transactions for each row execute function club_private.validate_points();
create trigger protect_ledger before update or delete on public.point_transactions for each row execute function club_private.protect_ledger();
create trigger protect_ledger_truncate before truncate on public.point_transactions for each statement execute function club_private.protect_ledger();

revoke all on function club_private.record_attendance(), club_private.keep_event_scope(), club_private.submission_actor(),
  club_private.validate_points(), club_private.protect_ledger() from public, anon, authenticated;

create view public.unit_ranking with (security_barrier = true) as
  select totals.*, dense_rank() over (order by totals.points desc) as position
  from (
    select u.id as unit_id, u.name, u.color, coalesce(sum(p.amount), 0) as points
    from public.units u
    left join public.point_transactions p on p.unit_id = u.id and p.category = 'COLETIVA'
    where u.active and (select club_private.role()) is not null
    group by u.id, u.name, u.color
  ) totals;
revoke all on public.unit_ranking from public, anon, authenticated;
grant select on public.unit_ranking to authenticated;

-- Invoker: the same column grants, triggers and RLS apply as on direct writes.
create function public.save_attendance(event uuid, entries jsonb)
returns setof public.attendance language plpgsql security invoker set search_path = '' as $$
declare
  entry record;
  saved public.attendance%rowtype;
begin
  if jsonb_typeof(entries) is distinct from 'array' or event is null then
    raise exception 'Expected an event and an attendance array' using errcode = '22023';
  end if;
  if jsonb_array_length(entries) > 500 then
    raise exception 'Attendance array is too large' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(entries) as item(member_id uuid)
    group by item.member_id having count(*) > 1 or item.member_id is null
  ) then
    raise exception 'Each attendance entry requires a distinct member' using errcode = '22023';
  end if;
  for entry in
    select * from jsonb_to_recordset(entries) as item(member_id uuid, status public.attendance_status, justification text)
    order by member_id
  loop
    update public.attendance as a set status = entry.status, justification = entry.justification
      where a.event_id = event and a.member_id = entry.member_id returning * into saved;
    if not found then
      insert into public.attendance (event_id, member_id, status, justification)
        values (event, entry.member_id, entry.status, entry.justification)
        on conflict (event_id, member_id) do update
          set status = excluded.status, justification = excluded.justification
        returning * into saved;
    end if;
    return next saved;
  end loop;
  return;
end;
$$;
revoke all on function public.save_attendance(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.save_attendance(uuid, jsonb) to authenticated;

commit;
