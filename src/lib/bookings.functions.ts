import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";

const getSupabaseAdmin = async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
};

// Paystack helper
const initializePaystackPayment = async (email: string, amount: number, currency: string, reference: string) => {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) throw new Error("PAYSTACK_SECRET_KEY not configured");

  // Convert amount to kobo (Paystack uses kobo for NGN)
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
      callback_url: `${process.env.VITE_SUPABASE_URL?.replace("api.supabase.co", "localhost:5173")}/booking/confirm?reference=${reference}`,
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
});

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => BookingSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase
      .from("bookings")
      .insert({
        user_id: context.userId,
        service_slug: data.serviceSlug,
        service_name: data.serviceName,
        category: data.category ?? null,
        scheduled_date: data.scheduledDate,
        scheduled_time: data.scheduledTime,
        duration: data.duration ?? null,
        price: data.price ?? null,
        currency: data.currency ?? null,
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        notes: data.notes ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// Get public services
export const getServices = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// Get single service by slug
export const getServiceBySlug = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select("*")
      .order("scheduled_date", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// Create booking with payment
export const createBookingWithPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => BookingSchema.parse(data))
  .handler(async ({ data, context }) => {
    // 1. Insert booking as pending
    const { error, data: row } = await context.supabase
      .from("bookings")
      .insert({
        user_id: context.userId,
        service_slug: data.serviceSlug,
        service_name: data.serviceName,
        category: data.category ?? null,
        scheduled_date: data.scheduledDate,
        scheduled_time: data.scheduledTime,
        duration: data.duration ?? null,
        price: data.price ?? null,
        currency: data.currency ?? null,
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        notes: data.notes ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // 2. Initialize Paystack payment if price exists
    if (data.price && data.price > 0) {
      const reference = `booking_${row.id}_${Date.now()}`;
      const checkoutUrl = await initializePaystackPayment(
        data.contactEmail,
        data.price,
        data.currency || "NGN",
        reference
      );
      return { ...row, checkoutUrl, reference };
    }

    // 3. If free, confirm immediately
    await context.supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", row.id);
    return { ...row, checkoutUrl: null, reference: null };
  });

// Confirm payment and update booking status
export const confirmBookingPayment = createServerFn({ method: "POST" })
  .inputValidator(z.object({ reference: z.string() }))
  .handler(async ({ data }) => {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) throw new Error("PAYSTACK_SECRET_KEY not configured");

    // 1. Verify payment with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${data.reference}`, {
      headers: { Authorization: `Bearer ${paystackSecretKey}` },
    });
    const verifyData = await verifyResponse.json();
    if (!verifyData.status) throw new Error(verifyData.message);
    if (verifyData.data.status !== "success") throw new Error("Payment not successful");

    // 2. Extract booking ID from reference
    const bookingId = data.reference.split("_")[1];

    // 3. Update booking to confirmed
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);

    if (error) throw new Error(error.message);
    return { success: true, bookingId };
  });
