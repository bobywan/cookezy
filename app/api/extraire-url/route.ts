import { NextResponse } from "next/server";
import { ExtractError, extractPageText } from "@/lib/extract-url";

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const ipMap = new Map<string, { count: number; resetAt: number }>();

function allowed(ip: string): boolean {
  const now = Date.now();
  const entry = ipMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!allowed(ip)) {
    return NextResponse.json(
      { ok: false, message: "Trop de lectures. Réessaie dans une heure." },
      { status: 429 },
    );
  }

  let url = "";
  try {
    const body = (await request.json()) as { url?: unknown };
    url = typeof body.url === "string" ? body.url.trim() : "";
  } catch {
    return NextResponse.json(
      { ok: false, message: "Le corps doit être un objet JSON." },
      { status: 400 },
    );
  }
  if (!url) {
    return NextResponse.json({ ok: false, message: "L'URL est requise." }, { status: 400 });
  }

  try {
    const text = await extractPageText(url);
    return NextResponse.json({ ok: true, text });
  } catch (error) {
    const message = error instanceof ExtractError ? error.message : "La page n'a pas pu être lue.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
