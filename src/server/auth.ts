import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AuthContext = {
  supabase: ReturnType<typeof createClient<Database>>;
  userId: string;
  claims: Record<string, unknown>;
};

export async function getAuthContext(
  authHeader: string | null | undefined,
): Promise<AuthContext> {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Supabase is not configured on the server.");
  }

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: No authorization header provided");
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    throw new Error("Unauthorized: No token provided");
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    throw new Error("Unauthorized: Invalid token");
  }

  return {
    supabase,
    userId: data.claims.sub,
    claims: data.claims as Record<string, unknown>,
  };
}
