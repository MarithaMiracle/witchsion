import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/paystack-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) return new Response("not configured", { status: 500 });

        const signature = request.headers.get("x-paystack-signature") ?? "";
        const body = await request.text();
        const expected = createHmac("sha512", secret).update(body).digest("hex");

        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expected);
        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
          return new Response("invalid signature", { status: 401 });
        }

        let event: any;
        try {
          event = JSON.parse(body);
        } catch {
          return new Response("bad json", { status: 400 });
        }

        const reference: string | undefined = event?.data?.reference;
        if (!reference) return new Response("ok");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (event.event === "charge.success") {
          await supabaseAdmin
            .from("orders")
            .update({ status: "paid" })
            .eq("provider_ref", reference);
        } else if (event.event === "charge.failed") {
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
