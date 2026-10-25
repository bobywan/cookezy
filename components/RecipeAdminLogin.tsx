"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { connecterAdminRecette } from "@/app/actions/modifier-recette";

const inputCls =
  "w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300";

export function RecipeAdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4 rounded-[--radius-card] border border-neutral-200 bg-white p-6 shadow-[--shadow-card]"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage("");
        const result = await connecterAdminRecette(password);
        setPending(false);
        if (result.status === "error") {
          setMessage(result.message);
          return;
        }
        setPassword("");
        router.refresh();
      }}
    >
      <h2 className="text-base font-semibold text-neutral-900">Mot de passe</h2>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">Mot de passe</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className={inputCls}
        />
      </label>
      {message && (
        <p role="alert" className="text-sm text-red-700">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !password.trim()}
        className="min-h-11 rounded-[--radius-card] bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Vérification…" : "Ouvrir"}
      </button>
    </form>
  );
}
