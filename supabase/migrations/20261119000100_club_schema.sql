begin;

create type public.club_role as enum ('ADMIN', 'DIRECTOR', 'COUNSELOR', 'MEMBER');
create type public.event_kind as enum ('MEETING', 'EVENT', 'ACTIVITY');
create type public.attendance_status as enum ('PRESENT', 'ABSENT');
create type public.submission_status as enum ('PENDING', 'APPROVED', 'REJECTED');
create type public.point_category as enum ('INDIVIDUAL', 'COLETIVA');
create type public.point_origin as enum ('MANUAL', 'EVENT', 'CHALLENGE', 'ADJUSTMENT', 'REVERSAL');

create table public.club_settings (
  id smallint primary key default 1 check (id = 1),
  name text not null check (btrim(name) <> ''),
  description text not null default '',
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.club_settings enable row level security;
revoke all on public.club_settings from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (btrim(display_name) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;

create table public.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role public.club_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_roles enable row level security;
revoke all on public.user_roles from public, anon, authenticated;

create table public.units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (btrim(name) <> ''),
  color text not null default 'purple',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.units enable row level security;
revoke all on public.units from public, anon, authenticated;

create table public.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete set null,
  unit_id uuid not null references public.units(id),
  name text not null check (btrim(name) <> ''),
  joined_on date not null default current_date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.members enable row level security;
revoke all on public.members from public, anon, authenticated;

create table public.unit_staff (
  unit_id uuid references public.units(id),
  user_id uuid references public.profiles(id) on delete cascade, primary key (unit_id, user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.unit_staff enable row level security;
revoke all on public.unit_staff from public, anon, authenticated;

create table public.guardians (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  email text,
  phone text, check (nullif(btrim(email), '') is not null or nullif(btrim(phone), '') is not null),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.guardians enable row level security;
revoke all on public.guardians from public, anon, authenticated;

create table public.member_guardians (
  member_id uuid references public.members(id),
  guardian_id uuid references public.guardians(id),
  relationship text not null check (btrim(relationship) <> ''), primary key (member_id, guardian_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.member_guardians enable row level security;
revoke all on public.member_guardians from public, anon, authenticated;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references public.units(id),
  title text not null check (btrim(title) <> ''),
  kind public.event_kind not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text not null default '',
  description text not null default '', check (ends_at is null or ends_at >= starts_at),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.events enable row level security;
revoke all on public.events from public, anon, authenticated;

create table public.attendance (
  event_id uuid references public.events(id),
  member_id uuid references public.members(id),
  unit_id uuid not null references public.units(id),
  status public.attendance_status not null,
  justification text,
  recorded_by uuid not null references public.profiles(id), primary key (event_id, member_id), check (justification is null or (status = 'ABSENT' and btrim(justification) <> '')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.attendance enable row level security;
revoke all on public.attendance from public, anon, authenticated;

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null check (btrim(title) <> ''),
  description text not null check (btrim(description) <> ''),
  deadline timestamptz not null,
  points integer not null check (points >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.challenges enable row level security;
revoke all on public.challenges from public, anon, authenticated;

create table public.challenge_submissions (
  challenge_id uuid references public.challenges(id),
  unit_id uuid references public.units(id),
  submitted_by uuid not null references public.profiles(id),
  notes text not null default '',
  status public.submission_status not null default 'PENDING', primary key (challenge_id, unit_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.challenge_submissions enable row level security;
revoke all on public.challenge_submissions from public, anon, authenticated;

create table public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  category public.point_category not null,
  member_id uuid references public.members(id),
  unit_id uuid references public.units(id),
  amount integer not null check (amount <> 0 and amount > -2147483648),
  reason text not null check (btrim(reason) <> ''),
  origin public.point_origin not null,
  event_id uuid references public.events(id),
  challenge_id uuid references public.challenges(id),
  recorded_by uuid not null references public.profiles(id),
  reversal_of uuid unique references public.point_transactions(id), check ((category = 'INDIVIDUAL' and member_id is not null and unit_id is null) or (category = 'COLETIVA' and unit_id is not null and member_id is null)), check ((origin = 'EVENT') = (event_id is not null) and (origin = 'CHALLENGE') = (challenge_id is not null) and (origin = 'REVERSAL') = (reversal_of is not null)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.point_transactions enable row level security;
revoke all on public.point_transactions from public, anon, authenticated;

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references public.units(id),
  title text not null check (btrim(title) <> ''),
  body text not null check (btrim(body) <> ''),
  important boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
revoke all on public.announcements from public, anon, authenticated;

create index on public.members (unit_id);
create index on public.unit_staff (user_id);
create index on public.member_guardians (guardian_id);
create index on public.events (unit_id, starts_at);
create index on public.events (starts_at);
create index on public.attendance (member_id);
create index on public.attendance (unit_id);
create index on public.challenges (published_at);
create index on public.challenge_submissions (unit_id);
create index on public.challenge_submissions (submitted_by);
create index on public.point_transactions (member_id);
create index on public.point_transactions (unit_id);
create index on public.point_transactions (recorded_by);
create index on public.point_transactions (event_id);
create index on public.point_transactions (challenge_id);
create index on public.announcements (unit_id, published_at);

create schema if not exists club_private;
revoke all on schema club_private from public, anon, authenticated;
grant usage on schema club_private to authenticated;

create function club_private.stamp() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
  else
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function club_private.stamp() from public, anon, authenticated;

create trigger stamp before insert or update on public.club_settings for each row execute function club_private.stamp();
create trigger stamp before insert or update on public.profiles for each row execute function club_private.stamp();
create trigger stamp before insert or update on public.user_roles for each row execute function club_private.stamp();
create trigger stamp before insert or update on public.units for each row execute function club_private.stamp();
create trigger stamp before insert or update on public.members for each row execute function club_private.stamp();
create trigger stamp before insert or update on public.unit_staff for each row execute function club_private.stamp();
create trigger stamp before insert or update on public.guardians for each row execute function club_private.stamp();
create trigger stamp before insert or update on public.member_guardians for each row execute function club_private.stamp();
create trigger stamp before insert or update on public.events for each row execute function club_private.stamp();
create trigger stamp before insert or update on public.attendance for each row execute function club_private.stamp();
create trigger stamp before insert or update on public.challenges for each row execute function club_private.stamp();
create trigger stamp before insert or update on public.challenge_submissions for each row execute function club_private.stamp();
create trigger stamp before insert or update on public.point_transactions for each row execute function club_private.stamp();
create trigger stamp before insert or update on public.announcements for each row execute function club_private.stamp();

commit;
