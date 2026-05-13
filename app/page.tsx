import type { Metadata } from "next";
import RecipeSearchExplorer from "@/components/RecipeSearchExplorer";
import { recipes } from "@/lib/recipes";

export const metadata: Metadata = {
  title: "Cookezy — Mes recettes",
  description: "Mon carnet de recettes personnel.",
};

export default function Home() {
  return (
    <main className="min-h-dvh bg-brand-50 pb-safe print:bg-white print:pb-0">
      <header className="px-safe pt-safe pb-4 text-center print:hidden md:pb-5">
        <h1 className="font-display text-3xl font-bold tracking-tight text-brand-700 md:text-4xl">
          Cookezy
        </h1>
      </header>

      <RecipeSearchExplorer recipes={recipes} />
    </main>
  );
}
