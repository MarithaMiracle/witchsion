import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, ArrowLeft, Heart } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getProductBySlug, getProducts, formatPrice } from "@/lib/catalog";
import defaultProductImg from "@/assets/product-oil.jpg";
import { getReviewsForProduct, createReview } from "@/lib/reviews.functions";
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
  // Key the inner component by slug so navigation always remounts it and
  // prevents hook-order mismatch between renders.
  return <ProductPageInner key={slug} slug={slug} />;
}

function ProductPageInner({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const queryClient = useQueryClient();
  const { add } = useCart();
  const fetchProduct = useServerFn(getProductBySlug);
  const fetchAllProductsFn = useServerFn(getProducts);
  const fetchWishlist = useServerFn(getMyWishlist);
  const addWishlistFn = useServerFn(addToWishlist);
  const removeWishlistFn = useServerFn(removeFromWishlist);

  const productQuery = useQuery({ 
    queryKey: ["product", slug], 
    queryFn: () => fetchProduct({ data: slug })
  });
  const wishlistQuery = useQuery({ 
    queryKey: ["my-wishlist"], 
    queryFn: () => fetchWishlist(),
    enabled: !!user
  });
  const fetchReviews = useServerFn(getReviewsForProduct);
  const submitReviewFn = useServerFn(createReview);
  const [reviewsPage, setReviewsPage] = useState(1);
  const reviewsQuery = useQuery({ 
    queryKey: ["product-reviews", productQuery.data?.id, reviewsPage], 
    queryFn: () => fetchReviews({ data: { productId: productQuery.data?.id!, page: reviewsPage, pageSize: 5 } }),
    enabled: !!productQuery.data?.id
  });

  const allProductsQuery = useQuery({ queryKey: ["all-products-list"], queryFn: () => fetchAllProductsFn({ data: { page: 1, pageSize: 200 } }) });

  // Related products query must be declared before any early returns so
  // the hook order remains stable between server and client renders.
  const relatedQuery = useQuery({
    queryKey: ["related-products", productQuery.data?.category_slug],
    queryFn: async () => {
      const prod = productQuery.data;
      if (!prod) return [];
      const result = await fetchAllProductsFn({ data: { category: prod.category_slug, pageSize: 5 } });
      return result?.products.filter((p: any) => p.id !== prod.id).slice(0, 4) || [];
    },
    enabled: !!productQuery.data
  });

  if (productQuery.isLoading) return <div className="min-h-screen bg-background text-foreground p-6">Loading…</div>;
  if (productQuery.error || !productQuery.data) {
    return (
      <main className="min-h-screen bg-background text-foreground p-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-witchy text-4xl mb-4">Not found</h1>
          <p className="mb-4 text-muted-foreground">We couldn't find that item in the apothecary.</p>
          <p className="mb-6 text-sm text-muted-foreground">Requested slug: <strong>{slug}</strong></p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <Link to="/shop" className="underline">Back to shop</Link>
            <Link to="/shop/" className="underline">Browse all products</Link>
          </div>
          <div className="mt-6 text-left">
            <h3 className="text-witchy text-2xl mb-4">Available products</h3>
            {allProductsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading available products…</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {allProductsQuery.data?.products.map((p: any) => (
                  <li key={p.slug}>
                    <Link to="/shop/$slug" params={{ slug: p.slug }} className="underline">{p.name} - {p.slug}</Link>
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

  const isInWishlist = !!wishlistQuery.data?.some(item => item.product_id === product?.id);

  const related = relatedQuery.data || [];

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
            src={product.image || (product.images && product.images[0]) || defaultProductImg}
            alt={product.name}
            width={1024}
            height={1024}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            {product.category?.name || product.category_slug}
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
                {product.use_case?.map((u: string) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Qty + Add + Wishlist */}
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
                  } catch (err) {
                    toast.error("Failed to update wishlist");
                  }
                }}
                className="px-4 py-4 border border-border text-muted-foreground hover:text-foreground transition-colors"
                aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={18} fill={isInWishlist ? "currentColor" : "none"} />
              </button>
            )}
          </div>

          <p className="font-serif mt-6 text-xs italic text-muted-foreground">
            Prepared on order.
          </p>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="border-t border-border/40 bg-card/30 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-witchy text-4xl">Reviews</h2>
              {reviewsQuery.data?.avgRating && (
                <p className="font-serif mt-2 text-lg italic text-muted-foreground">
                  {reviewsQuery.data.avgRating} out of 5 stars • {reviewsQuery.data.total} reviews
                </p>
              )}
            </div>
            {user && (
              <button
                onClick={() => document.getElementById("review-form")?.scrollIntoView({ behavior: "smooth" })}
                className="px-6 py-3 border border-foreground text-xs uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors"
              >
                Leave a Review
              </button>
            )}
          </div>

          {/* Review List */}
          {reviewsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading reviews…</p>
          ) : !reviewsQuery.data?.reviews.length ? (
            <p className="font-serif text-lg italic text-muted-foreground">No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-8">
              {reviewsQuery.data.reviews.map((review) => (
                <div key={review.id} className="border border-border bg-card/40 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        {review.profiles?.full_name || "Anonymous"}
                      </div>
                      {review.title && <div className="font-serif text-lg italic mt-1">{review.title}</div>}
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < review.rating ? "text-foreground" : "text-muted-foreground opacity-30"}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{review.content}</p>
                  {review.is_verified && (
                    <div className="mt-3 text-[10px] uppercase tracking-[0.2em] text-green-600">✓ Verified Purchase</div>
                  )}
                </div>
              ))}

              {/* Reviews Pagination */}
              {reviewsQuery.data.total > 5 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setReviewsPage(Math.max(1, reviewsPage - 1))}
                    disabled={reviewsPage === 1}
                    className="px-4 py-2 border border-border text-xs uppercase tracking-[0.2em] hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page {reviewsPage} of {Math.ceil(reviewsQuery.data.total / 5)}
                  </span>
                  <button
                    onClick={() => setReviewsPage(reviewsPage + 1)}
                    disabled={reviewsPage >= Math.ceil(reviewsQuery.data.total / 5)}
                    className="px-4 py-2 border border-border text-xs uppercase tracking-[0.2em] hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Review Form */}
          {user && (
            <div id="review-form" className="mt-16 border border-border bg-card/40 p-8">
              <h3 className="text-witchy text-2xl mb-6">Leave a Review</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  try {
                    await submitReviewFn({
                      data: {
                        productId: product?.id!,
                        rating: Number(formData.get("rating")),
                        title: formData.get("title") as string || undefined,
                        content: formData.get("content") as string
                      }
                    });
                    toast.success("Review submitted!");
                    queryClient.invalidateQueries({ queryKey: ["product-reviews", product?.id] });
                    e.currentTarget.reset();
                  } catch (err) {
                    toast.error("Failed to submit review");
                  }
                }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <label key={star} className="cursor-pointer">
                        <input
                          type="radio"
                          name="rating"
                          value={star}
                          required
                          className="sr-only"
                        />
                        <span className="text-3xl hover:scale-110 transition-transform block">★</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Title (optional)</label>
                  <input
                    name="title"
                    type="text"
                    className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground"
                    placeholder="What did you think?"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Review</label>
                  <textarea
                    name="content"
                    required
                    rows={5}
                    className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground"
                    placeholder="Tell us about your experience..."
                  />
                </div>
                <button
                  type="submit"
                  className="bg-foreground px-8 py-4 text-xs uppercase tracking-[0.2em] text-background hover:opacity-90 transition-opacity"
                >
                  Submit Review
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

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
