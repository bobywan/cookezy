import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import RecipeProposalForm from "@/components/RecipeProposalForm";

export const metadata: Metadata = {
  title: "Proposer une recette — Cookezy",
  description:
    "Prépare une recette avec ton IA, depuis une URL ou une description, puis envoie-la en demande.",
};

export default function ProposerRecettePage() {
  return (
    <main className="min-h-dvh bg-brand-50 pb-safe">
      <header className="px-safe pt-safe pb-4 text-center md:pb-5">
        <Link href="/" aria-label="Retour à l'accueil">
          <Logo className="mx-auto w-32 text-brand-700 md:w-36" />
        </Link>
      </header>

      <div className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800"
          >
            <span aria-hidden>←</span> Retour aux recettes
          </Link>
          <h1 className="mt-4 font-display text-3xl font-bold text-brand-700">
            Proposer une recette
          </h1>
          <p className="mt-2 text-neutral-500">
            Colle une URL ou décris la recette : ton IA la prépare. Tu l&apos;envoies ensuite en
            demande.
          </p>
        </div>

        <RecipeProposalForm />
      </div>
    </main>
  );
}
