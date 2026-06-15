import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { adminGetOverview } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Witchsion" }] }),
  component: AdminPage,
});

function AdminPage() {
  const fetchOverview = useServerFn(adminGetOverview);
  const q = useQuery({ queryKey: ["admin-overview"], queryFn: () => fetchOverview() });

  if (q.isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <p className="px-6 py-24 text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (q.error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="px-6 py-24">
          <h1 className="text-witchy text-4xl">forbidden</h1>
          <p className="font-serif mt-3 text-sm italic text-muted-foreground">
            This altar is for admins only.
          </p>
        </div>
      </div>
    );
  }

  const d = q.data!;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          the inner sanctum
        </span>
        <h1 className="text-witchy mt-3 text-5xl md:text-6xl">admin</h1>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Customers" value={d.customerCount.toString()} />
          <Stat label="Orders" value={d.orders.length.toString()} />
          <Stat label="Revenue (NGN)" value={`₦${d.revenueNgn.toLocaleString()}`} />
          <Stat label="Revenue (USD)" value={`$${d.revenueUsd.toLocaleString()}`} />
        </div>

        <h2 className="text-witchy mt-16 text-3xl">orders</h2>
        <div className="mt-6 overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead className="bg-card/60 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {d.orders.map((o) => (
                <tr key={o.id} className="border-t border-border/60">
                  <td className="px-4 py-3">{format(new Date(o.created_at), "d MMM")}</td>
                  <td className="px-4 py-3">{o.contact_name}<br /><span className="text-xs text-muted-foreground">{o.contact_email}</span></td>
                  <td className="px-4 py-3">{o.order_items.length}</td>
                  <td className="px-4 py-3">{o.currency} {Number(o.total).toLocaleString()}</td>
                  <td className="px-4 py-3">{o.status}</td>
                </tr>
              ))}
              {!d.orders.length && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <h2 className="text-witchy mt-16 text-3xl">bookings</h2>
        <div className="mt-6 overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead className="bg-card/60 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {d.bookings.map((b) => (
                <tr key={b.id} className="border-t border-border/60">
                  <td className="px-4 py-3">{format(new Date(b.scheduled_date), "d MMM")} · {b.scheduled_time}</td>
                  <td className="px-4 py-3">{b.service_name}</td>
                  <td className="px-4 py-3">{b.contact_name}<br /><span className="text-xs text-muted-foreground">{b.contact_email}</span></td>
                  <td className="px-4 py-3">{b.status}</td>
                </tr>
              ))}
              {!d.bookings.length && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No bookings yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card/40 p-6">
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="font-serif mt-2 text-3xl">{value}</div>
    </div>
  );
}
