import * as esbuild from "esbuild";

// Bundle RPC handlers into a single serverless function.
// Source lives in server/rpc (NOT under api/) so Vercel won't typecheck/deploy each handler.
await esbuild.build({
  entryPoints: ["server/rpc/rpc-entry.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "api/rpc.mjs",
  packages: "external",
  logLevel: "info",
});

console.log("API bundle written to api/rpc.mjs");
