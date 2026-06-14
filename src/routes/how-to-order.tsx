import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/how-to-order")({
  head: () => ({
    meta: [
      { title: "How To Order — Witchsion" },
      {
        name: "description",
        content:
          "How to order from Witchsion: choose your items, pay, and send your delivery details. Shipping worldwide via DHL, within Nigeria via GIG.",
      },
      { property: "og:title", content: "How To Order — Witchsion" },
      {
        property: "og:description",
        content:
          "How to order from Witchsion — payments, installments and shipping.",
      },
    ],
  }),
  component: HowToOrder,
});

const steps = [
  {
    n: "01",
    title: "Browse the shop",
    body: "Scroll through the apothecary and add what calls to you.",
  },
  {
    n: "02",
    title: "Pick what you want",
    body: "Bookmark intentions, products and any consultations you'd like to pair with them.",
  },
  {
    n: "03",
    title: "Make payment",
    body: "Pay in full, or use installments for orders that qualify. Once payments go live on the site you'll check out here. Until then, bank transfer is available.",
  },
  {
    n: "04",
    title: "Send your details",
    body: "Once payment is confirmed, send your name, address, phone, IG handle and the items you ordered.",
  },
];

function HowToOrder() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border/40 bg-card/30 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            the ritual of ordering
          </span>
          <h1 className="text-witchy mt-4 text-6xl md:text-8xl">how to order</h1>
          <p className="font-serif mt-4 max-w-2xl text-lg italic text-muted-foreground">
            A simple four-step process. Hand-prepared on order, sent with care.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <ol className="space-y-2">
          {steps.map((s) => (
            <li
              key={s.n}
              className="grid grid-cols-[auto_1fr] items-start gap-6 border-b border-border/40 py-8"
            >
              <div className="text-witchy text-5xl text-ember/80">{s.n}</div>
              <div>
                <div className="font-serif text-2xl italic text-foreground">{s.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-px bg-border md:grid-cols-2">
          <div className="bg-background p-8">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Installments
            </div>
            <h3 className="text-witchy mt-3 text-3xl">flexible payment</h3>
            <p className="font-serif mt-3 text-sm italic text-muted-foreground">
              Installments start from ₦50,000 with an upfront deposit of 30%. If
              the full payment is not completed within three (3) months, we'll
              send a product equivalent to the value of your deposit.
            </p>
          </div>
          <div className="bg-background p-8">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Shipping
            </div>
            <h3 className="text-witchy mt-3 text-3xl">handled with care</h3>
            <p className="font-serif mt-3 text-sm italic text-muted-foreground">
              We strictly ship via <strong>GIG</strong> within Nigeria and{" "}
              <strong>DHL</strong> internationally. No waybill by bus.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-32 text-center">
        <p className="font-serif text-xl italic text-foreground">
          Thank you for shopping with us.
        </p>
        <Link
          to="/shop"
          className="mt-8 inline-flex items-center justify-center bg-foreground px-7 py-4 text-xs uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-90"
        >
          Enter the shop
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
