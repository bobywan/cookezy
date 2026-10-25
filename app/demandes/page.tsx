import type { Metadata } from "next";
import Link from "next/link";
import { AdminLogin } from "@/components/AdminLogin";
import Logo from "@/components/Logo";
import { RequestQueue } from "@/components/RequestQueue";
import { isAdmin } from "@/lib/admin-session";
import { hasDatabase } from "@/lib/db";
import { listRecipeRequests } from "@/lib/recipe-requests";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demandes — Cookezy",
  description: "Examiner les demandes d'ajout de recettes.",
};

export default async function DemandesPage() {
  const allowed = await isAdmin();

  return (
    <main className="min-h-dvh bg-brand-50 px-safe pt-safe pb-safe">
      <header className="pb-4 text-center">
        <Link href="/" aria-label="Retour à l'accueil">
          <Logo className="mx-auto w-32 text-brand-700 md:w-36" />
        </Link>
      </header>
      <div className="mx-auto max-w-2xl pb-16">{allowed ? <Queue /> : <AdminLogin />}</div>
    </main>
  );
}

async function Queue() {
  if (!hasDatabase()) {
    return (
      <p className="mt-8 text-center text-sm text-neutral-600">
        Les demandes sont indisponibles pour le moment.
      </p>
    );
  }
  const requests = await listRecipeRequests();
  return (
    <>
      <h1 className="font-display text-3xl font-bold text-brand-700">Demandes</h1>
      <RequestQueue requests={requests} />
    </>
  );
}
