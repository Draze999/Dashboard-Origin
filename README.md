# Origin Dashboard

Dashboard Next.js + Supabase pour deux bases indépendantes :

- **Personnages** : personnage, arme, élément, type, histoire.
- **Donjons** : nom, 0–2 faiblesses, état, type.
- Lecture publique.
- Écriture réservée à un unique compte Supabase Auth dont l'e-mail est `ADMIN_EMAIL`.
- Filtres, recherche, statistiques, classements et pourcentages.
- Déploiement prévu sur Render.

## 1. Créer la base Supabase

Dans Supabase → SQL Editor, exécuter `supabase/schema.sql`.

Puis dans Authentication :
1. créer ton unique utilisateur administrateur ;
2. désactiver les inscriptions publiques ;
3. placer son e-mail dans `ADMIN_EMAIL`.

## 2. Variables locales

Copier `.env.example` vers `.env.local` puis renseigner :

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_EMAIL=...
```

**Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` au navigateur et ne jamais la committer.**

## 3. Lancer

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000.

## 4. Render

Créer un Web Service relié au dépôt :

- Build: `npm ci && npm run build`
- Start: `npm start`

Ajouter les 4 variables d'environnement dans Render.

Render fournira ensuite un domaine `onrender.com`; tu peux ajouter ton sous-domaine OVH, par exemple :

`origin.lasandboxdedraze.xyz`

en tant que Custom Domain du service Render.

## 5. Sécurité

Les tables Supabase ont RLS activé :
- `anon` et `authenticated` : lecture uniquement ;
- `service_role` : utilisé uniquement côté serveur ;
- les actions d'administration vérifient d'abord l'utilisateur Supabase Auth et son e-mail.

Ainsi, même si quelqu'un tente d'appeler directement la Data API avec la clé publique, il ne peut pas écrire dans les tables.

## Administration des faiblesses

Le formulaire du site permet de sélectionner 0 à 2 faiblesses. La validation est également répétée côté serveur et dans PostgreSQL.
