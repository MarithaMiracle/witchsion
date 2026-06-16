import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleRpc } from "./rpc-handler";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fn, data } = req.body ?? {};
  if (!fn || typeof fn !== "string") {
    return res.status(400).json({ error: "Missing function name" });
  }

  try {
    const result = await handleRpc(fn, data, req.headers.authorization);
    return res.status(200).json(result);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    const httpStatus = message.startsWith("Unauthorized") ? 401 : status;
    console.error(`[api/rpc] ${fn} error:`, err);
    return res.status(httpStatus).json({ error: message });
  }
}
