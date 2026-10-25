import type { LookupOptions } from "node:dns";
import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
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

type ResolvedAddress = { address: string; family: 4 | 6 };

async function assertPublicHttps(raw: string): Promise<{ url: URL; resolved: ResolvedAddress }> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ExtractError("L'URL est invalide.");
  }
  if (url.protocol !== "https:") throw new ExtractError("Seules les URL https sont acceptées.");
  if (url.username || url.password) throw new ExtractError("Cette URL est refusée.");
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^\d+$/.test(host)
  ) {
    throw new ExtractError("Cette adresse n'est pas accessible.");
  }
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new ExtractError("Cette adresse n'est pas accessible.");
    return { url, resolved: { address: host, family: host.includes(":") ? 6 : 4 } };
  }
  const addresses = await lookup(host, { all: true, verbatim: true });
  const chosen = addresses[0];
  if (!chosen || addresses.some((item) => isPrivateIp(item.address))) {
    throw new ExtractError("Cette adresse n'est pas accessible.");
  }
  return {
    url,
    resolved: { address: chosen.address, family: chosen.family === 6 ? 6 : 4 },
  };
}

type PinnedResponse = { status: number; location: string; contentType: string; body: Buffer };

function headerValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function readPinned(
  url: URL,
  resolved: ResolvedAddress,
  maxBytes: number,
  accept: string,
): Promise<PinnedResponse> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    const succeed = (value: PinnedResponse) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const req = httpsRequest(
      url,
      {
        method: "GET",
        headers: { Accept: accept, "User-Agent": "Cookezy" },
        timeout: TIMEOUT_MS,
        lookup: (_hostname: string, options: LookupOptions, callback) => {
          if (options.all) {
            callback(null, [{ address: resolved.address, family: resolved.family }]);
            return;
          }
          callback(null, resolved.address, resolved.family);
        },
      },
      (response) => {
        const status = response.statusCode ?? 0;
        const locationHeader = response.headers.location;
        const location = headerValue(locationHeader);
        const contentType = headerValue(response.headers["content-type"]);
        if (status >= 300 && status < 400) {
          response.resume();
          succeed({ status, location, contentType, body: Buffer.alloc(0) });
          return;
        }
        const declared = Number(response.headers["content-length"] ?? 0);
        if (declared > maxBytes) {
          response.destroy();
          fail(new ExtractError("Le contenu est trop volumineux."));
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) {
            response.destroy();
            fail(new ExtractError("Le contenu est trop volumineux."));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          succeed({ status, location, contentType, body: Buffer.concat(chunks) });
        });
        response.on("error", () => fail(new ExtractError("La page n'a pas pu être lue.")));
      },
    );
    req.on("timeout", () => {
      req.destroy();
      fail(new ExtractError("La page n'a pas pu être lue."));
    });
    req.on("error", () => fail(new ExtractError("La page n'a pas pu être lue.")));
    req.end();
  });
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

export type ExtractedPage = { text: string; imageUrl: string | null };

const PAGE_ACCEPT = "text/html,text/plain";
const IMAGE_ACCEPT = "image/avif,image/webp,image/png,image/jpeg,image/*";

async function readFollowed(
  rawUrl: string,
  maxBytes: number,
  accept: string,
): Promise<{ url: URL; response: PinnedResponse }> {
  let current = await assertPublicHttps(rawUrl);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await readPinned(current.url, current.resolved, maxBytes, accept);
    if (response.status >= 300 && response.status < 400) {
      if (!response.location || hop === MAX_REDIRECTS)
        throw new ExtractError("Redirection refusée.");
      current = await assertPublicHttps(new URL(response.location, current.url).href);
      continue;
    }
    if (response.status < 200 || response.status >= 300) {
      throw new ExtractError("La page n'a pas pu être lue.");
    }
    return { url: current.url, response };
  }
  throw new ExtractError("La page n'a pas pu être lue.");
}

export async function extractPage(rawUrl: string): Promise<ExtractedPage> {
  const { url, response } = await readFollowed(rawUrl, MAX_BYTES, PAGE_ACCEPT);
  const html = new TextDecoder().decode(response.body);
  const text = htmlToText(html);
  if (!text) throw new ExtractError("La page ne contient pas de texte.");
  return { text, imageUrl: await publicImageUrl(findImageCandidate(html, url)) };
}

export async function fetchPublicBytes(rawUrl: string, maxBytes: number): Promise<Buffer> {
  const { response } = await readFollowed(rawUrl, maxBytes, IMAGE_ACCEPT);
  const type = response.contentType.toLowerCase();
  if (type.includes("text/html") || type.includes("image/svg")) {
    throw new ExtractError("L'image n'a pas pu être lue.");
  }
  return response.body;
}

async function publicImageUrl(candidate: string | null): Promise<string | null> {
  if (!candidate) return null;
  try {
    const checked = await assertPublicHttps(candidate);
    return checked.url.href;
  } catch (error) {
    if (error instanceof ExtractError) return null;
    throw error;
  }
}

function findImageCandidate(html: string, base: URL): string | null {
  const meta =
    metaContent(html, "og:image") ?? metaContent(html, "twitter:image") ?? jsonLdImage(html);
  if (!meta) return null;
  try {
    const url = new URL(meta, base);
    if (url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

function metaContent(html: string, key: string): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const attrs = readAttrs(tag);
    const name = (attrs.property ?? attrs.name ?? "").toLowerCase();
    if (name === key && attrs.content) return decodeEntities(attrs.content);
  }
  return null;
}

function readAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  for (const match of tag.matchAll(pattern)) {
    attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attrs;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function jsonLdImage(html: string): string | null {
  const scripts = html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const match of scripts) {
    try {
      const found = walkLdImage(JSON.parse(match[1]) as unknown);
      if (found) return found;
    } catch {}
  }
  return null;
}

function walkLdImage(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = walkLdImage(item);
      if (found) return found;
    }
    return null;
  }
  const record = value as Record<string, unknown>;
  if (record["@graph"]) {
    const found = walkLdImage(record["@graph"]);
    if (found) return found;
  }
  const type = record["@type"];
  const types = (Array.isArray(type) ? type : [type]).map((item) => String(item).toLowerCase());
  if (types.includes("recipe")) return imageValue(record.image);
  return null;
}

function imageValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = imageValue(item);
      if (found) return found;
    }
    return null;
  }
  if (value && typeof value === "object" && "url" in value) {
    return imageValue((value as { url: unknown }).url);
  }
  return null;
}
