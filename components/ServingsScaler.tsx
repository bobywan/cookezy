"use client";

import IngredientList from "@/components/IngredientList";
import type { Ingredient } from "@/lib/types";

type Props = {
  baseServings: number;
  ingredients: Ingredient[];
  servings: number;
  onServingsChange: (servings: number) => void;
};

export default function ServingsScaler({
  baseServings,
  ingredients,
  servings,
  onServingsChange,
}: Props) {
  const decrement = () => onServingsChange(Math.max(1, servings - 1));
  const increment = () => onServingsChange(servings + 1);

  const ratio = servings / baseServings;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 md:mb-5 md:gap-4">
        <span className="min-h-11 shrink-0 text-base font-medium leading-none text-neutral-700 md:min-h-0">
          Portions :
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={decrement}
            disabled={servings <= 1}
            aria-label="Diminuer les portions"
            className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-[--radius-badge] border border-neutral-200 text-base text-neutral-600 transition hover:border-brand-400 hover:bg-brand-50 active:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-40 md:h-9 md:w-9"
          >
            −
          </button>
          <span className="min-w-10 px-1 text-center text-xl font-semibold tabular-nums text-brand-700 md:w-9 md:text-lg">
            {servings}
          </span>
          <button
            type="button"
            onClick={increment}
            aria-label="Augmenter les portions"
            className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-[--radius-badge] border border-neutral-200 text-base text-neutral-600 transition hover:border-brand-400 hover:bg-brand-50 active:bg-brand-100 md:h-9 md:w-9"
          >
            +
          </button>
        </div>
        {servings !== baseServings && (
          <button
            type="button"
            onClick={() => onServingsChange(baseServings)}
            className="min-h-11 rounded-[--radius-badge] px-2 text-base text-brand-600 underline underline-offset-2 hover:text-brand-800 active:bg-brand-50 md:min-h-0"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <IngredientList ingredients={ingredients} ratio={ratio} />
    </div>
  );
}
