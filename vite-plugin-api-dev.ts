import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin, ViteDevServer } from "vite";
import { loadEnv } from "vite";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export function apiDevPlugin(): Plugin {
  let server: ViteDevServer;

  return {
    name: "api-dev",
    configureServer(devServer) {
      server = devServer;

      const env = loadEnv(devServer.config.mode, devServer.config.envDir, "");
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value;
      }

      devServer.middlewares.use(async (req, res, next) => {
        const path = req.url?.split("?")[0];
        if (path !== "/api/rpc" || req.method !== "POST") {
          return next();
        }

        try {
          const raw = await readBody(req);
          const { fn, data } = JSON.parse(raw) as { fn?: string; data?: unknown };

          if (!fn) {
            sendJson(res, 400, { error: "Missing function name" });
            return;
          }

          const { handleRpc } = await server.ssrLoadModule("/api/_lib/rpc-handler.ts");
          const result = await handleRpc(fn, data, req.headers.authorization ?? null);
          sendJson(res, 200, result);
        } catch (err) {
          const status = (err as { status?: number }).status ?? 500;
          const message = err instanceof Error ? err.message : "Internal server error";
          const httpStatus = message.startsWith("Unauthorized") ? 401 : status;
          console.error("[api-dev]", err);
          sendJson(res, httpStatus, { error: message });
        }
      });
    },
  };
}
