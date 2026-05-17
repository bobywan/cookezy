"use server";

import { headers } from "next/headers";
import { Resend } from "resend";

export type ProposerState = {
  status: "idle" | "success" | "error";
  message: string;
};

type IngredientInput = { quantity: string; unit: string; name: string };

/* ── Rate limiting par IP (in-memory, 3 soumissions / heure) ── */
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
  entry.count++;
  return true;
}

export async function proposerRecette(
  _prevState: ProposerState,
  formData: FormData,
): Promise<ProposerState> {
  /* ── Honeypot : rejet silencieux si le champ piège est rempli ── */
  if ((formData.get("_trap") as string | null)?.trim()) {
    return { status: "success", message: "Merci ! Ta proposition a bien été envoyée." };
  }

  /* ── Rate limiting ── */
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return {
      status: "error",
      message: "Trop de tentatives. Réessaie dans une heure.",
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const dest = process.env.CONTACT_EMAIL;

  if (!apiKey || !dest) {
    return {
      status: "error",
      message: "Configuration email manquante côté serveur.",
    };
  }

  const resend = new Resend(apiKey);
  const mode = formData.get("mode") as string;
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  if (mode === "url") {
    const url = (formData.get("url") as string | null)?.trim();
    if (!url) {
      return { status: "error", message: "L'URL est requise." };
    }

    const { error } = await resend.emails.send({
      from,
      to: dest,
      subject: "🍳 Proposition de recette — Par URL",
      text: [
        "Nouvelle proposition de recette !",
        "",
        `URL : ${url}`,
        `Date : ${new Date().toLocaleDateString("fr-FR", { dateStyle: "long" })}`,
      ].join("\n"),
    });

    if (error) {
      return { status: "error", message: "Erreur lors de l'envoi de l'email." };
    }
  } else {
    const title = (formData.get("title") as string | null)?.trim();
    if (!title) {
      return { status: "error", message: "Le titre est requis." };
    }

    const description = (formData.get("description") as string | null)?.trim() ?? "";
    const category = (formData.get("category") as string) || "plat";
    const difficulty = (formData.get("difficulty") as string) || "moyen";
    const prepTime = Number(formData.get("prepTime") ?? 0);
    const cookTime = Number(formData.get("cookTime") ?? 0);
    const servings = Number(formData.get("servings") ?? 4);
    const tagsRaw = (formData.get("tags") as string | null)?.trim() ?? "";

    const ingredients: IngredientInput[] = JSON.parse(
      (formData.get("ingredients") as string) || "[]",
    );
    const steps: string[] = JSON.parse((formData.get("steps") as string) || "[]").filter(
      (s: string) => s.trim(),
    );
    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const jsonReady = JSON.stringify(
      {
        id: "REMPLACER",
        slug,
        title,
        description,
        image: `/images/recettes/${slug}.jpg`,
        category,
        difficulty,
        prepTime,
        cookTime,
        servings,
        ingredients: ingredients.map((i) => ({
          quantity: Number(i.quantity) || 0,
          unit: i.unit.trim(),
          name: i.name.trim(),
        })),
        steps,
        tags,
      },
      null,
      2,
    );

    const ingredientLines = ingredients
      .filter((i) => i.name.trim())
      .map((i) => `  - ${[i.quantity, i.unit, i.name].filter(Boolean).join(" ")}`)
      .join("\n");

    const stepLines = steps.map((s, i) => `  ${i + 1}. ${s}`).join("\n");

    const text = [
      "Nouvelle proposition de recette !",
      "",
      `Titre       : ${title}`,
      `Description : ${description}`,
      `Catégorie   : ${category}   Difficulté : ${difficulty}`,
      `Préparation : ${prepTime} min   Cuisson : ${cookTime} min   Portions : ${servings}`,
      "",
      "Ingrédients :",
      ingredientLines || "  (aucun)",
      "",
      "Étapes :",
      stepLines || "  (aucune)",
      "",
      `Tags : ${tags.map((t) => `#${t}`).join(" ") || "(aucun)"}`,
      "",
      "─".repeat(60),
      "JSON prêt à copier dans content/recipes/ :",
      jsonReady,
    ].join("\n");

    const { error } = await resend.emails.send({
      from,
      to: dest,
      subject: `🍳 Proposition de recette — ${title}`,
      text,
    });

    if (error) {
      return { status: "error", message: "Erreur lors de l'envoi de l'email." };
    }
  }

  return {
    status: "success",
    message: "Merci ! Ta proposition a bien été envoyée.",
  };
}
