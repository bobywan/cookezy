import type { Metadata } from "next";
import RecipeCard from "@/components/RecipeCard";
import { recipes } from "@/lib/recipes";

export const metadata: Metadata = {
  title: "Cookezy — Mes recettes",
  description: "Mon carnet de recettes personnel.",
};

export default function Home() {
  return (
    <main className="min-h-dvh bg-brand-50 pb-safe">
      <header className="px-safe pt-safe pb-4 text-center md:pb-5">
        <h1 className="font-display text-3xl font-bold tracking-tight text-brand-700 md:text-4xl">
          Cookezy
        </h1>
      </header>

      <section className="mx-auto max-w-5xl px-safe py-6 md:py-10 xl:max-w-6xl">
        <p className="mb-4 text-xs text-neutral-400 md:mb-6 md:text-sm">
          {recipes.length} recette{recipes.length > 1 ? "s" : ""}
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>
    </main>
  );
}
