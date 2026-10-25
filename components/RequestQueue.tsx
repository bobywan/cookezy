"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ajouterDemande, supprimerDemande } from "@/app/actions/demandes";
import { categoryBadgeClass } from "@/lib/recipe-badges";
import type { RecipeRequest } from "@/lib/recipe-requests";

type Props = {
  requests: RecipeRequest[];
};

export function RequestQueue({ requests }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const run = async (id: string, action: "add" | "delete") => {
    setPendingId(id);
    setErrors((prev) => ({ ...prev, [id]: "" }));
    const result = action === "add" ? await ajouterDemande(id) : await supprimerDemande(id);
    setPendingId(null);
    if (result.status === "error") {
      setErrors((prev) => ({ ...prev, [id]: result.message }));
      return;
    }
    router.refresh();
  };

  if (requests.length === 0) {
    return <p className="mt-8 text-center text-sm text-neutral-500">Aucune demande en attente.</p>;
  }

  return (
    <ul className="mt-6 space-y-4">
      {requests.map((request) => {
        const date = new Date(request.createdAt).toLocaleDateString("fr-FR", { dateStyle: "long" });
        return (
          <li
            key={request.id}
            className="space-y-4 rounded-[--radius-card] border border-neutral-200 bg-white p-5 shadow-[--shadow-card]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-[--radius-badge] px-2.5 py-0.5 text-xs font-medium ${categoryBadgeClass[request.recipe.category]}`}
              >
                {request.recipe.category}
              </span>
              <span className="text-xs text-neutral-400">{date}</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-neutral-900">
              {request.recipe.title}
            </h2>
            <p className="text-sm text-neutral-600">{request.recipe.description}</p>
            <div>
              <h3 className="text-sm font-medium text-neutral-700">Ingrédients</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                {request.recipe.ingredients.map((item) => (
                  <li key={`${item.name}-${item.quantity}-${item.unit}`}>
                    {[item.quantity, item.unit, item.name].filter(Boolean).join(" ")}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-neutral-700">Étapes</h3>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-neutral-700">
                {request.recipe.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
            {errors[request.id] && (
              <p role="alert" className="text-sm text-red-700">
                {errors[request.id]}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={pendingId === request.id}
                onClick={() => run(request.id, "add")}
                className="min-h-11 flex-1 rounded-[--radius-card] bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              >
                Ajouter
              </button>
              <button
                type="button"
                disabled={pendingId === request.id}
                onClick={() => run(request.id, "delete")}
                className="min-h-11 flex-1 rounded-[--radius-card] border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
              >
                Supprimer
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
