"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { importerImage } from "@/app/actions/images";
import {
  envoyerImageRecette,
  modifierRecette,
  oublierImageRecette,
} from "@/app/actions/modifier-recette";
import { AiKeySettings } from "@/components/AiKeySettings";
import { RecipeImage } from "@/components/RecipeImage";
import { draftRecipe } from "@/lib/ai/draft-recipe";
import { type AiSettings, activeApiKey } from "@/lib/ai/settings";
import type { Recipe } from "@/lib/types";

type DraftIngredient = { quantity: string; unit: string; name: string };
type Phase = "lecture" | "ia";
type ImageOffer = {
  id: string;
  previewUrl: string;
  choice: "pending" | "accepted" | "declined";
};

const phaseLabel: Record<Phase, string> = {
  lecture: "Lecture de la page…",
  ia: "L'IA prépare la recette…",
};

const inputCls =
  "w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300";

const categories = ["entrée", "plat", "dessert", "snack"] as const;
const difficulties = ["facile", "moyen", "difficile"] as const;

function draftIngredients(recipe: Recipe): DraftIngredient[] {
  if (recipe.ingredients.length === 0) return [{ quantity: "", unit: "", name: "" }];
  return recipe.ingredients.map((item) => ({
    quantity: String(item.quantity),
    unit: item.unit,
    name: item.name,
  }));
}

export function RecipeEditor({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(recipe.title);
  const [description, setDescription] = useState(recipe.description);
  const [category, setCategory] = useState<Recipe["category"]>(recipe.category);
  const [difficulty, setDifficulty] = useState<Recipe["difficulty"]>(recipe.difficulty);
  const [prepTime, setPrepTime] = useState(String(recipe.prepTime));
  const [cookTime, setCookTime] = useState(String(recipe.cookTime));
  const [servings, setServings] = useState(String(recipe.servings));
  const [image, setImage] = useState(recipe.image);
  const [sourceUrl, setSourceUrl] = useState(recipe.sourceUrl);
  const [tags, setTags] = useState(recipe.tags.join(", "));
  const [ingredients, setIngredients] = useState<DraftIngredient[]>(() => draftIngredients(recipe));
  const [steps, setSteps] = useState<string[]>(recipe.steps.length > 0 ? recipe.steps : [""]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const [imageMessage, setImageMessage] = useState("");
  const [imageBusy, setImageBusy] = useState(false);
  const [settings, setSettings] = useState<AiSettings>({ provider: "gemini", keys: {} });
  const [phase, setPhase] = useState<Phase | null>(null);
  const [aiError, setAiError] = useState("");
  const [pageText, setPageText] = useState("");
  const [offer, setOffer] = useState<ImageOffer | null>(null);
  const [previewBroken, setPreviewBroken] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const chooseImage = async (file: File | undefined) => {
    if (!file) return;
    setImageBusy(true);
    setImageMessage("");
    const body = new FormData();
    body.set("image", file);
    if (image !== recipe.image) body.set("previous", image);
    const result = await envoyerImageRecette(body);
    setImageBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!result.ok) {
      setImageMessage(result.message);
      return;
    }
    setImage(result.path);
  };

  const applyDraft = (next: Recipe) => {
    setTitle(next.title);
    setDescription(next.description);
    setCategory(next.category);
    setDifficulty(next.difficulty);
    setPrepTime(String(next.prepTime));
    setCookTime(String(next.cookTime));
    setServings(String(next.servings));
    setTags(next.tags.join(", "));
    setIngredients(draftIngredients(next));
    setSteps(next.steps.length > 0 ? next.steps : [""]);
  };

  const draftIntoForm = async (source: string): Promise<boolean> => {
    const key = activeApiKey(settings);
    if (!key) {
      setAiError("Enregistre d'abord la clé de ton service d'IA.");
      return false;
    }
    try {
      const result = await draftRecipe(settings.provider, key, source);
      if (!result.ok) {
        setAiError(result.errors.map((item) => item.message).join(" "));
        return false;
      }
      applyDraft(result.recipe);
      return true;
    } catch (caught) {
      setAiError(caught instanceof Error ? caught.message : "L'aide IA a échoué.");
      return false;
    }
  };

  const prepareFromPage = async () => {
    const page = sourceUrl.trim();
    if (!page) {
      setAiError("L'URL est requise.");
      return;
    }
    if (!activeApiKey(settings)) {
      setAiError("Enregistre d'abord la clé de ton service d'IA.");
      return;
    }
    setPhase("lecture");
    setAiError("");
    setOffer(null);
    setPreviewBroken(false);
    setPageText("");
    try {
      const response = await fetch("/api/extraire-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: page }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        text?: string;
        message?: string;
        imageId?: string;
        imageUrl?: string;
      };
      if (!response.ok || !data.ok || !data.text) {
        setAiError(data.message ?? "La page n'a pas pu être lue.");
        return;
      }
      const pendingOffer: ImageOffer | null =
        data.imageId && data.imageUrl
          ? { id: data.imageId, previewUrl: data.imageUrl, choice: "pending" }
          : null;
      setPhase("ia");
      const ready = await draftIntoForm(
        `Voici le texte d'une page de recette. Transforme-le en recette Cookezy.\n\n${data.text}`,
      );
      if (!ready) return;
      setSourceUrl(page);
      setPageText(data.text);
      if (pendingOffer) setOffer(pendingOffer);
    } catch {
      setAiError("La page n'a pas pu être lue.");
    } finally {
      setPhase(null);
    }
  };

  const rereadWithAi = async () => {
    if (!pageText.trim()) return;
    if (!activeApiKey(settings)) {
      setAiError("Enregistre d'abord la clé de ton service d'IA.");
      return;
    }
    setPhase("ia");
    setAiError("");
    try {
      await draftIntoForm(
        `Voici le texte d'une page de recette. Transforme-le en recette Cookezy.\n\n${pageText}`,
      );
    } finally {
      setPhase(null);
    }
  };

  const acceptPageImage = async () => {
    if (!offer) return;
    setImageBusy(true);
    setImageMessage("");
    try {
      const result = await importerImage(offer.id);
      if (!result.ok) {
        setImageMessage(result.message);
        return;
      }
      if (image !== recipe.image && image !== result.path) void oublierImageRecette(image);
      setImage(result.path);
      setPreviewBroken(false);
      setOffer({ id: offer.id, previewUrl: result.path, choice: "accepted" });
    } catch {
      setImageMessage("L'image n'a pas pu être enregistrée.");
    } finally {
      setImageBusy(false);
    }
  };

  const save = async () => {
    setPending(true);
    setMessage("");
    setError(false);
    const result = await modifierRecette(recipe.slug, {
      id: recipe.id,
      slug: recipe.slug,
      title,
      description,
      category,
      difficulty,
      prepTime: Number(prepTime),
      cookTime: Number(cookTime),
      servings: Number(servings),
      image,
      sourceUrl,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      ingredients: ingredients
        .filter((item) => item.name.trim())
        .map((item) => ({
          quantity: Number(item.quantity) || 0,
          unit: item.unit,
          name: item.name,
        })),
      steps: steps.filter((step) => step.trim()),
    });
    setPending(false);
    setError(result.status === "error");
    setMessage(result.message);
    if (result.status === "success") {
      setOpen(false);
      router.refresh();
    }
  };

  if (!open) {
    return (
      <div className="space-y-3">
        {message && <p className="text-sm text-neutral-700">{message}</p>}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-11 rounded-[--radius-card] bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
        >
          Modifier
        </button>
      </div>
    );
  }

  if (phase) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="flex flex-col items-center gap-4 rounded-[--radius-card] border border-brand-100 bg-white px-6 py-16 text-center shadow-[--shadow-card]"
      >
        <Spinner large />
        <p className="text-base font-medium text-neutral-700">{phaseLabel[phase]}</p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <AiKeySettings onChange={setSettings} />
      <Section title="Mettre à jour depuis une page">
        <Field label="Adresse de la page">
          <input
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            placeholder="https://"
            className={inputCls}
          />
        </Field>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void prepareFromPage()}
            disabled={imageBusy || pending}
            className="min-h-11 rounded-[--radius-card] bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            Mettre à jour avec l&apos;IA
          </button>
          {pageText && (
            <button
              type="button"
              onClick={() => void rereadWithAi()}
              disabled={imageBusy || pending}
              className="min-h-11 rounded-[--radius-card] border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 disabled:opacity-60"
            >
              Relire avec l&apos;IA
            </button>
          )}
        </div>
        {aiError && (
          <p role="alert" className="text-sm text-red-700">
            {aiError}
          </p>
        )}
      </Section>
      {offer && (
        <PageImageChoice
          offer={offer}
          busy={imageBusy}
          broken={previewBroken}
          error={imageMessage}
          onAccept={() => void acceptPageImage()}
          onDecline={() => setOffer({ ...offer, choice: "declined" })}
          onBroken={() => setPreviewBroken(true)}
        />
      )}
      <Section title="Informations">
        <Field label="Titre" required>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Description" required>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className={inputCls}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Catégorie">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as Recipe["category"])}
              className={inputCls}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Difficulté">
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as Recipe["difficulty"])}
              className={inputCls}
            >
              {difficulties.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Préparation (min)">
            <input
              type="number"
              min={0}
              value={prepTime}
              onChange={(event) => setPrepTime(event.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Cuisson (min)">
            <input
              type="number"
              min={0}
              value={cookTime}
              onChange={(event) => setCookTime(event.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Portions">
            <input
              type="number"
              min={1}
              value={servings}
              onChange={(event) => setServings(event.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-neutral-700">Photo</p>
          {image.trim() ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-[--radius-card]">
              <RecipeImage
                src={image.trim()}
                alt={title || "Photo"}
                sizes="(max-width: 768px) 100vw, 640px"
              />
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Aucune photo.</p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => {
              void chooseImage(event.target.files?.[0]);
            }}
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={imageBusy || pending}
              className="min-h-11 rounded-[--radius-card] bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {imageBusy
                ? "Envoi de la photo…"
                : image.trim()
                  ? "Changer la photo"
                  : "Ajouter une photo"}
            </button>
            {image.trim() && (
              <button
                type="button"
                onClick={() => {
                  if (image !== recipe.image) void oublierImageRecette(image);
                  setImage("");
                  setImageMessage("");
                }}
                disabled={imageBusy || pending}
                className="min-h-11 rounded-[--radius-card] border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 disabled:opacity-60"
              >
                Retirer la photo
              </button>
            )}
          </div>
          {imageMessage && (
            <p role="alert" className="text-sm text-red-700">
              {imageMessage}
            </p>
          )}
        </div>
      </Section>

      <Section title="Ingrédients">
        <div className="space-y-2">
          {ingredients.map((item, index) => (
            <div
              key={`ingredient-${
                // biome-ignore lint/suspicious/noArrayIndexKey: ordre saisi par l'admin
                index
              }`}
              className="grid grid-cols-[5rem_5rem_1fr_auto] gap-2"
            >
              <input
                value={item.quantity}
                onChange={(event) => updateIngredient(index, "quantity", event.target.value)}
                aria-label={`Quantité ${index + 1}`}
                className={inputCls}
              />
              <input
                value={item.unit}
                onChange={(event) => updateIngredient(index, "unit", event.target.value)}
                aria-label={`Unité ${index + 1}`}
                className={inputCls}
              />
              <input
                value={item.name}
                onChange={(event) => updateIngredient(index, "name", event.target.value)}
                aria-label={`Ingrédient ${index + 1}`}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                disabled={ingredients.length === 1}
                className="min-h-11 px-2 text-sm text-neutral-600 disabled:opacity-30"
                aria-label={`Supprimer ingrédient ${index + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setIngredients((current) => [...current, { quantity: "", unit: "", name: "" }])
          }
          className="text-sm font-medium text-brand-600 hover:text-brand-800"
        >
          + Ajouter un ingrédient
        </button>
      </Section>

      <Section title="Étapes">
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={`step-${
                // biome-ignore lint/suspicious/noArrayIndexKey: ordre saisi par l'admin
                index
              }`}
              className="flex items-start gap-3"
            >
              <span className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[50%] bg-brand-500 text-xs font-semibold text-white">
                {index + 1}
              </span>
              <textarea
                value={step}
                onChange={(event) => updateStep(index, event.target.value)}
                rows={2}
                aria-label={`Étape ${index + 1}`}
                className={`${inputCls} flex-1`}
              />
              <button
                type="button"
                onClick={() => removeStep(index)}
                disabled={steps.length === 1}
                className="mt-2 min-h-11 px-2 text-sm text-neutral-600 disabled:opacity-30"
                aria-label={`Supprimer étape ${index + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSteps((current) => [...current, ""])}
          className="text-sm font-medium text-brand-600 hover:text-brand-800"
        >
          + Ajouter une étape
        </button>
      </Section>

      <Section title="Tags">
        <Field label="Mots-clés (séparés par des virgules)">
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className={inputCls}
          />
        </Field>
      </Section>

      {message && (
        <p
          role={error ? "alert" : "status"}
          className={`text-sm ${error ? "text-red-700" : "text-neutral-700"}`}
        >
          {message}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending || imageBusy}
          className="min-h-11 rounded-[--radius-card] bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-11 rounded-[--radius-card] border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700"
        >
          Fermer
        </button>
      </div>
    </form>
  );

  function updateIngredient(index: number, key: keyof DraftIngredient, value: string) {
    setIngredients((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    );
  }

  function removeIngredient(index: number) {
    setIngredients((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateStep(index: number, value: string) {
    setSteps((current) => current.map((step, stepIndex) => (stepIndex === index ? value : step)));
  }

  function removeStep(index: number) {
    setSteps((current) => current.filter((_, stepIndex) => stepIndex !== index));
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-[--radius-card] border border-neutral-200 bg-white p-6 shadow-[--shadow-card]">
      <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* biome-ignore lint/a11y/noLabelWithoutControl: le champ est passé en enfant */}
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

function Spinner({ large = false }: { large?: boolean }) {
  const size = large ? "h-8 w-8 border-[3px]" : "h-4 w-4 border-2";
  return (
    <span
      className={`inline-block shrink-0 animate-spin rounded-[50%] border-brand-100 border-t-brand-600 ${size}`}
      aria-hidden
    />
  );
}

function PageImageChoice({
  offer,
  busy,
  broken,
  error,
  onAccept,
  onDecline,
  onBroken,
}: {
  offer: ImageOffer;
  busy: boolean;
  broken: boolean;
  error: string;
  onAccept: () => void;
  onDecline: () => void;
  onBroken: () => void;
}) {
  const note =
    offer.choice === "accepted"
      ? "Cette photo remplacera celle de la recette après l'enregistrement."
      : offer.choice === "declined"
        ? "La photo actuelle est conservée."
        : "Tu peux l'utiliser comme photo de la recette.";

  return (
    <section
      aria-busy={busy}
      className="space-y-4 rounded-[--radius-card] border border-neutral-200 bg-white p-6 shadow-[--shadow-card]"
    >
      <h2 className="text-base font-semibold text-neutral-900">Image trouvée sur la page</h2>
      <p className="text-sm text-neutral-500">{note}</p>
      {broken ? (
        <p className="text-sm text-neutral-600">
          L&apos;aperçu n&apos;a pas pu s&apos;afficher. Tu peux quand même utiliser l&apos;image.
        </p>
      ) : (
        <div className="relative aspect-[4/3] overflow-hidden rounded-[--radius-card] bg-neutral-100">
          {/* biome-ignore lint/performance/noImgElement: l'aperçu vient de la page d'origine */}
          <img
            src={offer.previewUrl}
            alt="Aperçu de l'image trouvée"
            referrerPolicy="no-referrer"
            onError={onBroken}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      )}
      {busy && (
        <p role="status" className="flex items-center gap-2 text-sm font-medium text-neutral-700">
          <Spinner />
          Préparation de l&apos;image…
        </p>
      )}
      {error && offer.choice !== "declined" && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onAccept}
          disabled={busy || offer.choice === "accepted"}
          className="min-h-11 rounded-[--radius-card] bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Utiliser cette image
        </button>
        <button
          type="button"
          onClick={onDecline}
          disabled={busy || offer.choice === "declined"}
          className="min-h-11 rounded-[--radius-card] border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
        >
          Garder la photo actuelle
        </button>
      </div>
    </section>
  );
}
