export type AiProviderId = "gemini" | "groq" | "openrouter";

export type AiProvider = {
  id: AiProviderId;
  label: string;
  model: string;
  keyUrl: string;
};

export const AI_PROVIDERS: readonly AiProvider[] = [
  {
    id: "gemini",
    label: "Google Gemini",
    model: "gemini-3.8-flash",
    keyUrl: "https://aistudio.google.com/apikey",
  },
  {
    id: "groq",
    label: "Groq",
    model: "openai/gpt-oss-120b",
    keyUrl: "https://console.groq.com/keys",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    model: "google/gemma-4-31b-it:free",
    keyUrl: "https://openrouter.ai/settings/keys",
  },
];

const KEYS_STORAGE = "cookezy.ai.keys";
const PROVIDER_KEY = "cookezy.ai.provider";
const AI_KEY = "cookezy.ai.key";

export type AiSettings = {
  provider: AiProviderId;
  keys: Partial<Record<AiProviderId, string>>;
};

function isProvider(value: string | null): value is AiProviderId {
  return AI_PROVIDERS.some((provider) => provider.id === value);
}

function sanitizeKeys(value: unknown): Partial<Record<AiProviderId, string>> {
  if (!value || typeof value !== "object") return {};
  const source = value as Record<string, unknown>;
  const keys: Partial<Record<AiProviderId, string>> = {};
  for (const provider of AI_PROVIDERS) {
    const raw = source[provider.id];
    if (typeof raw === "string" && raw.trim()) keys[provider.id] = raw.trim();
  }
  return keys;
}

export function activeApiKey(settings: AiSettings): string {
  return settings.keys[settings.provider]?.trim() ?? "";
}

export function loadAiSettings(): AiSettings {
  if (typeof window === "undefined") return { provider: "gemini", keys: {} };
  const raw = window.localStorage.getItem(KEYS_STORAGE);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { provider?: unknown; keys?: unknown };
      const storedProvider = typeof parsed.provider === "string" ? parsed.provider : null;
      const provider: AiProviderId = isProvider(storedProvider) ? storedProvider : "gemini";
      return { provider, keys: sanitizeKeys(parsed.keys) };
    } catch (error) {
      console.error("loadAiSettings failed", error);
    }
  }
  const legacyProvider = window.localStorage.getItem(PROVIDER_KEY);
  const legacyKey = window.localStorage.getItem(AI_KEY)?.trim() ?? "";
  const provider = isProvider(legacyProvider) ? legacyProvider : "gemini";
  const settings: AiSettings = {
    provider,
    keys: legacyKey ? { [provider]: legacyKey } : {},
  };
  if (legacyKey || isProvider(legacyProvider)) saveAiSettings(settings);
  return settings;
}

export function saveAiSettings(settings: AiSettings) {
  const provider = isProvider(settings.provider) ? settings.provider : "gemini";
  const keys = sanitizeKeys(settings.keys);
  window.localStorage.setItem(KEYS_STORAGE, JSON.stringify({ provider, keys }));
  window.localStorage.removeItem(PROVIDER_KEY);
  window.localStorage.removeItem(AI_KEY);
}

export function providerById(id: AiProviderId): AiProvider {
  const provider = AI_PROVIDERS.find((item) => item.id === id);
  if (!provider) return AI_PROVIDERS[0];
  return provider;
}
