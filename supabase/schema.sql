-- ORIGIN DASHBOARD — Supabase schema
-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- Clean recreation for a fresh project. Remove these DROP statements if you
-- already have data in tables with these names.
drop table if exists public.donjons cascade;
drop table if exists public.personnages cascade;

create table public.personnages (
  id uuid primary key default gen_random_uuid(),
  personnage text not null check (length(trim(personnage)) > 0),
  arme text not null check (arme in (
    'Epee Longue',
    'Espadon',
    'Epees Doubles',
    'Gantelets',
    'Nunchaku',
    'Hache',
    'Lance',
    'Rapière',
    'Epee & Bouclier',
    'Grimoire',
    'Baguette',
    'Bâton'
  )),
  element text not null check (element in (
    'Physique',
    'Feu',
    'Glace',
    'Vent',
    'Terre',
    'Foudre',
    'Ténèbres',
    'Sacré'
  )),
  type_personnage text not null check (type_personnage in (
    'DPS',
    'Déluge',
    'Défense',
    'Support'
  )),
  histoire text not null check (histoire in ('7DS', '4KoA', 'OC')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.donjons (
  id uuid primary key default gen_random_uuid(),
  nom_donjon text not null check (length(trim(nom_donjon)) > 0),
  faiblesses text[] not null default '{}',
  etat text not null check (etat in (
    'Disponible',
    'Temporairement désactivé',
    'Retiré',
    'Terminé'
  )),
  type text not null check (type in (
    'Boss d’Elite',
    'Donjons',
    'Raids',
    'Jonctions'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint donjons_faiblesses_max_2 check (cardinality(faiblesses) between 0 and 2),
  constraint donjons_faiblesses_values check (
    faiblesses <@ array[
      'Physique',
      'Feu',
      'Glace',
      'Vent',
      'Terre',
      'Foudre',
      'Ténèbres',
      'Sacré'
    ]::text[]
  )
);

create index personnages_arme_idx on public.personnages(arme);
create index personnages_element_idx on public.personnages(element);
create index personnages_type_idx on public.personnages(type_personnage);
create index personnages_histoire_idx on public.personnages(histoire);

create index donjons_etat_idx on public.donjons(etat);
create index donjons_type_idx on public.donjons(type);
create index donjons_faiblesses_gin_idx on public.donjons using gin(faiblesses);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger personnages_updated_at
before update on public.personnages
for each row execute function public.set_updated_at();

create trigger donjons_updated_at
before update on public.donjons
for each row execute function public.set_updated_at();

-- RLS: visitors can read; the application server writes with service_role
-- only after checking the authenticated admin email.
alter table public.personnages enable row level security;
alter table public.donjons enable row level security;

create policy "Public can read personnages"
on public.personnages for select
to anon, authenticated
using (true);

create policy "Public can read donjons"
on public.donjons for select
to anon, authenticated
using (true);

revoke insert, update, delete on public.personnages from anon, authenticated;
revoke insert, update, delete on public.donjons from anon, authenticated;

grant select on public.personnages to anon, authenticated;
grant select on public.donjons to anon, authenticated;
grant all on public.personnages to service_role;
grant all on public.donjons to service_role;

-- Optional useful SQL views for future API/reporting work.
create or replace view public.stats_personnages_elements as
select element, count(*)::int as total
from public.personnages
group by element
order by total desc, element;

create or replace view public.stats_donjons_faiblesses as
select weakness as faiblesse, count(*)::int as total
from public.donjons d
cross join lateral unnest(d.faiblesses) as weakness
group by weakness
order by total desc, weakness;

-- IMPORTANT:
-- In Supabase Authentication, create ONE user for the site owner.
-- Disable public sign-ups in Authentication settings.
-- Put that user's email in ADMIN_EMAIL on Render.
