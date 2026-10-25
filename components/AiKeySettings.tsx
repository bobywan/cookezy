"use client";

import { useEffect, useRef, useState } from "react";
import {
  AI_PROVIDERS,
  type AiSettings,
  loadAiSettings,
  providerById,
  saveAiSettings,
} from "@/lib/ai/settings";

type Props = {
  onChange: (settings: AiSettings) => void;
};

export function AiKeySettings({ onChange }: Props) {
  const [settings, setSettings] = useState<AiSettings>({
    provider: "gemini",
    apiKey: "",
  });
  const [saved, setSaved] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const stored = loadAiSettings();
    setSettings(stored);
    onChangeRef.current(stored);
  }, []);

  const provider = providerById(settings.provider);

  return (
    <section className="space-y-4 rounded-[--radius-card] border border-neutral-200 bg-white p-6 shadow-[--shadow-card]">
      <h2 className="text-base font-semibold text-neutral-900">Clé sur cet appareil</h2>
      <p className="text-sm text-neutral-500">
        La clé du service d&apos;IA reste dans ce navigateur et sert à préparer la recette.
      </p>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">Service</span>
        <select
          value={settings.provider}
          onChange={(event) =>
            setSettings((prev) => ({
              ...prev,
              provider: event.target.value as AiSettings["provider"],
            }))
          }
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900"
        >
          {AI_PROVIDERS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">Clé du service</span>
        <input
          type="password"
          autoComplete="off"
          value={settings.apiKey}
          onChange={(event) => setSettings((prev) => ({ ...prev, apiKey: event.target.value }))}
          placeholder="Colle ta clé ici"
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
        />
        <a
          href={provider.keyUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-sm font-medium text-brand-600 hover:text-brand-800"
        >
          Obtenir une clé {provider.label}
        </a>
      </label>
      <button
        type="button"
        onClick={() => {
          const next = {
            ...settings,
            apiKey: settings.apiKey.trim(),
          };
          saveAiSettings(next);
          setSettings(next);
          onChange(next);
          setSaved(true);
        }}
        className="rounded-[--radius-card] border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        Enregistrer sur cet appareil
      </button>
      {saved && <p className="text-sm text-neutral-600">Clé enregistrée sur cet appareil.</p>}
    </section>
  );
}
