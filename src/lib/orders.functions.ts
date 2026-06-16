import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ItemSchema = z.object({
  slug: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  category: z.string().max(100).optional(),
  price: z.number().nonnegative(),
  currency: z.enum(["NGN", "USD"]),
  image: z.string().max(500).optional(),
  quantity: z.number().int().min(1).max(50),
});

const CheckoutSchema = z.object({
  items: z.array(ItemSchema).min(1).max(50),
  provider: z.enum(["paystack", "stripe"]),
  contactName: z.string().min(1).max(120),
  contactEmail: z.string().email().max(255),
  contactPhone: z.string().max(40).optional(),
  shippingAddress: z.string().max(500).optional(),
  shippingCity: z.string().max(120).optional(),
  shippingCountry: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  origin: z.string().url(),
});

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CheckoutSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (data.provider === "stripe") {
      throw new Error("Stripe is not configured yet. Please use Paystack for now.");
    }

    const originalCurrency = data.items[0].currency;
    if (data.items.some((i) => i.currency !== originalCurrency)) {
      throw new Error("All items must share a single currency.");
    }

    const exchangeRate = Number(process.env.EXCHANGE_RATE_USD_TO_NGN || 1550);
    const subtotalOriginal = data.items.reduce((s, i) => s + i.price * i.quantity, 0);
    
    // Convert to NGN for Paystack
    let subtotal: number;
    let currency: "NGN";
    if (originalCurrency === "USD") {
      subtotal = Math.round(subtotalOriginal * exchangeRate);
      currency = "NGN";
    } else {
      subtotal = subtotalOriginal;
      currency = originalCurrency;
    }
    const total = subtotal;
    
    console.log(`[orders] Original currency: ${originalCurrency}, original subtotal: ${subtotalOriginal}, converted to ${currency}: ${subtotal}`);

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        status: "pending",
        provider: data.provider,
        currency,
        original_currency: originalCurrency,
        exchange_rate: originalCurrency === "USD" ? exchangeRate : null,
        subtotal_original: originalCurrency === "USD" ? subtotalOriginal : null,
        subtotal,
        shipping: 0,
        total,
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone ?? null,
        shipping_address: data.shippingAddress ?? null,
        shipping_city: data.shippingCity ?? null,
        shipping_country: data.shippingCountry ?? null,
        notes: data.notes ?? null,
      })
      .select()
      .single();

    if (orderErr || !order) {
      console.error("[orders] insert failed", orderErr);
      throw new Error("Could not create order.");
    }

    const itemsPayload = data.items.map((i) => ({
      order_id: order.id,
      product_slug: i.slug,
      product_name: i.name,
      category: i.category ?? null,
      unit_price: i.price,
      currency: i.currency,
      quantity: i.quantity,
      image: i.image ?? null,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(itemsPayload);
    if (itemsErr) {
      console.error("[orders] items insert failed", itemsErr);
      throw new Error("Could not save order items.");
    }

    // Paystack init
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) throw new Error("Paystack is not configured.");

    // Paystack expects subunits (kobo for NGN, cents for USD)
    const amountSubunits = Math.round(total * 100);
    const reference = `ws_${order.id.replace(/-/g, "")}_${Date.now()}`;

    const psRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.contactEmail,
        amount: amountSubunits,
        currency,
        reference,
        callback_url: `${data.origin}/order-confirmation?order=${order.id}`,
        metadata: { order_id: order.id, user_id: userId },
      }),
    });

    const psJson = (await psRes.json()) as {
      status: boolean;
      message: string;
      data?: { authorization_url: string; reference: string; access_code: string };
    };

    if (!psRes.ok || !psJson.status || !psJson.data) {
      console.error("[paystack] init failed", psJson);
      throw new Error(psJson.message || "Could not start payment.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("orders")
      .update({
        provider_ref: psJson.data.reference,
        checkout_url: psJson.data.authorization_url,
      })
      .eq("id", order.id);

    return {
      orderId: order.id,
      checkoutUrl: psJson.data.authorization_url,
    };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return order;
  });

export const verifyOrderPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string }) => z.object({ orderId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) throw new Error("PAYSTACK_SECRET_KEY not configured");

    // Load order using admin client to avoid RLS issues
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from("orders")
      .select("id, provider_ref, status")
      .eq("id", data.orderId)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message || "Could not fetch order");
    if (!order) throw new Error("Order not found");

    if (!order.provider_ref) return { success: false, reason: "no_reference" };
    if (order.status && order.status !== "pending") return { success: false, reason: "not_pending", status: order.status };

    // Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${order.provider_ref}`, {
      headers: { Authorization: `Bearer ${paystackKey}` },
    });
    const verifyJson = await verifyRes.json();
    if (!verifyJson.status) return { success: false, reason: verifyJson.message };

    if (verifyJson.data && verifyJson.data.status === "success") {
      const { error: updateErr } = await supabaseAdmin
        .from("orders")
        .update({ status: "paid" })
        .eq("id", data.orderId);
      if (updateErr) throw new Error(updateErr.message || "Failed to update order status");
      return { success: true, status: "paid" };
    }

    return { success: false, reason: "not_success", status: verifyJson.data?.status };
  });
