import type { VercelRequest, VercelResponse } from "@vercel/node";
import { products } from "../src/lib/catalog";

const BASE_URL = process.env.VITE_APP_URL || "";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const entries = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/shop", changefreq: "weekly", priority: "0.9" },
    { path: "/book", changefreq: "weekly", priority: "0.9" },
    { path: "/about", changefreq: "monthly", priority: "0.7" },
    { path: "/how-to-order", changefreq: "monthly", priority: "0.7" },
    ...products.map((p) => ({
      path: `/shop/${p.slug}`,
      changefreq: "weekly" as const,
      priority: "0.6",
    })),
  ];

  const urls = entries
    .map((e) =>
      [
        `  <url>`,
        `    <loc>${BASE_URL}${e.path}</loc>`,
        e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
        e.priority ? `    <priority>${e.priority}</priority>` : null,
        `  </url>`,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    urls,
    `</urlset>`,
  ].join("\n");

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.status(200).send(xml);
}
