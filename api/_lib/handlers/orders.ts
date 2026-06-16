import type { HandlerDef } from "../types";
import { z } from "zod";

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

export const createCheckout: HandlerDef = {
  auth: true,
  handler: async ({ data, context }) => {
    const parsed = CheckoutSchema.parse(data);
    const { supabase, userId } = context!;

    if (parsed.provider === "stripe") {
      throw new Error("Stripe is not configured yet. Please use Paystack for now.");
    }

    const originalCurrency = parsed.items[0].currency;
    if (parsed.items.some((i) => i.currency !== originalCurrency)) {
      throw new Error("All items must share a single currency.");
    }

    const exchangeRate = Number(process.env.EXCHANGE_RATE_USD_TO_NGN || 1550);
    const subtotalOriginal = parsed.items.reduce((s, i) => s + i.price * i.quantity, 0);

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

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        status: "pending",
        provider: parsed.provider,
        currency,
        original_currency: originalCurrency,
        exchange_rate: originalCurrency === "USD" ? exchangeRate : null,
        subtotal_original: originalCurrency === "USD" ? subtotalOriginal : null,
        subtotal,
        shipping: 0,
        total,
        contact_name: parsed.contactName,
        contact_email: parsed.contactEmail,
        contact_phone: parsed.contactPhone ?? null,
        shipping_address: parsed.shippingAddress ?? null,
        shipping_city: parsed.shippingCity ?? null,
        shipping_country: parsed.shippingCountry ?? null,
        notes: parsed.notes ?? null,
      })
      .select()
      .single();

    if (orderErr || !order) {
      console.error("[orders] insert failed", orderErr);
      throw new Error("Could not create order.");
    }

    const itemsPayload = parsed.items.map((i) => ({
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

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) throw new Error("Paystack is not configured.");

    const amountSubunits = Math.round(total * 100);
    const reference = `ws_${order.id.replace(/-/g, "")}_${Date.now()}`;

    const psRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: parsed.contactEmail,
        amount: amountSubunits,
        currency,
        reference,
        callback_url: `${parsed.origin}/order-confirmation?order=${order.id}`,
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

    const { supabaseAdmin } = await import("../../../src/integrations/supabase/client.server");
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
  },
};

export const listMyOrders: HandlerDef = {
  auth: true,
  handler: async ({ context }) => {
    const { data, error } = await context!.supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};

export const getOrder: HandlerDef = {
  auth: true,
  handler: async ({ data, context }) => {
    const parsed = z.object({ id: z.string().uuid() }).parse(data);
    const { data: order, error } = await context!.supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", parsed.id)
      .single();
    if (error) throw new Error(error.message);
    return order;
  },
};

export const verifyOrderPayment: HandlerDef = {
  auth: true,
  handler: async ({ data }) => {
    const parsed = z.object({ orderId: z.string().uuid() }).parse(data);
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) throw new Error("PAYSTACK_SECRET_KEY not configured");

    const { supabaseAdmin } = await import("../../../src/integrations/supabase/client.server");
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from("orders")
      .select("id, provider_ref, status")
      .eq("id", parsed.orderId)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message || "Could not fetch order");
    if (!order) throw new Error("Order not found");

    if (!order.provider_ref) return { success: false, reason: "no_reference" };
    if (order.status && order.status !== "pending")
      return { success: false, reason: "not_pending", status: order.status };

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${order.provider_ref}`,
      { headers: { Authorization: `Bearer ${paystackKey}` } },
    );
    const verifyJson = await verifyRes.json();
    if (!verifyJson.status) return { success: false, reason: verifyJson.message };

    if (verifyJson.data && verifyJson.data.status === "success") {
      const { error: updateErr } = await supabaseAdmin
        .from("orders")
        .update({ status: "paid" })
        .eq("id", parsed.orderId);
      if (updateErr) throw new Error(updateErr.message || "Failed to update order status");
      return { success: true, status: "paid" };
    }

    return { success: false, reason: "not_success", status: verifyJson.data?.status };
  },
};
