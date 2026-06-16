import type { HandlerDef } from "../types";
import { z } from "zod";
import { products, categories, formatPrice, productBySlug } from "@/lib/catalog";
import { getPublishedContent } from "./content";

export const getAIAdvice: HandlerDef = {
  auth: true,
  handler: async ({ data }) => {
    const { message } = z.object({ message: z.string().min(1) }).parse(data);

    try {
      const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
      const q = message.trim().toLowerCase();

      if (q.includes("book") || q.includes("consult") || q.includes("reading")) {
        return { reply: "Book a tarot or consultation at /book. Sessions list duration and price there." };
      }

      const bySlug = productBySlug(q.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
      if (bySlug) {
        return {
          reply: `${bySlug.name} — ${bySlug.blurb} Price: ${bySlug.price ? formatPrice(bySlug.price, bySlug.currency) : "By request"}`,
        };
      }

      const found = products.find(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug === q ||
          (p.blurb || "").toLowerCase().includes(q),
      );
      if (found) {
        return {
          reply: `${found.name} — ${found.blurb} Price: ${found.price ? formatPrice(found.price, found.currency) : "By request"}`,
        };
      }

      const cat = categories.find((c) => q.includes(c.slug) || q.includes(c.name.toLowerCase()));
      if (cat) {
        return { reply: `${cat.name} — ${cat.blurb} Browse: /shop?category=${cat.slug}` };
      }

      try {
        const posts = (await getPublishedContent.handler({
          data: { type: "blog", page: 1, pageSize: 10 },
        })) as { content?: Array<{ title?: string; excerpt?: string }> };
        const post = (posts.content || []).find((p) => (p.title || "").toLowerCase().includes(q));
        if (post) {
          return { reply: `${post.title} — ${post.excerpt || "Read the full post on our blog."}` };
        }
      } catch {
        // ignore and fall back to external AI
      }

      if (
        q.includes("contact") ||
        q.includes("social") ||
        q.includes("instagram") ||
        q.includes("facebook") ||
        q.includes("tiktok") ||
        q.includes("whatsapp")
      ) {
        return {
          reply:
            "Contact us: Instagram https://www.instagram.com/witchsion, Facebook https://facebook.com/euphemia.uzoeto, TikTok https://www.tiktok.com/@witchsion, WhatsApp +234121224789 (https://wa.me/234121224789).",
        };
      }

      if (!GROQ_API_KEY) {
        throw new Error("AI key not configured in environment variables (use GROQ_API_KEY)");
      }

      const requestBody = {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are Witchsion's AI. Answer concisely (max 2 sentences) and focus on Witchsion's offerings: charged/conjured oils, incenses, smudge, spell jars, spiritual baths, crystals, tarot readings, and consultations. When asked for product recommendations, suggest up to 3 items by name with a one-line reason and price if known. For bookings, provide the next actionable step (e.g., visit /book). Be clear, knowledgeable, and avoid flowery language.`,
          },
          { role: "user", content: message },
        ],
        max_tokens: 800,
        temperature: 0.7,
      };

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      if (!response.ok) {
        const errorMessage =
          result.error?.message || result.error || `AI request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }
      return { reply: result.choices[0].message.content };
    } catch (err) {
      console.error("[AI] Error:", err);
      throw new Error(err instanceof Error ? err.message : "Failed to get advice");
    }
  },
};
