begin;

alter table public.units add column symbol_image text
  check (
    symbol_image is null or (
      char_length(symbol_image) <= 273092
      and symbol_image ~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$'
    )
  );

create or replace view public.unit_directory with (security_invoker = true, security_barrier = true) as
  select u.id, u.code, u.name, u.description, u.color, u.active,
    (select count(*) from public.members m where m.unit_id = u.id) as member_count,
    (select count(*) from public.members m where m.unit_id = u.id and m.active) as active_member_count,
    (select coalesce(sum(p.amount), 0) from public.point_transactions p where p.unit_id = u.id and p.category = 'COLETIVA') as points,
    u.symbol_image
  from public.units u;

commit;