"use client";

import type { Ingredient } from "@/lib/types";

type Props = {
  ingredients: Ingredient[];
  ratio: number;
};

function formatQuantity(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  // Display up to 2 decimals, trimming trailing zeros
  return rounded.toFixed(2).replace(/\.?0+$/, "");
}

export default function IngredientList({ ingredients, ratio }: Props) {
  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
      {ingredients.map((ingredient, index) => {
        const scaledQty = ingredient.quantity * ratio;
        return (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: static list with no reordering
            key={index}
            className="flex items-center justify-between px-4 py-2.5 text-sm"
          >
            <span className="text-gray-700">{ingredient.name}</span>
            <span className="font-medium text-amber-700">
              {formatQuantity(scaledQty)}
              {ingredient.unit ? ` ${ingredient.unit}` : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
