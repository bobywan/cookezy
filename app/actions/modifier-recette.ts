"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  adminPasswordMessage,
  isAdmin,
  SESSION_7_DAYS,
  startAdminSession,
} from "@/lib/admin-session";
import { clientIpFrom } from "@/lib/client-ip";
import { clearRateLimit, noteRateLimit, rateLimitCount } from "@/lib/rate-limit";
import { releaseRecipeImage, storedImageReady } from "@/lib/recipe-images";
import { parseRecipe } from "@/lib/recipe-schema";
import { getRecipeBySlug, updateRecipe } from "@/lib/recipes";

export type EditState = {
  status: "idle" | "success" | "error";
  message: string;
};

const ADMIN_ATTEMPT_MAX = 5;
const ADMIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

export async function connecterAdminRecette(password: string): Promise<EditState> {
  const problem = adminPasswordMessage();
  if (problem) return { status: "error", message: problem };
  const ip = clientIpFrom(await headers());
  if ((await rateLimitCount(`admin:${ip}`)) >= ADMIN_ATTEMPT_MAX) {
    return { status: "error", message: "Trop de tentatives. Réessaie dans un quart d'heure." };
  }
  const ok = await startAdminSession(password, SESSION_7_DAYS);
  if (!ok) {
    await noteRateLimit(`admin:${ip}`, ADMIN_ATTEMPT_WINDOW_MS);
    return { status: "error", message: "Mot de passe incorrect." };
  }
  await clearRateLimit(`admin:${ip}`);
  return { status: "success", message: "" };
}

async function releaseReplacedImage(previous: string, next: string) {
  if (!previous || previous === next) return;
  try {
    await releaseRecipeImage(previous);
  } catch (error) {
    console.error("releaseRecipeImage failed", error);
  }
}

export async function modifierRecette(slug: string, input: unknown): Promise<EditState> {
  if (!(await isAdmin())) return { status: "error", message: "Accès refusé." };
  const published = await getRecipeBySlug(slug);
  if (!published) return { status: "error", message: "Recette introuvable." };

  const parsed = parseRecipe(input);
  if (!parsed.ok) {
    return { status: "error", message: parsed.errors.map((error) => error.message).join(" ") };
  }
  if (parsed.recipe.image && !(await storedImageReady(parsed.recipe.image))) {
    return {
      status: "error",
      message: "L'image choisie n'est plus disponible. Garde la photo actuelle, ou retire-la.",
    };
  }

  const next = { ...parsed.recipe, id: published.id, slug: published.slug };
  try {
    await updateRecipe(next);
    await releaseReplacedImage(published.image, next.image);
  } catch (error) {
    console.error("updateRecipe failed", error);
    return { status: "error", message: "La recette n'a pas pu être mise à jour." };
  }
  revalidatePath("/");
  revalidatePath(`/recettes/${published.slug}`);
  return { status: "success", message: "La recette a été mise à jour." };
}
