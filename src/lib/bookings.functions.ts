import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
