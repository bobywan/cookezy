import { getSql, hasDatabase } from "@/lib/db";
import { ExtractError, fetchPublicBytes } from "@/lib/extract-url";
import { ImageOptimizeError, optimizeRecipeImage } from "@/lib/optimize-recipe-image";
import { imageIdFromPath, storedImagePath } from "@/lib/recipe-image-path";

const SOURCE_MAX_BYTES = 5 * 1024 * 1024;
const OFFER_TTL_MS = 30 * 60 * 1000;
const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export class ImageImportError extends Error {}

type ImageRow = {
  ready: boolean | string;
  source_url: string | null;
  expires_at: Date | string | null;
};

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = getSql()`
      CREATE TABLE IF NOT EXISTS recipe_images (
        id text PRIMARY KEY,
        source_url text,
        bytes bytea,
        expires_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `
      .then(() => undefined)
      .catch((error: unknown) => {
        tableReady = null;
        throw error;
      });
  }
  return tableReady;
}

function readyFlag(value: boolean | string): boolean {
  return value === true || value === "t" || value === "true";
}

export async function rememberImageSource(sourceUrl: string): Promise<string> {
  if (!hasDatabase()) throw new Error("DATABASE_URL manquante");
  await ensureTable();
  const sql = getSql();
  await sql`DELETE FROM recipe_images WHERE bytes IS NULL AND expires_at < now()`;
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + OFFER_TTL_MS).toISOString();
  await sql`
    INSERT INTO recipe_images (id, source_url, expires_at)
    VALUES (${id}, ${sourceUrl}, ${expiresAt})
  `;
  return id;
}

export async function importRememberedImage(id: string): Promise<string> {
  if (!ID_RE.test(id)) throw new ImageImportError("Cette image n'est plus disponible.");
  if (!hasDatabase()) throw new ImageImportError("Les images sont indisponibles pour le moment.");
  await ensureTable();
  const sql = getSql();
  const rows = (await sql`
    SELECT (bytes IS NOT NULL) AS ready, source_url, expires_at
    FROM recipe_images
    WHERE id = ${id}
  `) as ImageRow[];
  const row = rows[0];
  if (!row) throw new ImageImportError("Cette image n'est plus disponible.");
  const path = storedImagePath(id);
  if (readyFlag(row.ready)) return path;
  if (!row.source_url) throw new ImageImportError("Cette image n'est plus disponible.");
  const expires = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  if (expires <= Date.now()) {
    throw new ImageImportError("Cette image n'est plus disponible. Relance la lecture de la page.");
  }

  let source: Buffer;
  try {
    source = await fetchPublicBytes(row.source_url, SOURCE_MAX_BYTES);
  } catch (error) {
    if (!(error instanceof ExtractError)) console.error("fetchPublicBytes failed", error);
    throw new ImageImportError("L'image n'a pas pu être lue.");
  }

  let optimized: Buffer;
  try {
    optimized = await optimizeRecipeImage(source);
  } catch (error) {
    if (error instanceof ImageOptimizeError) throw new ImageImportError(error.message);
    console.error("optimizeRecipeImage failed", error);
    throw new ImageImportError("L'image n'a pas pu être préparée.");
  }

  const updated = (await sql`
    UPDATE recipe_images
    SET bytes = decode(${optimized.toString("base64")}, 'base64'),
        source_url = NULL,
        expires_at = NULL
    WHERE id = ${id} AND source_url IS NOT NULL
    RETURNING id
  `) as { id: string }[];
  if (updated.length > 0) return path;
  if (await storedImageReady(path)) return path;
  throw new ImageImportError("Cette image n'est plus disponible.");
}

export async function storeRecipeImage(source: Buffer): Promise<string> {
  if (!hasDatabase()) throw new ImageImportError("Les images sont indisponibles pour le moment.");
  if (source.length === 0) throw new ImageImportError("Choisis une image.");
  if (source.length > SOURCE_MAX_BYTES) throw new ImageImportError("L'image dépasse 5 Mo.");
  await ensureTable();

  let optimized: Buffer;
  try {
    optimized = await optimizeRecipeImage(source);
  } catch (error) {
    if (error instanceof ImageOptimizeError) throw new ImageImportError(error.message);
    console.error("optimizeRecipeImage failed", error);
    throw new ImageImportError("L'image n'a pas pu être préparée.");
  }

  const sql = getSql();
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO recipe_images (id, bytes)
    VALUES (${id}, decode(${optimized.toString("base64")}, 'base64'))
  `;
  return storedImagePath(id);
}

export async function storedImageReady(path: string): Promise<boolean> {
  const id = imageIdFromPath(path);
  if (!id) return true;
  if (!hasDatabase()) return false;
  await ensureTable();
  const sql = getSql();
  const rows = (await sql`
    SELECT 1 AS ok FROM recipe_images WHERE id = ${id} AND bytes IS NOT NULL
  `) as { ok: number }[];
  return rows.length > 0;
}

export async function readStoredImage(file: string): Promise<Buffer | null> {
  if (!file.endsWith(".webp")) return null;
  const id = file.slice(0, -".webp".length);
  if (!ID_RE.test(id) || !hasDatabase()) return null;
  await ensureTable();
  const sql = getSql();
  const rows = (await sql`
    SELECT encode(bytes, 'base64') AS data
    FROM recipe_images
    WHERE id = ${id} AND bytes IS NOT NULL
  `) as { data: string | null }[];
  const data = rows[0]?.data;
  if (!data) return null;
  return Buffer.from(data, "base64");
}

export async function releaseRecipeImage(path: string): Promise<void> {
  const id = imageIdFromPath(path);
  if (!id || !hasDatabase()) return;
  await ensureTable();
  const sql = getSql();
  const used = (await sql`
    SELECT 1 AS found FROM recipes WHERE data->>'image' = ${path}
    UNION ALL
    SELECT 1 FROM recipe_requests WHERE data->>'image' = ${path}
    LIMIT 1
  `) as { found: number }[];
  if (used.length > 0) return;
  await sql`DELETE FROM recipe_images WHERE id = ${id}`;
}
