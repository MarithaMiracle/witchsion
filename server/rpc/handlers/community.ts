import type { HandlerDef } from "../types";
import { z } from "zod";
import { supabaseAdmin } from "../../../src/integrations/supabase/client.server";

export const getCommunityGroups: HandlerDef = {
  handler: async () => {
    const { data, error } = await supabaseAdmin
      .from("community_groups")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return data || [];
  },
};

const CommunityPostsSchema = z.object({
  groupSlug: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(20).default(10),
});

export const getCommunityPosts: HandlerDef = {
  handler: async ({ data }) => {
    const { groupSlug, page, pageSize } = CommunityPostsSchema.parse(data || { page: 1, pageSize: 10 });

    const { data: groups } = await supabaseAdmin.from("community_groups").select("id, slug");
    const groupIdToFilter = groups?.find((g) => g.slug === groupSlug)?.id;

    let postsQuery = supabaseAdmin
      .from("community_posts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (groupIdToFilter) {
      postsQuery = postsQuery.eq("group_id", groupIdToFilter);
    }

    const { data: posts, error: postsError, count } = await postsQuery;
    if (postsError) throw new Error(postsError.message);

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
            .eq("post_id", post.id),
        ]);

        return {
          ...post,
          community_comments: [{ count: commentsRes.count || 0 }],
          community_reactions: [{ count: reactionsRes.count || 0 }],
        };
      }),
    );

    return {
      posts: postsWithCounts,
      total: count || 0,
      page,
      pageSize,
    };
  },
};

export const createPost: HandlerDef = {
  auth: true,
  handler: async ({ data, context }) => {
    const parsed = z
      .object({
        groupId: z.string().uuid().optional(),
        title: z.string().min(1),
        content: z.string().min(1),
      })
      .parse(data);
    const { supabase, userId } = context!;

    const { error, data: post } = await supabase
      .from("community_posts")
      .insert({
        user_id: userId,
        title: parsed.title,
        content: parsed.content,
        group_id: parsed.groupId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return post;
  },
};

export const toggleReaction: HandlerDef = {
  auth: true,
  handler: async ({ data, context }) => {
    const parsed = z
      .object({
        postId: z.string().uuid(),
        reaction: z.string().min(1),
      })
      .parse(data);
    const { supabase, userId } = context!;

    const { data: existing } = await supabase
      .from("community_reactions")
      .select("*")
      .eq("post_id", parsed.postId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("community_reactions")
        .delete()
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { action: "removed" };
    }

    const { error, data: reaction } = await supabase
      .from("community_reactions")
      .insert({
        user_id: userId,
        post_id: parsed.postId,
        reaction: parsed.reaction,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { action: "added", reaction };
  },
};
