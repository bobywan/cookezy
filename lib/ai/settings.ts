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

const PROVIDER_KEY = "cookezy.ai.provider";
const AI_KEY = "cookezy.ai.key";

export type AiSettings = {
  provider: AiProviderId;
  apiKey: string;
};

function isProvider(value: string | null): value is AiProviderId {
  return AI_PROVIDERS.some((provider) => provider.id === value);
}

export function loadAiSettings(): AiSettings {
  if (typeof window === "undefined") {
    return { provider: "gemini", apiKey: "" };
  }
  const stored = window.localStorage.getItem(PROVIDER_KEY);
  return {
    provider: isProvider(stored) ? stored : "gemini",
    apiKey: window.localStorage.getItem(AI_KEY) ?? "",
  };
}

export function saveAiSettings(settings: AiSettings) {
  window.localStorage.setItem(PROVIDER_KEY, settings.provider);
  window.localStorage.setItem(AI_KEY, settings.apiKey.trim());
}

export function providerById(id: AiProviderId): AiProvider {
  const provider = AI_PROVIDERS.find((item) => item.id === id);
  if (!provider) return AI_PROVIDERS[0];
  return provider;
}
