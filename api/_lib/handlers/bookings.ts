import type { HandlerDef } from "../types";
import { z } from "zod";
import { services as staticServices } from "../../../src/lib/catalog-data";

const getSupabaseAdmin = async () => {
  const { supabaseAdmin } = await import("../../../src/integrations/supabase/client.server");
  return supabaseAdmin;
};

const initializePaystackPayment = async (
  email: string,
  amount: number,
  currency: string,
  reference: string,
  origin?: string,
) => {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) throw new Error("PAYSTACK_SECRET_KEY not configured");

  const paystackAmount = currency === "NGN" ? amount * 100 : amount;

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: paystackAmount,
      currency: currency.toUpperCase(),
      reference,
      callback_url: `${origin || process.env.VITE_APP_URL || process.env.VITE_SUPABASE_URL?.replace("api.supabase.co", "localhost:5173")}/booking-confirm?reference=${reference}`,
    }),
  });

  const data = await response.json();
  if (!data.status) throw new Error(data.message);
  return data.data.authorization_url;
};

const BookingSchema = z.object({
  serviceSlug: z.string().min(1).max(120),
  serviceName: z.string().min(1).max(200),
  category: z.string().max(80).optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime: z.string().min(1).max(20),
  duration: z.string().max(80).optional(),
  price: z.number().nonnegative().optional(),
  currency: z.enum(["NGN", "USD"]).optional(),
  contactName: z.string().min(1).max(120),
  contactEmail: z.string().email().max(255),
  notes: z.string().max(2000).optional(),
  origin: z.string().url().optional(),
});

export const createBooking: HandlerDef = {
  auth: true,
  handler: async ({ data, context }) => {
    const parsed = BookingSchema.parse(data);
    const { supabase, userId } = context!;

    const { error, data: row } = await supabase
      .from("bookings")
      .insert({
        user_id: userId,
        service_slug: parsed.serviceSlug,
        service_name: parsed.serviceName,
        category: parsed.category ?? null,
        scheduled_date: parsed.scheduledDate,
        scheduled_time: parsed.scheduledTime,
        duration: parsed.duration ?? null,
        price: parsed.price ?? null,
        currency: parsed.currency ?? null,
        contact_name: parsed.contactName,
        contact_email: parsed.contactEmail,
        notes: parsed.notes ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  },
};

export const getServices: HandlerDef = {
  handler: async () => {
    try {
      const supabaseAdmin = await getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      if (data && data.length > 0) return data;
    } catch (e) {
      console.warn("getServices DB fallback:", e);
    }
    return staticServices.map((s) => ({
      slug: s.slug,
      name: s.name,
      category: s.category,
      price: s.price ?? null,
      currency: s.currency ?? null,
      duration: s.duration,
      blurb: s.blurb,
      description: s.description,
      image: s.image ?? null,
      is_active: true,
    }));
  },
};

export const getServiceBySlug: HandlerDef = {
  handler: async ({ data }) => {
    const slug = z.string().parse(data);
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: service, error } = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error) throw new Error(error.message);
    return service;
  },
};

export const listMyBookings: HandlerDef = {
  auth: true,
  handler: async ({ context }) => {
    const { data, error } = await context!.supabase
      .from("bookings")
      .select("*")
      .order("scheduled_date", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};

export const createBookingWithPayment: HandlerDef = {
  auth: true,
  handler: async ({ data, context }) => {
    const parsed = BookingSchema.parse(data);
    const { supabase, userId } = context!;

    const { error, data: row } = await supabase
      .from("bookings")
      .insert({
        user_id: userId,
        service_slug: parsed.serviceSlug,
        service_name: parsed.serviceName,
        category: parsed.category ?? null,
        scheduled_date: parsed.scheduledDate,
        scheduled_time: parsed.scheduledTime,
        duration: parsed.duration ?? null,
        price: parsed.price ?? null,
        currency: parsed.currency ?? null,
        contact_name: parsed.contactName,
        contact_email: parsed.contactEmail,
        notes: parsed.notes ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (parsed.price && parsed.price > 0) {
      const reference = `booking_${row.id}_${Date.now()}`;
      const checkoutUrl = await initializePaystackPayment(
        parsed.contactEmail,
        parsed.price,
        parsed.currency || "NGN",
        reference,
        parsed.origin,
      );
      return { ...row, checkoutUrl, reference };
    }

    await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", row.id);
    return { ...row, checkoutUrl: null, reference: null };
  },
};

export const confirmBookingPayment: HandlerDef = {
  handler: async ({ data }) => {
    const { reference } = z.object({ reference: z.string() }).parse(data);
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) throw new Error("PAYSTACK_SECRET_KEY not configured");

    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${paystackSecretKey}` },
    });
    const verifyData = await verifyResponse.json();
    if (!verifyData.status) throw new Error(verifyData.message);
    if (verifyData.data.status !== "success") throw new Error("Payment not successful");

    const bookingId = reference.split("_")[1];

    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);

    if (error) throw new Error(error.message);
    return { success: true, bookingId };
  },
};
