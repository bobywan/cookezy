import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import RecipeSearchExplorer from "@/components/RecipeSearchExplorer";
import { hasDatabase } from "@/lib/db";
import { getRecipes } from "@/lib/recipes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cookezy — Mes recettes",
  description: "Mon carnet de recettes personnel.",
};

export default async function Home() {
  const recipes = hasDatabase() ? await getRecipes() : null;

  return (
    <main className="min-h-dvh bg-brand-50 pb-safe print:bg-white print:pb-0">
      <header className="px-safe pt-safe pb-4 text-center print:hidden md:pb-5">
        <h1>
          <Logo className="mx-auto w-40 text-brand-700 md:w-44" />
          <span className="sr-only">Cookezy</span>
        </h1>
        <Link
          href="/proposer-une-recette"
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-1.5 text-sm font-medium text-brand-700 shadow-[--shadow-card] transition-colors hover:bg-brand-100"
        >
          <span aria-hidden>+</span> Proposer une recette
        </Link>
      </header>

      {recipes ? (
        <RecipeSearchExplorer recipes={recipes} />
      ) : (
        <p className="mx-auto mt-10 max-w-md px-safe text-center text-sm text-neutral-600">
          Les recettes sont indisponibles pour le moment.
        </p>
      )}
    </main>
  );
}
