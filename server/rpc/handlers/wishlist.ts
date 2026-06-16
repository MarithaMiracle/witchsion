import type { HandlerDef } from "../types";
import { z } from "zod";

export const getMyWishlist: HandlerDef = {
  auth: true,
  handler: async ({ context }) => {
    const { data, error } = await context!.supabase
      .from("wishlist")
      .select("*, products(*, category:categories(name))")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};

export const addToWishlist: HandlerDef = {
  auth: true,
  handler: async ({ data, context }) => {
    const { productId } = z.object({ productId: z.string().uuid() }).parse(data);
    const { supabase, userId } = context!;

    const { error, data: row } = await supabase
      .from("wishlist")
      .insert({ user_id: userId, product_id: productId })
      .select()
      .single();
    if (error && error.code !== "23505") {
      throw new Error(error.message);
    }
    return row;
  },
};

export const removeFromWishlist: HandlerDef = {
  auth: true,
  handler: async ({ data, context }) => {
    const { productId } = z.object({ productId: z.string().uuid() }).parse(data);
    const { supabase, userId } = context!;

    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);
    if (error) throw new Error(error.message);
    return { success: true };
  },
};
