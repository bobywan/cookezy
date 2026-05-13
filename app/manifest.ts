import type { MetadataRoute } from "next";

/** Couleurs alignées sur `app/globals.css` (@theme brand-50 / brand-600). */
const BACKGROUND = "#fffbeb";
const THEME = "#d97706";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cookezy — Mes recettes",
    short_name: "Cookezy",
    description: "Mon carnet de recettes personnel.",
    start_url: "/",
    display: "standalone",
    background_color: BACKGROUND,
    theme_color: THEME,
    lang: "fr",
    icons: [
      { src: "/icon-192.jpg", sizes: "192x192", type: "image/jpeg", purpose: "any" },
      { src: "/icon-512.jpg", sizes: "512x512", type: "image/jpeg", purpose: "any" },
    ],
  };
}
