import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getRequest } from "@tanstack/react-start/server";

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


export const getContentLikes = createServerFn({ method: "GET" })
  .inputValidator(z.object({ contentId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    console.log('getContentLikes called for', data.contentId);

    const { count, error } = await supabaseAdmin
      .from("content_likes")
      .select('*', { count: 'exact', head: true })
      .eq("content_id", data.contentId);

    if (error) {
      console.error('getContentLikes count error:', error);
      throw new Error(error.message);
    }

    // Determine if the requesting user has liked this content. If the
    // client included an Authorization bearer token (attached by the client
    // middleware), decode it to get the user id and check the likes table.
    let hasLiked = false;
    try {
      const request = getRequest();
      const authHeader = request?.headers?.get?.('authorization') || request?.headers?.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const { data: claimsData, error: claimsErr } = await supabaseAdmin.auth.getClaims(token);
        if (!claimsErr && claimsData?.claims?.sub) {
          const userId = claimsData.claims.sub;
          const { data: userLike } = await supabaseAdmin
            .from('content_likes')
            .select('id')
            .eq('content_id', data.contentId)
            .eq('user_id', userId)
            .maybeSingle();
          if (userLike) hasLiked = true;
        }
      }
    } catch (err) {
      console.error('getContentLikes userLike check failed:', err);
    }

    return { count: count || 0, hasLiked };
  });

export const toggleContentLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ contentId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    console.log('toggleContentLike called for', data.contentId, 'by user', context.userId);
    const { data: existing, error: fetchErr } = await context.supabase
      .from("content_likes")
      .select('id')
      .eq("content_id", data.contentId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (fetchErr) {
      console.error('toggleContentLike fetch existing error:', fetchErr);
      throw new Error(fetchErr.message);
    }

    if (existing) {
      const { error } = await context.supabase.from("content_likes").delete().eq("id", existing.id);
      if (error) {
        console.error('toggleContentLike delete error:', error);
        throw new Error(error.message);
      }
      console.log('toggleContentLike: removed like', existing.id);
      return { liked: false };
    } else {
      const { error } = await context.supabase.from("content_likes").insert({ content_id: data.contentId, user_id: context.userId });
      if (error) {
        console.error('toggleContentLike insert error:', error);
        throw new Error(error.message);
      }
      console.log('toggleContentLike: inserted like for user', context.userId);
      return { liked: true };
    }
  });

