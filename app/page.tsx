import type { Metadata } from "next";
import RecipeCard from "@/components/RecipeCard";
import { recipes } from "@/lib/recipes";

export const metadata: Metadata = {
  title: "Cookezy — Mes recettes",
  description: "Mon carnet de recettes personnel.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-amber-50">
      <header className="border-b border-amber-100 bg-white px-6 py-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-amber-700">
          Cookezy
        </h1>
        <p className="mt-2 text-gray-500">Mon carnet de recettes personnel</p>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <p className="mb-6 text-sm text-gray-400">
          {recipes.length} recette{recipes.length > 1 ? "s" : ""}
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>
    </main>
  );
}
