# Origin Database Dashboard v2

Next.js 16 + Supabase + Render.

## Authentification
La connexion administrateur est maintenant une **Server Action** : Supabase écrit la session dans les cookies côté serveur, puis `redirect("/")`. Le `proxy.ts` rafraîchit la session pour les requêtes suivantes.

Dans Supabase Auth :
- crée un seul utilisateur propriétaire ;
- désactive les inscriptions publiques ;
- mets son adresse exacte dans `ADMIN_EMAIL` sur Render.

## Base
Exécute `supabase/schema.sql` sur une base neuve. Le schéma inclut aussi `rarete` et `image_url`, présents dans ton projet actuel.

## Fonctionnalités
- dashboard SaaS inspiré du logo fourni ;
- vue d'ensemble ;
- Personnages / Donjons ;
- filtres combinables + recherche ;
- classements et pourcentages ;
- graphiques sans dépendance lourde ;
- édition directe des lignes côté administrateur ;
- ajout rapide ;
- import CSV ;
- export CSV ;
- RLS lecture publique / écriture serveur `service_role` ;
- compte admin unique.

## CSV
Personnages : `personnage,rarete,arme,element,type_personnage,histoire,image_url`
Donjons : `nom_donjon,faiblesses,etat,type`

Pour les faiblesses CSV, sépare les deux valeurs par `|`, par exemple `Feu|Ténèbres`.

## Déploiement Render
Build: `npm ci && npm run build`
Start: `npm start`

Variables :
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- ADMIN_EMAIL

## Important
Ne committe jamais `.env` ni `SUPABASE_SERVICE_ROLE_KEY`.
