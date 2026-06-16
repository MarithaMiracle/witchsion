import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { useApiFn } from "@/lib/api/create-api-fn";
import { useQuery } from "@tanstack/react-query";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { formatPrice } from "@/lib/catalog";
import { useAuth } from "@/lib/auth";
import { getServices, createBookingWithPayment } from "@/lib/bookings.functions";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Consultations & Readings - Witchsion" },
      {
        name: "description",
        content:
          "Book a tarot reading, spiritual consultation or spell-work conversation with Witchsion.",
      },
      { property: "og:title", content: "Consultations & Readings - Witchsion" },
      {
        property: "og:description",
        content:
          "Tarot, spiritual guidance and spell-work consultations.",
      },
    ],
  }),
  component: BookPage,
});

const SLOTS = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"] as const;

function BookPage() {
  const [serviceSlug, setServiceSlug] = useState<string | null>(null);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fetchServices = useApiFn(getServices);
  const submitBooking = useApiFn(createBookingWithPayment);
  
  const servicesQuery = useQuery({ queryKey: ["services"], queryFn: () => fetchServices() });
  const services = servicesQuery.data || [];
  
  useEffect(() => {
    if (services.length && !serviceSlug) setServiceSlug(services[0].slug);
  }, [services, serviceSlug]);

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [user, email]);

  const selectedService = useMemo(
    () => {
      if (!services.length) return null;
      if (!serviceSlug) return services[0];
      return services.find((s) => s.slug === serviceSlug) || services[0];
    },
    [serviceSlug, services],
  );

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(startOfDay(new Date()), i + 1);
        return { date: d, label: format(d, "EEE"), num: format(d, "d MMM") };
      }),
    [],
  );

  if (servicesQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20 text-center">
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            sit with the witch
          </span>
          <h1 className="text-witchy mt-4 text-4xl sm:text-6xl md:text-8xl">consultations</h1>
          <p className="font-serif mt-6 text-lg italic text-muted-foreground">
            Reading the cards…
          </p>
        </section>
        <SiteFooter />
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedService || !slot || !name || !email) {
      toast.error("Please complete every required field.");
      return;
    }
    if (!user && !loading) {
      navigate({ to: "/auth", search: { redirect: "/book" } });
      return;
    }
    setBusy(true);
    try {
      const result = await submitBooking({
        data: {
          serviceSlug: selectedService.slug,
          serviceName: selectedService.name,
          category: selectedService.category,
          scheduledDate: format(days[day].date, "yyyy-MM-dd"),
          scheduledTime: slot,
          duration: selectedService.duration,
          price: selectedService.price,
          currency: selectedService.currency,
          contactName: name,
          contactEmail: email,
          notes: notes || undefined,
          origin: window.location.origin,
        },
      });
      
      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        toast.success("Booking confirmed!", {
          description: `Your ${selectedService.name} on ${days[day].num} at ${slot} is confirmed!`,
        });
        setSlot(null);
        setName("");
        setNotes("");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Could not save your booking.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Header */}
      <section className="border-b border-border/40 bg-card/30 px-4 sm:px-6 py-14 sm:py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            sit with the witch
          </span>
          <h1 className="text-witchy mt-4 text-4xl sm:text-6xl md:text-8xl">consultations</h1>
          <p className="font-serif mt-4 max-w-2xl text-lg italic text-muted-foreground">
            Tarot readings, spiritual guidance and spell-work conversations. Sessions are private and reflective.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:gap-12 sm:px-6 sm:py-16 lg:grid-cols-[1.2fr_1fr]">
        {/* Summary — shown first on mobile so users see their selection while booking */}
        <aside className="order-first lg:order-none lg:sticky lg:top-20 lg:self-start">
          <div className="border border-border bg-card/40 p-5 sm:p-8">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              <CalendarIcon size={14} /> Your session
            </div>
            {selectedService ? (
              <>
                <div className="font-serif mt-4 text-xl italic sm:text-2xl">
                  {selectedService.name}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {selectedService.description}
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm italic text-muted-foreground">
                Select a service to continue
              </p>
            )}

            <div className="ornate-divider my-6 text-[10px] uppercase tracking-[0.3em]">
              <span>details</span>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Date</dt>
                <dd className="text-right">{days[day].label}, {days[day].num}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Time</dt>
                <dd>{slot ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Duration</dt>
                <dd>{selectedService?.duration ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border/60 pt-3 text-foreground">
                <dt>Price</dt>
                <dd className="font-serif text-lg">
                  {selectedService?.price
                    ? formatPrice(selectedService.price, selectedService.currency!)
                    : "By request"}
                </dd>
              </div>
            </dl>

            <p className="font-serif mt-6 text-xs italic text-muted-foreground">
              You'll receive a confirmation email with payment and call details.
            </p>
          </div>
        </aside>

        <form onSubmit={submit} className="order-last space-y-8 sm:space-y-10 lg:order-none">
          <div>
            <h2 className="text-witchy text-2xl sm:text-3xl">1. Choose a session</h2>
            <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2">
              {services.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => setServiceSlug(s.slug)}
                  className={`touch-target border p-4 text-left transition-colors sm:p-5 ${
                    serviceSlug === s.slug
                      ? "border-foreground bg-foreground/5"
                      : "border-border hover:border-foreground/60"
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    {s.category}
                  </div>
                  <div className="font-serif mt-1 text-lg italic">{s.name}</div>
                  <div className="mt-3 flex items-baseline justify-between text-sm">
                    <span className="text-muted-foreground">{s.duration}</span>
                    <span className="text-foreground">
                      {s.price ? formatPrice(s.price, s.currency!) : "On request"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-witchy text-2xl sm:text-3xl">2. Pick a day</h2>
            <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto pb-2 sm:mt-6">
              {days.map((d, i) => (
                <button
                  key={d.num}
                  type="button"
                  onClick={() => {
                    setDay(i);
                    setSlot(null);
                  }}
                  className={`touch-target shrink-0 border px-4 py-3 text-center transition-colors sm:px-5 sm:py-4 ${
                    day === i
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-[0.2em]">
                    {d.label}
                  </div>
                  <div className="font-serif mt-1 text-base">{d.num}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-witchy text-2xl sm:text-3xl">3. Choose a time</h2>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:grid-cols-3 md:grid-cols-6">
              {SLOTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSlot(t)}
                  className={`touch-target border py-3.5 text-sm transition-colors ${
                    slot === t
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-witchy text-2xl sm:text-3xl">4. Your details</h2>
            <div className="mt-4 grid gap-4 sm:mt-6 sm:grid-cols-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name *"
                className="min-h-11 w-full border border-border bg-transparent px-4 py-3 text-base placeholder:text-muted-foreground focus:border-foreground focus:outline-none sm:text-sm"
                required
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Email *"
                className="min-h-11 w-full border border-border bg-transparent px-4 py-3 text-base placeholder:text-muted-foreground focus:border-foreground focus:outline-none sm:text-sm"
                required
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="What would you like to focus on?"
                className="w-full border border-border bg-transparent px-4 py-3 text-base placeholder:text-muted-foreground focus:border-foreground focus:outline-none sm:col-span-2 sm:text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="touch-target inline-flex w-full items-center justify-center bg-foreground px-7 py-5 text-xs uppercase tracking-[0.3em] text-background transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
          >
            {busy ? "Sending…" : user ? "Request session" : "Sign in & request"}
          </button>
        </form>
      </section>

      <SiteFooter />
    </div>
  );
}
