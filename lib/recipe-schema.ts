import { existsSync } from "node:fs";
import path from "node:path";
import { type ParseResult, parseRecipeFields } from "@/lib/recipe-fields";

export type { FieldError, ParseResult } from "@/lib/recipe-fields";
export { slugify } from "@/lib/recipe-fields";

export function parseRecipe(input: unknown): ParseResult {
  return parseRecipeFields(input, {
    localImageExists: (image) => existsSync(path.join(process.cwd(), "public", image)),
  });
}
