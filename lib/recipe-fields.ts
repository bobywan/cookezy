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

function readText(value: unknown, field: string, label: string, errors: FieldError[]): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    push(errors, field, `${label} est obligatoire.`);
    return "";
  }
  return value.trim();
}

function readInt(
  value: unknown,
  field: string,
  label: string,
  min: number,
  errors: FieldError[],
): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    push(errors, field, `${label} doit être un nombre entier.`);
    return min;
  }
  if (value < min) {
    push(errors, field, `${label} doit être supérieur ou égal à ${min}.`);
    return min;
  }
  return value;
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
  if (image.startsWith("https://")) {
    try {
      const url = new URL(image);
      if (url.protocol !== "https:" || url.username || url.password) {
        push(errors, "image", "L'image doit être une URL https sans identifiants.");
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

function readIngredients(value: unknown, errors: FieldError[]): Ingredient[] {
  if (!Array.isArray(value)) {
    push(errors, "ingredients", "Les ingrédients doivent être une liste.");
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
    const quantity = record.quantity;
    if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity < 0) {
      push(errors, "ingredients", `La quantité de « ${name} » doit être un nombre positif ou nul.`);
      continue;
    }
    if (typeof record.unit !== "string") {
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
  const steps = value
    .filter((step): step is string => typeof step === "string")
    .map((step) => step.trim())
    .filter(Boolean);
  if (steps.length === 0) {
    push(errors, "steps", "Au moins une étape est requise.");
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
  return value
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().toLowerCase().replace(/^#/, ""))
    .filter(Boolean);
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
  const title = readText(record.title, "title", "Le titre", errors);
  const description = readText(record.description, "description", "La description", errors);
  const slugSource = typeof record.slug === "string" && record.slug.trim() ? record.slug : title;
  const slug = slugify(slugSource);
  if (!slug) push(errors, "slug", "Le slug doit contenir des lettres ou des chiffres.");

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

  const prepTime = readInt(record.prepTime, "prepTime", "Le temps de préparation", 0, errors);
  const cookTime = readInt(record.cookTime, "cookTime", "Le temps de cuisson", 0, errors);
  const servings = readInt(record.servings, "servings", "Le nombre de portions", 1, errors);
  const ingredients = readIngredients(record.ingredients, errors);
  const steps = readSteps(record.steps, errors);
  const tags = readTags(record.tags, errors);
  const image = resolveImage(record.image, errors, options?.localImageExists);

  const idSource = typeof record.id === "string" ? record.id.trim() : "";
  const id = idSource || slug;
  if (!id || /\s/.test(id)) {
    push(errors, "id", "L'identifiant ne doit pas contenir d'espace.");
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
  };
  return { ok: true, recipe };
}
