"use client";

import { useState } from "react";
import type { Ingredient } from "@/lib/types";
import IngredientList from "@/components/IngredientList";

type Props = {
  baseServings: number;
  ingredients: Ingredient[];
};

export default function ServingsScaler({ baseServings, ingredients }: Props) {
  const [servings, setServings] = useState(baseServings);

  const decrement = () => setServings((s) => Math.max(1, s - 1));
  const increment = () => setServings((s) => s + 1);

  const ratio = servings / baseServings;

  return (
    <div>
      <div className="mb-5 flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Portions :</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={decrement}
            disabled={servings <= 1}
            aria-label="Diminuer les portions"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:bg-amber-50 hover:border-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          <span className="w-8 text-center text-lg font-semibold text-amber-700">
            {servings}
          </span>
          <button
            type="button"
            onClick={increment}
            aria-label="Augmenter les portions"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:bg-amber-50 hover:border-amber-400"
          >
            +
          </button>
        </div>
        {servings !== baseServings && (
          <button
            type="button"
            onClick={() => setServings(baseServings)}
            className="text-xs text-amber-600 underline underline-offset-2 hover:text-amber-800"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <IngredientList ingredients={ingredients} ratio={ratio} />
    </div>
  );
}
