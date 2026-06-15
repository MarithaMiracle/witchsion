import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your bag — Witchsion" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, currency, setQty, remove, clear } = useCart();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-6 py-16">
        <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          gathered for ritual
        </span>
        <h1 className="text-witchy mt-3 text-5xl md:text-6xl">your bag</h1>

        {!items.length ? (
          <div className="mt-12">
            <p className="font-serif text-lg italic text-muted-foreground">
              Your bag is empty as a moonless sky.
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-block border border-foreground/40 px-6 py-3 text-[10px] uppercase tracking-[0.3em] hover:bg-foreground hover:text-background"
            >
              To the shop
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
            <ul className="space-y-6">
              {items.map((i) => (
                <li key={i.slug} className="flex gap-4 border-b border-border/60 pb-6">
                  <img src={i.image} alt={i.name} className="h-24 w-24 object-cover" />
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      {i.category}
                    </div>
                    <div className="font-serif text-lg italic">{i.name}</div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center border border-border">
                        <button onClick={() => setQty(i.slug, i.quantity - 1)} className="px-2 py-2">
                          <Minus size={12} />
                        </button>
                        <div className="w-8 text-center text-sm">{i.quantity}</div>
                        <button onClick={() => setQty(i.slug, i.quantity + 1)} className="px-2 py-2">
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(i.slug)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="font-serif text-base">
                    {formatPrice(i.price * i.quantity, i.currency)}
                  </div>
                </li>
              ))}
              <button
                onClick={clear}
                className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
              >
                Clear bag
              </button>
            </ul>

            <aside className="border border-border bg-card/40 p-8 lg:sticky lg:top-24 lg:self-start">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Summary</div>
              <div className="mt-6 flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-serif text-lg">{currency ? formatPrice(subtotal, currency) : "—"}</span>
              </div>
              <p className="font-serif mt-3 text-xs italic text-muted-foreground">
                Shipping calculated after checkout.
              </p>
              <Link
                to="/checkout"
                className="mt-8 block w-full bg-foreground py-4 text-center text-[10px] uppercase tracking-[0.3em] text-background hover:opacity-90"
              >
                Proceed to checkout
              </Link>
            </aside>
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
