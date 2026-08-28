# Origin Dashboard

Dashboard Next.js + Supabase pour les bases **Personnages** et **Donjons**.

## Cette version

- édition directe dans les tableaux ;
- après enregistrement, la ligne reste à sa position visuelle et sort immédiatement du mode édition ;
- suppression d'une ligne avec confirmation ;
- pagination de 50 lignes pour éviter de rendre des centaines/milliers de `<tr>` simultanément ;
- ajout rapide via le bouton `+` fixe ;
- import CSV validé côté serveur et inséré par lots de 400, avec jusqu'à 4 lots traités en parallèle ;
- import sans rechargement complet du navigateur (`router.refresh`) ;
- graphiques et badges avec couleurs sémantiques pour raretés, éléments et armes ;
- filtres combinables ;
- export CSV ;
- authentification Supabase réservée au compte défini par `ADMIN_EMAIL`.

## Palette

### Raretés
- SR : violet
- SSR : jaune

### Éléments
- Feu : rouge
- Glace : bleu clair
- Terre : marron
- Foudre : bleu foncé
- Vent : vert
- Physique : gris
- Ténèbres : violet
- Sacré : jaune

### Armes
- Espadon / Epees Doubles / Epee Longue : bleu royal → bleu clair
- Grimoire / Baguette / Bâton : bordeaux → orange
- Hache / Nunchaku / Gantelets : noir → rouge sang
- Lance / Rapière / Epee & Bouclier : vert → vert clair

## Variables Render

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_EMAIL=...
```

Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` au navigateur.

## CSV

Personnages :

```csv
personnage,rarete,arme,element,type_personnage,histoire,image_url
```

Donjons :

```csv
nom_donjon,faiblesses,etat,type
```

Pour plusieurs faiblesses, utiliser `|` : `Feu|Ténèbres`.

La taille maximale d'un CSV est de 10 Mo dans l'application. Next.js est configuré avec une limite Server Action de 10 Mo pour permettre ces imports ; la limite par défaut des Server Actions est de 1 Mo.

## Performance

La table n'affiche que 50 lignes à la fois. Les modifications et suppressions mettent à jour l'interface localement sans rechargement complet. Les imports sont découpés en lots afin de ne pas envoyer une énorme insertion PostgreSQL en une seule opération. Supabase recommande également la pagination avec `range()` lorsque les volumes deviennent importants.

Si les bases dépassent plusieurs milliers de lignes, l'étape suivante recommandée est de déplacer la pagination et les statistiques côté serveur/SQL : cela évitera de charger toute la base au navigateur pour calculer les graphiques.

## Déploiement Render

Build :

```bash
npm ci && npm run build
```

Start :

```bash
npm start
```

Le projet utilise le système `proxy.ts` de Next.js 16. Next.js 16 a renommé `middleware.ts` en `proxy.ts`.
