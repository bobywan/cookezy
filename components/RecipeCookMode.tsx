"use client";

import { type TouchEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import IngredientList from "@/components/IngredientList";
import type { Ingredient } from "@/lib/types";

type Props = {
  title: string;
  steps: string[];
  ingredients: Ingredient[];
  baseServings: number;
  servings: number;
};

const SWIPE_THRESHOLD_PX = 52;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.getAttribute("aria-hidden") === "true") return false;
    return el.offsetParent !== null || el.getClientRects().length > 0;
  });
}

export default function RecipeCookMode({
  title,
  steps,
  ingredients,
  baseServings,
  servings,
}: Props) {
  const total = steps.length;
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const titleId = useId();
  const ingredientsPanelId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const ratio = useMemo(() => servings / baseServings, [servings, baseServings]);

  const lastIndex = total > 0 ? total - 1 : 0;
  const isLast = stepIndex >= lastIndex;
  const isFirst = stepIndex <= 0;

  const closeMode = useCallback(() => {
    setShowIngredients(false);
    setOpen(false);
  }, []);

  const openMode = () => {
    setStepIndex(0);
    setShowIngredients(false);
    setOpen(true);
  };

  const goNext = useCallback(() => {
    setStepIndex((i) => {
      if (i < lastIndex) return i + 1;
      return i;
    });
  }, [lastIndex]);

  const goPrev = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const finishOrNext = useCallback(() => {
    if (isLast) {
      closeMode();
      return;
    }
    goNext();
  }, [closeMode, goNext, isLast]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMode();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = dialogRef.current;
      if (!panel) return;
      const focusable = getFocusableElements(panel);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeMode]);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
  }, [open]);

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    if (Math.abs(dx) <= Math.abs(dy)) return;
    if (dx < 0) {
      if (isLast) closeMode();
      else goNext();
    } else {
      goPrev();
    }
  };

  if (total === 0) {
    return null;
  }

  const progressPct = ((stepIndex + 1) / total) * 100;
  const currentStep = steps[stepIndex] ?? "";

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={openMode}
          className="fixed right-[max(1rem,env(safe-area-inset-right,0px))] bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-30 flex aspect-square h-14 w-14 shrink-0 touch-manipulation items-center justify-center rounded-[50%] border border-brand-600 bg-brand-600 text-white shadow-[--shadow-card] transition hover:bg-brand-700 hover:shadow-md active:bg-brand-800 md:h-16 md:w-16"
          aria-label="Lancer la recette — mode pas à pas"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 md:h-8 md:w-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50" role="presentation">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Fermer le mode pas à pas"
            className="absolute inset-0 bg-neutral-900/60"
            onClick={closeMode}
          />
          <div className="relative z-10 flex h-dvh w-full items-stretch justify-center md:items-center md:justify-center md:p-4">
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="flex h-full w-full max-w-2xl flex-col bg-brand-50 px-safe pt-safe pb-safe shadow-[--shadow-card] md:h-auto md:min-h-0 md:max-h-[min(90dvh,48rem)] md:rounded-[--radius-card] md:border md:border-neutral-200"
            >
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-brand-100 pb-3">
                <h2
                  id={titleId}
                  className="font-display text-lg font-bold leading-tight text-neutral-900 sm:text-xl"
                >
                  {title}
                </h2>
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={closeMode}
                  className="flex min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center rounded-[--radius-badge] border border-neutral-200 bg-white text-neutral-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-neutral-900"
                  aria-label="Fermer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              <p className="mt-2 shrink-0 text-xs text-neutral-500 sm:text-sm">
                Étape {stepIndex + 1} sur {total} — glissez horizontalement sur l’étape pour avancer
                ou revenir
              </p>

              <div className="mt-2 h-1.5 shrink-0 overflow-hidden rounded-[--radius-badge] bg-brand-200">
                <div
                  className="h-full rounded-[--radius-badge] bg-brand-500 transition-[width] duration-200 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <button
                type="button"
                aria-expanded={showIngredients}
                aria-controls={ingredientsPanelId}
                onClick={() => setShowIngredients((v) => !v)}
                className="mt-3 flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-[--radius-card] border border-neutral-200 bg-white px-3 text-sm font-semibold text-brand-700 shadow-[--shadow-card] transition hover:border-brand-300 hover:bg-brand-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 shrink-0 text-brand-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 2v7c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V2" />
                  <path d="M7 2v20" />
                  <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                </svg>
                {showIngredients ? "Masquer les ingrédients" : "Voir les ingrédients"}
              </button>

              <div
                id={ingredientsPanelId}
                hidden={!showIngredients}
                className="mt-2 flex max-h-[min(40vh,18rem)] shrink-0 flex-col overflow-hidden rounded-[--radius-card] border border-neutral-200 bg-white p-3 shadow-[--shadow-card] sm:p-4"
              >
                <p className="mb-2 shrink-0 text-xs text-neutral-600 sm:text-sm">
                  Quantités pour <span className="font-semibold text-neutral-900">{servings}</span>{" "}
                  portion
                  {servings !== 1 ? "s" : ""}
                </p>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <IngredientList ingredients={ingredients} ratio={ratio} />
                </div>
              </div>

              <div
                className="mt-4 flex min-h-0 flex-1 flex-col"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[--radius-card] border border-neutral-200 bg-white p-4 shadow-[--shadow-card] sm:p-5">
                  <div className="mb-4 flex shrink-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[--radius-badge] bg-brand-500 text-base font-bold text-white">
                      {stepIndex + 1}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                      Étape {stepIndex + 1}
                    </span>
                  </div>
                  <p
                    aria-live="polite"
                    aria-atomic="true"
                    className="min-h-0 flex-1 overflow-y-auto text-base leading-relaxed text-neutral-700"
                  >
                    {currentStep}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex shrink-0 gap-3">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={isFirst}
                  className="flex min-h-11 min-w-0 flex-1 touch-manipulation items-center justify-center gap-1 rounded-[--radius-card] border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 transition hover:border-brand-300 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={finishOrNext}
                  className="flex min-h-11 min-w-0 flex-1 touch-manipulation items-center justify-center gap-1 rounded-[--radius-card] border border-brand-600 bg-brand-600 px-3 text-sm font-semibold text-white transition hover:bg-brand-700 active:bg-brand-800"
                >
                  {isLast ? (
                    "Terminer"
                  ) : (
                    <>
                      Suivant
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
