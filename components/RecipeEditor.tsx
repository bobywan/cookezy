"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  envoyerImageRecette,
  modifierRecette,
  oublierImageRecette,
} from "@/app/actions/modifier-recette";
import { RecipeImage } from "@/components/RecipeImage";
import type { Recipe } from "@/lib/types";

type DraftIngredient = { quantity: string; unit: string; name: string };

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

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
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
        <Field label="Adresse d'origine">
          <input
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            className={inputCls}
          />
        </Field>
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
