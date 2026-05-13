"use client";

import type { Ingredient } from "@/lib/types";

type Props = {
  ingredients: Ingredient[];
  ratio: number;
};

function formatQuantity(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/\.?0+$/, "");
}

export default function IngredientList({ ingredients, ratio }: Props) {
  return (
    <ul className="divide-y divide-neutral-100 rounded-[--radius-card] border border-neutral-200 bg-white">
      {ingredients.map((ingredient, index) => {
        const scaledQty = ingredient.quantity * ratio;
        return (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: static list with no reordering
            key={index}
            className="flex min-h-12 items-center justify-between gap-3 px-4 py-3 text-base md:min-h-0 md:py-2.5"
          >
            <span className="text-neutral-700">{ingredient.name}</span>
            <span className="font-medium text-brand-700">
              {formatQuantity(scaledQty)}
              {ingredient.unit ? ` ${ingredient.unit}` : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
