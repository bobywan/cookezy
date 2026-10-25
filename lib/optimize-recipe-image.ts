import sharp from "sharp";

export class ImageOptimizeError extends Error {}

const MAX_EDGE = 1200;
const TARGET_BYTES = 150 * 1024;

const ATTEMPTS: readonly { edge: number; quality: number }[] = [
  { edge: MAX_EDGE, quality: 75 },
  { edge: MAX_EDGE, quality: 60 },
  { edge: MAX_EDGE, quality: 45 },
  { edge: 960, quality: 60 },
  { edge: 960, quality: 45 },
];

export async function optimizeRecipeImage(input: Buffer): Promise<Buffer> {
  let format: string | undefined;
  try {
    format = (await sharp(input, { failOn: "error", pages: 1 }).metadata()).format;
  } catch (error) {
    console.error("optimizeRecipeImage metadata failed", error);
    throw new ImageOptimizeError("Le format de l'image n'est pas accepté.");
  }
  if (format !== "jpeg" && format !== "png" && format !== "webp") {
    throw new ImageOptimizeError("Le format de l'image n'est pas accepté.");
  }

  let smallest: Buffer | null = null;
  for (const attempt of ATTEMPTS) {
    const output = await encode(input, attempt.edge, attempt.quality);
    if (!smallest || output.length < smallest.length) smallest = output;
    if (output.length <= TARGET_BYTES) return output;
  }
  if (smallest && smallest.length <= TARGET_BYTES) return smallest;
  throw new ImageOptimizeError("L'image reste trop lourde après réduction.");
}

function encode(input: Buffer, edge: number, quality: number): Promise<Buffer> {
  return sharp(input, { failOn: "error", pages: 1 })
    .rotate()
    .resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toBuffer();
}
