---
name: boilerplate-conventions
description: Guides the agent when adding features or files to this Next.js boilerplate. Use when adding a new page, component, API route, or utility; when setting up a new feature from scratch; or when the user asks how something should be structured in this project.
---

# Boilerplate Conventions

## Stack rapide

| Couche     | Outil                        |
| ---------- | ---------------------------- |
| Framework  | Next.js App Router           |
| Styles     | Tailwind CSS v4              |
| Lint/format | BiomeJS v2                  |
| Runtime    | Node.js 24 LTS               |

## Ajouter une nouvelle page

1. Créer `app/[nom-route]/page.tsx`
2. Exporter une fonction nommée + `metadata`
3. Server Component par défaut (pas de `"use client"`)

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Titre",
  description: "Description",
};

export default function MaPage() {
  return <main className="p-8">Contenu</main>;
}
```

## Ajouter un composant

- Créer dans `components/` (à la racine, pas dans `app/`)
- Fichier : `PascalCase.tsx`
- Props typées avec `type`, pas `interface`

## Ajouter une recette

- Le catalogue vivant est Neon. Le formulaire public crée une demande (`recipe_requests`) ; la publication se fait sur `/demandes`. `POST /api/recettes` reste réservé à une clé `RECIPE_API_KEYS`.
- Ne pas réintroduire une publication directe depuis le formulaire, ni une clé Cookezy à coller dans le navigateur.
- Les JSON de `content/recipes/` sont le jeu de départ, chargé par `npm run db:seed`.
- Suivre la checklist et le modèle JSON décrits dans `.cursor/rules/recettes-donnees.mdc` et `docs/publier-une-recette.md`.

## Ajouter une Route Handler (API)

```
app/api/[nom]/route.ts
```

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true });
}
```

## Variables d'env

- Ajouter dans `.env.local` (non commité) ET dans `.env.example` (commité)
- Préfixer `NEXT_PUBLIC_` uniquement si nécessaire côté client

## Lancer / vérifier

```bash
npm run dev      # démarrage avec message coloré
npm run check    # lint + format + imports (BiomeJS)
npm run build    # vérification TS + build prod
```
