import { handlers } from "./registry";
import { getAuthContext } from "./auth";

export async function handleRpc(
  fn: string,
  data: unknown,
  authHeader?: string | null,
) {
  const def = handlers[fn];
  if (!def) {
    throw Object.assign(new Error(`Unknown function: ${fn}`), { status: 404 });
  }

  let context;
  if (def.auth) {
    context = await getAuthContext(authHeader);
  }

  return def.handler({ data, context, authHeader });
}
