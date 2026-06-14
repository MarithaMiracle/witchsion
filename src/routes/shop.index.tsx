import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { categories, products, formatPrice } from "@/lib/catalog";

export const Route = createFileRoute("/shop/")({
  component: ShopIndex,
});

function ShopIndex() {
  const { category } = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });

  const filtered = category
    ? products.filter((p) => p.categorySlug === category)
    : products;

  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <main>
      {/* Header */}
      <section className="border-b border-border/40 bg-card/30 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            the apothecary
          </span>
          <h1 className="text-witchy mt-4 text-6xl md:text-7xl lg:text-8xl">
            {activeCategory ? activeCategory.name.toLowerCase() : "the shop"}
          </h1>
          <p className="font-serif mt-4 max-w-xl text-lg italic text-muted-foreground">
            {activeCategory
              ? activeCategory.blurb
              : "Every piece is prepared on order or hand-charged in small batches. Made with intention."}
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 border-b border-border/40 bg-background/80 px-6 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto py-4">
          <button
            type="button"
            onClick={() =>
              navigate({ search: () => ({ category: undefined }) })
            }
            className={`shrink-0 border px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition-colors ${
              !category
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => navigate({ search: () => ({ category: c.slug }) })}
              className={`shrink-0 border px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition-colors ${
                category === c.slug
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground">Nothing here yet.</p>
        ) : (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <Link
                key={p.slug}
                to="/shop/$slug"
                params={{ slug: p.slug }}
                className="group block"
              >
                <div className="relative aspect-square overflow-hidden bg-card">
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-background/0 transition-colors group-hover:bg-background/10" />
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {p.category}
                    </div>
                    <div className="font-serif mt-1 text-lg italic text-foreground">
                      {p.name}
                    </div>
                  </div>
                  <div className="shrink-0 text-sm text-foreground">
                    {formatPrice(p.price, p.currency)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
