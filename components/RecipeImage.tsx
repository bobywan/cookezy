import Image from "next/image";
import { isStoredRecipeImage } from "@/lib/recipe-image-path";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

function RemoteImage({ src, alt, className }: Pick<Props, "src" | "alt" | "className">) {
  return (
    // biome-ignore lint/performance/noImgElement: le navigateur charge l'image, pas le serveur
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      className={`absolute inset-0 h-full w-full ${className ?? "object-cover"}`}
    />
  );
}

export function RecipeImage({ src, alt, sizes, priority = false, className }: Props) {
  if (!src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-brand-100 px-4">
        <p className="text-center font-display text-lg text-brand-700">{alt}</p>
      </div>
    );
  }

  if (src.startsWith("https://") || isStoredRecipeImage(src)) {
    return <RemoteImage src={src} alt={alt} className={className} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={className ?? "object-cover"}
    />
  );
}
