import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

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
  .inputValidator((data: unknown) => z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(20),
    ordersSearch: z.string().optional(),
    ordersStatus: z.enum(["pending", "paid", "fulfilled", "cancelled", "failed"]).optional(),
    bookingsSearch: z.string().optional(),
    bookingsStatus: z.enum(["requested", "confirmed", "completed", "cancelled"]).optional(),
  }).parse(data || { page: 1, pageSize: 20 }))
  .handler(async ({ data: input, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { page, pageSize, ordersSearch, ordersStatus, bookingsSearch, bookingsStatus } = input;
    const offset = (page - 1) * pageSize;

    // Build orders query
    let ordersQuery = supabaseAdmin
      .from("orders")
      .select("*, order_items(*)", { count: "exact" })
      .order("created_at", { ascending: false });
    if (ordersStatus) {
      ordersQuery = ordersQuery.eq("status", ordersStatus);
    }
    if (ordersSearch) {
      ordersQuery = ordersQuery.or(`contact_name.ilike.%${ordersSearch}%,contact_email.ilike.%${ordersSearch}%,provider_ref.ilike.%${ordersSearch}%`);
    }
    
    // Build bookings query
    let bookingsQuery = supabaseAdmin
      .from("bookings")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });
    if (bookingsStatus) {
      bookingsQuery = bookingsQuery.eq("status", bookingsStatus);
    }
    if (bookingsSearch) {
      bookingsQuery = bookingsQuery.or(`contact_name.ilike.%${bookingsSearch}%,contact_email.ilike.%${bookingsSearch}%,service_name.ilike.%${bookingsSearch}%`);
    }

    const [ordersRes, bookingsRes, profiles, allOrders, allOrderItems] = await Promise.all([
      ordersQuery.range(offset, offset + pageSize - 1),
      bookingsQuery.range(offset, offset + pageSize - 1),
      supabaseAdmin.from("profiles").select("id, email, full_name, created_at"),
      supabaseAdmin.from("orders").select("*, order_items(*)", { count: "exact" }).order("created_at", { ascending: false }),
      supabaseAdmin.from("order_items").select("*, products(name, image)"),
    ]);

    console.log("[adminGetOverview] orders:", ordersRes);
    console.log("[adminGetOverview] bookings:", bookingsRes);
    console.log("[adminGetOverview] profiles:", profiles);

    const allPaidOrders = (allOrders.data ?? []).filter((o) => o.status === "paid");
    const revenueNgn = allPaidOrders
      .filter((o) => o.currency === "NGN")
      .reduce((s, o) => s + Number(o.total), 0);
    const revenueUsd = allPaidOrders
      .filter((o) => o.currency === "USD")
      .reduce((s, o) => s + Number(o.total), 0);

    // Calculate top products
    const productSales = new Map();
    (allOrderItems.data ?? []).forEach((item) => {
      if (!item.product_id) return;
      const existing = productSales.get(item.product_id) || { count: 0, revenue: 0, name: item.products?.name, image: item.products?.image };
      productSales.set(item.product_id, {
        ...existing,
        count: existing.count + (item.quantity || 1),
        revenue: existing.revenue + Number(item.price_total || item.price || 0),
      });
    });

    const topProducts = Array.from(productSales.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate orders per month for last 12 months
    const now = new Date();
    const monthlyOrders = Array(12).fill(0).map((_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      const count = (allOrders.data ?? []).filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= monthStart && orderDate < monthEnd;
      }).length;
      return { month: date.toLocaleString('default', { month: 'short' }), count };
    }).reverse();

    return {
      orders: ordersRes.data ?? [],
      ordersTotal: ordersRes.count ?? 0,
      bookings: bookingsRes.data ?? [],
      bookingsTotal: bookingsRes.count ?? 0,
      customerCount: profiles.data?.length ?? 0,
      revenueNgn,
      revenueUsd,
      topProducts,
      monthlyOrders,
      page,
      pageSize,
    };
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    id: z.string().uuid(),
    status: z.enum(["pending", "paid", "fulfilled", "cancelled", "failed"])
  }).parse(data))
  .handler(async ({ data: input, context }) => {
    console.log('adminUpdateOrderStatus called with:', input);
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status: input.status })
      .eq("id", input.id)
      .select()
      .single();
    console.log('Supabase result:', { data, error });
    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message);
    }
    return data;
  });

export const adminUpdateBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    id: z.string().uuid(),
    status: z.enum(["requested", "confirmed", "completed", "cancelled"])
  }).parse(data))
  .handler(async ({ data: input, context }) => {
    console.log('adminUpdateBookingStatus called with:', input);
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({ status: input.status })
      .eq("id", input.id)
      .select()
      .single();
    console.log('Supabase result:', { data, error });
    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message);
    }
    return data;
  });

// Product Management
export const adminGetProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(20),
    search: z.string().optional(),
    category: z.string().optional(),
  }).parse(data || { page: 1, pageSize: 20 }))
  .handler(async ({ data: input, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { page, pageSize, search, category } = input;
    const offset = (page - 1) * pageSize;

    let query = supabaseAdmin
      .from("products")
      .select("*, category:categories(*)", { count: "exact" })
      .order("created_at", { ascending: false });
    
    if (category) {
      query = query.eq("category_slug", category);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,blurb.ilike.%${search}%`);
    }

    const { data, error, count } = await query.range(offset, offset + pageSize - 1);

    if (error) throw new Error(error.message);
    return {
      products: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    };
  });

export const adminGetCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    id: z.string().uuid().optional(),
    slug: z.string().min(1),
    name: z.string().min(1),
    category_id: z.string().uuid(),
    category_slug: z.string().min(1),
    price: z.number().nonnegative(),
    currency: z.enum(["NGN", "USD"]),
    image: z.string().optional(),
    blurb: z.string().optional(),
    description: z.string().optional(),
    intention: z.string().optional(),
    use_case: z.array(z.string()).optional(),
    is_active: z.boolean().default(true)
  }).parse(data))
  .handler(async ({ data: input, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("products")
      .upsert(input)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data: input, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", input.id);
    if (error) throw new Error(error.message);
    return true;
  });

export const adminUpsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    id: z.string().uuid().optional(),
    slug: z.string().min(1),
    name: z.string().min(1),
    blurb: z.string().optional()
  }).parse(data))
  .handler(async ({ data: input, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("categories")
      .upsert(input)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  });
