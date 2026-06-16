import type { HandlerDef } from "../types";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PublishedContentSchema = z.object({
  type: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(20).default(10),
});

export const getPublishedContent: HandlerDef = {
  handler: async ({ data }) => {
    const parsed = PublishedContentSchema.parse(data || { page: 1, pageSize: 10 });

    try {
      let query = supabaseAdmin
        .from("content")
        .select(`*`, { count: "exact" })
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .range((parsed.page - 1) * parsed.pageSize, parsed.page * parsed.pageSize - 1);

      if (parsed.type) {
        query = query.eq("type", parsed.type);
      }

      const { data: results, error, count } = await query;
      if (error) throw error;
      return { content: results || [], total: count || 0 };
    } catch (e) {
      console.warn("getPublishedContent fallback:", e);
      return { content: [], total: 0 };
    }
  },
};

export const getContentBySlug: HandlerDef = {
  handler: async ({ data }) => {
    const { slug } = z.object({ slug: z.string().min(1) }).parse(data);
    const { data: result, error } = await supabaseAdmin
      .from("content")
      .select(`*`)
      .eq("slug", slug)
      .eq("is_published", true)
      .single();
    if (error) throw new Error(error.message);
    return result;
  },
};

const AdminContentListSchema = z.object({
  type: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(20).default(10),
});

export const adminGetAllContent: HandlerDef = {
  auth: true,
  handler: async ({ data, context }) => {
    const parsed = AdminContentListSchema.parse(data || { page: 1, pageSize: 10 });
    const { supabase, userId } = context!;

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = roles?.some((r) => r.role === "admin") || false;
    if (!isAdmin) throw new Error("Not authorized");

    let query = supabase
      .from("content")
      .select(`*`, { count: "exact" })
      .order("created_at", { ascending: false })
      .range((parsed.page - 1) * parsed.pageSize, parsed.page * parsed.pageSize - 1);

    if (parsed.type) {
      query = query.eq("type", parsed.type);
    }

    const { data: results, error, count } = await query;
    if (error) throw new Error(error.message);
    return { content: results || [], total: count || 0 };
  },
};

const UpsertContentSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  type: z.enum(["blog", "resource"]).default("blog"),
  image: z.string().optional(),
  is_published: z.boolean().default(false),
  published_at: z.string().optional(),
});

export const adminUpsertContent: HandlerDef = {
  auth: true,
  handler: async ({ data, context }) => {
    const parsed = UpsertContentSchema.parse(data);
    const { supabase, userId } = context!;

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = roles?.some((r) => r.role === "admin") || false;
    if (!isAdmin) throw new Error("Not authorized");

    const { error, data: result } = await supabase
      .from("content")
      .upsert({
        ...parsed,
        author_id: userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  },
};

export const adminDeleteContent: HandlerDef = {
  auth: true,
  handler: async ({ data, context }) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(data);
    const { supabase, userId } = context!;

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = roles?.some((r) => r.role === "admin") || false;
    if (!isAdmin) throw new Error("Not authorized");

    const { error } = await supabase.from("content").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  },
};

export const getContentLikes: HandlerDef = {
  handler: async ({ data, authHeader }) => {
    const { contentId } = z.object({ contentId: z.string().uuid() }).parse(data);

    const { count, error } = await supabaseAdmin
      .from("content_likes")
      .select("*", { count: "exact", head: true })
      .eq("content_id", contentId);

    if (error) throw new Error(error.message);

    let hasLiked = false;
    try {
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "");
        const { data: claimsData, error: claimsErr } = await supabaseAdmin.auth.getClaims(token);
        if (!claimsErr && claimsData?.claims?.sub) {
          const userId = claimsData.claims.sub;
          const { data: userLike } = await supabaseAdmin
            .from("content_likes")
            .select("id")
            .eq("content_id", contentId)
            .eq("user_id", userId)
            .maybeSingle();
          if (userLike) hasLiked = true;
        }
      }
    } catch (err) {
      console.error("getContentLikes userLike check failed:", err);
    }

    return { count: count || 0, hasLiked };
  },
};

export const toggleContentLike: HandlerDef = {
  auth: true,
  handler: async ({ data, context }) => {
    const { contentId } = z.object({ contentId: z.string().uuid() }).parse(data);
    const { supabase, userId } = context!;

    const { data: existing, error: fetchErr } = await supabase
      .from("content_likes")
      .select("id")
      .eq("content_id", contentId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchErr) throw new Error(fetchErr.message);

    if (existing) {
      const { error } = await supabase.from("content_likes").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { liked: false };
    }

    const { error } = await supabase
      .from("content_likes")
      .insert({ content_id: contentId, user_id: userId });
    if (error) throw new Error(error.message);
    return { liked: true };
  },
};
