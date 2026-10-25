import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { clientIpFrom } from "@/lib/client-ip";
import { hasDatabase } from "@/lib/db";
import { noteRateLimit, rateLimitCount } from "@/lib/rate-limit";
import { storedImageReady } from "@/lib/recipe-images";
import { type FieldError, parseRecipe } from "@/lib/recipe-schema";
import { insertRecipe } from "@/lib/recipes";

function json(
  body: { ok: boolean; errors?: FieldError[]; slug?: string; url?: string },
  status: number,
) {
  return NextResponse.json(body, { status });
}

function authorized(request: Request): boolean {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  const token = header.slice("Bearer ".length).trim();
  const keys = (process.env.RECIPE_API_KEYS ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
  if (!token || keys.length === 0) return false;
  const tokenBytes = Buffer.from(token);
  return keys.some((key) => {
    const keyBytes = Buffer.from(key);
    if (tokenBytes.length !== keyBytes.length) return false;
    return timingSafeEqual(tokenBytes, keyBytes);
  });
}

const AUTH_FAILURE_MAX = 10;
const AUTH_WINDOW_MS = 60 * 60 * 1000;

function recipeUrl(request: Request, slug: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const base = configured || new URL(request.url).origin;
  return `${base}/recettes/${slug}`;
}

export async function POST(request: Request) {
  const ip = clientIpFrom(request.headers);
  if ((await rateLimitCount(`recettes-auth:${ip}`)) >= AUTH_FAILURE_MAX) {
    return json(
      {
        ok: false,
        errors: [
          { field: "authorization", message: "Trop de tentatives. Réessaie dans une heure." },
        ],
      },
      429,
    );
  }
  if (!authorized(request)) {
    await noteRateLimit(`recettes-auth:${ip}`, AUTH_WINDOW_MS);
    return json({ ok: false, errors: [{ field: "authorization", message: "Clé invalide." }] }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(
      { ok: false, errors: [{ field: "body", message: "Le corps doit être un objet JSON." }] },
      400,
    );
  }

  const parsed = parseRecipe(body);
  if (!parsed.ok) return json({ ok: false, errors: parsed.errors }, 400);
  if (parsed.recipe.image && !(await storedImageReady(parsed.recipe.image))) {
    return json(
      {
        ok: false,
        errors: [{ field: "image", message: "Cette image n'est pas disponible sur le site." }],
      },
      400,
    );
  }
  if (!hasDatabase()) {
    return json(
      {
        ok: false,
        errors: [{ field: "server", message: "La base des recettes n'est pas configurée." }],
      },
      503,
    );
  }

  try {
    const result = await insertRecipe(parsed.recipe);
    if (result.status === "conflict") {
      const errors: FieldError[] = result.fields.map((field) => ({
        field,
        message:
          field === "slug"
            ? "Ce slug est déjà utilisé. Change le titre ou le slug."
            : "Cet identifiant est déjà utilisé.",
      }));
      return json({ ok: false, errors }, 409);
    }
  } catch (error) {
    console.error("insertRecipe failed", error);
    return json(
      {
        ok: false,
        errors: [{ field: "server", message: "Enregistrement impossible pour le moment." }],
      },
      500,
    );
  }

  return json(
    { ok: true, slug: parsed.recipe.slug, url: recipeUrl(request, parsed.recipe.slug) },
    201,
  );
}
