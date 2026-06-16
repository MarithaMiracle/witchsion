import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import React from "react";
import { z } from "zod";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getOrder } from "@/lib/orders.functions";
import { verifyOrderPayment } from "@/lib/orders.functions";
import { formatPrice, type Currency } from "@/lib/catalog";

const search = z.object({ order: z.string().optional(), reference: z.string().optional() });

export const Route = createFileRoute("/order-confirmation")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Order received - Witchsion" }] }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { order } = useSearch({ from: "/order-confirmation" });
  const fetchOrder = useServerFn(getOrder);
  const verifyPayment = useServerFn(verifyOrderPayment);
  const q = useQuery({
    queryKey: ["order", order],
    queryFn: () => fetchOrder({ data: { id: order! } }),
    enabled: !!order,
    refetchInterval: (query) =>
      (query.state.data as any)?.status === "pending" ? 3000 : false,
  });

  // Try an immediate verification on page load when order is pending - fallback when webhook delays.
  React.useEffect(() => {
    if (!order) return;
    if (q.data?.status !== "pending") return;
    (async () => {
      try {
        await verifyPayment({ data: { orderId: order } });
        // invalidate / refetch handled by useQuery polling; we trigger a refetch
        // by invalidating the query via the query client if available.
      } catch (err) {
        console.warn("Order verify-on-redirect failed:", err);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          received
        </span>
        <h1 className="text-witchy mt-3 text-6xl">thank you</h1>
        <p className="font-serif mt-4 text-lg italic text-muted-foreground">
          Your order is logged in the grimoire.
        </p>

        {q.data && (
          <div className="mt-12 border border-border bg-card/40 p-8 text-left">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Order · {q.data.status}
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {q.data.order_items.map((i: any) => (
                <li key={i.id} className="flex justify-between">
                  <span className="font-serif italic">
                    {i.product_name} × {i.quantity}
                  </span>
                  <span>{formatPrice(Number(i.unit_price) * i.quantity, i.currency as Currency)}</span>
                </li>
              ))}
            </ul>
            <div className="ornate-divider my-6 text-[10px]"><span /></div>
            <div className="flex justify-between text-base">
              <span className="text-muted-foreground">Total</span>
              <span className="font-serif text-lg">
                {formatPrice(Number(q.data.total), q.data.currency as Currency)}
              </span>
            </div>
            {q.data.status === "pending" && (
              <p className="font-serif mt-4 text-xs italic text-muted-foreground">
                Awaiting payment confirmation… this page refreshes automatically.
              </p>
            )}
          </div>
        )}

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link to="/account" className="border border-foreground/40 px-6 py-3 text-[10px] uppercase tracking-[0.3em] hover:bg-foreground hover:text-background">
            View account
          </Link>
          <Link to="/shop" className="border border-border px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">
            Keep shopping
          </Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
