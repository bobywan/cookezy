import { getSql } from "@/lib/db";
import { parseRecipe } from "@/lib/recipe-schema";
import { insertRecipe } from "@/lib/recipes";
import type { Recipe } from "@/lib/types";

export type RecipeRequest = {
  id: string;
  createdAt: string;
  recipe: Recipe;
};

type RequestRow = { id: string; data: Recipe | string; created_at: Date | string };

function readRecipe(data: Recipe | string): Recipe {
  if (typeof data === "string") return JSON.parse(data) as Recipe;
  return data;
}

async function ensureTable() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS recipe_requests (
      id text PRIMARY KEY,
      data jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
}

export async function createRecipeRequest(recipe: Recipe): Promise<string> {
  await ensureTable();
  const sql = getSql();
  const id = crypto.randomUUID();
  await sql.query("INSERT INTO recipe_requests (id, data) VALUES ($1, $2::jsonb)", [
    id,
    JSON.stringify(recipe),
  ]);
  return id;
}

export async function listRecipeRequests(): Promise<RecipeRequest[]> {
  await ensureTable();
  const sql = getSql();
  const rows = (await sql`
    SELECT id, data, created_at FROM recipe_requests ORDER BY created_at DESC
  `) as RequestRow[];
  return rows.map((row) => ({
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    recipe: readRecipe(row.data),
  }));
}

export async function deleteRecipeRequest(id: string) {
  await ensureTable();
  const sql = getSql();
  await sql`DELETE FROM recipe_requests WHERE id = ${id}`;
}

export async function approveRecipeRequest(
  id: string,
): Promise<{ ok: true; slug: string } | { ok: false; message: string }> {
  await ensureTable();
  const sql = getSql();
  const rows = (await sql`
    SELECT id, data, created_at FROM recipe_requests WHERE id = ${id} LIMIT 1
  `) as RequestRow[];
  const row = rows[0];
  if (!row) return { ok: false, message: "Cette demande n'existe plus." };
  const parsed = parseRecipe(readRecipe(row.data));
  if (!parsed.ok) {
    return { ok: false, message: parsed.errors.map((error) => error.message).join(" ") };
  }
  const inserted = await insertRecipe(parsed.recipe);
  if (inserted.status === "conflict") {
    return { ok: false, message: "Ce slug est déjà utilisé. La demande reste dans la liste." };
  }
  await sql`DELETE FROM recipe_requests WHERE id = ${id}`;
  return { ok: true, slug: parsed.recipe.slug };
}
