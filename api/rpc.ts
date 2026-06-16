import type { VercelRequest, VercelResponse } from "@vercel/node";
import rpcHandler from "./_handler.mjs";

export default function handler(req: VercelRequest, res: VercelResponse) {
  return rpcHandler(req, res);
}
