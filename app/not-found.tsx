import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-brand-50 px-safe py-12 text-center">
      <div className="max-w-md space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">404</p>
        <h1 className="font-display text-2xl font-bold text-neutral-900">Recette introuvable</h1>
        <p className="text-sm text-neutral-600">
          Cette page n’existe pas ou la recette a été déplacée. Retournez au carnet pour continuer.
        </p>
      </div>
      <Link
        href="/"
        className="min-h-11 inline-flex touch-manipulation items-center justify-center rounded-[--radius-card] border border-brand-600 bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 active:bg-brand-800"
      >
        Toutes les recettes
      </Link>
    </main>
  );
}
