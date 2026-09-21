-- Migration : ajout de la difficulté aux donjons existants.
-- À exécuter une seule fois sur une base déjà en production.
alter table public.donjons
  add column if not exists difficulte text not null default 'Normal';

update public.donjons
set difficulte = 'Normal'
where difficulte is null or trim(difficulte) = '';

alter table public.donjons
  drop constraint if exists donjons_difficulte_check;

alter table public.donjons
  add constraint donjons_difficulte_check
  check (difficulte in ('Facile','Normal','Difficile','Cauchemar','Infernal','Abysse','Transcendance'));

create index if not exists donjons_difficulte_idx on public.donjons(difficulte);
