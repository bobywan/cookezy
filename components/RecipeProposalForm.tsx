"use client";

import { useState } from "react";
import { type DemandeState, envoyerDemande } from "@/app/actions/demandes";
import { AiKeySettings } from "@/components/AiKeySettings";
import { draftRecipe } from "@/lib/ai/draft-recipe";
import type { AiSettings } from "@/lib/ai/settings";
import { type FieldError, parseRecipeFields } from "@/lib/recipe-fields";
import type { Recipe } from "@/lib/types";

type Mode = "url" | "full";
type Ingredient = { quantity: string; unit: string; name: string };

const initialState: DemandeState = { status: "idle", message: "" };
const emptySettings: AiSettings = { provider: "gemini", apiKey: "" };

export default function RecipeProposalForm() {
  const [mode, setMode] = useState<Mode>("url");
  const [settings, setSettings] = useState<AiSettings>(emptySettings);
  const [url, setUrl] = useState("");
  const [brief, setBrief] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("plat");
  const [difficulty, setDifficulty] = useState("moyen");
  const [prepTime, setPrepTime] = useState("15");
  const [cookTime, setCookTime] = useState("30");
  const [servings, setServings] = useState("4");
  const [tags, setTags] = useState("");
  const [image, setImage] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { quantity: "", unit: "", name: "" },
  ]);
  const [steps, setSteps] = useState<string[]>(["", "", ""]);
  const [aiPending, setAiPending] = useState(false);
  const [aiError, setAiError] = useState("");
  const [requestState, setRequestState] = useState<DemandeState>(initialState);

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

  const applyRecipe = (recipe: Recipe) => {
    setTitle(recipe.title);
    setDescription(recipe.description);
    setCategory(recipe.category);
    setDifficulty(recipe.difficulty);
    setPrepTime(String(recipe.prepTime));
    setCookTime(String(recipe.cookTime));
    setServings(String(recipe.servings));
    setTags(recipe.tags.join(", "));
    setImage(recipe.image);
    setIngredients(
      recipe.ingredients.length > 0
        ? recipe.ingredients.map((item) => ({
            quantity: String(item.quantity),
            unit: item.unit,
            name: item.name,
          }))
        : [{ quantity: "", unit: "", name: "" }],
    );
    setSteps(recipe.steps.length > 0 ? recipe.steps : [""]);
    setMode("full");
  };

  const runDraft = async (source: string) => {
    if (!settings.apiKey.trim()) {
      setAiError("Enregistre d'abord la clé de ton service d'IA.");
      return;
    }
    setAiPending(true);
    setAiError("");
    try {
      const result = await draftRecipe(settings.provider, settings.apiKey.trim(), source);
      if (!result.ok) {
        setAiError(result.errors.map((error) => error.message).join(" "));
        return;
      }
      applyRecipe(result.recipe);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "L'aide IA a échoué.");
    } finally {
      setAiPending(false);
    }
  };

  const prepareFromUrl = async () => {
    if (!url.trim()) {
      setAiError("L'URL est requise.");
      return;
    }
    setAiPending(true);
    setAiError("");
    try {
      const response = await fetch("/api/extraire-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await response.json()) as { ok: boolean; text?: string; message?: string };
      if (!response.ok || !data.ok || !data.text) {
        setAiError(data.message ?? "La page n'a pas pu être lue.");
        return;
      }
      await runDraft(
        `Voici le texte d'une page de recette. Transforme-le en recette Cookezy.\n\n${data.text}`,
      );
    } catch {
      setAiError("La page n'a pas pu être lue.");
    } finally {
      setAiPending(false);
    }
  };

  const completeFromForm = () => {
    const current = {
      title,
      description,
      category,
      difficulty,
      prepTime: Number(prepTime),
      cookTime: Number(cookTime),
      servings: Number(servings),
      ingredients: ingredients
        .filter((item) => item.name.trim())
        .map((item) => ({
          quantity: Number(item.quantity) || 0,
          unit: item.unit,
          name: item.name,
        })),
      steps: steps.filter((step) => step.trim()),
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
    const note = brief.trim() ? `Description de la personne : ${brief.trim()}\n` : "";
    return runDraft(`${note}Complète ou corrige cette recette :\n${JSON.stringify(current)}`);
  };

  const sendRequest = async (trap: string) => {
    if (mode !== "full") {
      setRequestState({
        status: "error",
        message: "Prépare d'abord la recette, ou passe en recette complète.",
      });
      return;
    }
    const parsed = parseRecipeFields({
      title,
      description,
      category,
      difficulty,
      prepTime: Number(prepTime),
      cookTime: Number(cookTime),
      servings: Number(servings),
      image,
      ingredients: ingredients
        .filter((item) => item.name.trim())
        .map((item) => ({
          quantity: Number(item.quantity) || 0,
          unit: item.unit,
          name: item.name,
        })),
      steps,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    if (!parsed.ok) {
      setRequestState({ status: "error", message: formatErrors(parsed.errors) });
      return;
    }
    setAiPending(true);
    setRequestState(initialState);
    try {
      setRequestState(await envoyerDemande(parsed.recipe, trap));
    } catch {
      setRequestState({ status: "error", message: "La demande n'a pas pu être envoyée." });
    } finally {
      setAiPending(false);
    }
  };

  if (requestState.status === "success") {
    return (
      <div className="rounded-[--radius-card] border border-green-200 bg-green-50 px-6 py-10 text-center">
        <p className="text-2xl">✅</p>
        <p className="mt-3 font-semibold text-neutral-900">{requestState.message}</p>
        <p className="mt-1 text-sm text-neutral-500">
          La recette sera examinée et ajoutée prochainement.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AiKeySettings onChange={setSettings} />
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

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void sendRequest(String(data.get("_trap") ?? ""));
        }}
      >
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
              Colle l&apos;URL d&apos;une recette. L&apos;IA la prépare dans le formulaire, que tu
              peux corriger avant de l&apos;envoyer.
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
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://exemple.com/ma-recette"
                className="w-full rounded-[--radius-card] border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
            <button
              type="button"
              onClick={prepareFromUrl}
              disabled={aiPending}
              className="rounded-[--radius-card] bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {aiPending ? "Préparation…" : "Préparer avec l'IA"}
            </button>
          </div>
        ) : (
          /* ── Mode recette complète ── */
          <div className="space-y-5">
            <Section title="Aide de l'IA">
              <Field label="Décris la recette, ou laisse l'IA compléter les champs déjà remplis">
                <textarea
                  value={brief}
                  onChange={(event) => setBrief(event.target.value)}
                  rows={3}
                  placeholder="Une tarte aux pommes pour 6, pâte brisée et pommes fondantes…"
                  className={inputCls}
                />
              </Field>
              <button
                type="button"
                onClick={completeFromForm}
                disabled={aiPending}
                className="rounded-[--radius-card] bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {aiPending ? "Préparation…" : "Compléter avec l'IA"}
              </button>
            </Section>
            {/* Infos de base */}
            <Section title="Informations générales">
              <Field label="Titre de la recette" required>
                <input
                  name="title"
                  type="text"
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex : Tarte aux pommes caramélisées"
                  className={inputCls}
                />
              </Field>
              <Field label="Description courte">
                <textarea
                  name="description"
                  rows={2}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Une ou deux phrases qui donnent envie..."
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Field label="Catégorie">
                  <select
                    name="category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className={inputCls}
                  >
                    <option value="plat">Plat</option>
                    <option value="entrée">Entrée</option>
                    <option value="dessert">Dessert</option>
                    <option value="snack">Snack</option>
                  </select>
                </Field>
                <Field label="Difficulté">
                  <select
                    name="difficulty"
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value)}
                    className={inputCls}
                  >
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
                    value={prepTime}
                    onChange={(event) => setPrepTime(event.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Cuisson (min)">
                  <input
                    name="cookTime"
                    type="number"
                    min={0}
                    value={cookTime}
                    onChange={(event) => setCookTime(event.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Nombre de portions" className="w-32">
                <input
                  name="servings"
                  type="number"
                  min={1}
                  value={servings}
                  onChange={(event) => setServings(event.target.value)}
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
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="végétarien, rapide, automne"
                  className={inputCls}
                />
              </Field>
            </Section>
          </div>
        )}

        {aiError && (
          <p
            role="alert"
            className="rounded-[--radius-card] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {aiError}
          </p>
        )}
        {requestState.status === "error" && (
          <p
            role="alert"
            className="rounded-[--radius-card] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {requestState.message}
          </p>
        )}

        {mode === "full" && (
          <button
            type="submit"
            disabled={aiPending}
            className="min-h-11 w-full rounded-[--radius-card] bg-brand-600 px-6 py-3 font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {aiPending ? "Envoi en cours…" : "Envoyer la demande"}
          </button>
        )}
      </form>
    </div>
  );
}

/* ── Helpers ── */

function formatErrors(errors: FieldError[]): string {
  return errors.map((error) => error.message).join(" ");
}

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
