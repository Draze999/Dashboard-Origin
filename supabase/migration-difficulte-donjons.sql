-- Migration : une ou plusieurs difficultés par donjon, sans limite.
-- À exécuter une seule fois sur une base qui possède déjà la colonne difficulte text.
--
-- Les anciennes valeurs sont conservées et transformées en tableau à un élément.
-- Exemple : 'Difficile' devient ARRAY['Difficile'].

alter table public.donjons
  add column if not exists difficulte text;

update public.donjons
set difficulte = 'Normal'
where difficulte is null or trim(difficulte) = '';

alter table public.donjons
  drop constraint if exists donjons_difficulte_check;

alter table public.donjons
  drop constraint if exists donjons_difficulte_min_one_check;

alter table public.donjons
  drop constraint if exists donjons_difficulte_values_check;

alter table public.donjons
  alter column difficulte drop default;

alter table public.donjons
  alter column difficulte type text[]
  using array[difficulte];

alter table public.donjons
  alter column difficulte set default array['Normal']::text[];

alter table public.donjons
  alter column difficulte set not null;

alter table public.donjons
  add constraint donjons_difficulte_min_one_check
  check (cardinality(difficulte) >= 1);

alter table public.donjons
  add constraint donjons_difficulte_values_check
  check (
    difficulte <@ array[
      'Facile','Normal','Difficile','Cauchemar','Infernal','Abysse','Transcendance'
    ]::text[]
  );

drop index if exists donjons_difficulte_idx;
create index if not exists donjons_difficulte_gin_idx
  on public.donjons using gin(difficulte);
