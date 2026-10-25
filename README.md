# Cookezy

Carnet de recettes. Les recettes publiées sont dans Neon. Une personne prépare une recette sur le site, avec ou sans son IA, puis envoie une demande. Toi seul l’ajoutes au catalogue ou la supprimes.

[![CI](https://github.com/bobywan/cookezy/actions/workflows/ci.yml/badge.svg)](https://github.com/bobywan/cookezy/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Node](https://img.shields.io/badge/Node.js-24%20LTS-green?logo=node.js)](https://nodejs.org/)
[![Biome](https://img.shields.io/badge/Biome-lint%20%26%20format-60A5FA?logo=biome)](https://biomejs.dev/)

## Stack

| Outil | Usage |
| --- | --- |
| Next.js 16 | App Router |
| TypeScript | Typage strict |
| Tailwind CSS 4 | Styles, tokens dans le design system |
| Biome | Lint et format |
| Neon | Postgres du catalogue et des demandes |
| Resend | E-mail à l’arrivée d’une demande |
| Node.js 24 | Runtime |

## Démarrage

```bash
nvm use
npm install
cp .env.example .env.local
```

Renseigne au moins `DATABASE_URL` et `ADMIN_PASSWORD` dans `.env.local`, puis :

```bash
npm run db:seed
npm run dev
```

Le site est sur [http://localhost:3000](http://localhost:3000).

`npm run db:seed` charge les JSON de `content/recipes/`. Il n’insère pas une recette déjà présente.

## Ajouter une recette

1. `/proposer-une-recette` — la personne colle une URL, décrit la recette, ou remplit le formulaire. L’URL est enregistrée avec la recette. Une adresse déjà connue rouvre la fiche : une demande en attente est mise à jour, une recette déjà en ligne aussi, après le mot de passe de `/demandes`. Une adresse nouvelle crée une demande dans `recipe_requests` et n’apparaît pas sur l’accueil. Si la page contient une image, la personne peut l’adopter : Cookezy la réduit (1200 px, WebP, 150 Ko maximum) et la garde dans Neon.
2. Un e-mail part vers `CONTACT_EMAIL` à la première demande. Si l’e-mail échoue, la demande reste enregistrée. Une mise à jour n’envoie pas un nouvel e-mail.
3. `/demandes` — mot de passe `ADMIN_PASSWORD`. **Ajouter** copie la recette dans `recipes` et retire la demande. **Supprimer** efface la demande et l’image si aucune recette ne l’utilise. Si le slug existe déjà, la demande reste dans la liste.

Les clés Gemini, Groq et OpenRouter sont saisies sur la page et restent dans le navigateur (`localStorage`), une par service. Le bloc se replie quand le service actif a une clé. Cookezy ne stocke pas ces clés. Sans clé, le formulaire manuel et l’envoi de la demande fonctionnent quand même.

Quitter la page alors qu’une recette n’est pas envoyée demande confirmation. Les envois publics sont limités dans Neon : 3 demandes et 10 lectures d’URL par heure et par adresse, 5 essais de mot de passe admin par quart d’heure, 10 échecs de clé sur `POST /api/recettes` par heure.

Le guide à donner à une IA externe, et le contrat JSON, sont dans [docs/publier-une-recette.md](docs/publier-une-recette.md).

`POST /api/recettes` publie encore directement, avec une clé `RECIPE_API_KEYS`. Ce n’est pas le chemin du formulaire.

## Production

Sur Vercel, pour Production et Preview :

- `DATABASE_URL` — URL Neon (préfixe `DATABASE`)
- `ADMIN_PASSWORD` — le mot de passe de `/demandes`, au moins 12 caractères
- `RESEND_API_KEY`, `CONTACT_EMAIL`, `RESEND_FROM_EMAIL` — l’e-mail de demande
- `RECIPE_API_KEYS` — seulement si l’API de publication directe est utilisée

Une variable ajoutée est prise en compte au déploiement suivant. Ensuite, `https://cookezy.vercel.app/demandes`.

## Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Sert le build |
| `npm run check` | Lint, format et imports (Biome) |
| `npm run ci` | Vérification en lecture seule |
| `npm run db:seed` | Charge `content/recipes/` dans Neon |

## Repères

```
app/page.tsx                     accueil
app/recettes/[slug]/page.tsx     fiche recette
app/proposer-une-recette/        formulaire de demande
app/demandes/                    file protégée par mot de passe
app/api/recettes/                publication directe (clé serveur)
app/api/extraire-url/            lecture d’une page pour l’aide IA
app/images/recettes/[file]/      image réduite servie depuis Neon
content/recipes/                 jeu de départ, pas le catalogue vivant
db/schema.sql                    tables recipes, recipe_requests, recipe_images, rate_limits
lib/ai/                          appel IA depuis le navigateur
```
