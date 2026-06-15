import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { useServerFn } from "@tanstack/react-start";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { services, formatPrice } from "@/lib/catalog";
import { useAuth } from "@/lib/auth";
import { createBooking } from "@/lib/bookings.functions";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Consultations & Readings — Witchsion" },
      {
        name: "description",
        content:
          "Book a tarot reading, spiritual consultation or spell-work conversation with Witchsion. Offered as cultural and entertainment practice.",
      },
      { property: "og:title", content: "Consultations & Readings — Witchsion" },
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
  const [serviceSlug, setServiceSlug] = useState(services[0].slug);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const submitBooking = useServerFn(createBooking);

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [user, email]);

  const selectedService = useMemo(
    () => services.find((s) => s.slug === serviceSlug)!,
    [serviceSlug],
  );

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(startOfDay(new Date()), i + 1);
        return { date: d, label: format(d, "EEE"), num: format(d, "d MMM") };
      }),
    [],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot || !name || !email) {
      toast.error("Please complete every required field.");
      return;
    }
    if (!user && !loading) {
      navigate({ to: "/auth", search: { redirect: "/book" } });
      return;
    }
    setBusy(true);
    try {
      await submitBooking({
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
        },
      });
      toast.success("Request received", {
        description: `We'll confirm your ${selectedService.name} on ${days[day].num} at ${slot} by email.`,
      });
      setSlot(null);
      setName("");
      setNotes("");
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
      <section className="border-b border-border/40 bg-card/30 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            sit with the witch
          </span>
          <h1 className="text-witchy mt-4 text-6xl md:text-8xl">consultations</h1>
          <p className="font-serif mt-4 max-w-2xl text-lg italic text-muted-foreground">
            Tarot readings, spiritual guidance and spell-work conversations.
            Sessions are private, reflective and offered as cultural and
            entertainment practice.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.2fr_1fr]">
        {/* Booking flow */}
        <form onSubmit={submit} className="space-y-10">
          <div>
            <h2 className="text-witchy text-3xl">1. Choose a session</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => setServiceSlug(s.slug)}
                  className={`border p-5 text-left transition-colors ${
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
            <h2 className="text-witchy text-3xl">2. Pick a day</h2>
            <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
              {days.map((d, i) => (
                <button
                  key={d.num}
                  type="button"
                  onClick={() => {
                    setDay(i);
                    setSlot(null);
                  }}
                  className={`shrink-0 border px-5 py-4 text-center transition-colors ${
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
            <h2 className="text-witchy text-3xl">3. Choose a time</h2>
            <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {SLOTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSlot(t)}
                  className={`border py-3 text-sm transition-colors ${
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
            <h2 className="text-witchy text-3xl">4. Your details</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name *"
                className="border border-border bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                required
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Email *"
                className="border border-border bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                required
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="What would you like to focus on?"
                className="border border-border bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none sm:col-span-2"
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center bg-foreground px-7 py-5 text-xs uppercase tracking-[0.3em] text-background transition-opacity hover:opacity-90 sm:w-auto"
          >
            Request session
          </button>
        </form>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-border bg-card/40 p-8">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              <CalendarIcon size={14} /> Your session
            </div>
            <div className="font-serif mt-4 text-2xl italic">
              {selectedService.name}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {selectedService.description}
            </p>

            <div className="ornate-divider my-6 text-[10px] uppercase tracking-[0.3em]">
              <span>details</span>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Date</dt>
                <dd>{days[day].label}, {days[day].num}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Time</dt>
                <dd>{slot ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Duration</dt>
                <dd>{selectedService.duration}</dd>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-3 text-foreground">
                <dt>Price</dt>
                <dd className="font-serif text-lg">
                  {selectedService.price
                    ? formatPrice(selectedService.price, selectedService.currency!)
                    : "By request"}
                </dd>
              </div>
            </dl>

            <p className="font-serif mt-6 text-xs italic text-muted-foreground">
              You'll receive a confirmation email with payment and call details.
              Sessions are offered as cultural and entertainment practice.
            </p>
          </div>
        </aside>
      </section>

      <SiteFooter />
    </div>
  );
}
