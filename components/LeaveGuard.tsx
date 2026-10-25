"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

type Props = {
  when: boolean;
};

export function LeaveGuard({ when }: Props) {
  const router = useRouter();
  const titleId = useId();
  const stayRef = useRef<HTMLButtonElement>(null);
  const leaving = useRef(false);
  const pendingHref = useRef<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!when) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [when]);

  useEffect(() => {
    if (!when) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search)
        return;
      event.preventDefault();
      event.stopPropagation();
      pendingHref.current = `${url.pathname}${url.search}${url.hash}`;
      setOpen(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [when]);

  useEffect(() => {
    if (!when) return;
    window.history.pushState({ cookezyLeave: true }, "");
    const onPop = () => {
      if (leaving.current) return;
      pendingHref.current = null;
      setOpen(true);
      window.history.pushState({ cookezyLeave: true }, "");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [when]);

  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    stayRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const stay = () => setOpen(false);

  const leave = () => {
    leaving.current = true;
    const href = pendingHref.current;
    setOpen(false);
    if (href) {
      router.push(href);
      return;
    }
    window.history.go(-2);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/60 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-[--radius-card] border border-neutral-200 bg-brand-50 p-6 shadow-[--shadow-card]"
      >
        <h2 id={titleId} className="text-lg font-semibold text-neutral-900">
          La recette n&apos;est pas encore envoyée. Quitter quand même ?
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Si tu quittes, la préparation en cours est perdue.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={stayRef}
            type="button"
            onClick={stay}
            className="min-h-11 rounded-[--radius-card] border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Rester
          </button>
          <button
            type="button"
            onClick={leave}
            className="min-h-11 rounded-[--radius-card] bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Quitter
          </button>
        </div>
      </div>
    </div>
  );
}
