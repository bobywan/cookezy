"use client";

import { useCallback, useId, useState } from "react";

type Props = {
  title: string;
  description: string;
};

export default function RecipeShareActions({ title, description }: Props) {
  const statusId = useId();
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  const getShareUrl = useCallback(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, []);

  const copyLink = useCallback(async () => {
    const url = getShareUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 3000);
    }
  }, [getShareUrl]);

  const shareNative = useCallback(async () => {
    const url = getShareUrl();
    if (!url) return;
    if (typeof navigator === "undefined" || !navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({ title, text: description, url });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      await copyLink();
    }
  }, [copyLink, description, getShareUrl, title]);

  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className="print:hidden">
      <p id={statusId} className="sr-only" aria-live="polite">
        {status === "copied" && "Lien copié dans le presse-papiers."}
        {status === "error" &&
          "La copie du lien a échoué. Réessayez ou copiez l’adresse manuellement."}
        {status === "idle" && ""}
      </p>
      <div className="mt-4 flex flex-wrap gap-3 md:mt-5">
        <button
          type="button"
          onClick={copyLink}
          className="min-h-11 touch-manipulation rounded-[--radius-card] border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-[--shadow-card] transition hover:border-brand-300 hover:bg-brand-50"
        >
          Copier le lien
        </button>
        {canShare ? (
          <button
            type="button"
            onClick={() => void shareNative()}
            className="min-h-11 touch-manipulation rounded-[--radius-card] border border-brand-600 bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 active:bg-brand-800"
          >
            Partager…
          </button>
        ) : null}
      </div>
    </div>
  );
}
