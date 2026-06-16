import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/paystack-webhook")({
  staticData: {
    // Disable CSRF protection for Paystack webhook
    skipCsrf: true,
  },
  server: {
    handlers: {
      POST: async ({ request }) => {
        console.log("[paystack-webhook] Received webhook");
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) {
          console.error("[paystack-webhook] Missing PAYSTACK_SECRET_KEY");
          return new Response("not configured", { status: 500 });
        }

        const signature = request.headers.get("x-paystack-signature") ?? "";
        const body = await request.text();
        console.log("[paystack-webhook] Request body:", body);
        
        const expected = createHmac("sha512", secret).update(body).digest("hex");
        console.log("[paystack-webhook] Expected signature:", expected);
        console.log("[paystack-webhook] Received signature:", signature);

        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expected);
        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
          console.error("[paystack-webhook] Invalid signature");
          return new Response("invalid signature", { status: 401 });
        }

        let event: any;
        try {
          event = JSON.parse(body);
        } catch {
          console.error("[paystack-webhook] Failed to parse JSON");
          return new Response("bad json", { status: 400 });
        }
        console.log("[paystack-webhook] Parsed event:", event);

        const reference: string | undefined = event?.data?.reference;
        if (!reference) {
          console.error("[paystack-webhook] Missing reference in event data");
          return new Response("ok");
        }
        console.log("[paystack-webhook] Looking for order with provider_ref:", reference);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (event.event === "charge.success") {
          console.log("[paystack-webhook] Handling charge.success event");
          const { data: existingOrder, error: fetchErr } = await supabaseAdmin
            .from("orders")
            .select("id, provider_ref")
            .eq("provider_ref", reference)
            .maybeSingle();
          console.log("[paystack-webhook] Found order:", existingOrder, "Error:", fetchErr);
          
          const { data: updateResult, error: updateErr } = await supabaseAdmin
            .from("orders")
            .update({ status: "paid" })
            .eq("provider_ref", reference)
            .select();
          console.log("[paystack-webhook] Update result:", updateResult, "Error:", updateErr);
        } else if (event.event === "charge.failed") {
          console.log("[paystack-webhook] Handling charge.failed event");
          await supabaseAdmin
            .from("orders")
            .update({ status: "failed" })
            .eq("provider_ref", reference);
        }

        return new Response("ok");
      },
    },
  },
});
