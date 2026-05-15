import type { Metadata } from "next";
import Logo from "@/components/Logo";
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
        <h1>
          <Logo className="mx-auto w-40 text-brand-700 md:w-44" />
          <span className="sr-only">Cookezy</span>
        </h1>
      </header>

      <RecipeSearchExplorer recipes={recipes} />
    </main>
  );
}
