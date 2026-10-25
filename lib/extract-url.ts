import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_BYTES = 1_000_000;
const MAX_CHARS = 12_000;
const TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 3;

export class ExtractError extends Error {}

function isPrivateIp(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) return isPrivateIp(normalized.slice("::ffff:".length));
  if (normalized.includes(":")) {
    if (normalized === "::1" || normalized === "::") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    if (/^fe[89ab]/.test(normalized)) return true;
    return false;
  }
  const parts = normalized.split(".").map((part) => Number(part));
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

async function assertPublicHttps(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ExtractError("L'URL est invalide.");
  }
  if (url.protocol !== "https:") throw new ExtractError("Seules les URL https sont acceptées.");
  if (url.username || url.password) throw new ExtractError("Cette URL est refusée.");
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new ExtractError("Cette adresse n'est pas accessible.");
  }
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new ExtractError("Cette adresse n'est pas accessible.");
    return url;
  }
  const addresses = await lookup(host, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some((item) => isPrivateIp(item.address))) {
    throw new ExtractError("Cette adresse n'est pas accessible.");
  }
  return url;
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CHARS);
}

export async function extractPageText(rawUrl: string): Promise<string> {
  let current = await assertPublicHttps(rawUrl);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "text/html,text/plain", "User-Agent": "Cookezy" },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || hop === MAX_REDIRECTS) throw new ExtractError("Redirection refusée.");
      current = await assertPublicHttps(new URL(location, current).href);
      continue;
    }
    if (!response.ok) throw new ExtractError("La page n'a pas pu être lue.");
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > MAX_BYTES) throw new ExtractError("La page est trop volumineuse.");
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) throw new ExtractError("La page est trop volumineuse.");
    const text = htmlToText(new TextDecoder().decode(buffer));
    if (!text) throw new ExtractError("La page ne contient pas de texte.");
    return text;
  }
  throw new ExtractError("La page n'a pas pu être lue.");
}
