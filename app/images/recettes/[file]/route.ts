import { NextResponse } from "next/server";
import { readStoredImage } from "@/lib/recipe-images";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ file: string }> }) {
  const { file } = await context.params;
  const image = await readStoredImage(file);
  if (!image) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(image), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
