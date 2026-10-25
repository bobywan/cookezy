import type { Ingredient, Recipe } from "@/lib/types";

export type FieldError = {
  field: string;
  message: string;
};

export type ParseResult = { ok: true; recipe: Recipe } | { ok: false; errors: FieldError[] };

const CATEGORIES = ["entrée", "plat", "dessert", "snack"] as const;
const DIFFICULTIES = ["facile", "moyen", "difficile"] as const;
const LOCAL_IMAGE = /^\/images\/recettes\/[a-z0-9][a-z0-9.-]*\.(jpg|jpeg|png|webp)$/;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function push(errors: FieldError[], field: string, message: string) {
  errors.push({ field, message });
}

function readText(
  value: unknown,
  field: string,
  label: string,
  max: number,
  errors: FieldError[],
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    push(errors, field, `${label} est obligatoire.`);
    return "";
  }
  const text = value.trim();
  if (text.length > max) {
    push(errors, field, `${label} est trop long.`);
    return "";
  }
  return text;
}

function readInt(
  value: unknown,
  field: string,
  label: string,
  min: number,
  max: number,
  errors: FieldError[],
): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    push(errors, field, `${label} doit être un nombre entier.`);
    return min;
  }
  if (value < min || value > max) {
    push(errors, field, `${label} doit être entre ${min} et ${max}.`);
    return min;
  }
  return value;
}

function blockedImageHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }
  if (/^\d+$/.test(host)) return true;
  const parts = host.split(".").map((part) => Number(part));
  if (
    parts.length === 4 &&
    parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)
  ) {
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (host.includes(":")) {
    if (host === "::1" || host === "::") return true;
    if (host.startsWith("fc") || host.startsWith("fd") || /^fe[89ab]/.test(host)) return true;
  }
  return false;
}

function resolveImage(
  value: unknown,
  errors: FieldError[],
  localImageExists?: (image: string) => boolean,
): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") {
    push(errors, "image", "L'image doit être une URL https, ou absente.");
    return "";
  }
  const image = value.trim();
  if (!image) return "";
  if (image.length > 500) {
    push(errors, "image", "L'adresse de l'image est trop longue.");
    return "";
  }
  if (image.startsWith("https://")) {
    try {
      const url = new URL(image);
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        blockedImageHost(url.hostname)
      ) {
        push(errors, "image", "L'image doit être une URL https publique, sans identifiants.");
        return "";
      }
      return url.toString();
    } catch {
      push(errors, "image", "L'image doit être une URL https valide.");
      return "";
    }
  }
  if (LOCAL_IMAGE.test(image) && !image.includes("..")) {
    if (localImageExists && !localImageExists(image)) return "";
    return image;
  }
  push(errors, "image", "L'image doit être une URL https, ou absente.");
  return "";
}

export function normalizeSourceUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return "";
  }
  if (url.protocol !== "https:" || url.username || url.password || blockedImageHost(url.hostname)) {
    return "";
  }
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}

function resolveSourceUrl(value: unknown, errors: FieldError[]): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") {
    push(errors, "sourceUrl", "L'adresse d'origine doit être une URL https, ou absente.");
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length > 500) {
    push(errors, "sourceUrl", "L'adresse d'origine est trop longue.");
    return "";
  }
  const source = normalizeSourceUrl(trimmed);
  if (!source) {
    push(errors, "sourceUrl", "L'adresse d'origine doit être une URL https publique.");
    return "";
  }
  return source;
}

function readIngredients(value: unknown, errors: FieldError[]): Ingredient[] {
  if (!Array.isArray(value)) {
    push(errors, "ingredients", "Les ingrédients doivent être une liste.");
    return [];
  }
  if (value.length > 40) {
    push(errors, "ingredients", "40 ingrédients au maximum.");
    return [];
  }
  const ingredients: Ingredient[] = [];
  for (const [index, item] of value.entries()) {
    if (typeof item !== "object" || item === null) {
      push(errors, "ingredients", `L'ingrédient ${index + 1} doit être un objet.`);
      continue;
    }
    const record = item as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name.trim() : "";
    if (!name) continue;
    if (name.length > 80) {
      push(errors, "ingredients", `Le nom de « ${name.slice(0, 40)} » est trop long.`);
      continue;
    }
    const quantity = record.quantity;
    if (
      typeof quantity !== "number" ||
      !Number.isFinite(quantity) ||
      quantity < 0 ||
      quantity > 100000
    ) {
      push(errors, "ingredients", `La quantité de « ${name} » doit être un nombre positif ou nul.`);
      continue;
    }
    if (typeof record.unit !== "string" || record.unit.trim().length > 20) {
      push(
        errors,
        "ingredients",
        `L'unité de « ${name} » doit être une chaîne, vide s'il n'y en a pas.`,
      );
      continue;
    }
    ingredients.push({ quantity, unit: record.unit.trim(), name });
  }
  if (ingredients.length === 0) {
    push(errors, "ingredients", "Au moins un ingrédient avec un nom est requis.");
  }
  return ingredients;
}

function readSteps(value: unknown, errors: FieldError[]): string[] {
  if (!Array.isArray(value)) {
    push(errors, "steps", "Les étapes doivent être une liste de textes.");
    return [];
  }
  if (value.length > 40) {
    push(errors, "steps", "40 étapes au maximum.");
    return [];
  }
  const steps = value
    .filter((step): step is string => typeof step === "string")
    .map((step) => step.trim())
    .filter(Boolean);
  if (steps.length === 0) {
    push(errors, "steps", "Au moins une étape est requise.");
  }
  if (steps.some((step) => step.length > 1000)) {
    push(errors, "steps", "Une étape est trop longue.");
  }
  if (value.some((step) => typeof step !== "string")) {
    push(errors, "steps", "Chaque étape doit être un texte.");
  }
  return steps;
}

function readTags(value: unknown, errors: FieldError[]): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    push(errors, "tags", "Les tags doivent être une liste de textes.");
    return [];
  }
  if (value.length > 15) {
    push(errors, "tags", "15 tags au maximum.");
    return [];
  }
  return value
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().toLowerCase().replace(/^#/, ""))
    .filter((tag) => tag.length > 0 && tag.length <= 30);
}

export function parseRecipeFields(
  input: unknown,
  options?: { localImageExists?: (image: string) => boolean },
): ParseResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return {
      ok: false,
      errors: [{ field: "body", message: "Le corps doit être un objet JSON." }],
    };
  }
  const record = input as Record<string, unknown>;
  const errors: FieldError[] = [];
  const title = readText(record.title, "title", "Le titre", 120, errors);
  const description = readText(record.description, "description", "La description", 500, errors);
  const slugSource = typeof record.slug === "string" && record.slug.trim() ? record.slug : title;
  const slug = slugify(slugSource);
  if (!slug) push(errors, "slug", "Le slug doit contenir des lettres ou des chiffres.");
  if (slug.length > 80) push(errors, "slug", "Le slug est trop long.");

  const category = record.category;
  if (
    typeof category !== "string" ||
    !CATEGORIES.includes(category as (typeof CATEGORIES)[number])
  ) {
    push(errors, "category", "La catégorie doit être entrée, plat, dessert ou snack.");
  }
  const difficulty = record.difficulty;
  if (
    typeof difficulty !== "string" ||
    !DIFFICULTIES.includes(difficulty as (typeof DIFFICULTIES)[number])
  ) {
    push(errors, "difficulty", "La difficulté doit être facile, moyen ou difficile.");
  }

  const prepTime = readInt(record.prepTime, "prepTime", "Le temps de préparation", 0, 1440, errors);
  const cookTime = readInt(record.cookTime, "cookTime", "Le temps de cuisson", 0, 1440, errors);
  const servings = readInt(record.servings, "servings", "Le nombre de portions", 1, 100, errors);
  const ingredients = readIngredients(record.ingredients, errors);
  const steps = readSteps(record.steps, errors);
  const tags = readTags(record.tags, errors);
  const image = resolveImage(record.image, errors, options?.localImageExists);
  const sourceUrl = resolveSourceUrl(record.sourceUrl, errors);

  const idSource = typeof record.id === "string" ? record.id.trim() : "";
  const id = idSource || slug;
  if (!id || /\s/.test(id) || id.length > 80) {
    push(errors, "id", "L'identifiant doit tenir en 80 caractères, sans espace.");
  }

  if (errors.length > 0 || !slug) return { ok: false, errors };

  const recipe: Recipe = {
    id,
    slug,
    title,
    description,
    image,
    category: category as Recipe["category"],
    difficulty: difficulty as Recipe["difficulty"],
    prepTime,
    cookTime,
    servings,
    ingredients,
    steps,
    tags,
    sourceUrl,
  };
  return { ok: true, recipe };
}
