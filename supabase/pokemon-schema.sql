-- Base Pokémon indépendante des bases Origin.
create table if not exists public.pokemon (
  id uuid primary key default gen_random_uuid(),
  national_id integer not null unique check (national_id > 0),
  nom_fr text not null check (length(trim(nom_fr)) > 0),
  nom_en text not null check (length(trim(nom_en)) > 0),
  type_1 text not null check (type_1 in ('Normal','Feu','Eau','Électrik','Plante','Glace','Combat','Poison','Sol','Vol','Psy','Insecte','Roche','Spectre','Dragon','Ténèbres','Acier','Fée')),
  type_2 text null check (type_2 is null or type_2 in ('Normal','Feu','Eau','Électrik','Plante','Glace','Combat','Poison','Sol','Vol','Psy','Insecte','Roche','Spectre','Dragon','Ténèbres','Acier','Fée')),
  image_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pokemon_type_2_distinct check (type_2 is null or type_2 <> type_1)
);

create index if not exists pokemon_nom_fr_idx on public.pokemon(nom_fr);
create index if not exists pokemon_type_1_idx on public.pokemon(type_1);
create index if not exists pokemon_type_2_idx on public.pokemon(type_2);

alter table public.pokemon enable row level security;
drop policy if exists "Public can read pokemon" on public.pokemon;
create policy "Public can read pokemon" on public.pokemon for select to anon, authenticated using (true);

revoke insert, update, delete on public.pokemon from anon, authenticated;
grant select on public.pokemon to anon, authenticated;
grant all on public.pokemon to service_role;

create or replace function public.set_pokemon_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists pokemon_updated_at on public.pokemon;
create trigger pokemon_updated_at before update on public.pokemon
for each row execute function public.set_pokemon_updated_at();
