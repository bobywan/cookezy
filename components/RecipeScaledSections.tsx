"use client";

import { useState } from "react";
import RecipeCookMode from "@/components/RecipeCookMode";
import ServingsScaler from "@/components/ServingsScaler";
import type { Ingredient } from "@/lib/types";

type Props = {
  baseServings: number;
  ingredients: Ingredient[];
  title: string;
  steps: string[];
};

export default function RecipeScaledSections({ baseServings, ingredients, title, steps }: Props) {
  const [servings, setServings] = useState(baseServings);

  return (
    <div className="grid gap-8 md:gap-10 lg:grid-cols-2 lg:gap-12">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900 md:mb-4 md:text-xl">
          Ingrédients
        </h2>
        <ServingsScaler
          baseServings={baseServings}
          ingredients={ingredients}
          servings={servings}
          onServingsChange={setServings}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900 md:mb-4 md:text-xl">
          Préparation
        </h2>
        <div className="print:hidden">
          <RecipeCookMode
            title={title}
            steps={steps}
            ingredients={ingredients}
            baseServings={baseServings}
            servings={servings}
          />
        </div>
        <ol className="space-y-5 md:space-y-4">
          {steps.map((step, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: ordered steps
            <li key={index} className="flex gap-3.5 md:gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[--radius-badge] bg-brand-500 text-sm font-bold text-white md:h-8 md:w-8 md:text-sm">
                {index + 1}
              </span>
              <p className="text-base leading-relaxed text-neutral-700">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
