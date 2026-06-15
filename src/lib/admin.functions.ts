import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const adminGetOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [orders, bookings, profiles] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin.from("profiles").select("id, email, full_name, created_at"),
    ]);
    const paidOrders = (orders.data ?? []).filter((o) => o.status === "paid");
    const revenueNgn = paidOrders
      .filter((o) => o.currency === "NGN")
      .reduce((s, o) => s + Number(o.total), 0);
    const revenueUsd = paidOrders
      .filter((o) => o.currency === "USD")
      .reduce((s, o) => s + Number(o.total), 0);
    return {
      orders: orders.data ?? [],
      bookings: bookings.data ?? [],
      customerCount: profiles.data?.length ?? 0,
      revenueNgn,
      revenueUsd,
    };
  });
