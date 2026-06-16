// /Users/decagon/witchsion/witchsion/src/routes/resources.$slug.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useApiFn } from "@/lib/api/create-api-fn";
import { format } from "date-fns";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getContentBySlug } from "@/lib/content.functions";

export const Route = createFileRoute("/resources/$slug")({
  component: ResourcePage,
  head: (ctx) => ({
    meta: [
      { title: `${ctx.params.slug} - Witchsion Resources` },
    ],
  }),
});

function ResourcePage() {
  const { slug } = Route.useParams();
  const fetchContent = useApiFn(getContentBySlug);

  const contentQuery = useQuery({
    queryKey: ["resource", slug],
    queryFn: () => fetchContent({ data: { slug } }),
  });

  if (contentQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <p className="px-4 sm:px-6 py-24 text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (contentQuery.error || !contentQuery.data) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="px-4 sm:px-6 py-24">
          <h1 className="text-witchy text-4xl">not found</h1>
          <p className="font-serif mt-3 text-sm italic text-muted-foreground">
            That resource doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const resource = contentQuery.data;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16">
        <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          resource
        </span>
        <h1 className="text-witchy mt-3 text-4xl sm:text-5xl md:text-6xl">{resource.title}</h1>

        <div className="mt-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {resource.published_at && (
            <span>{format(new Date(resource.published_at), "d MMMM yyyy")}</span>
          )}
          {resource.profiles && <span>by {resource.profiles.full_name}</span>}
        </div>

        {resource.image && (
          <div className="mt-8 aspect-[16/9] overflow-hidden bg-card">
            <img
              src={resource.image}
              alt={resource.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div
          className="mt-8 prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: resource.content }}
        />
      </article>
      <SiteFooter />
    </div>
  );
}