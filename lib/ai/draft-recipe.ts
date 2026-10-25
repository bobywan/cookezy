import { type AiProviderId, providerById } from "@/lib/ai/settings";
import { type FieldError, type ParseResult, parseRecipeFields } from "@/lib/recipe-fields";

const SYSTEM = `Tu prépares une recette pour Cookezy. Réponds uniquement avec un objet JSON, sans texte autour.
Champs : title, description, category (entrée, plat, dessert ou snack), difficulty (facile, moyen ou difficile), prepTime et cookTime (entiers, minutes), servings (entier >= 1), ingredients (liste de { quantity: nombre, unit: chaîne, name: chaîne }), steps (liste de textes, une action par étape), tags (liste de textes en minuscules, sans #).
N'invente pas d'image. Omets image, id et slug.`;

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const source = fenced?.[1] ?? text;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("La réponse de l'IA n'est pas un JSON.");
  }
  return JSON.parse(source.slice(start, end + 1)) as unknown;
}

async function complete(providerId: AiProviderId, apiKey: string, user: string): Promise<string> {
  const provider = providerById(providerId);
  if (providerId === "gemini") {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingLevel: "LOW" },
          },
        }),
      },
    );
    if (!response.ok) throw new Error("Le service d'IA a refusé la demande. Vérifie la clé.");
    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
    };
    const text =
      data.candidates?.[0]?.content?.parts
        ?.filter((part) => !part.thought)
        .map((part) => part.text ?? "")
        .join("") ?? "";
    if (!text) throw new Error("L'IA n'a pas renvoyé de recette.");
    return text;
  }

  const response = await fetch(`${baseUrl(providerId)}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.4,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
      ...(providerId === "groq"
        ? {
            reasoning_effort: "low",
            reasoning_format: "hidden",
            response_format: { type: "json_object" },
          }
        : {}),
    }),
  });
  if (!response.ok) throw new Error("Le service d'IA a refusé la demande. Vérifie la clé.");
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("L'IA n'a pas renvoyé de recette.");
  return text;
}

function baseUrl(providerId: AiProviderId): string {
  if (providerId === "groq") return "https://api.groq.com/openai/v1";
  return "https://openrouter.ai/api/v1";
}

function userPrompt(source: string, errors?: FieldError[]): string {
  const correction = errors?.length
    ? `\n\nLa tentative précédente a été refusée. Corrige ces champs et renvoie le JSON complet :\n${errors
        .map((error) => `- ${error.field} : ${error.message}`)
        .join("\n")}`
    : "";
  return `${source}${correction}`;
}

export async function draftRecipe(
  providerId: AiProviderId,
  apiKey: string,
  source: string,
): Promise<ParseResult> {
  let errors: FieldError[] | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await complete(providerId, apiKey, userPrompt(source, errors));
    let parsed: ParseResult;
    try {
      parsed = parseRecipeFields(extractJson(text));
    } catch (error) {
      parsed = {
        ok: false,
        errors: [
          {
            field: "body",
            message: error instanceof Error ? error.message : "Réponse illisible.",
          },
        ],
      };
    }
    if (parsed.ok) return parsed;
    errors = parsed.errors;
  }
  return { ok: false, errors: errors ?? [{ field: "body", message: "Recette incomplète." }] };
}
