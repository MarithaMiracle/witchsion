// /Users/decagon/witchsion/witchsion/src/routes/blog.$slug.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { format } from "date-fns";
import { Heart } from "lucide-react";
import { toggleContentCommentLike } from "@/lib/content.functions";

import { getContentBySlug, getContentComments, createContentComment, getContentLikes, toggleContentLike } from "@/lib/content.functions";
import { useAuth } from "@/lib/auth";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPostPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center text-center">
      <div>
        <h1 className="text-witchy text-5xl">lost</h1>
        <Link to="/blog" className="mt-6 inline-block text-xs uppercase tracking-[0.2em] underline">
          Back to blog
        </Link>
      </div>
    </div>
  ),
  head: (ctx) => ({
    meta: [
      { title: `${ctx.params.slug} — Witchsion Blog` },
    ],
  }),
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const fetchContent = useServerFn(getContentBySlug);
  const fetchComments = useServerFn(getContentComments);
  const addComment = useServerFn(createContentComment);
  const fetchLikes = useServerFn(getContentLikes);
  const toggleLike = useServerFn(toggleContentLike);
  const toggleCommentLike = useServerFn(toggleContentCommentLike);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const contentQuery = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => fetchContent({ data: { slug } }),
  });

  const commentsQuery = useQuery({
    queryKey: ["blog-comments", contentQuery.data?.id],
    queryFn: () => fetchComments({ data: { contentId: contentQuery.data!.id } }),
    enabled: !!contentQuery.data?.id,
  });

  const likesQuery = useQuery({
    queryKey: ["blog-likes", contentQuery.data?.id],
    queryFn: () => fetchLikes({ data: { contentId: contentQuery.data!.id } }),
    enabled: !!contentQuery.data?.id,
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) => addComment({ data: { contentId: contentQuery.data!.id, content: text, parentId: replyingTo || undefined } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments", contentQuery.data?.id] });
      setCommentText("");
      setReplyingTo(null);
    },
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
        <p className="px-6 py-24 text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (contentQuery.error || !contentQuery.data) {
    return (
      <div className="w-full">
        <div className="px-6 py-24">
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
      <article className="mx-auto max-w-3xl px-6 py-16">
        <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          {post.type || 'blog'}
        </span>
        <h1 className="text-witchy mt-3 text-5xl md:text-6xl">{post.title}</h1>
        
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

        {/* Comments Section */}
        <div className="mt-24 border-t border-border pt-12">
          <h2 className="text-witchy text-4xl mb-8">Comments</h2>
          
          {user ? (
            <form 
              onSubmit={async (e) => { 
                e.preventDefault(); 
                if (commentText.trim()) {
                  try {
                    await commentMutation.mutateAsync(commentText);
                  } catch (err) {
                    console.error("Failed to post comment:", err);
                  }
                }
              }}
              className="mb-12"
            >
              {replyingTo && (
                <div className="mb-2 flex items-center justify-between bg-muted/20 px-4 py-2 text-sm">
                  <span className="text-muted-foreground italic">Replying to comment...</span>
                  <button type="button" onClick={() => setReplyingTo(null)} className="text-foreground hover:underline">Cancel</button>
                </div>
              )}
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full bg-card border border-border p-4 text-sm focus:outline-none focus:border-foreground min-h-[100px]"
                required
              />
              <button
                type="submit"
                disabled={commentMutation.isPending || !commentText.trim()}
                className="mt-4 bg-foreground text-background px-6 py-2 text-[10px] uppercase tracking-[0.2em] hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {commentMutation.isPending ? "Posting..." : "Post Comment"}
              </button>
            </form>
          ) : (
            <div className="mb-12 bg-card/50 border border-border p-6 text-center">
              <p className="font-serif italic text-muted-foreground mb-4">You must be logged in to leave a comment.</p>
              <Link to="/auth" className="inline-block bg-foreground text-background px-6 py-2 text-[10px] uppercase tracking-[0.2em]">
                Log In
              </Link>
            </div>
          )}

          <div className="space-y-8">
            {commentsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading comments...</p>
            ) : commentsQuery.data?.length === 0 ? (
              <p className="font-serif italic text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
            ) : (
              commentsQuery.data?.filter((c: any) => !c.parent_id).map((comment: any) => (
                <CommentNode 
                  key={comment.id} 
                  comment={comment} 
                  allComments={commentsQuery.data || []} 
                  onReply={(id) => {
                    setReplyingTo(id);
                    document.querySelector('textarea')?.focus();
                  }}
                  user={user}
                  onLike={async (id) => {
                    // Optimistic update for comment likes
                    const previousComments = queryClient.getQueryData(["blog-comments", contentQuery.data?.id]);
                    queryClient.setQueryData(["blog-comments", contentQuery.data?.id], (old: any[]) => {
                      if (!old) return old;
                      return old.map(c => {
                        if (c.id === id) {
                          const hasLiked = c.content_comment_likes?.some((l: any) => l.user_id === user?.id);
                          const newLikes = hasLiked 
                            ? c.content_comment_likes.filter((l: any) => l.user_id !== user?.id)
                            : [...(c.content_comment_likes || []), { user_id: user?.id }];
                          return { ...c, content_comment_likes: newLikes };
                        }
                        return c;
                      });
                    });

                    try {
                      await toggleCommentLike({ data: { commentId: id } });
                    } catch (err) {
                      console.error(err);
                      // Revert on error
                      queryClient.setQueryData(["blog-comments", contentQuery.data?.id], previousComments);
                    } finally {
                      queryClient.invalidateQueries({ queryKey: ["blog-comments", contentQuery.data?.id] });
                    }
                  }}
                />
              ))
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

function CommentNode({ comment, allComments, onReply, user, onLike }: { comment: any, allComments: any[], onReply: (id: string) => void, user: any, onLike: (id: string) => void }) {
  const replies = allComments.filter(c => c.parent_id === comment.id);
  const likesCount = comment.content_comment_likes?.length || 0;
  const hasLiked = user && comment.content_comment_likes?.some((l: any) => l.user_id === user.id);
  
  return (
    <div className="pb-6 border-b border-border/20 last:border-0 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-xs uppercase">
          {comment.profiles?.full_name?.charAt(0) || '?'}
        </div>
        <div>
          <div className="text-sm font-medium">{comment.profiles?.full_name || 'Anonymous'}</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {format(new Date(comment.created_at), "d MMM yyyy, h:mm a")}
          </div>
        </div>
      </div>
      <p className="text-foreground/80 mb-3">{comment.content}</p>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={() => user ? onLike(comment.id) : alert('Please log in to like this comment.')}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] transition-colors group"
        >
          <Heart size={12} className={hasLiked ? 'fill-foreground text-foreground' : 'text-muted-foreground group-hover:text-foreground'} />
          <span className={hasLiked ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}>{likesCount}</span>
        </button>

        {user && (
          <button 
            onClick={() => onReply(comment.id)}
            className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
          >
            Reply
          </button>
        )}
      </div>

      {replies.length > 0 && (
        <div className="mt-6 pl-6 sm:pl-8 border-l border-border/30">
          {replies.map(reply => (
            <CommentNode key={reply.id} comment={reply} allComments={allComments} onReply={onReply} user={user} onLike={onLike} />
          ))}
        </div>
      )}
    </div>
  );
}