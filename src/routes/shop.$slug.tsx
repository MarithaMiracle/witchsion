import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, ArrowLeft, Heart } from "lucide-react";
import { useApiFn } from "@/lib/api/create-api-fn";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { formatPrice } from "@/lib/catalog";
import { getProductBySlug, getProducts } from "@/lib/catalog-api";
import defaultProductImg from "@/assets/product-oil.jpg";
import { getMyWishlist, addToWishlist, removeFromWishlist } from "@/lib/wishlist.functions";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/shop/$slug")({
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
  const { slug } = Route.useParams();
  return <ProductPageInner key={slug} slug={slug} />;
}

function ProductPageInner({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const queryClient = useQueryClient();
  const { add } = useCart();
  const fetchProduct = useApiFn(getProductBySlug);
  const fetchAllProductsFn = useApiFn(getProducts);
  const fetchWishlist = useApiFn(getMyWishlist);
  const addWishlistFn = useApiFn(addToWishlist);
  const removeWishlistFn = useApiFn(removeFromWishlist);

  const productQuery = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProduct({ data: slug }),
  });
  const wishlistQuery = useQuery({
    queryKey: ["my-wishlist"],
    queryFn: () => fetchWishlist(),
    enabled: !!user,
  });

  const allProductsQuery = useQuery({
    queryKey: ["all-products-list"],
    queryFn: () => fetchAllProductsFn({ data: { page: 1, pageSize: 200 } }),
  });

  const relatedQuery = useQuery({
    queryKey: ["related-products", productQuery.data?.category_slug],
    queryFn: async () => {
      const prod = productQuery.data;
      if (!prod) return [];
      const result = await fetchAllProductsFn({
        data: { category: prod.category_slug, page: 1, pageSize: 20 },
      });
      return result?.products.filter((p: { id?: string }) => p.id !== prod.id).slice(0, 4) || [];
    },
    enabled: !!productQuery.data,
  });

  if (productQuery.isLoading) {
    return <div className="min-h-screen bg-background text-foreground p-6">Loading…</div>;
  }
  if (productQuery.error || !productQuery.data) {
    return (
      <main className="min-h-screen bg-background text-foreground p-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-witchy text-4xl mb-4">Not found</h1>
          <p className="mb-4 text-muted-foreground">We couldn't find that item in the apothecary.</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Requested slug: <strong>{slug}</strong>
          </p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <Link to="/shop" className="underline">
              Back to shop
            </Link>
            <Link to="/shop/" className="underline">
              Browse all products
            </Link>
          </div>
          <div className="mt-6 text-left">
            <h3 className="text-witchy text-2xl mb-4">Available products</h3>
            {allProductsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading available products…</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {allProductsQuery.data?.products.map((p: { slug: string; name: string }) => (
                  <li key={p.slug}>
                    <Link to="/shop/$slug" params={{ slug: p.slug }} className="underline">
                      {p.name} - {p.slug}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    );
  }
  const product = productQuery.data;

  const isInWishlist = !!wishlistQuery.data?.some((item) => item.product_id === product?.id);
  const related = relatedQuery.data || [];
  const productImage =
    product.image || (product.images && product.images[0]) || defaultProductImg;

  return (
    <main>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={12} /> Back to shop
        </Link>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 sm:gap-12 sm:px-6 sm:pb-24 lg:grid-cols-2 lg:gap-20">
        <div className="relative aspect-square overflow-hidden bg-card">
          <img
            src={productImage}
            alt={product.name}
            width={1024}
            height={1024}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            {product.category?.name || product.category_slug}
          </span>
          <h1 className="text-witchy mt-3 text-balance text-4xl leading-tight sm:text-5xl md:text-6xl">
            {product.name}
          </h1>
          <p className="font-serif mt-4 text-lg italic text-muted-foreground">{product.blurb}</p>

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
                {(product.use_case ?? product.use)?.map((u: string) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:mt-12 sm:flex-row sm:items-stretch">
            <div className="flex items-center border border-border self-start">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="touch-target px-3 py-3 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <div className="w-10 text-center text-sm">{qty}</div>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="touch-target px-3 py-3 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => add(product, qty)}
              className="w-full bg-foreground px-6 py-4 text-xs uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-90 sm:flex-1"
            >
              Add to bag
            </button>

            {user && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (isInWishlist) {
                      await removeWishlistFn({ data: { productId: product.id } });
                      toast.success("Removed from wishlist");
                    } else {
                      await addWishlistFn({ data: { productId: product.id } });
                      toast.success("Added to wishlist");
                    }
                    queryClient.invalidateQueries({ queryKey: ["my-wishlist"] });
                  } catch {
                    toast.error("Failed to update wishlist");
                  }
                }}
                className="touch-target self-start border border-border px-4 py-4 text-muted-foreground hover:text-foreground transition-colors sm:self-auto"
                aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={18} fill={isInWishlist ? "currentColor" : "none"} />
              </button>
            )}
          </div>

          <p className="font-serif mt-6 text-xs italic text-muted-foreground">Prepared on order.</p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-border/40 bg-card/30 px-4 py-14 sm:px-6 sm:py-20">
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
                      src={p.image || defaultProductImg}
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
