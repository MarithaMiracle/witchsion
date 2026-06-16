// /Users/decagon/witchsion/witchsion/src/routes/blog.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getPublishedContent } from "@/lib/content.functions";

export const Route = createFileRoute("/blog/")({
  head: () => ({ meta: [{ title: "Blog — Witchsion" }] }),
  component: BlogPage,
});

function BlogPage() {
  const fetchContent = useServerFn(getPublishedContent);

  const contentQuery = useQuery({
    queryKey: ["blog-list"],
    queryFn: () => fetchContent({ data: { type: "blog", page: 1, pageSize: 5 } }),
  });

  if (contentQuery.isLoading) {
    return (
      <div className="w-full">
        <p className="px-6 py-24 text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (contentQuery.error) {
    return (
      <div className="w-full">
        <div className="px-6 py-24">
          <h1 className="text-witchy text-4xl">error</h1>
          <p className="font-serif mt-3 text-sm italic text-muted-foreground">
            Something went wrong.
          </p>
        </div>
      </div>
    );
  }

  const { content } = contentQuery.data!;
  console.log('Blog content:', content);

  return (
    <div className="w-full">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          the grimoire
        </span>
        <h1 className="text-witchy mt-3 text-5xl md:text-6xl">blog</h1>

        <div className="mt-12 grid gap-8">
          {content.length > 0 ? (
            content.map((post) => (
              <article key={post.id} className="border-b border-border pb-8 last:border-0">
                {post.image && (
                  <div className="mb-4 aspect-[16/9] overflow-hidden bg-card">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {post.published_at && (
                    <span>{format(new Date(post.published_at), "d MMMM yyyy")}</span>
                  )}
                  {post.profiles?.full_name && <span>by {post.profiles.full_name}</span>}
                </div>
                <h2 className="text-witchy mt-3 text-3xl">
                  <Link
                    to="/blog/$slug"
                    params={{ slug: post.slug }}
                    className="underline hover:opacity-80 cursor-pointer"
                  >
                    {post.title}
                  </Link>
                </h2>
                {post.excerpt && (
                  <p className="font-serif mt-4 text-base italic text-muted-foreground">
                    {post.excerpt}
                  </p>
                )}
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Read more <ArrowRight size={11} />
                </Link>
              </article>
            ))
          ) : (
            <p className="font-serif text-sm italic text-muted-foreground">
              No posts yet. Check back soon!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}