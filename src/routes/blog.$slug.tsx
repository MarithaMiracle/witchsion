// /Users/decagon/witchsion/witchsion/src/routes/blog.$slug.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiFn } from "@/lib/api/create-api-fn";
import { useState } from "react";
import { format } from "date-fns";
import { Heart, ArrowLeft } from "lucide-react";
import { getContentBySlug, getContentLikes, toggleContentLike, getPublishedContent } from "@/lib/content.functions";
import { useAuth } from "@/lib/auth";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPostPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center text-center">
        <div>
        <h1 className="text-witchy text-5xl">lost</h1>
        <Link
          to="/blog"
          className="mt-6 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={12} /> BACK TO BLOG
        </Link>
      </div>
    </div>
  ),
  head: (ctx) => ({
    meta: [
      { title: `${ctx.params.slug} - Witchsion Blog` },
    ],
  }),
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const fetchContent = useApiFn(getContentBySlug);
  
  const fetchLikes = useApiFn(getContentLikes);
  const toggleLike = useApiFn(toggleContentLike);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  

  const contentQuery = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => fetchContent({ data: { slug } }),
  });

  const fetchPublished = useApiFn(getPublishedContent);
  const relatedQuery = useQuery({
    queryKey: ["related-posts", contentQuery.data?.id],
    queryFn: () => fetchPublished({ data: { type: 'blog', page: 1, pageSize: 3 } }),
    enabled: !!contentQuery.data?.id,
  });

  const likesQuery = useQuery({
    queryKey: ["blog-likes", contentQuery.data?.id],
    queryFn: () => fetchLikes({ data: { contentId: contentQuery.data!.id } }),
    enabled: !!contentQuery.data?.id,
  });

  

  const likeMutation = useMutation({
    mutationFn: () => toggleLike({ data: { contentId: contentQuery.data!.id } }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["blog-likes", contentQuery.data?.id] });
      const previousLikes = queryClient.getQueryData(["blog-likes", contentQuery.data?.id]);
      
      queryClient.setQueryData(["blog-likes", contentQuery.data?.id], (old: any) => {
        if (!old) return old;
        return {
          count: old.hasLiked ? Math.max(0, old.count - 1) : old.count + 1,
          hasLiked: !old.hasLiked
        };
      });
      
      return { previousLikes };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["blog-likes", contentQuery.data?.id], context?.previousLikes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-likes", contentQuery.data?.id] });
    },
  });

  if (contentQuery.isLoading) {
    return (
      <div className="w-full">
        <p className="px-4 sm:px-6 py-24 text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (contentQuery.error || !contentQuery.data) {
    return (
      <div className="w-full">
        <div className="px-4 sm:px-6 py-24">
          <h1 className="text-witchy text-4xl">not found</h1>
          <p className="font-serif mt-3 text-sm italic text-muted-foreground">
            That post doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const post = contentQuery.data;

  return (
    <div className="w-full">
      <article className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16">
        <div className="mb-6">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={12} /> BACK TO BLOG
          </Link>
        </div>
        <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          {post.type || 'blog'}
        </span>
        <h1 className="text-witchy mt-3 text-4xl sm:text-5xl md:text-6xl">{post.title}</h1>
        
        <div className="mt-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {post.published_at && (
            <span>{format(new Date(post.published_at), "d MMMM yyyy")}</span>
          )}
          {post.profiles?.full_name && <span>by {post.profiles.full_name}</span>}
        </div>

        {post.image && (
          <div className="mt-8 aspect-[16/9] overflow-hidden bg-card">
            <img
              src={post.image}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div
          className="mt-12 [&_p]:mb-6 [&_h2]:font-display [&_h2]:text-4xl [&_h2]:mt-12 [&_h2]:mb-6 [&_h3]:font-display [&_h3]:text-3xl [&_h3]:mt-8 [&_h3]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6 [&_a]:underline [&_a:hover]:opacity-80 [&_blockquote]:border-l-2 [&_blockquote]:border-foreground [&_blockquote]:pl-4 [&_blockquote]:italic text-lg text-foreground/90 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-12 flex items-center gap-4">
          <button
            onClick={() => user ? likeMutation.mutate() : alert('Please log in to like this article.')}
            className="flex items-center gap-2 group"
          >
            <Heart 
              size={20} 
              className={`transition-colors ${likesQuery.data?.hasLiked ? 'fill-foreground text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} 
            />
            <span className="text-sm font-medium">
              {likesQuery.data?.count || 0} {likesQuery.data?.count === 1 ? 'Like' : 'Likes'}
            </span>
          </button>
        </div>

        {/* Recommended posts */}
        <div className="mt-20 border-t border-border pt-12">
          <h2 className="text-witchy text-3xl mb-6">Recommended</h2>
          {relatedQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading recommendations…</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {relatedQuery.data?.content.filter((p: any) => p.id !== contentQuery.data?.id).slice(0,3).map((p: any) => (
                <div key={p.id} className="border border-border bg-card/40 p-4">
                  <Link to={`/blog/${p.slug}`} className="text-witchy block mb-2">{p.title}</Link>
                  <p className="text-sm text-muted-foreground">{p.excerpt || (p.content || '').slice(0,120) + '…'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

