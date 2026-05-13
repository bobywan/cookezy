import crepes from "@/content/recipes/crepes.json";
import pouletRoti from "@/content/recipes/poulet-roti.json";
import tarteAuCitron from "@/content/recipes/tarte-au-citron.json";
import type { Recipe } from "@/lib/types";

export const recipes: Recipe[] = [crepes, pouletRoti, tarteAuCitron] as Recipe[];

export function getRecipeBySlug(slug: string): Recipe | undefined {
  return recipes.find((r) => r.slug === slug);
}
