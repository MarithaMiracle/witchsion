import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getCommunityGroups = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("community_groups")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return data || [];
  });

export const getCommunityPosts = createServerFn({ method: "GET" })
  .inputValidator(z.object({ groupSlug: z.string().optional(), page: z.number().min(1).default(1), pageSize: z.number().min(1).max(20).default(10) }))
  .handler(async ({ data: { groupSlug, page, pageSize } }) => {
    // First get all groups for filtering
    const { data: groups } = await supabaseAdmin.from('community_groups').select('id, slug');
    const groupIdToFilter = groups?.find(g => g.slug === groupSlug)?.id;

    let postsQuery = supabaseAdmin
      .from("community_posts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (groupIdToFilter) {
      postsQuery = postsQuery.eq("group_id", groupIdToFilter);
    }

    const { data: posts, error: postsError, count } = await postsQuery;
    console.log('Posts from DB:', posts);
    if (postsError) throw new Error(postsError.message);

    // Get comments and reactions counts for each post
    const postsWithCounts = await Promise.all(
      (posts || []).map(async (post) => {
        const [commentsRes, reactionsRes] = await Promise.all([
          supabaseAdmin
            .from("community_comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id),
          supabaseAdmin
            .from("community_reactions")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id)
        ]);

        return {
          ...post,
          community_comments: [{ count: commentsRes.count || 0 }],
          community_reactions: [{ count: reactionsRes.count || 0 }]
        };
      })
    );

    return {
      posts: postsWithCounts,
      total: count || 0,
      page,
      pageSize
    };
  });



export const createPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ groupId: z.string().uuid().optional(), title: z.string().min(1), content: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    console.log('createPost called with:', { data, userId: context.userId });
    const { error, data: post } = await context.supabase
      .from("community_posts")
      .insert({ user_id: context.userId, title: data.title, content: data.content, group_id: data.groupId })
      .select()
      .single();
    console.log('createPost result:', { error, post });
    if (error) throw new Error(error.message);
    return post;
  });



export const toggleReaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ postId: z.string().uuid(), reaction: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("community_reactions")
      .select("*")
      .eq("post_id", data.postId)
      .eq("user_id", context.userId)
      .single();

    if (existing) {
      const { error } = await context.supabase
        .from("community_reactions")
        .delete()
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { action: 'removed' };
    } else {
      const { error, data: reaction } = await context.supabase
        .from("community_reactions")
        .insert({ user_id: context.userId, post_id: data.postId, reaction: data.reaction })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { action: 'added', reaction };
    }
  });


