import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getPublishedContent = createServerFn({ method: "GET" })
  .inputValidator(z.object({ type: z.string().optional(), page: z.number().min(1).default(1), pageSize: z.number().min(1).max(20).default(10) }))
  .handler(async ({ data }) => {
    let query = supabaseAdmin
      .from("content")
      .select(`*`, { count: "exact" })
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .range((data.page - 1) * data.pageSize, data.page * data.pageSize - 1);

    if (data.type) {
      query = query.eq("type", data.type);
    }

    const { data: results, error, count } = await query;
    console.log('getPublishedContent results:', results);
    console.log('getPublishedContent error:', error);
    if (error) throw new Error(error.message);
    return { content: results || [], total: count || 0 };
  });

export const getContentBySlug = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    console.log('getContentBySlug called with slug:', data.slug);
    const { data: result, error } = await supabaseAdmin
      .from("content")
      .select(`*`)
      .eq("slug", data.slug)
      .eq("is_published", true)
      .single();
    console.log('getContentBySlug result:', result);
    console.log('getContentBySlug error:', error);
    if (error) throw new Error(error.message);
    return result;
  });

export const adminGetAllContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ type: z.string().optional(), page: z.number().min(1).default(1), pageSize: z.number().min(1).max(20).default(10) }))
  .handler(async ({ data, context }) => {
    // Check if user is admin
    const { data: roles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const isAdmin = roles?.some(r => r.role === "admin") || false;
    if (!isAdmin) throw new Error("Not authorized");

    let query = context.supabase
      .from("content")
      .select(`*`, { count: "exact" })
      .order("created_at", { ascending: false })
      .range((data.page - 1) * data.pageSize, data.page * data.pageSize - 1);

    if (data.type) {
      query = query.eq("type", data.type);
    }

    const { data: results, error, count } = await query;
    if (error) throw new Error(error.message);
    return { content: results || [], total: count || 0 };
  });

export const adminUpsertContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    id: z.string().uuid().optional(),
    slug: z.string().min(1),
    title: z.string().min(1),
    content: z.string().min(1),
    excerpt: z.string().optional(),
    type: z.enum(["blog", "resource"]).default("blog"),
    image: z.string().optional(),
    is_published: z.boolean().default(false),
    published_at: z.string().optional()
  }))
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const isAdmin = roles?.some(r => r.role === "admin") || false;
    if (!isAdmin) throw new Error("Not authorized");

    const { error, data: result } = await context.supabase
      .from("content")
      .upsert({
        ...data,
        author_id: context.userId
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  });

export const adminDeleteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const isAdmin = roles?.some(r => r.role === "admin") || false;
    if (!isAdmin) throw new Error("Not authorized");

    const { error } = await context.supabase.from("content").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getContentComments = createServerFn({ method: "GET" })
  .inputValidator(z.object({ contentId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { data: comments, error } = await supabaseAdmin
      .from("content_comments")
      .select(`*, profiles(full_name), content_comment_likes(user_id)`)
      .eq("content_id", data.contentId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return comments || [];
  });

export const createContentComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ 
    contentId: z.string().uuid(), 
    content: z.string().min(1),
    parentId: z.string().uuid().optional() 
  }))
  .handler(async ({ data, context }) => {
    const { error, data: comment } = await context.supabase
      .from("content_comments")
      .insert({ 
        content_id: data.contentId, 
        user_id: context.userId, 
        content: data.content,
        parent_id: data.parentId 
      })
      .select(`*, profiles(full_name)`)
      .single();
    if (error) throw new Error(error.message);
    return comment;
  });

export const getContentLikes = createServerFn({ method: "GET" })
  .inputValidator(z.object({ contentId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { count, error } = await supabaseAdmin
      .from("content_likes")
      .select('*', { count: 'exact', head: true })
      .eq("content_id", data.contentId);
    
    if (error) throw new Error(error.message);

    let hasLiked = false;
    if (context.userId) {
      const { data: userLike } = await supabaseAdmin
        .from("content_likes")
        .select('id')
        .eq("content_id", data.contentId)
        .eq("user_id", context.userId)
        .maybeSingle();
      if (userLike) hasLiked = true;
    }
    
    return { count: count || 0, hasLiked };
  });

export const toggleContentLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ contentId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("content_likes")
      .select('id')
      .eq("content_id", data.contentId)
      .eq("user_id", context.userId)
      .maybeSingle();
    
    if (existing) {
      const { error } = await context.supabase.from("content_likes").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { liked: false };
    } else {
      const { error } = await context.supabase.from("content_likes").insert({ content_id: data.contentId, user_id: context.userId });
      if (error) throw new Error(error.message);
      return { liked: true };
    }
  });

export const toggleContentCommentLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ commentId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("content_comment_likes")
      .select('id')
      .eq("comment_id", data.commentId)
      .eq("user_id", context.userId)
      .maybeSingle();
    
    if (existing) {
      const { error } = await context.supabase.from("content_comment_likes").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { liked: false };
    } else {
      const { error } = await context.supabase.from("content_comment_likes").insert({ comment_id: data.commentId, user_id: context.userId });
      if (error) throw new Error(error.message);
      return { liked: true };
    }
  });