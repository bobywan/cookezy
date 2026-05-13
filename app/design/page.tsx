import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Design system — Cookezy",
  description: "Tokens sémantiques, typographie, rayons et exemples de composants Cookezy.",
};

type ColorSwatch = {
  name: string;
  bgClass: string;
  fgClass: string;
};

const brandSwatches: ColorSwatch[] = [
  { name: "brand-50", bgClass: "bg-brand-50", fgClass: "text-neutral-800" },
  { name: "brand-100", bgClass: "bg-brand-100", fgClass: "text-neutral-900" },
  { name: "brand-200", bgClass: "bg-brand-200", fgClass: "text-neutral-900" },
  { name: "brand-300", bgClass: "bg-brand-300", fgClass: "text-neutral-900" },
  { name: "brand-400", bgClass: "bg-brand-400", fgClass: "text-neutral-900" },
  { name: "brand-500", bgClass: "bg-brand-500", fgClass: "text-white" },
  { name: "brand-600", bgClass: "bg-brand-600", fgClass: "text-white" },
  { name: "brand-700", bgClass: "bg-brand-700", fgClass: "text-white" },
  { name: "brand-800", bgClass: "bg-brand-800", fgClass: "text-brand-50" },
];

const accentSwatches: ColorSwatch[] = [
  { name: "accent-50", bgClass: "bg-accent-50", fgClass: "text-neutral-800" },
  { name: "accent-100", bgClass: "bg-accent-100", fgClass: "text-neutral-900" },
  { name: "accent-200", bgClass: "bg-accent-200", fgClass: "text-neutral-900" },
  { name: "accent-300", bgClass: "bg-accent-300", fgClass: "text-neutral-900" },
  { name: "accent-400", bgClass: "bg-accent-400", fgClass: "text-white" },
  { name: "accent-500", bgClass: "bg-accent-500", fgClass: "text-white" },
  { name: "accent-600", bgClass: "bg-accent-600", fgClass: "text-white" },
];

const neutralSwatches: ColorSwatch[] = [
  { name: "neutral-50", bgClass: "bg-neutral-50", fgClass: "text-neutral-900" },
  { name: "neutral-100", bgClass: "bg-neutral-100", fgClass: "text-neutral-900" },
  { name: "neutral-200", bgClass: "bg-neutral-200", fgClass: "text-neutral-900" },
  { name: "neutral-300", bgClass: "bg-neutral-300", fgClass: "text-neutral-900" },
  { name: "neutral-400", bgClass: "bg-neutral-400", fgClass: "text-white" },
  { name: "neutral-500", bgClass: "bg-neutral-500", fgClass: "text-white" },
  { name: "neutral-600", bgClass: "bg-neutral-600", fgClass: "text-white" },
  { name: "neutral-700", bgClass: "bg-neutral-700", fgClass: "text-white" },
  { name: "neutral-800", bgClass: "bg-neutral-800", fgClass: "text-neutral-50" },
  { name: "neutral-900", bgClass: "bg-neutral-900", fgClass: "text-neutral-50" },
];

const navLinks = [
  { href: "#principes", label: "Principes" },
  { href: "#couleurs", label: "Couleurs" },
  { href: "#typographie", label: "Typographie" },
  { href: "#badges", label: "Badges" },
  { href: "#surfaces", label: "Surfaces" },
  { href: "#actions", label: "Actions" },
] as const;

function SwatchGrid({ title, swatches }: { title: string; swatches: ColorSwatch[] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-neutral-900">{title}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {swatches.map((s) => (
          <div
            key={s.name}
            className={`flex min-h-20 flex-col justify-end rounded-[--radius-card] border border-neutral-200 p-3 ${s.bgClass}`}
          >
            <span className={`font-mono text-xs font-medium ${s.fgClass}`}>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-dvh bg-brand-50 pb-safe">
      <header className="border-b border-brand-100 bg-white px-safe pt-safe pb-4 md:pb-5">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-end md:justify-between xl:max-w-6xl">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Cookezy</p>
            <h1 className="font-display text-2xl font-bold text-brand-700 md:text-3xl">
              Design system
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Référence des tokens et des motifs d’interface.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-brand-600 hover:text-brand-800 md:shrink-0"
          >
            ← Retour aux recettes
          </Link>
        </div>
        <nav
          aria-label="Sections"
          className="mx-auto mt-4 flex max-w-5xl flex-wrap gap-x-4 gap-y-2 border-t border-brand-100 pt-4 text-sm xl:max-w-6xl"
        >
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-neutral-600 underline-offset-4 hover:text-brand-600 hover:underline"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-5xl space-y-14 px-safe py-8 md:space-y-16 md:py-12 xl:max-w-6xl">
        <section id="principes" className="scroll-mt-24">
          <h2 className="mb-4 font-display text-xl font-semibold text-neutral-900 md:text-2xl">
            Principes
          </h2>
          <ul className="space-y-2 text-sm leading-relaxed text-neutral-700 md:text-base">
            <li>
              Utiliser uniquement les tokens sémantiques{" "}
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-800">
                brand-*
              </code>
              ,{" "}
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-800">
                accent-*
              </code>
              ,{" "}
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-800">
                neutral-*
              </code>{" "}
              — pas de palettes Tailwind brutes type{" "}
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-800">
                amber-*
              </code>
              .
            </li>
            <li>
              Pas de couleurs hex codées en dur dans le JSX ou le CSS applicatif : tout passe par le
              thème Tailwind.
            </li>
            <li>
              Titres de recettes :{" "}
              <span className="font-display font-semibold text-neutral-900">Playfair</span> (
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs">
                font-display
              </code>
              ). UI et corps : <span className="font-sans text-neutral-900">DM Sans</span> (
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs">
                font-sans
              </code>
              ).
            </li>
          </ul>
        </section>

        <section id="couleurs" className="scroll-mt-24">
          <h2 className="mb-6 font-display text-xl font-semibold text-neutral-900 md:text-2xl">
            Couleurs
          </h2>
          <div className="space-y-10 rounded-[--radius-card] border border-neutral-200 bg-white p-5 shadow-[--shadow-card] md:p-8">
            <SwatchGrid title="Brand — ambre pastel" swatches={brandSwatches} />
            <SwatchGrid title="Accent — rose pastel" swatches={accentSwatches} />
            <SwatchGrid title="Neutral — pierre chaude" swatches={neutralSwatches} />
          </div>
        </section>

        <section id="typographie" className="scroll-mt-24">
          <h2 className="mb-6 font-display text-xl font-semibold text-neutral-900 md:text-2xl">
            Typographie
          </h2>
          <div className="space-y-8 rounded-[--radius-card] border border-neutral-200 bg-white p-5 shadow-[--shadow-card] md:p-8">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">Familles</h3>
              <div className="space-y-4 divide-y divide-neutral-100">
                <div className="pt-2 first:pt-0">
                  <p className="text-xs text-neutral-500">font-display — titres recettes</p>
                  <p className="font-display text-3xl text-neutral-900">
                    Tarte au citron meringuée
                  </p>
                </div>
                <div className="pt-4">
                  <p className="text-xs text-neutral-500">font-sans — interface & corps</p>
                  <p className="font-sans text-base text-neutral-700">
                    Préchauffer le four à 180&nbsp;°C. Mélanger les ingrédients secs dans un
                    saladier.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">Échelle conseillée</h3>
              <div className="space-y-3 font-sans">
                <p className="text-xs text-neutral-600">text-xs — badges, labels</p>
                <p className="text-sm text-neutral-600">text-sm — métadonnées, étapes</p>
                <p className="text-base text-neutral-700">text-base — corps principal</p>
                <p className="text-lg text-neutral-700">text-lg — sous-titres</p>
                <p className="text-xl text-neutral-900">text-xl — sections</p>
                <p className="text-2xl text-neutral-900">text-2xl — titres intermédiaires</p>
                <p className="text-3xl text-neutral-900">text-3xl — titres de page</p>
                <p className="font-display text-4xl text-brand-700">text-4xl — hero</p>
              </div>
            </div>
          </div>
        </section>

        <section id="badges" className="scroll-mt-24">
          <h2 className="mb-6 font-display text-xl font-semibold text-neutral-900 md:text-2xl">
            Badges
          </h2>
          <div className="rounded-[--radius-card] border border-neutral-200 bg-white p-5 shadow-[--shadow-card] md:p-8">
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Catégorie</h3>
            <div className="mb-8 flex flex-wrap gap-2">
              <span className="rounded-[--radius-badge] bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                plat
              </span>
              <span className="rounded-[--radius-badge] bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                snack
              </span>
              <span className="rounded-[--radius-badge] bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-600">
                entrée
              </span>
              <span className="rounded-[--radius-badge] bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-600">
                dessert
              </span>
            </div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Difficulté</h3>
            <div className="mb-8 flex flex-wrap gap-2">
              <span className="rounded-[--radius-badge] bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                facile
              </span>
              <span className="rounded-[--radius-badge] bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                moyen
              </span>
              <span className="rounded-[--radius-badge] bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                difficile
              </span>
            </div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Tags</h3>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-[--radius-badge] bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600">
                #végétarien
              </span>
              <span className="rounded-[--radius-badge] bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600">
                #rapide
              </span>
            </div>
          </div>
        </section>

        <section id="surfaces" className="scroll-mt-24">
          <h2 className="mb-6 font-display text-xl font-semibold text-neutral-900 md:text-2xl">
            Rayons & surfaces
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[--radius-card] border border-neutral-200 bg-white p-6 shadow-[--shadow-card]">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Carte recette
              </p>
              <h3 className="mt-2 font-display text-lg font-semibold text-neutral-900">
                Exemple de titre
              </h3>
              <p className="mt-2 text-sm text-neutral-500">
                Description courte sur deux lignes maximum pour la grille d’accueil.
              </p>
              <div className="mt-4 flex gap-2">
                <span className="rounded-[--radius-badge] bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                  plat
                </span>
                <span className="rounded-[--radius-badge] bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  facile
                </span>
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm text-neutral-600">
                <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs">
                  rounded-[--radius-card]
                </code>{" "}
                ·{" "}
                <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs">
                  shadow-[--shadow-card]
                </code>{" "}
                · bordure{" "}
                <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs">
                  border-neutral-200
                </code>
              </p>
              <ul className="divide-y divide-neutral-100 rounded-[--radius-card] border border-neutral-200 bg-white">
                <li className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-neutral-700">Farine</span>
                  <span className="font-medium text-brand-700">200 g</span>
                </li>
                <li className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-neutral-700">Lait</span>
                  <span className="font-medium text-brand-700">25 cl</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="actions" className="scroll-mt-24">
          <h2 className="mb-6 font-display text-xl font-semibold text-neutral-900 md:text-2xl">
            Actions & liens
          </h2>
          <div className="rounded-[--radius-card] border border-neutral-200 bg-white p-5 shadow-[--shadow-card] md:p-8">
            <p className="mb-4 text-sm text-neutral-600">
              Liens :{" "}
              <a href="#couleurs" className="font-medium text-brand-600 hover:text-brand-800">
                Lien interne exemple
              </a>
            </p>
            <p className="mb-4 text-sm text-neutral-600">
              Bouton fantôme (portions) : taille tactile mobile, plus compact en{" "}
              <code className="rounded bg-neutral-100 px-1 font-mono text-xs">md</code>.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-[--radius-badge] border border-neutral-200 text-base text-neutral-600 hover:border-brand-400 hover:bg-brand-50 active:bg-brand-100 md:h-9 md:w-9 md:text-sm"
              >
                −
              </button>
              <span className="min-w-10 text-center text-xl font-semibold tabular-nums text-brand-700 md:text-lg">
                4
              </span>
              <button
                type="button"
                className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-[--radius-badge] border border-neutral-200 text-base text-neutral-600 hover:border-brand-400 hover:bg-brand-50 active:bg-brand-100 md:h-9 md:w-9 md:text-sm"
              >
                +
              </button>
              <span className="rounded-[--radius-badge] bg-brand-500 px-3 py-1.5 text-sm font-bold text-white">
                1
              </span>
              <span className="text-sm text-neutral-700">Étape numérotée (puce)</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
