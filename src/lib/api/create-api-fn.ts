import { supabase } from "@/integrations/supabase/client";

export type ApiFn<TInput = unknown, TOutput = unknown> = (
  opts?: { data?: TInput },
) => Promise<TOutput>;

export function createApiFn<TInput, TOutput>(name: string): ApiFn<TInput, TOutput> {
  return async (opts?) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await fetch("/api/rpc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ fn: name, data: opts?.data }),
    });

    if (!res.ok) {
      let message = `API error: ${res.status}`;
      try {
        const errBody = await res.json();
        message = errBody.error || message;
      } catch {
        message = (await res.text()) || message;
      }
      throw new Error(message);
    }

    return res.json() as Promise<TOutput>;
  };
}

/** Drop-in replacement for TanStack Start's useServerFn */
export function useApiFn<T extends ApiFn>(fn: T): T {
  return fn;
}
