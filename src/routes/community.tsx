import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { toast } from "sonner";
import { Heart } from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth";
import {
  getCommunityGroups,
  getCommunityPosts,
  getPostComments,
  createPost,
  createComment,
  toggleReaction,
  toggleCommunityCommentLike
} from "@/lib/community.functions";

export const Route = createFileRoute("/community")({
  component: CommunityPage,
  head: () => ({ meta: [{ title: "Community — Witchsion" }] })
});

function CommunityPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeGroupSlug, setActiveGroupSlug] = useState<string | undefined>();
  const [postsPage, setPostsPage] = useState(1);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  const fetchGroups = useServerFn(getCommunityGroups);
  const fetchPosts = useServerFn(getCommunityPosts);
  const fetchComments = useServerFn(getPostComments);
  const createPostFn = useServerFn(createPost);
  const createCommentFn = useServerFn(createComment);
  const toggleReactionFn = useServerFn(toggleReaction);
  const toggleCommentLikeFn = useServerFn(toggleCommunityCommentLike);

  const groupsQuery = useQuery({ queryKey: ["community-groups"], queryFn: () => fetchGroups() });
  const postsQuery = useQuery({ 
    queryKey: ["community-posts", activeGroupSlug, postsPage], 
    queryFn: () => fetchPosts({ data: { groupSlug: activeGroupSlug, page: postsPage, pageSize: 10 } })
  });
  const commentsQuery = useQuery({ 
    queryKey: ["post-comments", expandedPostId], 
    queryFn: () => fetchComments({ data: { postId: expandedPostId! } }),
    enabled: !!expandedPostId
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-center justify-between mb-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              the circle
            </span>
            <h1 className="text-witchy mt-3 text-5xl">community</h1>
            <p className="font-serif mt-4 text-lg italic text-muted-foreground">
              Connect, share, and grow together.
            </p>
          </div>
          {user && (
            <button
              onClick={() => setShowNewPostForm(!showNewPostForm)}
              className="px-6 py-3 border border-foreground text-xs uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors"
            >
              {showNewPostForm ? "Cancel" : "New Post"}
            </button>
          )}
        </div>

        {showNewPostForm && user && (
          <div className="mb-12 border border-border bg-card/40 p-8">
            <h3 className="text-witchy text-2xl mb-6">Share Something</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  await createPostFn({
                    data: {
                      title: formData.get("title") as string,
                      content: formData.get("content") as string
                    }
                  });
                  toast.success("Post created!");
                  queryClient.invalidateQueries({ queryKey: ["community-posts"] });
                  setShowNewPostForm(false);
                  e.currentTarget.reset();
                } catch (err) {
                  toast.error("Failed to create post");
                }
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Title</label>
                <input
                  name="title"
                  required
                  className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground"
                  placeholder="What's on your mind?"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Content</label>
                <textarea
                  name="content"
                  required
                  rows={6}
                  className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground"
                  placeholder="Share your thoughts..."
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowNewPostForm(false)}
                  className="px-6 py-3 border border-border text-xs uppercase tracking-[0.2em] hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] text-background hover:opacity-90 transition-opacity"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar - Groups */}
          <div className="lg:col-span-1">
            <div className="border border-border bg-card/40 p-6">
              <h3 className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-6">
                Groups
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveGroupSlug(undefined)}
                  className={`w-full text-left text-sm py-2 hover:text-foreground transition-colors ${!activeGroupSlug ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  All Posts
                </button>
                {groupsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : groupsQuery.data?.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setActiveGroupSlug(group.slug)}
                    className={`w-full text-left text-sm py-2 hover:text-foreground transition-colors ${activeGroupSlug === group.slug ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main - Posts */}
          <div className="lg:col-span-3">
            {postsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading posts...</p>
            ) : !postsQuery.data?.posts.length ? (
              <p className="font-serif text-lg italic text-muted-foreground">No posts yet. Be the first to share!</p>
            ) : (
              <div className="space-y-8">
                {postsQuery.data.posts.map((post) => (
                  <div key={post.id} className="border border-border bg-card/40 p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                          {post.profiles?.full_name || "Anonymous"}
                        </div>
                        <div className="font-serif mt-1 text-sm italic text-muted-foreground">
                          {format(new Date(post.created_at), "MMMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                    </div>
                    <h3 className="text-witchy text-2xl mb-4">{post.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground mb-6">{post.content}</p>
                    <div className="flex items-center gap-6 mb-4">
                      <button
                        onClick={async () => {
                          try {
                            await toggleReactionFn({ data: { postId: post.id, reaction: 'like' } });
                            queryClient.invalidateQueries({ queryKey: ["community-posts"] });
                          } catch (err) {
                            toast.error("Failed to react");
                          }
                        }}
                        className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        ❤️ {post.community_reactions?.[0]?.count || 0}
                      </button>
                      <button
                        onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                        className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        💬 {post.community_comments?.[0]?.count || 0} Comments
                      </button>
                    </div>

                    {/* Comments Section */}
                    {expandedPostId === post.id && (
                      <div className="border-t border-border/50 pt-6 mt-4">
                        {commentsQuery.isLoading ? (
                          <p className="text-sm text-muted-foreground">Loading comments...</p>
                        ) : !commentsQuery.data?.length ? (
                          <p className="font-serif text-sm italic text-muted-foreground">No comments yet. Be the first!</p>
                        ) : (
                          <div className="space-y-4 mb-6">
                            {commentsQuery.data.filter((c: any) => !c.parent_id).map((comment: any) => (
                              <CommunityCommentNode
                                key={comment.id}
                                comment={comment}
                                allComments={commentsQuery.data}
                                user={user}
                                onReply={(id) => setReplyingTo(id)}
                                onLike={async (id) => {
                                  try {
                                    await toggleCommentLikeFn({ data: { commentId: id } });
                                    queryClient.invalidateQueries({ queryKey: ["post-comments", post.id] });
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                              />
                            ))}
                          </div>
                        )}

                        {user && (
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);
                              try {
                                await createCommentFn({
                                  data: {
                                    postId: post.id,
                                    content: formData.get("comment") as string,
                                    parentId: replyingTo || undefined
                                  }
                                });
                                toast.success("Comment added!");
                                queryClient.invalidateQueries({ queryKey: ["post-comments", post.id] });
                                queryClient.invalidateQueries({ queryKey: ["community-posts"] });
                                setReplyingTo(null);
                                e.currentTarget.reset();
                              } catch (err) {
                                toast.error("Failed to add comment");
                              }
                            }}
                            className="flex flex-col gap-3"
                          >
                            {replyingTo && (
                              <div className="flex items-center justify-between bg-muted/20 px-4 py-2 text-sm">
                                <span className="text-muted-foreground italic">Replying to comment...</span>
                                <button type="button" onClick={() => setReplyingTo(null)} className="text-foreground hover:underline">Cancel</button>
                              </div>
                            )}
                            <div className="flex gap-3">
                              <input
                                name="comment"
                                required
                                placeholder="Add a comment..."
                                className="flex-1 bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground"
                              />
                              <button
                                type="submit"
                                className="bg-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] text-background hover:opacity-90 transition-opacity"
                              >
                                Post
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Posts Pagination */}
                {postsQuery.data.total > 10 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button
                      onClick={() => setPostsPage(Math.max(1, postsPage - 1))}
                      disabled={postsPage === 1}
                      className="px-4 py-2 border border-border text-xs uppercase tracking-[0.2em] hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-muted-foreground">
                      Page {postsPage} of {Math.ceil(postsQuery.data.total / 10)}
                    </span>
                    <button
                      onClick={() => setPostsPage(postsPage + 1)}
                      disabled={postsPage >= Math.ceil(postsQuery.data.total / 10)}
                      className="px-4 py-2 border border-border text-xs uppercase tracking-[0.2em] hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function CommunityCommentNode({ comment, allComments, onReply, user, onLike }: { comment: any, allComments: any[], onReply: (id: string) => void, user: any, onLike: (id: string) => void }) {
  const replies = allComments.filter(c => c.parent_id === comment.id);
  const likesCount = comment.community_comment_likes?.length || 0;
  const hasLiked = user && comment.community_comment_likes?.some((l: any) => l.user_id === user.id);
  
  return (
    <div className="pl-4 border-l border-border/30 mb-4">
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {comment.profiles?.full_name || "Anonymous"}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground mt-2 mb-2">{comment.content}</p>
      
      <div className="flex items-center gap-4 mb-2">
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
        <div className="mt-4 space-y-4">
          {replies.map(reply => (
            <CommunityCommentNode key={reply.id} comment={reply} allComments={allComments} onReply={onReply} user={user} onLike={onLike} />
          ))}
        </div>
      )}
    </div>
  );
}
