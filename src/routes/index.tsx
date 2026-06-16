import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useApiFn } from "@/lib/api/create-api-fn";
import { format } from "date-fns";

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
import { getPublishedContent } from "@/lib/content.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Witchsion - A Witch on a Mission" },
      {
        name: "description",
        content:
          "Hand-charged oils, spell jars, spiritual baths, smudge, crystals and consultations from Witchsion.",
      },
      { property: "og:title", content: "Witchsion - A Witch on a Mission" },
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
  const fetchContent = useApiFn(getPublishedContent);
  const blogQuery = useQuery({ 
    queryKey: ["home-blog"], 
    queryFn: () => fetchContent({ data: { type: "blog", page: 1, pageSize: 3 } }) 
  });

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

        <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 pb-24 pt-24 sm:gap-10 sm:px-6 sm:pb-32 sm:pt-32 md:pt-40 lg:pb-44">
          <h1
            className="animate-float-up text-witchy text-balance text-5xl leading-[0.95] sm:text-6xl sm:leading-[0.9] md:text-[7.5rem] lg:text-[9rem]"
            style={{ animationDelay: "0.1s" }}
          >
            welcome to <br />
            <span className="text-foreground">witchsion</span>
          </h1>

          <p
            className="animate-float-up font-serif max-w-xl text-pretty text-lg italic text-muted-foreground md:text-xl"
            style={{ animationDelay: "0.2s" }}
          >
            Hand-charged oils, sealed spell jars, spiritual baths and quiet consultations.
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
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 py-24 md:py-32">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredCategories.map((c) => (
            <Link
              key={c.slug}
              to="/shop"
              search={{ category: c.slug }}
              className="group relative block w-full aspect-[3/4] overflow-hidden bg-transparent"
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
      <section className="relative isolate overflow-hidden border-y border-border/40 bg-card/40 py-14 sm:py-20 md:py-28">
        <MysticBackground />
        <div className="relative mx-auto grid w-full min-w-0 max-w-7xl gap-10 px-4 sm:gap-12 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-16">
          <div className="relative min-w-0">
            <img
              src={owlArt}
              alt="Witchsion mystical owl illustration"
              loading="lazy"
              width={1024}
              height={1024}
              className="mx-auto w-full max-w-[14rem] opacity-90 mix-blend-screen animate-flicker sm:max-w-xs md:max-w-md"
            />
          </div>

          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              sit with the witch
            </span>
            <h2 className="text-witchy mt-3 text-balance text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
              readings &amp; consultations
            </h2>
            <p className="font-serif mt-4 max-w-xl text-pretty text-base italic text-muted-foreground sm:mt-6 sm:text-lg">
              Tarot, spiritual guidance and spell-work consultations. Bring your question, leave with perspective.
            </p>

            <ul className="mt-8 divide-y divide-border/40 border-y border-border/40 sm:mt-10">
              {services.slice(0, 3).map((s) => (
                <li
                  key={s.slug}
                  className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 sm:py-5"
                >
                  <div className="min-w-0">
                    <div className="break-words text-sm text-foreground sm:text-base">{s.name}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground sm:tracking-[0.2em]">
                      {s.duration}
                    </div>
                  </div>
                  <div className="shrink-0 font-serif text-base text-foreground sm:text-lg">
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
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-32 text-center">
        <div className="ornate-divider mb-10 text-[10px] uppercase tracking-[0.3em]">
          <span>our practice</span>
        </div>
        <p className="text-witchy text-balance text-4xl leading-tight md:text-6xl">
          "we believe there is no evil and no good magick - the difference is in
          she who wields it."
        </p>
        <p className="font-serif mt-8 text-base italic text-muted-foreground">
          Witchsion is open to anyone, irrespective of age, status, race, religion or ethnicity.
        </p>
      </section>

      {/* Latest Blog Posts */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 py-24 md:py-32">
        <div className="mb-12 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              from the grimoire
            </span>
            <h2 className="text-witchy mt-3 text-5xl md:text-6xl">latest insights</h2>
          </div>
          <Link
            to="/blog"
            className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            View all posts <ArrowRight size={11} className="inline ml-1" />
          </Link>
        </div>

        {blogQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Unveiling the latest insights…</p>
        ) : blogQuery.data?.content.length === 0 ? (
          <p className="font-serif text-base italic text-muted-foreground">
            No posts yet. Check back soon for mystical insights!
          </p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {blogQuery.data?.content.map((post) => (
              <Link
                key={post.id}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group block"
              >
                {post.image && (
                  <div className="aspect-[16/9] overflow-hidden bg-card mb-4">
                    <img
                      src={post.image}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover opacity-80 transition-all duration-700 group-hover:opacity-100 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  {post.published_at && (
                    <span>{format(new Date(post.published_at), "d MMM yyyy")}</span>
                  )}
                </div>
                <h3 className="text-witchy mt-3 text-2xl group-hover:underline">{post.title}</h3>
                {post.excerpt && (
                  <p className="font-serif mt-3 text-base italic text-muted-foreground">
                    {post.excerpt}
                  </p>
                )}
                <div className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground transition-colors group-hover:text-foreground">
                  Read more <ArrowRight size={11} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* All Categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
        <div className="flex justify-center">
          <div className="inline-grid grid-cols-1 md:grid-cols-3 gap-px bg-background w-full md:w-auto">
            {categories.map((c) => (
              <>
                {c.slug === "crystals" && (
                  <div key={`spacer-${c.slug}`} className="hidden md:block invisible p-8" aria-hidden />
                )}
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
              </>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
