import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyWishlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("wishlist")
      .select("*, products(*, category:categories(name))")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addToWishlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ productId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    console.log("addToWishlist request: userId=", context.userId, "productId=", data.productId);
    const { error, data: row } = await context.supabase
      .from("wishlist")
      .insert({ user_id: context.userId, product_id: data.productId })
      .select()
      .single();
    if (error && error.code !== "23505") {
      console.error("addToWishlist error:", error);
      throw new Error(error.message);
    }
    console.log("addToWishlist success:", !!row);
    return row;
  });

export const removeFromWishlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ productId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    console.log("removeFromWishlist request: userId=", context.userId, "productId=", data.productId);
    const { error } = await context.supabase
      .from("wishlist")
      .delete()
      .eq("user_id", context.userId)
      .eq("product_id", data.productId);
    if (error) {
      console.error("removeFromWishlist error:", error);
      throw new Error(error.message);
    }
    console.log("removeFromWishlist success for productId=", data.productId);
    return { success: true };
  });