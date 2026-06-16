import { createFileRoute } from "@tanstack/react-router";

import owlArt from "@/assets/mystic-owl.png";
import forestHero from "@/assets/forest-hero.jpg";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About - Witchsion" },
      {
        name: "description",
        content:
          "Witchsion is a witch on a mission. We exist to make your spiritual life richer and to share an honest, unfiltered view of witchcraft.",
      },
      { property: "og:title", content: "About - Witchsion" },
      {
        property: "og:description",
        content:
          "A witch on a mission.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="relative isolate grain overflow-hidden">
        <img
          src={forestHero}
          alt=""
          width={1920}
          height={1080}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-veil" />

        <div className="relative mx-auto grid max-w-7xl gap-16 px-6 pb-24 pt-28 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              the mission
            </span>
            <h1 className="text-witchy mt-4 text-balance text-6xl leading-[0.95] md:text-8xl">
              about <br /> witchsion
            </h1>
            <p className="font-serif mt-8 max-w-xl text-pretty text-xl italic text-muted-foreground">
              Our mission is to make your spiritual life richer - and to educate
              on what witchcraft actually is, not the washed-out version.
            </p>
          </div>

          <img
            src={owlArt}
            alt="Witchsion mystical owl"
            loading="lazy"
            width={1024}
            height={1024}
            className="mx-auto w-full max-w-sm opacity-90 mix-blend-screen animate-flicker"
          />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24">
        <div className="space-y-10 text-base leading-relaxed text-muted-foreground">
          <p className="font-serif text-2xl italic text-foreground">
            Witchsion is a fusion of <em>Witch</em> and <em>Mission</em> - a
            witch on a mission to demystify the craft and walk with you on your
            spiritual journey.
          </p>

          <p>
            What we do is not the washed-out version. Our practices, teachings,
            products and services are for everyone, irrespective of age,
            status, race, religion or ethnicity.
          </p>

          <p>
            Our goal is to enlighten you on spirituality, debunk myth and help
            you on your path - to show why witchcraft can be done by anyone,
            why their belief matters, and why curiosity is more useful than
            fear.
          </p>

          <p className="font-serif border-l-2 border-ember/60 pl-6 text-xl italic text-foreground">
            "We believe there is no evil and no good magick - all magick is the
            same. The difference is in she who wields it."
          </p>

          <p>
            Welcome to our page, beautiful witch. We look forward to working
            with you.
          </p>
        </div>

        <p className="font-serif mt-8 text-pretty text-sm italic text-muted-foreground">
          
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
