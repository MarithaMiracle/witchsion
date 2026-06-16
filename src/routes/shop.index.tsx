import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getCategories, getProducts, formatPrice } from "@/lib/catalog";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const searchSchema = z.object({
  category: z.string().optional(),
  page: z.number().min(1).default(1).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["created_at", "price", "name"]).default("created_at").optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
});

export const Route = createFileRoute("/shop/")({
  validateSearch: searchSchema,
  component: ShopIndex,
});

function ShopIndex() {
  const { category, page = 1, search = "", sortBy = "created_at", sortOrder = "desc" } = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const pageSize = 12;

  const fetchProductsFn = useServerFn(getProducts);
  const fetchCategoriesFn = useServerFn(getCategories);
  
  const productsQuery = useQuery({ 
    queryKey: ["shop-products", category, page, search, sortBy, sortOrder], 
    queryFn: () => fetchProductsFn({ data: { page, pageSize, category, search, sortBy, sortOrder } }) 
  });
  const categoriesQuery = useQuery({ queryKey: ["shop-categories"], queryFn: () => fetchCategoriesFn() });

  if (productsQuery.isLoading || categoriesQuery.isLoading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <p className="px-6 py-24 text-center text-muted-foreground">Loading…</p>
      </main>
    );
  }

  const productsData = productsQuery.data!;
  const categories = categoriesQuery.data!;
  const activeCategory = categories.find((c) => c.slug === category);
  const totalPages = Math.ceil(productsData.total / pageSize);

  const generatePaginationPages = (currentPage: number, totalPages: number) => {
    const pages: Array<number | 'ellipsis'> = [];
    const delta = 2;
    
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== 'ellipsis') {
        pages.push('ellipsis');
      }
    }
    
    return pages;
  };

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

      {/* Search and Filters */}
      <section className="sticky top-16 z-30 border-b border-border/40 bg-background/80 px-6 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl py-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => navigate({ search: (prev) => ({ ...prev, search: e.target.value || undefined, page: 1 }) })}
              className="w-full bg-card border border-border px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground rounded-sm"
            />
            {search && (
              <button
                onClick={() => navigate({ search: (prev) => ({ ...prev, search: undefined, page: 1 }) })}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Filters and Sorting */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 overflow-x-auto items-center">
              <button
                type="button"
                onClick={() => navigate({ search: (prev) => ({ ...prev, category: undefined, page: 1 }) })}
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
                  onClick={() => navigate({ search: (prev) => ({ ...prev, category: c.slug, page: 1 }) })}
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
            
            {/* Sorting */}
            <div className="flex gap-2 items-center">
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground shrink-0">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => navigate({ search: (prev) => ({ ...prev, sortBy: e.target.value as any, page: 1 }) })}
                className="bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground rounded-sm shrink-0"
              >
                <option value="created_at">Newest</option>
                <option value="price">Price</option>
                <option value="name">Name</option>
              </select>
              <button
                onClick={() => navigate({ search: (prev) => ({ ...prev, sortOrder: prev.sortOrder === "asc" ? "desc" : "asc", page: 1 }) })}
                className="border border-border px-3 py-2 text-sm hover:border-foreground transition-colors shrink-0"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        {productsData.products.length === 0 ? (
          <p className="text-center text-muted-foreground">Nothing here yet.</p>
        ) : (
          <>
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productsData.products.map((p) => (
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
            
            {/* Shop Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-12">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => navigate({ search: (prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }) })}
                      className={page === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {generatePaginationPages(page, totalPages).map((p, i) => (
                    <PaginationItem key={i}>
                      {p === 'ellipsis' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          isActive={p === page}
                          onClick={() => navigate({ search: (prev) => ({ ...prev, page: p }) })}
                        >
                          {p}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => navigate({ search: (prev) => ({ ...prev, page: Math.min(totalPages, (prev.page || 1) + 1) }) })}
                      className={page === totalPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </section>
    </main>
  );
}
