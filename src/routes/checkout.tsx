import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApiFn } from "@/lib/api/create-api-fn";
import { toast } from "sonner";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/catalog";
import { createCheckout } from "@/lib/orders.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout - Witchsion" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, currency, clear } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const submit = useApiFn(createCheckout);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [notes, setNotes] = useState("");
  const [provider, setProvider] = useState<"paystack" | "stripe">("paystack");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth", search: { redirect: "/checkout" } });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [user, email]);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!items.length) return;
    setBusy(true);
    try {
      const res = await submit({
        data: {
          items: items.map((i) => ({
            slug: i.slug,
            name: i.name,
            category: i.category,
            price: i.price,
            currency: i.currency,
            image: i.image,
            quantity: i.quantity,
          })),
          provider,
          contactName: name,
          contactEmail: email,
          contactPhone: phone || undefined,
          shippingAddress: address || undefined,
          shippingCity: city || undefined,
          shippingCountry: country || undefined,
          notes: notes || undefined,
          origin: window.location.origin,
        },
      });
      clear();
      window.location.href = res.checkoutUrl;
    } catch (err: any) {
      toast.error(err?.message ?? "Could not start checkout");
      setBusy(false);
    }
  }

  if (loading || !user) return null;

  if (!items.length) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="text-witchy text-5xl">an empty altar</h1>
          <p className="font-serif mt-3 text-sm italic text-muted-foreground">
            Add something to your bag first.
          </p>
          <Link
            to="/shop"
            className="mt-8 inline-block border border-foreground/40 px-6 py-3 text-[10px] uppercase tracking-[0.3em] hover:bg-foreground hover:text-background"
          >
            To the shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-witchy text-5xl md:text-6xl">checkout</h1>

        <form onSubmit={pay} className="mt-12 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-8">
            <fieldset>
              <legend className="text-witchy text-2xl">Contact</legend>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input value={name} onChange={setName} placeholder="Full name *" required />
                <Input value={email} onChange={setEmail} placeholder="Email *" type="email" required />
                <Input value={phone} onChange={setPhone} placeholder="Phone" />
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-witchy text-2xl">Shipping</legend>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input value={address} onChange={setAddress} placeholder="Address" className="sm:col-span-2" />
                <Input value={city} onChange={setCity} placeholder="City" />
                <Input value={country} onChange={setCountry} placeholder="Country" />
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-witchy text-2xl">Notes</legend>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Anything we should know?"
                className="mt-4 w-full border border-border bg-transparent px-4 py-3 text-sm focus:border-foreground focus:outline-none"
              />
            </fieldset>

            <fieldset>
              <legend className="text-witchy text-2xl">Payment</legend>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ProviderOption
                  active={provider === "paystack"}
                  onClick={() => setProvider("paystack")}
                  title="Paystack"
                  blurb="Card · bank · transfer. Best for NG."
                />
                <ProviderOption
                  active={provider === "stripe"}
                  onClick={() => setProvider("stripe")}
                  title="Stripe"
                  blurb="Coming soon - not yet configured."
                  disabled
                />
              </div>
            </fieldset>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-border bg-card/40 p-8">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Your bag</div>
              <ul className="mt-4 space-y-3 text-sm">
                {items.map((i) => (
                  <li key={i.slug} className="flex justify-between gap-3">
                    <span className="font-serif italic">
                      {i.name} <span className="text-muted-foreground">× {i.quantity}</span>
                    </span>
                    <span>{formatPrice(i.price * i.quantity, i.currency)}</span>
                  </li>
                ))}
              </ul>
              <div className="ornate-divider my-6 text-[10px] uppercase tracking-[0.3em]"><span>total</span></div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-serif text-xl">{currency && formatPrice(subtotal, currency)}</span>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="mt-8 w-full bg-foreground py-4 text-[10px] uppercase tracking-[0.3em] text-background hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Preparing…" : `Pay ${currency ? formatPrice(subtotal, currency) : ""}`}
              </button>
              <p className="font-serif mt-4 text-xs italic text-muted-foreground">
                You'll be redirected to {provider} to complete payment securely.
              </p>
            </div>
          </aside>
        </form>
      </section>
      <SiteFooter />
    </div>
  );
}

function Input(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <input
      type={props.type ?? "text"}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      required={props.required}
      className={`border border-border bg-transparent px-4 py-3 text-sm focus:border-foreground focus:outline-none ${props.className ?? ""}`}
    />
  );
}

function ProviderOption({
  active,
  onClick,
  title,
  blurb,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  blurb: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`border p-4 text-left transition-colors ${
        active ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/60"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <div className="font-serif text-base italic">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{blurb}</div>
    </button>
  );
}
