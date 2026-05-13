export default function Loading() {
  return (
    <main className="min-h-dvh bg-brand-50 pb-safe">
      <header className="px-safe pt-safe pb-4 text-center md:pb-5">
        <div className="mx-auto h-9 w-48 max-w-full animate-pulse rounded-[--radius-badge] bg-brand-100 md:h-10 md:w-56" />
      </header>
      <section className="mx-auto max-w-5xl px-safe py-6 md:py-10 xl:max-w-6xl">
        <div className="mb-4 h-12 animate-pulse rounded-[--radius-card] bg-white shadow-[--shadow-card] md:mb-6 md:h-14" />
        <p className="mb-4 h-5 w-32 animate-pulse rounded-[--radius-badge] bg-brand-100 md:mb-6" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-[--radius-card] border border-neutral-200 bg-white shadow-[--shadow-card]"
            >
              <div className="aspect-[5/4] w-full animate-pulse bg-neutral-100 md:h-48 xl:h-52" />
              <div className="space-y-3 p-4 md:p-5">
                <div className="flex gap-2">
                  <div className="h-6 w-16 animate-pulse rounded-[--radius-badge] bg-brand-100" />
                  <div className="h-6 w-14 animate-pulse rounded-[--radius-badge] bg-neutral-100" />
                </div>
                <div className="h-7 w-3/4 max-w-[12rem] animate-pulse rounded-[--radius-badge] bg-brand-100" />
                <div className="h-4 w-24 animate-pulse rounded-[--radius-badge] bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
