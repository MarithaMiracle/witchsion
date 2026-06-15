import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth";
import { listMyOrders } from "@/lib/orders.functions";
import { listMyBookings } from "@/lib/bookings.functions";
import { formatPrice, type Currency } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Your account — Witchsion" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, isAdmin, signOut } = useAuth();
  const fetchOrders = useServerFn(listMyOrders);
  const fetchBookings = useServerFn(listMyBookings);

  const orders = useQuery({ queryKey: ["my-orders"], queryFn: () => fetchOrders() });
  const bookings = useQuery({ queryKey: ["my-bookings"], queryFn: () => fetchBookings() });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              the witch's ledger
            </span>
            <h1 className="text-witchy mt-3 text-5xl md:text-6xl">your account</h1>
            <p className="font-serif mt-3 text-sm italic text-muted-foreground">
              {user?.email}
            </p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="border border-foreground/40 px-5 py-3 text-[10px] uppercase tracking-[0.3em] hover:bg-foreground hover:text-background"
              >
                Admin
              </Link>
            )}
            <button
              onClick={() => signOut()}
              className="border border-border px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-16">
          <div className="ornate-divider text-[10px] uppercase tracking-[0.3em]">
            <span>orders</span>
          </div>
          {orders.isLoading ? (
            <p className="mt-6 text-sm text-muted-foreground">Reading the cards…</p>
          ) : !orders.data?.length ? (
            <p className="font-serif mt-6 text-base italic text-muted-foreground">
              No orders yet. <Link to="/shop" className="underline">Visit the shop</Link>.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {orders.data.map((o) => (
                <li
                  key={o.id}
                  className="border border-border bg-card/40 p-5 sm:flex sm:items-start sm:justify-between"
                >
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      {format(new Date(o.created_at), "d MMM yyyy")} ·{" "}
                      <span className="text-foreground">{o.status}</span>
                    </div>
                    <div className="font-serif mt-2 text-base italic">
                      {o.order_items.length} item{o.order_items.length === 1 ? "" : "s"} —{" "}
                      {o.order_items.map((i) => i.product_name).slice(0, 2).join(", ")}
                      {o.order_items.length > 2 ? ", …" : ""}
                    </div>
                  </div>
                  <div className="mt-3 text-right sm:mt-0">
                    <div className="font-serif text-lg">
                      {formatPrice(Number(o.total), o.currency as Currency)}
                    </div>
                    {o.status === "pending" && o.checkout_url && (
                      <a
                        href={o.checkout_url}
                        className="mt-2 inline-block text-[10px] uppercase tracking-[0.3em] underline"
                      >
                        Resume payment
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-16">
          <div className="ornate-divider text-[10px] uppercase tracking-[0.3em]">
            <span>consultations</span>
          </div>
          {bookings.isLoading ? (
            <p className="mt-6 text-sm text-muted-foreground">…</p>
          ) : !bookings.data?.length ? (
            <p className="font-serif mt-6 text-base italic text-muted-foreground">
              No bookings yet. <Link to="/book" className="underline">Sit with the witch</Link>.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {bookings.data.map((b) => (
                <li
                  key={b.id}
                  className="border border-border bg-card/40 p-5 sm:flex sm:items-start sm:justify-between"
                >
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      {b.status}
                    </div>
                    <div className="font-serif mt-2 text-base italic">{b.service_name}</div>
                  </div>
                  <div className="mt-3 text-right sm:mt-0">
                    <div className="text-sm">
                      {format(new Date(b.scheduled_date), "EEE d MMM")} · {b.scheduled_time}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
