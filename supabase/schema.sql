create extension if not exists pgcrypto;

-- If this is an existing production DB, migrate instead of running the DROP statements.
drop table if exists public.donjons cascade;
drop table if exists public.personnages cascade;

create table public.personnages (
  id uuid primary key default gen_random_uuid(),
  personnage text not null check (length(trim(personnage)) > 0),
  rarete text not null check (rarete in ('SR','SSR')),
  arme text not null check (arme in ('Epee Longue','Espadon','Epees Doubles','Gantelets','Nunchaku','Hache','Lance','Rapière','Epee & Bouclier','Grimoire','Baguette','Bâton')),
  element text not null check (element in ('Physique','Feu','Glace','Vent','Terre','Foudre','Ténèbres','Sacré')),
  type_personnage text not null check (type_personnage in ('DPS','Déluge','Défense','Support')),
  histoire text not null check (histoire in ('7DS','4KoA','OC')),
  image_url text null check (image_url is null or length(image_url) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.donjons (
  id uuid primary key default gen_random_uuid(),
  nom_donjon text not null check (length(trim(nom_donjon)) > 0),
  faiblesses text[] not null default '{}',
  etat text not null check (etat in ('Disponible','Temporairement désactivé','Retiré','Terminé')),
  type text not null check (type in ('Boss d’Elite','Donjons','Raids','Jonctions')),
  difficulte text not null default 'Normal' check (difficulte in ('Facile','Normal','Difficile','Cauchemar','Infernal','Abysse','Transcendance')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint donjons_faiblesses_max_2 check (cardinality(faiblesses) between 0 and 2),
  constraint donjons_faiblesses_values check (faiblesses <@ array['Physique','Feu','Glace','Vent','Terre','Foudre','Ténèbres','Sacré']::text[])
);

create index personnages_arme_idx on public.personnages(arme);
create index personnages_element_idx on public.personnages(element);
create index personnages_type_idx on public.personnages(type_personnage);
create index personnages_histoire_idx on public.personnages(histoire);
create index personnages_rarete_idx on public.personnages(rarete);
create index donjons_etat_idx on public.donjons(etat);
create index donjons_type_idx on public.donjons(type);
create index donjons_difficulte_idx on public.donjons(difficulte);
create index donjons_faiblesses_gin_idx on public.donjons using gin(faiblesses);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger personnages_updated_at before update on public.personnages
for each row execute function public.set_updated_at();
create trigger donjons_updated_at before update on public.donjons
for each row execute function public.set_updated_at();

alter table public.personnages enable row level security;
alter table public.donjons enable row level security;

create policy "Public can read personnages" on public.personnages for select to anon, authenticated using (true);
create policy "Public can read donjons" on public.donjons for select to anon, authenticated using (true);

revoke insert, update, delete on public.personnages from anon, authenticated;
revoke insert, update, delete on public.donjons from anon, authenticated;
grant select on public.personnages to anon, authenticated;
grant select on public.donjons to anon, authenticated;
grant all on public.personnages to service_role;
grant all on public.donjons to service_role;

create or replace view public.stats_personnages_elements as
select element, count(*)::int total from public.personnages group by element order by total desc;
create or replace view public.stats_donjons_faiblesses as
select weakness faiblesse, count(*)::int total
from public.donjons d cross join lateral unnest(d.faiblesses) weakness
group by weakness order by total desc;

-- Authentication:
-- Create one Supabase Auth user for the owner, disable public signups,
-- and set ADMIN_EMAIL on Render to that exact email.
