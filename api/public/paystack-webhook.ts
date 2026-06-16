import { createHmac, timingSafeEqual } from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readBody(req: VercelRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error("[paystack-webhook] Missing PAYSTACK_SECRET_KEY");
    return res.status(500).send("not configured");
  }

  const body = await readBody(req);
  const signature = (req.headers["x-paystack-signature"] as string) ?? "";
  const expected = createHmac("sha512", secret).update(body).digest("hex");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    console.error("[paystack-webhook] Invalid signature");
    return res.status(401).send("invalid signature");
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(body);
  } catch {
    return res.status(400).send("bad json");
  }

  const reference = event?.data?.reference;
  if (!reference) {
    return res.status(200).send("ok");
  }

  const { supabaseAdmin } = await import("../src/integrations/supabase/client.server");

  if (event.event === "charge.success") {
    await supabaseAdmin.from("orders").update({ status: "paid" }).eq("provider_ref", reference);
  } else if (event.event === "charge.failed") {
    await supabaseAdmin.from("orders").update({ status: "failed" }).eq("provider_ref", reference);
  }

  return res.status(200).send("ok");
}
