import * as esbuild from "esbuild";

// Bundle all RPC handlers into a single serverless function (api/rpc.mjs).
// Vercel ignores underscore-prefixed api folders and won't resolve multi-file imports.
await esbuild.build({
  entryPoints: ["api/lib/rpc-entry.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "api/rpc.mjs",
  packages: "external",
  logLevel: "info",
});

console.log("API bundle written to api/rpc.mjs");
