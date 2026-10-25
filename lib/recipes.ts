import { getSql } from "@/lib/db";
import type { Recipe } from "@/lib/types";

type RecipeRow = { data: Recipe | string };
type IdentityRow = { id: string; slug: string };

function readRecipe(data: Recipe | string): Recipe {
  const recipe = typeof data === "string" ? (JSON.parse(data) as Recipe) : data;
  return { ...recipe, sourceUrl: recipe.sourceUrl ?? "" };
}

export async function getRecipes(): Promise<Recipe[]> {
  const sql = getSql();
  const rows =
    (await sql`SELECT data FROM recipes ORDER BY created_at ASC, slug ASC`) as RecipeRow[];
  return rows.map((row) => readRecipe(row.data));
}

export async function getRecipeBySlug(slug: string): Promise<Recipe | undefined> {
  const sql = getSql();
  const rows = (await sql`SELECT data FROM recipes WHERE slug = ${slug} LIMIT 1`) as RecipeRow[];
  const row = rows[0];
  if (!row) return undefined;
  return readRecipe(row.data);
}

export type InsertResult =
  | { status: "created" }
  | { status: "conflict"; fields: Array<"id" | "slug"> };

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export async function insertRecipe(recipe: Recipe): Promise<InsertResult> {
  const sql = getSql();
  const existing = (await sql`
    SELECT id, slug FROM recipes WHERE id = ${recipe.id} OR slug = ${recipe.slug}
  `) as IdentityRow[];
  if (existing.length > 0) {
    const fields = new Set<"id" | "slug">();
    for (const row of existing) {
      if (row.id === recipe.id) fields.add("id");
      if (row.slug === recipe.slug) fields.add("slug");
    }
    return { status: "conflict", fields: [...fields] };
  }

  try {
    await sql.query("INSERT INTO recipes (id, slug, data) VALUES ($1, $2, $3::jsonb)", [
      recipe.id,
      recipe.slug,
      JSON.stringify(recipe),
    ]);
  } catch (error) {
    if (isUniqueViolation(error)) return { status: "conflict", fields: ["slug"] };
    throw error;
  }
  return { status: "created" };
}

export async function getRecipeBySourceUrl(sourceUrl: string): Promise<Recipe | null> {
  if (!sourceUrl) return null;
  const sql = getSql();
  const rows = (await sql`
    SELECT data FROM recipes
    WHERE data->>'sourceUrl' = ${sourceUrl}
    ORDER BY created_at DESC
    LIMIT 1
  `) as RecipeRow[];
  const row = rows[0];
  if (!row) return null;
  return readRecipe(row.data);
}

export async function updateRecipe(recipe: Recipe): Promise<void> {
  const sql = getSql();
  await sql.query("UPDATE recipes SET slug = $2, data = $3::jsonb WHERE id = $1", [
    recipe.id,
    recipe.slug,
    JSON.stringify(recipe),
  ]);
}
