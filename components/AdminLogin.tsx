"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { connecterAdmin } from "@/app/actions/demandes";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mx-auto mt-10 max-w-sm space-y-4 rounded-[--radius-card] border border-neutral-200 bg-white p-6 shadow-[--shadow-card]"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage("");
        const result = await connecterAdmin(password);
        setPending(false);
        if (result.status === "error") {
          setMessage(result.message);
          return;
        }
        router.refresh();
      }}
    >
      <h1 className="font-display text-2xl font-bold text-brand-700">Demandes</h1>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">Mot de passe</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900"
        />
      </label>
      {message && (
        <p role="alert" className="text-sm text-red-700">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full rounded-[--radius-card] bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Vérification…" : "Ouvrir"}
      </button>
    </form>
  );
}
