"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Resend } from "resend";
import { isAdmin, startAdminSession } from "@/lib/admin-session";
import { hasDatabase } from "@/lib/db";
import {
  approveRecipeRequest,
  createRecipeRequest,
  deleteRecipeRequest,
} from "@/lib/recipe-requests";
import { parseRecipe } from "@/lib/recipe-schema";

export type DemandeState = {
  status: "idle" | "success" | "error";
  message: string;
};

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const ipMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
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

export async function envoyerDemande(input: unknown, trap: string): Promise<DemandeState> {
  if (trap.trim()) {
    return { status: "success", message: "Merci ! Ta demande a bien été envoyée." };
  }
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return { status: "error", message: "Trop de tentatives. Réessaie dans une heure." };
  }
  if (!hasDatabase()) {
    return { status: "error", message: "Les demandes sont indisponibles pour le moment." };
  }
  const parsed = parseRecipe(input);
  if (!parsed.ok) {
    return { status: "error", message: parsed.errors.map((error) => error.message).join(" ") };
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
  if (!process.env.ADMIN_PASSWORD) {
    return { status: "error", message: "Le mot de passe administrateur n'est pas configuré." };
  }
  const ok = await startAdminSession(password);
  if (!ok) return { status: "error", message: "Mot de passe incorrect." };
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
  try {
    await deleteRecipeRequest(id);
  } catch (error) {
    console.error("deleteRecipeRequest failed", error);
    return { status: "error", message: "La demande n'a pas pu être supprimée." };
  }
  revalidatePath("/demandes");
  return { status: "success", message: "Demande supprimée." };
}
