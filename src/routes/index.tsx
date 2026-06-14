import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import forestHero from "@/assets/forest-hero.jpg";
import owlArt from "@/assets/mystic-owl.png";
import oilImg from "@/assets/product-oil.jpg";
import jarImg from "@/assets/product-spelljar.jpg";
import crystalImg from "@/assets/product-crystals.jpg";
import smudgeImg from "@/assets/product-smudge.jpg";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MysticBackground } from "@/components/MysticBackground";
import { categories, services, formatPrice } from "@/lib/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Witchsion — A Witch on a Mission" },
      {
        name: "description",
        content:
          "Hand-charged oils, spell jars, spiritual baths, smudge, crystals and consultations from Witchsion. Spiritual, cultural and entertainment offerings.",
      },
      { property: "og:title", content: "Witchsion — A Witch on a Mission" },
      {
        property: "og:description",
        content:
          "Hand-charged oils, spell jars, baths, smudge, crystals and consultations.",
      },
    ],
  }),
  component: HomePage,
});

const featuredCategories = [
  { slug: "oils", title: "Charged & Conjured Oils", image: oilImg },
  { slug: "spell-jars", title: "Sealed Spell Jars", image: jarImg },
  { slug: "smudge", title: "Smudge & Smoke", image: smudgeImg },
  { slug: "crystals", title: "Crystals", image: crystalImg },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <section className="relative grain isolate overflow-hidden">
        <img
          src={forestHero}
          alt=""
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-veil" />
        <MysticBackground />

        <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-10 px-6 pb-32 pt-32 md:pt-40 lg:pb-44">
          <span className="animate-float-up text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            Established in the dark — for the modern witch
          </span>

          <h1
            className="animate-float-up text-witchy text-balance text-6xl leading-[0.9] sm:text-7xl md:text-[7.5rem] lg:text-[9rem]"
            style={{ animationDelay: "0.1s" }}
          >
            welcome to <br />
            <span className="text-foreground">witchsion</span>
          </h1>

          <p
            className="animate-float-up font-serif max-w-xl text-pretty text-lg italic text-muted-foreground md:text-xl"
            style={{ animationDelay: "0.2s" }}
          >
            Hand-charged oils, sealed spell jars, spiritual baths and quiet
            consultations. Offered as spiritual, cultural and entertainment
            practice — never the washed-out version.
          </p>

          <div
            className="animate-float-up flex flex-wrap gap-3"
            style={{ animationDelay: "0.3s" }}
          >
            <Link
              to="/shop"
              className="group inline-flex items-center gap-3 bg-foreground px-7 py-4 text-xs uppercase tracking-[0.2em] text-background transition-all hover:gap-4"
            >
              Enter the shop
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/book"
              className="inline-flex items-center gap-3 border border-foreground/30 px-7 py-4 text-xs uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-foreground/10"
            >
              Book a reading
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-fog" />
      </section>

      {/* CATEGORY GRID */}
      <section className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="mb-12 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              the apothecary
            </span>
            <h2 className="text-witchy mt-3 text-5xl md:text-6xl">find your tool</h2>
          </div>
          <Link
            to="/shop"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            View everything →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredCategories.map((c) => (
            <Link
              key={c.slug}
              to="/shop"
              search={{ category: c.slug }}
              className="group relative block aspect-[3/4] overflow-hidden bg-card"
            >
              <img
                src={c.image}
                alt={c.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="text-witchy text-2xl leading-tight">{c.title}</div>
                <div className="mt-2 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground transition-colors group-hover:text-foreground">
                  Explore <ArrowRight size={11} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CONSULTATIONS */}
      <section className="relative isolate overflow-hidden border-y border-border/40 bg-card/40 py-24 md:py-32">
        <MysticBackground />
        <div className="relative mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div className="relative">
            <img
              src={owlArt}
              alt="Witchsion mystical owl illustration"
              loading="lazy"
              width={1024}
              height={1024}
              className="mx-auto w-full max-w-md opacity-90 mix-blend-screen animate-flicker"
            />
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              sit with the witch
            </span>
            <h2 className="text-witchy mt-3 text-balance text-5xl md:text-6xl lg:text-7xl">
              readings &amp; consultations
            </h2>
            <p className="font-serif mt-6 max-w-xl text-pretty text-lg italic text-muted-foreground">
              Tarot, spiritual guidance and spell-work consultations. Sessions
              are reflective, cultural and entertainment-focused — bring your
              question, leave with perspective.
            </p>

            <ul className="mt-10 divide-y divide-border/40 border-y border-border/40">
              {services.slice(0, 3).map((s) => (
                <li key={s.slug} className="flex items-baseline justify-between gap-4 py-5">
                  <div>
                    <div className="text-base text-foreground">{s.name}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {s.duration}
                    </div>
                  </div>
                  <div className="font-serif text-lg text-foreground">
                    {s.price ? formatPrice(s.price, s.currency!) : "By request"}
                  </div>
                </li>
              ))}
            </ul>

            <Link
              to="/book"
              className="mt-10 inline-flex items-center gap-3 bg-foreground px-7 py-4 text-xs uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-90"
            >
              Book a session <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ETHOS */}
      <section className="mx-auto max-w-4xl px-6 py-32 text-center">
        <div className="ornate-divider mb-10 text-[10px] uppercase tracking-[0.3em]">
          <span>our practice</span>
        </div>
        <p className="text-witchy text-balance text-4xl leading-tight md:text-6xl">
          "we believe there is no evil and no good magick — the difference is in
          she who wields it."
        </p>
        <p className="font-serif mt-8 text-base italic text-muted-foreground">
          Witchsion is open to anyone, irrespective of age, status, race,
          religion or ethnicity. Everything here is offered as spiritual,
          cultural and entertainment practice.
        </p>
      </section>

      {/* ALL CATEGORIES */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-px bg-border md:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/shop"
              search={{ category: c.slug }}
              className="group block bg-background p-8 transition-colors hover:bg-card"
            >
              <div className="text-witchy text-3xl">{c.name}</div>
              <p className="font-serif mt-2 text-sm italic text-muted-foreground">
                {c.blurb}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground transition-colors group-hover:text-foreground">
                Browse <ArrowRight size={11} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
