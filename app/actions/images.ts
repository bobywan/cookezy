"use server";

import { ImageImportError, importRememberedImage } from "@/lib/recipe-images";

export async function importerImage(
  id: string,
): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  try {
    const path = await importRememberedImage(id);
    return { ok: true, path };
  } catch (error) {
    if (error instanceof ImageImportError) return { ok: false, message: error.message };
    console.error("importerImage failed", error);
    return { ok: false, message: "L'image n'a pas pu être enregistrée." };
  }
}
