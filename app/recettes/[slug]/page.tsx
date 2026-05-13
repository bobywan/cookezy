import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import RecipeScaledSections from "@/components/RecipeScaledSections";
import RecipeShareActions from "@/components/RecipeShareActions";
import { categoryBadgeClass, difficultyBadgeClass } from "@/lib/recipe-badges";
import { getRecipeBySlug, recipes } from "@/lib/recipes";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return recipes.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) return {};
  return {
    title: `${recipe.title} — Cookezy`,
    description: recipe.description,
  };
}

export default async function RecipePage({ params }: Props) {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);

  if (!recipe) notFound();

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="min-h-dvh bg-brand-50 pb-safe print:bg-white print:pb-0">
      <header className="top-0 z-20 px-safe pt-safe pb-3 print:hidden md:static md:px-6 md:py-4">
        <Link
          href="/"
          className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-[--radius-badge] py-2 pr-2 text-sm font-medium text-brand-700 touch-manipulation hover:bg-brand-50 hover:text-brand-800 active:bg-brand-100 md:min-h-0 md:min-w-0 md:p-0 md:hover:bg-transparent"
        >
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
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Toutes les recettes
        </Link>
      </header>

      <article className="recipe-print-root mx-auto max-w-3xl px-safe pt-5 pb-28 md:pt-10 md:pb-28 xl:max-w-4xl">
        <div className="relative mb-6 aspect-[4/3] w-full min-h-48 overflow-hidden rounded-[--radius-card] sm:min-h-56 md:mb-8 md:aspect-auto md:h-72 md:min-h-0 lg:h-80">
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 896px"
          />
        </div>

        <div className="mb-8">
          <div className="mb-3 flex flex-wrap gap-2">
            <span
              className={`rounded-[--radius-badge] px-2.5 py-0.5 text-xs font-medium ${categoryBadgeClass[recipe.category]}`}
            >
              {recipe.category}
            </span>
            <span
              className={`rounded-[--radius-badge] px-2.5 py-0.5 text-xs font-medium ${difficultyBadgeClass[recipe.difficulty]}`}
            >
              {recipe.difficulty}
            </span>
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-[--radius-badge] bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600"
              >
                #{tag}
              </span>
            ))}
          </div>

          <h1 className="font-display text-2xl font-bold leading-tight text-neutral-900 sm:text-3xl lg:text-4xl">
            {recipe.title}
          </h1>
          <p className="mt-2 text-base text-neutral-500 md:mt-3 md:text-lg">{recipe.description}</p>

          <RecipeShareActions title={recipe.title} description={recipe.description} />

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-neutral-600 md:mt-5 md:gap-6">
            <div className="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-brand-500"
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
              <span>Préparation : {recipe.prepTime} min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-brand-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>Cuisson : {recipe.cookTime} min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-brand-500"
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
              <span>Temps total : {totalTime} min</span>
            </div>
          </div>
        </div>

        <RecipeScaledSections
          baseServings={recipe.servings}
          ingredients={recipe.ingredients}
          title={recipe.title}
          steps={recipe.steps}
        />
      </article>
    </div>
  );
}
