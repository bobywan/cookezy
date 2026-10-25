"use client";

import { useEffect, useRef, useState } from "react";
import {
  AI_PROVIDERS,
  type AiProviderId,
  type AiSettings,
  activeApiKey,
  loadAiSettings,
  providerById,
  saveAiSettings,
} from "@/lib/ai/settings";

type Props = {
  onChange: (settings: AiSettings) => void;
};

const emptySettings: AiSettings = { provider: "gemini", keys: {} };

export function AiKeySettings({ onChange }: Props) {
  const [settings, setSettings] = useState<AiSettings>(emptySettings);
  const [savedSettings, setSavedSettings] = useState<AiSettings>(emptySettings);
  const [open, setOpen] = useState(true);
  const [notice, setNotice] = useState("");
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const stored = loadAiSettings();
    setSettings(stored);
    setSavedSettings(stored);
    setOpen(!activeApiKey(stored));
    onChangeRef.current(stored);
  }, []);

  const draftProvider = providerById(settings.provider);
  const savedProvider = providerById(savedSettings.provider);
  const savedKey = activeApiKey(savedSettings);
  const draftKey = settings.keys[settings.provider] ?? "";

  const storeKey = (provider: AiProviderId, value: string) => {
    setSettings((prev) => {
      const keys = { ...prev.keys };
      const trimmed = value.trim();
      if (trimmed) keys[provider] = value;
      else delete keys[provider];
      return { ...prev, keys };
    });
    setNotice("");
  };

  return (
    <section className="rounded-[--radius-card] border border-neutral-200 bg-white p-6 shadow-[--shadow-card]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Clés sur cet appareil</h2>
          {!open && (
            <p className="mt-1 text-sm text-neutral-600">
              {savedKey ? `${savedProvider.label} · clé enregistrée` : "Aucune clé enregistrée"}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="ai-key-panel"
          onClick={() => setOpen((current) => !current)}
          className="min-h-11 shrink-0 rounded-[--radius-card] border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          {open ? "Réduire" : "Modifier"}
        </button>
      </div>
      {open && (
        <div id="ai-key-panel" className="mt-4 space-y-4">
          <p className="text-sm text-neutral-500">
            Chaque clé reste dans ce navigateur. Le service actif prépare la recette.
          </p>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-neutral-700">Service actif</span>
            <select
              value={settings.provider}
              onChange={(event) => {
                setSettings((prev) => ({
                  ...prev,
                  provider: event.target.value as AiProviderId,
                }));
                setNotice("");
              }}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900"
            >
              {AI_PROVIDERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                  {settings.keys[item.id] ? " · clé enregistrée" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-neutral-700">
              Clé {draftProvider.label}
            </span>
            <input
              type="password"
              autoComplete="off"
              value={draftKey}
              onChange={(event) => storeKey(settings.provider, event.target.value)}
              placeholder="Colle ta clé ici"
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
            />
            <a
              href={draftProvider.keyUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-sm font-medium text-brand-600 hover:text-brand-800"
            >
              Obtenir une clé {draftProvider.label}
            </a>
          </label>
          <button
            type="button"
            onClick={() => {
              const keys = { ...settings.keys };
              const trimmed = (keys[settings.provider] ?? "").trim();
              if (trimmed) keys[settings.provider] = trimmed;
              else delete keys[settings.provider];
              const next = { provider: settings.provider, keys };
              saveAiSettings(next);
              setSettings(next);
              setSavedSettings(next);
              onChange(next);
              setNotice(
                trimmed
                  ? `Clé ${draftProvider.label} enregistrée sur cet appareil.`
                  : `Clé ${draftProvider.label} retirée de cet appareil.`,
              );
              if (trimmed) setOpen(false);
            }}
            className="min-h-11 rounded-[--radius-card] border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Enregistrer sur cet appareil
          </button>
          {notice && <p className="text-sm text-neutral-600">{notice}</p>}
        </div>
      )}
    </section>
  );
}
