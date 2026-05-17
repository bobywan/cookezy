"use client";

import { useActionState, useState } from "react";
import type { ProposerState } from "@/app/actions/proposer";
import { proposerRecette } from "@/app/actions/proposer";

type Mode = "url" | "full";
type Ingredient = { quantity: string; unit: string; name: string };

const initialState: ProposerState = { status: "idle", message: "" };

export default function RecipeProposalForm() {
  const [state, formAction, pending] = useActionState(proposerRecette, initialState);
  const [mode, setMode] = useState<Mode>("url");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { quantity: "", unit: "", name: "" },
  ]);
  const [steps, setSteps] = useState<string[]>(["", "", ""]);

  const addIngredient = () =>
    setIngredients((prev) => [...prev, { quantity: "", unit: "", name: "" }]);
  const removeIngredient = (idx: number) =>
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  const updateIngredient = (idx: number, field: keyof Ingredient, value: string) =>
    setIngredients((prev) => prev.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing)));

  const addStep = () => setSteps((prev) => [...prev, ""]);
  const removeStep = (idx: number) => setSteps((prev) => prev.filter((_, i) => i !== idx));
  const updateStep = (idx: number, value: string) =>
    setSteps((prev) => prev.map((s, i) => (i === idx ? value : s)));

  if (state.status === "success") {
    return (
      <div className="rounded-[--radius-card] border border-green-200 bg-green-50 px-6 py-10 text-center">
        <p className="text-2xl">✅</p>
        <p className="mt-3 font-semibold text-neutral-900">{state.message}</p>
        <p className="mt-1 text-sm text-neutral-500">
          La recette sera examinée et ajoutée prochainement.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-2 rounded-[--radius-card] bg-white p-1 shadow-[--shadow-card] border border-neutral-200">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex-1 rounded-[calc(var(--radius-card)-4px)] px-4 py-2.5 text-sm font-medium transition-colors ${
            mode === "url"
              ? "bg-brand-100 text-brand-700"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Par URL
        </button>
        <button
          type="button"
          onClick={() => setMode("full")}
          className={`flex-1 rounded-[calc(var(--radius-card)-4px)] px-4 py-2.5 text-sm font-medium transition-colors ${
            mode === "full"
              ? "bg-brand-100 text-brand-700"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Recette complète
        </button>
      </div>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="mode" value={mode} />
        {/* Honeypot : champ piège invisible pour les humains */}
        <input
          type="text"
          name="_trap"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden opacity-0"
        />

        {mode === "url" ? (
          /* ── Mode URL ── */
          <div className="rounded-[--radius-card] bg-white border border-neutral-200 shadow-[--shadow-card] p-6 space-y-4">
            <p className="text-sm text-neutral-500">
              Colle l&apos;URL d&apos;une recette trouvée sur le web et elle sera ajoutée à la liste
              de révision.
            </p>
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-neutral-700 mb-1.5">
                URL de la recette
              </label>
              <input
                id="url"
                name="url"
                type="url"
                required
                placeholder="https://exemple.com/ma-recette"
                className="w-full rounded-[--radius-card] border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
          </div>
        ) : (
          /* ── Mode recette complète ── */
          <div className="space-y-5">
            {/* Infos de base */}
            <Section title="Informations générales">
              <Field label="Titre de la recette" required>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="Ex : Tarte aux pommes caramélisées"
                  className={inputCls}
                />
              </Field>
              <Field label="Description courte">
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Une ou deux phrases qui donnent envie..."
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Field label="Catégorie">
                  <select name="category" defaultValue="plat" className={inputCls}>
                    <option value="plat">Plat</option>
                    <option value="entrée">Entrée</option>
                    <option value="dessert">Dessert</option>
                    <option value="snack">Snack</option>
                  </select>
                </Field>
                <Field label="Difficulté">
                  <select name="difficulty" defaultValue="moyen" className={inputCls}>
                    <option value="facile">Facile</option>
                    <option value="moyen">Moyen</option>
                    <option value="difficile">Difficile</option>
                  </select>
                </Field>
                <Field label="Préparation (min)">
                  <input
                    name="prepTime"
                    type="number"
                    min={0}
                    defaultValue={15}
                    className={inputCls}
                  />
                </Field>
                <Field label="Cuisson (min)">
                  <input
                    name="cookTime"
                    type="number"
                    min={0}
                    defaultValue={30}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Nombre de portions" className="w-32">
                <input
                  name="servings"
                  type="number"
                  min={1}
                  defaultValue={4}
                  className={inputCls}
                />
              </Field>
            </Section>

            {/* Ingrédients */}
            <Section title="Ingrédients">
              <input type="hidden" name="ingredients" value={JSON.stringify(ingredients)} />
              <div className="space-y-2">
                {/* Header */}
                <div className="hidden grid-cols-[80px_100px_1fr_32px] gap-2 sm:grid">
                  <span className="text-xs font-medium text-neutral-400">Quantité</span>
                  <span className="text-xs font-medium text-neutral-400">Unité</span>
                  <span className="text-xs font-medium text-neutral-400">Ingrédient</span>
                </div>
                {ingredients.map((ing, idx) => (
                  <div
                    key={`ing-${
                      // biome-ignore lint/suspicious/noArrayIndexKey: ordre stable dans cet affichage
                      idx
                    }`}
                    className="grid grid-cols-[80px_100px_1fr_32px] items-center gap-2"
                  >
                    <input
                      type="text"
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(idx, "quantity", e.target.value)}
                      placeholder="200"
                      className={inputCls}
                      aria-label={`Quantité ingrédient ${idx + 1}`}
                    />
                    <input
                      type="text"
                      value={ing.unit}
                      onChange={(e) => updateIngredient(idx, "unit", e.target.value)}
                      placeholder="g"
                      className={inputCls}
                      aria-label={`Unité ingrédient ${idx + 1}`}
                    />
                    <input
                      type="text"
                      value={ing.name}
                      onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                      placeholder="farine"
                      className={inputCls}
                      aria-label={`Nom ingrédient ${idx + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(idx)}
                      disabled={ingredients.length === 1}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-30"
                      aria-label={`Supprimer ingrédient ${idx + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addIngredient}
                className="mt-1 text-sm font-medium text-brand-600 hover:text-brand-800"
              >
                + Ajouter un ingrédient
              </button>
            </Section>

            {/* Étapes */}
            <Section title="Étapes de préparation">
              <input type="hidden" name="steps" value={JSON.stringify(steps)} />
              <div className="space-y-2">
                {steps.map((step, idx) => (
                  <div
                    key={`step-${
                      // biome-ignore lint/suspicious/noArrayIndexKey: ordre stable dans cet affichage
                      idx
                    }`}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[50%] bg-brand-500 text-xs font-semibold text-white">
                      {idx + 1}
                    </span>
                    <textarea
                      value={step}
                      onChange={(e) => updateStep(idx, e.target.value)}
                      rows={2}
                      placeholder={`Étape ${idx + 1}...`}
                      className={`${inputCls} flex-1`}
                      aria-label={`Étape ${idx + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeStep(idx)}
                      disabled={steps.length === 1}
                      className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-30"
                      aria-label={`Supprimer étape ${idx + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addStep}
                className="mt-1 text-sm font-medium text-brand-600 hover:text-brand-800"
              >
                + Ajouter une étape
              </button>
            </Section>

            {/* Tags */}
            <Section title="Tags">
              <Field label="Mots-clés (séparés par des virgules)">
                <input
                  name="tags"
                  type="text"
                  placeholder="végétarien, rapide, automne"
                  className={inputCls}
                />
              </Field>
            </Section>
          </div>
        )}

        {/* Error */}
        {state.status === "error" && (
          <p
            role="alert"
            className="rounded-[--radius-card] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {state.message}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-[--radius-card] bg-brand-600 px-6 py-3 font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Envoi en cours…" : "Envoyer la proposition"}
        </button>
      </form>
    </div>
  );
}

/* ── Helpers ── */

const inputCls =
  "w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[--radius-card] bg-white border border-neutral-200 shadow-[--shadow-card] p-6 space-y-4">
      <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      {/* biome-ignore lint/a11y/noLabelWithoutControl: children contains the input */}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </span>
        {children}
      </label>
    </div>
  );
}
