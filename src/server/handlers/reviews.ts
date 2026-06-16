import type { HandlerDef } from "../types";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ReviewsForProductSchema = z.object({
  productId: z.string().uuid(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(10).default(5),
});

export const getReviewsForProduct: HandlerDef = {
  handler: async ({ data }) => {
    const { productId, page, pageSize } = ReviewsForProductSchema.parse(data);

    const { data: reviews, error, count } = await supabaseAdmin
      .from("product_reviews")
      .select(
        `
        *,
        profiles (full_name)
      `,
        { count: "exact" },
      )
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw new Error(error.message);

    const { data: avgData } = await supabaseAdmin
      .from("product_reviews")
      .select("rating")
      .eq("product_id", productId);
    const avgRating = avgData?.length
      ? (avgData.reduce((sum, r) => sum + r.rating, 0) / avgData.length).toFixed(1)
      : null;

    return {
      reviews: reviews || [],
      total: count || 0,
      avgRating,
      page,
      pageSize,
    };
  },
};

export const createReview: HandlerDef = {
  auth: true,
  handler: async ({ data, context }) => {
    const parsed = z
      .object({
        productId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        title: z.string().optional(),
        content: z.string().min(10),
      })
      .parse(data);
    const { supabase, userId } = context!;

    const { error, data: review } = await supabase
      .from("product_reviews")
      .insert({
        product_id: parsed.productId,
        user_id: userId,
        rating: parsed.rating,
        title: parsed.title,
        content: parsed.content,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return review;
  },
};
