import type { HandlerDef } from "../types";
import { z } from "zod";
import { products, productBySlug, categories } from "@/lib/catalog";
import { getPublishedContent } from "./content";

export const getAdvice: HandlerDef = {
  handler: async ({ data }) => {
    const { question } = z.object({ question: z.string().min(1) }).parse(data);
    const q = question.trim().toLowerCase();

    const concise = (text: string, maxWords = 30) => {
      const cleaned = text.replace(/—/g, "-").replace(/\s+/g, " ").trim();
      const words = cleaned.split(" ");
      return words.length > maxWords ? words.slice(0, maxWords).join(" ") + "..." : cleaned;
    };

    const reply = (text: string) => ({
      provider: "Witchsion AI",
      tone: "direct",
      answer: concise(text),
    });

    const isGeneric =
      q.length < 6 || /^(help|advice|guidance|i need guidance|i need help|need help)$/.test(q);
    if (isGeneric || q === "i need guidance") {
      return reply(
        "I can help with products, bookings, shipping, returns, or blog posts. Which would you like? If product, say name or goal (e.g. 'Citrine' or 'protection').",
      );
    }

    const bySlug = productBySlug(q.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
    if (bySlug) {
      return reply(
        `${bySlug.name}: ${bySlug.blurb} Price: ${bySlug.price ? bySlug.price : "By request"}`,
      );
    }

    const found = products.find((p) => p.name.toLowerCase().includes(q) || p.slug === q);
    if (found) {
      return reply(`${found.name}: ${found.blurb} Price: ${found.price ? found.price : "By request"}`);
    }

    const cat = categories.find((c) => q.includes(c.slug) || q.includes(c.name.toLowerCase()));
    if (cat) {
      return reply(`${cat.name}: ${cat.blurb} Browse the shop category for options.`);
    }

    if (q.includes("book") || q.includes("consult")) {
      return reply(
        "Book a consultation via the /book page. Sessions are advertised with duration and price there.",
      );
    }
    if (q.includes("shipping") || q.includes("deliver")) {
      return reply(
        "Shipping: We ship worldwide. Local carriers and rates vary; see checkout for exact costs.",
      );
    }
    if (q.includes("returns") || q.includes("refund")) {
      return reply(
        "Returns: Most products are handmade and final sale — contact support for exceptions.",
      );
    }

    try {
      const posts = (await getPublishedContent.handler({
        data: { type: "blog", page: 1, pageSize: 10 },
      })) as { content?: Array<{ title?: string; excerpt?: string }> };
      const p = (posts.content || []).find((post) => (post.title || "").toLowerCase().includes(q));
      if (p) return reply(`${p.title}: ${p.excerpt || "Read the full post for details."}`);
    } catch {
      // ignore
    }

    return reply(
      "I don't have a direct answer. Tell me one of: product (name or goal, e.g. 'Citrine' or 'protection'), booking (e.g. 'book tarot June 20'), shipping (country), returns, or a blog post title. Give a short phrase.",
    );
  },
};
