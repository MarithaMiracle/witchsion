import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useApiFn } from "@/lib/api/create-api-fn";
import { format } from "date-fns";
import { toast } from "sonner";
import { Heart } from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth";
import {
  getCommunityGroups,
  getCommunityPosts,
  createPost,
  toggleReaction
} from "@/lib/community.functions";

export const Route = createFileRoute("/community")({
  component: CommunityPage,
  head: () => ({ meta: [{ title: "Community - Witchsion" }] })
});

function CommunityPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeGroupSlug, setActiveGroupSlug] = useState<string | undefined>();
  const [postsPage, setPostsPage] = useState(1);
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  const fetchGroups = useApiFn(getCommunityGroups);
  const fetchPosts = useApiFn(getCommunityPosts);
  const createPostFn = useApiFn(createPost);
  const toggleReactionFn = useApiFn(toggleReaction);

  const groupsQuery = useQuery({ queryKey: ["community-groups"], queryFn: () => fetchGroups() });
  const postsQuery = useQuery({ 
    queryKey: ["community-posts", activeGroupSlug, postsPage], 
    queryFn: () => fetchPosts({ data: { groupSlug: activeGroupSlug, page: postsPage, pageSize: 10 } })
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              the circle
            </span>
            <h1 className="text-witchy mt-3 text-4xl sm:text-5xl">community</h1>
            <p className="font-serif mt-4 text-lg italic text-muted-foreground">
              Connect, share, and grow together.
            </p>
          </div>
          {user && (
            <button
              type="button"
              onClick={() => setShowNewPostForm(!showNewPostForm)}
              className="touch-target w-full border border-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors sm:w-auto"
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
          <div className="lg:col-span-1">
            <div className="border border-border bg-card/40 p-4 sm:p-6">
              <h3 className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-4 sm:mb-6">
                Groups
              </h3>
              <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
                <button
                  type="button"
                  onClick={() => setActiveGroupSlug(undefined)}
                  className={`shrink-0 touch-target rounded-sm border px-4 py-2 text-left text-sm transition-colors lg:w-full lg:rounded-none lg:border-0 lg:px-0 lg:py-2 ${!activeGroupSlug ? "border-foreground text-foreground lg:border-0" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  All Posts
                </button>
                {groupsQuery.isLoading ? (
                  <p className="shrink-0 px-2 text-sm text-muted-foreground lg:px-0">Loading...</p>
                ) : (
                  groupsQuery.data?.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setActiveGroupSlug(group.slug)}
                      className={`shrink-0 touch-target rounded-sm border px-4 py-2 text-left text-sm transition-colors lg:w-full lg:rounded-none lg:border-0 lg:px-0 lg:py-2 ${activeGroupSlug === group.slug ? "border-foreground text-foreground lg:border-0" : "border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      {group.name}
                    </button>
                  ))
                )}
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
                  <div key={post.id} className="border border-border bg-card/40 p-5 sm:p-8">
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
                      
                    </div>

                    
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

 
