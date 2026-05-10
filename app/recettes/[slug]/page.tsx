import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getRecipeBySlug, recipes } from "@/lib/recipes";
import ServingsScaler from "@/components/ServingsScaler";

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

const difficultyColor: Record<string, string> = {
  facile: "bg-green-100 text-green-800",
  moyen: "bg-yellow-100 text-yellow-800",
  difficile: "bg-red-100 text-red-800",
};

export default async function RecipePage({ params }: Props) {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);

  if (!recipe) notFound();

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="border-b border-amber-100 bg-white px-6 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-amber-700 hover:text-amber-900"
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

      <article className="mx-auto max-w-3xl px-4 py-10">
        {/* Hero image */}
        <div className="relative mb-8 h-64 w-full overflow-hidden rounded-2xl sm:h-80">
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>

        {/* Title & meta */}
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              {recipe.category}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColor[recipe.difficulty]}`}
            >
              {recipe.difficulty}
            </span>
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            {recipe.title}
          </h1>
          <p className="mt-3 text-gray-500">{recipe.description}</p>

          <div className="mt-5 flex flex-wrap gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-amber-500"
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
                className="h-4 w-4 text-amber-500"
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
                className="h-4 w-4 text-amber-500"
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

        <div className="grid gap-10 md:grid-cols-2">
          {/* Ingredients + scaler */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Ingrédients
            </h2>
            <ServingsScaler
              baseServings={recipe.servings}
              ingredients={recipe.ingredients}
            />
          </section>

          {/* Steps */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Préparation
            </h2>
            <ol className="space-y-4">
              {recipe.steps.map((step, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: ordered steps
                <li key={index} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-gray-700">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </article>
    </div>
  );
}
