import type { AuthContext } from "./auth";

export type HandlerContext = {
  data: unknown;
  context?: AuthContext;
  authHeader?: string | null;
};

export type HandlerFn = (ctx: HandlerContext) => Promise<unknown>;

export type HandlerDef = {
  handler: HandlerFn;
  auth?: boolean;
};
