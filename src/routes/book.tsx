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
          <h1 className="text-witchy mt-4 text-3xl sm:text-5xl md:text-6xl lg:text-8xl">consultations</h1>
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
          <h1 className="text-witchy mt-4 text-3xl sm:text-5xl md:text-6xl lg:text-8xl">consultations</h1>
          <p className="font-serif mt-3 max-w-2xl text-pretty text-base italic text-muted-foreground sm:mt-4 sm:text-lg">
            Tarot readings, spiritual guidance and spell-work conversations. Sessions are private and reflective.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 gap-8 overflow-x-clip px-4 py-8 sm:gap-10 sm:px-6 sm:py-12 lg:grid-cols-[1.2fr_1fr] lg:gap-12 lg:py-16">
        <aside className="order-first min-w-0 lg:order-none lg:sticky lg:top-20 lg:self-start">
          <div className="w-full min-w-0 border border-border bg-card/40 p-4 sm:p-6">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              <CalendarIcon size={14} /> Your session
            </div>
            {selectedService ? (
              <>
                <div className="font-serif mt-3 break-words text-lg italic sm:mt-4 sm:text-xl">
                  {selectedService.name}
                </div>
                <p className="mt-2 break-words text-pretty text-xs leading-relaxed text-muted-foreground sm:text-sm">
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

        <form onSubmit={submit} className="order-last min-w-0 w-full max-w-full space-y-6 sm:space-y-8 lg:order-none">
          <div className="min-w-0">
            <h2 className="text-witchy text-xl sm:text-2xl md:text-3xl">1. Choose a session</h2>
            <div className="mt-3 flex w-full min-w-0 flex-col gap-2 sm:mt-4 sm:grid sm:grid-cols-2 sm:gap-3">
              {services.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => setServiceSlug(s.slug)}
                  className={`touch-target-block box-border border p-3 text-left transition-colors sm:p-4 ${
                    serviceSlug === s.slug
                      ? "border-foreground bg-foreground/5"
                      : "border-border hover:border-foreground/60"
                  }`}
                >
                  <div className="break-words text-[9px] uppercase tracking-[0.15em] text-muted-foreground sm:text-[10px] sm:tracking-[0.2em]">
                    {s.category}
                  </div>
                  <div className="font-serif mt-1 break-words text-base leading-snug italic sm:text-lg">
                    {s.name}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
                    <span className="shrink-0 text-muted-foreground">{s.duration}</span>
                    <span className="font-medium text-foreground">
                      {s.price ? formatPrice(s.price, s.currency!) : "On request"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-0 overflow-hidden">
            <h2 className="text-witchy text-xl sm:text-2xl md:text-3xl">2. Pick a day</h2>
            <div className="mt-3 grid w-full grid-cols-3 gap-2 sm:mt-4 sm:grid-cols-4 md:grid-cols-7">
              {days.map((d, i) => (
                <button
                  key={d.num}
                  type="button"
                  onClick={() => {
                    setDay(i);
                    setSlot(null);
                  }}
                  className={`min-w-0 border px-1.5 py-2.5 text-center transition-colors sm:px-3 sm:py-3 ${
                    day === i
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="truncate text-[9px] uppercase tracking-[0.1em] sm:text-[10px] sm:tracking-[0.2em]">
                    {d.label}
                  </div>
                  <div className="font-serif mt-0.5 truncate text-xs sm:mt-1 sm:text-sm">{d.num}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <h2 className="text-witchy text-xl sm:text-2xl md:text-3xl">3. Choose a time</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-3 md:grid-cols-6">
              {SLOTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSlot(t)}
                  className={`min-h-11 border px-2 py-2.5 text-xs transition-colors sm:text-sm ${
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

          <div className="min-w-0">
            <h2 className="text-witchy text-xl sm:text-2xl md:text-3xl">4. Your details</h2>
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
