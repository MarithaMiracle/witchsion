// /Users/decagon/witchsion/witchsion/src/lib/gamification.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getBadges = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("badges")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { badges: data };
  });

export const getUserBadges = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_badges")
      .select("*, badges(*)")
      .eq("user_id", context.userId)
      .order("earned_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { userBadges: data };
  });

export const getUserTotalPoints = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("get_user_total_points", { user_uuid: context.userId });
    if (error) throw new Error(error.message);
    return { totalPoints: data };
  });

export const getUserPointsHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(20).default(10) }))
  .handler(async ({ data, context }) => {
    const { data: points, error, count } = await context.supabase
      .from("user_points")
      .select("*", { count: "exact" })
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .range((data.page - 1) * data.pageSize, data.page * data.pageSize - 1);
    if (error) throw new Error(error.message);
    return { points, total: count || 0 };
  });

export const adminUpsertBadge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    description: z.string().optional(),
    image: z.string().optional(),
    criteria: z.string().min(1),
    points: z.number().int().min(0).default(0),
  }))
  .handler(async ({ data, context }) => {
    // Check admin
    const { data: roles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const isAdmin = roles?.some(r => r.role === "admin") || false;
    if (!isAdmin) throw new Error("Not authorized");

    const { error, data: result } = await context.supabase
      .from("badges")
      .upsert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  });