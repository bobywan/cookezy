import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquante. Ajoute-la dans .env.local puis relance npm run db:seed.");
  process.exit(1);
}

const sql = neon(url);

await sql`
  CREATE TABLE IF NOT EXISTS recipes (
    id text PRIMARY KEY,
    slug text UNIQUE NOT NULL,
    data jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`;

const preferred = [
  "crepes.json",
  "poulet-roti.json",
  "tarte-au-citron.json",
  "boeuf-bourguignon-sans-vin.json",
  "fraisier.json",
];

const dir = path.join(process.cwd(), "content/recipes");
const found = (await readdir(dir)).filter((name) => name.endsWith(".json"));
const files = [
  ...preferred.filter((name) => found.includes(name)),
  ...found.filter((name) => !preferred.includes(name)).sort(),
];

const start = Date.now();
let inserted = 0;
let skipped = 0;

for (const [index, file] of files.entries()) {
  const recipe = JSON.parse(await readFile(path.join(dir, file), "utf8"));
  const existing = await sql`
    SELECT slug FROM recipes WHERE slug = ${recipe.slug} OR id = ${recipe.id}
  `;
  if (existing.length > 0) {
    skipped += 1;
    console.log(`déjà présente : ${recipe.slug}`);
    continue;
  }
  const createdAt = new Date(start + index * 1000).toISOString();
  await sql.query(
    "INSERT INTO recipes (id, slug, data, created_at) VALUES ($1, $2, $3::jsonb, $4)",
    [recipe.id, recipe.slug, JSON.stringify(recipe), createdAt],
  );
  inserted += 1;
  console.log(`ajoutée : ${recipe.slug}`);
}

console.log(`Terminé. ${inserted} ajoutée(s), ${skipped} ignorée(s).`);
