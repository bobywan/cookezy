import Link from "next/link";
import Image from "next/image";
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
  entrée: "bg-purple-100 text-purple-800",
  plat: "bg-blue-100 text-blue-800",
  dessert: "bg-pink-100 text-pink-800",
  snack: "bg-orange-100 text-orange-800",
};

export default function RecipeCard({ recipe }: Props) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <Link
      href={`/recettes/${recipe.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={recipe.image}
          alt={recipe.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor[recipe.category]}`}
          >
            {recipe.category}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColor[recipe.difficulty]}`}
          >
            {recipe.difficulty}
          </span>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
            {recipe.title}
          </h2>
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
            {recipe.description}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-4 text-sm text-gray-500">
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
