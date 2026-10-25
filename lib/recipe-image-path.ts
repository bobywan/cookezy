const STORED_IMAGE =
  /^\/images\/recettes\/([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.webp$/;

export function imageIdFromPath(path: string): string | null {
  return STORED_IMAGE.exec(path)?.[1] ?? null;
}

export function isStoredRecipeImage(path: string): boolean {
  return imageIdFromPath(path) !== null;
}

export function storedImagePath(id: string): string {
  return `/images/recettes/${id}.webp`;
}
