"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import type { HomeScreenGuide } from "sur-lecran";
import { getHomeScreenGuide } from "sur-lecran";

const STORAGE_KEY = "sur-lecran:dismissed";
const dismissedForThisVisit = new Set<string>();

export function HomeScreenHint() {
  const titleId = useId();
  const pathname = usePathname();
  const [guide, setGuide] = useState<HomeScreenGuide | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const onRecipePage = pathname.startsWith("/recettes/");

  useEffect(() => {
    setDismissed(isDismissed(STORAGE_KEY));
    setGuide(getHomeScreenGuide({ appName: "Cookezy" }));
  }, []);

  function close(): void {
    rememberDismissal(STORAGE_KEY);
    setDismissed(true);
  }

  if (!guide?.shouldExplain || dismissed) return null;

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-20 rounded-t-[--radius-card] border border-neutral-200 bg-white px-safe pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[--shadow-card] print:hidden"
      aria-labelledby={titleId}
    >
      <div className={`mx-auto max-w-5xl${onRecipePage ? " pr-20 md:pr-24" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-display text-lg leading-tight text-brand-700">
            {guide.title}
          </h2>
          <button
            type="button"
            onClick={close}
            className="min-h-11 shrink-0 touch-manipulation rounded-[--radius-card] border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700"
          >
            Fermer
          </button>
        </div>
        <p className="mt-2 text-sm text-neutral-700">{guide.intro}</p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-neutral-700">
          {guide.steps.map((step) => (
            <li key={step.id}>{step.text}</li>
          ))}
        </ol>
      </div>
    </aside>
  );
}

function isDismissed(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return dismissedForThisVisit.has(key);
  }
}

function rememberDismissal(key: string): void {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    dismissedForThisVisit.add(key);
  }
}
