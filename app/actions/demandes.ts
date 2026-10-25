"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Resend } from "resend";
import { adminPasswordMessage, isAdmin, startAdminSession } from "@/lib/admin-session";
import { clientIpFrom } from "@/lib/client-ip";
import { hasDatabase } from "@/lib/db";
import { allowRateLimit, clearRateLimit, noteRateLimit, rateLimitCount } from "@/lib/rate-limit";
import { normalizeSourceUrl } from "@/lib/recipe-fields";
import { releaseRecipeImage, storedImageReady } from "@/lib/recipe-images";
import {
  approveRecipeRequest,
  createRecipeRequest,
  deleteRecipeRequest,
  deleteRecipeRequestsBySourceUrl,
  findRecipeRequestBySourceUrl,
  updateRecipeRequest,
} from "@/lib/recipe-requests";
import { parseRecipe } from "@/lib/recipe-schema";
import { getRecipeBySourceUrl, updateRecipe } from "@/lib/recipes";
import type { Recipe } from "@/lib/types";

export type DemandeState = {
  status: "idle" | "success" | "error" | "auth";
  message: string;
};

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const ADMIN_ATTEMPT_MAX = 5;
const ADMIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

async function clientIp(): Promise<string> {
  return clientIpFrom(await headers());
}

function allowDemand(ip: string): Promise<boolean> {
  return allowRateLimit(`demande:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
}

async function notify(title: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const dest = process.env.CONTACT_EMAIL;
  if (!apiKey || !dest) return;
  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  await resend.emails.send({
    from,
    to: dest,
    subject: `Demande de recette — ${title}`,
    text: [`Nouvelle demande : ${title}`, "", "À examiner sur /demandes"].join("\n"),
  });
}

async function releaseReplacedImage(previous: string, next: string) {
  if (!previous || previous === next) return;
  try {
    await releaseRecipeImage(previous);
  } catch (error) {
    console.error("releaseRecipeImage failed", error);
  }
}

export async function trouverRecette(
  rawUrl: string,
): Promise<
  | { ok: true; kind: "published" | "request" | null; recipe: Recipe | null }
  | { ok: false; message: string }
> {
  const source = normalizeSourceUrl(rawUrl);
  if (!source) return { ok: false, message: "L'adresse doit être une URL https publique." };
  if (!hasDatabase()) return { ok: true, kind: null, recipe: null };
  const published = await getRecipeBySourceUrl(source);
  if (published) return { ok: true, kind: "published", recipe: published };
  const pending = await findRecipeRequestBySourceUrl(source);
  if (pending) return { ok: true, kind: "request", recipe: pending.recipe };
  return { ok: true, kind: null, recipe: null };
}

export async function envoyerDemande(input: unknown, trap: string): Promise<DemandeState> {
  if (trap.trim()) {
    return { status: "success", message: "Merci ! Ta demande a bien été envoyée." };
  }
  if (!hasDatabase()) {
    return { status: "error", message: "Les demandes sont indisponibles pour le moment." };
  }
  const parsed = parseRecipe(input);
  if (!parsed.ok) {
    return { status: "error", message: parsed.errors.map((error) => error.message).join(" ") };
  }
  if (parsed.recipe.image && !(await storedImageReady(parsed.recipe.image))) {
    return {
      status: "error",
      message:
        "L'image choisie n'est plus disponible. Relance la lecture de la page, ou continue sans photo.",
    };
  }

  const source = parsed.recipe.sourceUrl;
  const published = source ? await getRecipeBySourceUrl(source) : null;
  if (published && !(await isAdmin())) {
    return {
      status: "auth",
      message: "Cette recette est déjà en ligne. Entre le mot de passe pour la mettre à jour.",
    };
  }

  const ip = await clientIp();
  const allowed = await allowDemand(ip);
  if (!allowed) {
    return { status: "error", message: "Trop de tentatives. Réessaie dans une heure." };
  }

  if (published) {
    const next = { ...parsed.recipe, id: published.id, slug: published.slug };
    try {
      await updateRecipe(next);
      const removed = await deleteRecipeRequestsBySourceUrl(source);
      await releaseReplacedImage(published.image, next.image);
      for (const recipe of removed) await releaseReplacedImage(recipe.image, next.image);
    } catch (error) {
      console.error("updateRecipe failed", error);
      return { status: "error", message: "La recette n'a pas pu être mise à jour." };
    }
    revalidatePath("/");
    revalidatePath("/demandes");
    revalidatePath(`/recettes/${next.slug}`);
    return { status: "success", message: "La recette en ligne a été mise à jour." };
  }

  const pending = source ? await findRecipeRequestBySourceUrl(source) : null;
  if (pending) {
    const next = { ...parsed.recipe, id: pending.recipe.id };
    try {
      await updateRecipeRequest(pending.id, next);
      await releaseReplacedImage(pending.recipe.image, next.image);
    } catch (error) {
      console.error("updateRecipeRequest failed", error);
      return { status: "error", message: "La demande n'a pas pu être mise à jour." };
    }
    revalidatePath("/demandes");
    return { status: "success", message: "La demande a été mise à jour." };
  }

  try {
    await createRecipeRequest(parsed.recipe);
  } catch (error) {
    console.error("createRecipeRequest failed", error);
    return { status: "error", message: "La demande n'a pas pu être enregistrée." };
  }
  try {
    await notify(parsed.recipe.title);
  } catch (error) {
    console.error("notify request failed", error);
  }
  return {
    status: "success",
    message: "Merci ! Ta demande a bien été envoyée. Elle sera examinée.",
  };
}

export async function connecterAdmin(password: string): Promise<DemandeState> {
  const problem = adminPasswordMessage();
  if (problem) return { status: "error", message: problem };
  const ip = await clientIp();
  if ((await rateLimitCount(`admin:${ip}`)) >= ADMIN_ATTEMPT_MAX) {
    return { status: "error", message: "Trop de tentatives. Réessaie dans un quart d'heure." };
  }
  const ok = await startAdminSession(password);
  if (!ok) {
    await noteRateLimit(`admin:${ip}`, ADMIN_ATTEMPT_WINDOW_MS);
    return { status: "error", message: "Mot de passe incorrect." };
  }
  await clearRateLimit(`admin:${ip}`);
  return { status: "success", message: "" };
}

export async function ajouterDemande(id: string): Promise<DemandeState> {
  if (!(await isAdmin())) return { status: "error", message: "Accès refusé." };
  try {
    const result = await approveRecipeRequest(id);
    if (!result.ok) return { status: "error", message: result.message };
    revalidatePath(`/recettes/${result.slug}`);
  } catch (error) {
    console.error("approveRecipeRequest failed", error);
    return { status: "error", message: "La recette n'a pas pu être ajoutée." };
  }
  revalidatePath("/");
  revalidatePath("/demandes");
  return { status: "success", message: "Recette ajoutée au site." };
}

export async function supprimerDemande(id: string): Promise<DemandeState> {
  if (!(await isAdmin())) return { status: "error", message: "Accès refusé." };
  let removed: Awaited<ReturnType<typeof deleteRecipeRequest>> = null;
  try {
    removed = await deleteRecipeRequest(id);
  } catch (error) {
    console.error("deleteRecipeRequest failed", error);
    return { status: "error", message: "La demande n'a pas pu être supprimée." };
  }
  if (removed?.image) {
    try {
      await releaseRecipeImage(removed.image);
    } catch (error) {
      console.error("releaseRecipeImage failed", error);
    }
  }
  revalidatePath("/demandes");
  return { status: "success", message: "Demande supprimée." };
}
