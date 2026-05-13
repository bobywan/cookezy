import type { Recipe } from "@/lib/types";

export const difficultyBadgeClass: Record<Recipe["difficulty"], string> = {
  facile: "bg-green-100 text-green-800",
  moyen: "bg-yellow-100 text-yellow-800",
  difficile: "bg-red-100 text-red-800",
};

export const categoryBadgeClass: Record<Recipe["category"], string> = {
  entrée: "bg-accent-100 text-accent-600",
  plat: "bg-brand-100 text-brand-700",
  dessert: "bg-accent-100 text-accent-600",
  snack: "bg-brand-100 text-brand-700",
};
