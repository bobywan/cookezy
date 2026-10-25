import { NextResponse } from "next/server";
import { clientIpFrom } from "@/lib/client-ip";
import { ExtractError, extractPage } from "@/lib/extract-url";
import { allowRateLimit } from "@/lib/rate-limit";
import { rememberImageSource } from "@/lib/recipe-images";

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const ip = clientIpFrom(request.headers);
  if (!(await allowRateLimit(`extraire:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS))) {
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
    const page = await extractPage(url);
    let imageId: string | undefined;
    if (page.imageUrl) {
      try {
        imageId = await rememberImageSource(page.imageUrl);
      } catch (error) {
        console.error("rememberImageSource failed", error);
      }
    }
    return NextResponse.json({
      ok: true,
      text: page.text,
      ...(imageId && page.imageUrl ? { imageId, imageUrl: page.imageUrl } : {}),
    });
  } catch (error) {
    const message = error instanceof ExtractError ? error.message : "La page n'a pas pu être lue.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
