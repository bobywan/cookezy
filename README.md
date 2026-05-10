# boby-boilerplate

[![CI](https://github.com/bobywan/boby-boilerplate/actions/workflows/ci.yml/badge.svg)](https://github.com/bobywan/boby-boilerplate/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Node](https://img.shields.io/badge/Node.js-24%20LTS-green?logo=node.js)](https://nodejs.org/)
[![Biome](https://img.shields.io/badge/Biome-lint%20%26%20format-60A5FA?logo=biome)](https://biomejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Boilerplate Next.js (App Router) fullstack, prêt à l'emploi pour démarrer un nouveau projet rapidement.

## Stack

| Outil      | Usage                        |
| ---------- | ---------------------------- |
| Next.js 16 | Framework fullstack          |
| TypeScript | Typage strict                |
| BiomeJS    | Lint + format (remplace ESLint + Prettier) |
| Node.js 24 | Runtime LTS                  |

## Démarrage rapide

```bash
# 1. Cloner le repo
git clone https://github.com/bobywan/boby-boilerplate.git mon-projet
cd mon-projet

# 2. Utiliser la bonne version de Node (nvm ou fnm)
nvm use   # ou: fnm use

# 3. Installer les dépendances
npm install

# 4. Copier les variables d'environnement
cp .env.example .env.local

# 5. Lancer le serveur de développement
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000).

## Scripts disponibles

| Commande        | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Lance le serveur de dev avec message de démarrage |
| `npm run build` | Build de production                      |
| `npm run start` | Démarre le serveur de production         |
| `npm run lint`  | Analyse le code avec Biome               |
| `npm run format`| Formate le code avec Biome               |
| `npm run check` | Lint + format + imports en une commande  |
| `npm run ci`    | Vérification CI (lecture seule)          |

## Structure du projet

```
.
├── .github/workflows/ci.yml   # GitHub Actions CI
├── .vscode/                   # Config VSCode / Cursor
├── app/                       # App Router Next.js
│   ├── layout.tsx
│   └── page.tsx
├── public/                    # Assets statiques
├── scripts/
│   └── dev-start.mjs          # Message de démarrage
├── .env.example               # Variables d'env (template)
├── .nvmrc                     # Node 24 LTS
├── biome.json                 # Config Biome (lint + format)
├── next.config.ts
├── tsconfig.json
└── boby-boilerplate.code-workspace
```

## Variables d'environnement

Copie `.env.example` vers `.env.local` et renseigne les valeurs :

```bash
cp .env.example .env.local
```

> Les fichiers `.env*` sont ignorés par git (sauf `.env.example`).

## Licence

MIT
