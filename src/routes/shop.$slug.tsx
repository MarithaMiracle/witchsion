import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, ArrowLeft } from "lucide-react";

import { productBySlug, products, formatPrice } from "@/lib/catalog";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/shop/$slug")({
  loader: ({ params }) => {
    const product = productBySlug(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    return {
      meta: p
        ? [
            { title: `${p.name} — Witchsion` },
            { name: "description", content: p.description },
            { property: "og:title", content: `${p.name} — Witchsion` },
            { property: "og:description", content: p.description },
            { property: "og:image", content: p.image },
            { name: "twitter:image", content: p.image },
          ]
        : [{ title: "Product — Witchsion" }],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center text-center">
      <div>
        <h1 className="text-witchy text-5xl">not in the apothecary</h1>
        <Link to="/shop" className="mt-6 inline-block text-xs uppercase tracking-[0.2em] underline">
          Back to shop
        </Link>
      </div>
    </div>
  ),
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const [qty, setQty] = useState(1);
  const { add } = useCart();

  const related = products
    .filter((p) => p.categorySlug === product.categorySlug && p.slug !== product.slug)
    .slice(0, 4);

  return (
    <main>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={12} /> Back to shop
        </Link>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-24 lg:grid-cols-2 lg:gap-20">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-card">
          <img
            src={product.image}
            alt={product.name}
            width={1024}
            height={1024}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            {product.category}
          </span>
          <h1 className="text-witchy mt-3 text-balance text-5xl leading-tight md:text-6xl">
            {product.name}
          </h1>
          <p className="font-serif mt-4 text-lg italic text-muted-foreground">
            {product.blurb}
          </p>

          <div className="mt-8 font-serif text-3xl text-foreground">
            {formatPrice(product.price, product.currency)}
          </div>

          <div className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
            <p>{product.description}</p>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-foreground">
                Suggested use
              </div>
              <ul className="font-serif mt-3 list-disc space-y-1 pl-5 italic">
                {product.use.map((u: string) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Qty + Add */}
          <div className="mt-12 flex items-stretch gap-3">
            <div className="flex items-center border border-border">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-3 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <div className="w-10 text-center text-sm">{qty}</div>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="px-3 py-3 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => add(product, qty)}
              className="flex-1 bg-foreground px-6 py-4 text-xs uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-90"
            >
              Add to bag
            </button>
          </div>

          <p className="font-serif mt-6 text-xs italic text-muted-foreground">
            Prepared on order. Spiritual, cultural and entertainment offering —
            no specific outcome is guaranteed.
          </p>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-border/40 bg-card/30 px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-witchy text-4xl md:text-5xl">also from the shelf</h2>
            <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  to="/shop/$slug"
                  params={{ slug: p.slug }}
                  className="group block"
                >
                  <div className="relative aspect-square overflow-hidden bg-background">
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="font-serif mt-3 text-base italic">{p.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {formatPrice(p.price, p.currency)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
