"use client";

import { useMemo, useState } from "react";
import RecipeCard from "@/components/RecipeCard";
import type { Recipe } from "@/lib/types";

type Props = {
  recipes: Recipe[];
};

const CATEGORIES: Recipe["category"][] = ["entrée", "plat", "dessert", "snack"];

function matchesQuery(recipe: Recipe, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;

  const parts = [
    recipe.title,
    recipe.description,
    recipe.category,
    recipe.difficulty,
    recipe.slug.replace(/-/g, " "),
    ...recipe.tags,
  ];

  return parts.some((p) => p.toLowerCase().includes(q));
}

const chipBase =
  "min-h-9 touch-manipulation rounded-[--radius-badge] border px-3 py-1.5 text-xs font-medium transition md:min-h-0 md:py-1";
const chipOff =
  "border-neutral-200 bg-white text-neutral-600 hover:border-brand-300 hover:bg-brand-50";
const chipOn = "border-brand-500 bg-brand-100 text-brand-800";

export default function RecipeSearchExplorer({ recipes }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Recipe["category"] | null>(null);

  const filtered = useMemo(
    () =>
      recipes.filter((r) => {
        if (!matchesQuery(r, query)) return false;
        if (category !== null && r.category !== category) return false;
        return true;
      }),
    [recipes, query, category],
  );

  const total = recipes.length;
  const count = filtered.length;
  const hasFilter = query.trim().length > 0 || category !== null;

  return (
    <section className="mx-auto max-w-5xl px-safe py-6 md:py-10 xl:max-w-6xl">
      <div className="print:hidden">
        <search className="mb-4 block md:mb-6" aria-label="Recherche dans les recettes">
          <label htmlFor="recipe-search" className="sr-only">
            Rechercher une recette
          </label>
          <div className="flex items-center gap-3 rounded-[--radius-card] border border-neutral-200 bg-white px-3 py-2 shadow-[--shadow-card] transition-[box-shadow,border-color] focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-300 md:gap-4 md:px-4 md:py-2.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 shrink-0 text-neutral-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              id="recipe-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une recette…"
              autoComplete="off"
              className="min-h-11 w-full min-w-0 border-0 bg-transparent text-base text-neutral-900 placeholder:text-neutral-400 outline-none focus-visible:ring-0 md:min-h-0 md:text-sm"
            />
          </div>
        </search>

        <fieldset className="mb-4 min-w-0 border-0 p-0 md:mb-6">
          <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Catégorie
          </legend>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={category === null}
              onClick={() => setCategory(null)}
              className={`${chipBase} ${category === null ? chipOn : chipOff}`}
            >
              Toutes
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory((prev) => (prev === c ? null : c))}
                className={`${chipBase} ${category === c ? chipOn : chipOff}`}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <p className="mb-4 text-sm text-neutral-400 print:hidden md:mb-6">
        {hasFilter ? (
          count === 0 ? (
            <span className="text-neutral-600">
              Aucune recette ne correspond à votre recherche.
            </span>
          ) : (
            <>
              {count} sur {total} recette{total !== 1 ? "s" : ""}
            </>
          )
        ) : (
          <>
            {total} recette{total !== 1 ? "s" : ""}
          </>
        )}
      </p>

      {count > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          {filtered.map((recipe, index) => (
            <RecipeCard key={recipe.id} recipe={recipe} priority={index === 0} />
          ))}
        </div>
      )}
    </section>
  );
}
