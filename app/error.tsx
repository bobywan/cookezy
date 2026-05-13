"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-brand-50 px-safe py-12 text-center">
      <div className="max-w-md space-y-2">
        <h1 className="font-display text-2xl font-bold text-neutral-900">
          Une erreur est survenue
        </h1>
        <p className="text-sm text-neutral-600">
          Impossible d’afficher la page. Vous pouvez réessayer ou retourner à l’accueil.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="min-h-11 touch-manipulation rounded-[--radius-card] border border-brand-600 bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 active:bg-brand-800"
        >
          Réessayer
        </button>
        <a
          href="/"
          className="min-h-11 inline-flex touch-manipulation items-center justify-center rounded-[--radius-card] border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-brand-300 hover:bg-brand-50"
        >
          Toutes les recettes
        </a>
      </div>
    </main>
  );
}
