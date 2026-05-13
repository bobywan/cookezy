import Image from "next/image";
import Link from "next/link";
import type { Recipe } from "@/lib/types";

type Props = {
  recipe: Recipe;
};

const difficultyColor: Record<Recipe["difficulty"], string> = {
  facile: "bg-green-100 text-green-800",
  moyen: "bg-yellow-100 text-yellow-800",
  difficile: "bg-red-100 text-red-800",
};

const categoryColor: Record<Recipe["category"], string> = {
  entrée: "bg-accent-100 text-accent-600",
  plat: "bg-brand-100 text-brand-700",
  dessert: "bg-accent-100 text-accent-600",
  snack: "bg-brand-100 text-brand-700",
};

export default function RecipeCard({ recipe }: Props) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <Link
      href={`/recettes/${recipe.slug}`}
      className="group flex touch-manipulation flex-col overflow-hidden rounded-[--radius-card] border border-neutral-200 bg-white shadow-[--shadow-card] transition-[box-shadow,transform] active:scale-[0.99] hover:shadow-md md:active:scale-100"
    >
      <div className="relative aspect-[5/4] w-full overflow-hidden md:aspect-auto md:h-48 xl:h-52">
        <Image
          src={recipe.image}
          alt={recipe.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4 md:gap-3 md:p-5">
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-[--radius-badge] px-2.5 py-0.5 text-xs font-medium ${categoryColor[recipe.category]}`}
          >
            {recipe.category}
          </span>
          <span
            className={`rounded-[--radius-badge] px-2.5 py-0.5 text-xs font-medium ${difficultyColor[recipe.difficulty]}`}
          >
            {recipe.difficulty}
          </span>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-neutral-900 transition-colors group-hover:text-brand-600 md:text-lg">
            {recipe.title}
          </h2>
          <p className="mt-1 line-clamp-2 text-sm text-neutral-500 md:line-clamp-3">
            {recipe.description}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-4 text-sm text-neutral-500">
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {totalTime} min
          </span>
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {recipe.servings} pers.
          </span>
        </div>
      </div>
    </Link>
  );
}
