export default function RecipeLoading() {
  return (
    <div className="min-h-dvh bg-brand-50 pb-safe">
      <header className="px-safe pt-safe pb-3 md:px-6 md:py-4">
        <div className="h-10 w-40 animate-pulse rounded-[--radius-badge] bg-brand-100 md:h-8 md:w-36" />
      </header>
      <article className="mx-auto max-w-3xl px-safe pt-5 pb-28 md:pt-10 md:pb-28 xl:max-w-4xl">
        <div className="relative mb-6 aspect-[4/3] w-full min-h-48 animate-pulse rounded-[--radius-card] bg-neutral-100 sm:min-h-56 md:mb-8 md:h-72 md:min-h-0 lg:h-80" />
        <div className="mb-8 space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="h-6 w-20 animate-pulse rounded-[--radius-badge] bg-brand-100" />
            <div className="h-6 w-16 animate-pulse rounded-[--radius-badge] bg-neutral-100" />
          </div>
          <div className="h-9 max-w-md animate-pulse rounded-[--radius-badge] bg-brand-100" />
          <div className="h-16 max-w-2xl animate-pulse rounded-[--radius-badge] bg-neutral-100" />
        </div>
        <div className="grid gap-8 md:grid-cols-2 md:gap-10 lg:gap-12">
          <div className="h-64 animate-pulse rounded-[--radius-card] bg-white shadow-[--shadow-card] md:h-72" />
          <div className="h-64 animate-pulse rounded-[--radius-card] bg-white shadow-[--shadow-card] md:h-72" />
        </div>
      </article>
    </div>
  );
}
