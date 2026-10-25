import Logo from "@/components/Logo";

export function RecipesUnavailable() {
  return (
    <main className="flex min-h-dvh flex-col items-center bg-brand-50 px-safe pt-safe pb-safe text-center">
      <h1 className="pt-6">
        <Logo className="mx-auto w-40 text-brand-700 md:w-44" />
        <span className="sr-only">Cookezy</span>
      </h1>
      <p className="mt-8 max-w-md text-sm text-neutral-600">
        Les recettes sont indisponibles pour le moment.
      </p>
    </main>
  );
}
