import { createFileRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const searchSchema = z.object({
  category: z.string().optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Shop — Witchsion" },
      {
        name: "description",
        content:
          "Browse Witchsion's catalogue: charged oils, sealed spell jars, spiritual baths, smudge, incense, crystals and more.",
      },
      { property: "og:title", content: "Shop — Witchsion" },
      {
        property: "og:description",
        content:
          "Hand-charged oils, sealed spell jars, baths, smudge, incense and crystals.",
      },
    ],
  }),
  component: ShopLayout,
});

function ShopLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Outlet />
      <SiteFooter />
    </div>
  );
}
