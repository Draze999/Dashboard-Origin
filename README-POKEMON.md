# Pokémon Type Trainer

Deuxième projet du même repo que **Origin Database**.

## Navigation

- `/` → Origin Database
- `/pokemon` → Pokémon Type Trainer

Les deux applications partagent le shell Next.js et le menu gauche, mais les données restent indépendantes.

## Les 4 modes

1. **Type → type** : 0×, 0,5×, 1× ou 2×.
2. **Type → double type** : inclut 0,25× (double résistance) et 4× (double faiblesse).
3. **Classement** : une attaque est tirée au sort, puis les 18 types défenseurs doivent être rangés dans Immunité / Faiblesse / Résistance / Neutre.
4. **Type → Pokémon** : l'image et le nom du Pokémon sont visibles, ses types sont cachés.

## Supabase

La table Pokémon est indépendante :

```text
supabase/pokemon-schema.sql
```

Elle ne modifie pas `personnages` ou `donjons`.

### Générer le CSV complet

```bash
npm run pokemon:seed
```

Le script utilise PokéAPI pour produire :

```text
data/pokemon.csv
```

Puis importe ce CSV dans la table `pokemon` de Supabase.

> Le fichier `.env` fourni dans le projet d'origine n'est pas recopié dans cette archive pour éviter d'embarquer des secrets. Recrée-le depuis `.env.example`.

## Type chart

Le calcul est local et déterministe dans `lib/pokemon.ts`, avec la matrice Gen VI+ des 18 types.
