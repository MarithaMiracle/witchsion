import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
} from "@tanstack/react-router";
import { useEffect } from "react";

import owlFavicon from "../assets/mystic-owl.png";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { I18nProvider } from "@/lib/i18n.jsx";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-witchy text-7xl text-foreground">lost</h1>
        <p className="font-serif mt-3 text-base italic text-muted-foreground">
          The path you sought has wandered into the fog.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center border border-foreground/30 px-4 sm:px-6 py-3 text-xs uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-witchy text-5xl text-foreground">a shadow fell</h1>
        <p className="font-serif mt-3 text-sm italic text-muted-foreground">
          Something disturbed the ritual. Try again, or return to the start.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center bg-foreground px-4 sm:px-6 py-3 text-xs uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center border border-foreground/30 px-4 sm:px-6 py-3 text-xs uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Witchsion - A Witch on a Mission" },
      {
        name: "description",
        content:
          "Witchsion offers hand-charged oils, spell jars, spiritual baths, smudge, crystals and consultations for the modern witch.",
      },
      { name: "author", content: "Witchsion" },
      { name: "theme-color", content: "#0a0a14" },
      { property: "og:title", content: "Witchsion - A Witch on a Mission" },
      {
        property: "og:description",
        content:
          "Hand-charged oils, spell jars, baths, smudge, crystals and consultations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Witchsion - A Witch on a Mission" },
    ],
    links: [
      { rel: "icon", href: owlFavicon },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <HeadContent />
      <AuthProvider>
        <CartProvider>
          <I18nProvider>
            <Outlet />
            <Toaster theme="dark" position="bottom-right" />
          </I18nProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
