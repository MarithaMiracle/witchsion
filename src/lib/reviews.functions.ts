import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getReviewsForProduct = createServerFn({ method: "GET" })
  .inputValidator(z.object({ productId: z.string().uuid(), page: z.number().min(1).default(1), pageSize: z.number().min(1).max(10).default(5) }))
  .handler(async ({ data: { productId, page, pageSize }, context }) => {
    const { data: reviews, error, count } = await context.supabase
      .from("product_reviews")
      .select(`
        *,
        profiles (full_name)
      `, { count: "exact" })
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw new Error(error.message);
    
    // Calculate average rating
    const { data: avgData } = await context.supabase
      .from("product_reviews")
      .select("rating")
      .eq("product_id", productId);
    const avgRating = avgData?.length ? (avgData.reduce((sum, r) => sum + r.rating, 0) / avgData.length).toFixed(1) : null;
    
    return {
      reviews: reviews || [],
      total: count || 0,
      avgRating,
      page,
      pageSize
    };
  });

export const createReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    productId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    title: z.string().optional(),
    content: z.string().min(10)
  }))
  .handler(async ({ data, context }) => {
    const { error, data: review } = await context.supabase
      .from("product_reviews")
      .insert({
        product_id: data.productId,
        user_id: context.userId,
        rating: data.rating,
        title: data.title,
        content: data.content
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return review;
  });