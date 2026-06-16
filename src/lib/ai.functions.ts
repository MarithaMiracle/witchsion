import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { products, categories, formatPrice, productBySlug } from "./catalog";
import { getPublishedContent } from "./content.functions";

export const getAIAdvice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ message: z.string().min(1) }))
  .handler(async ({ data }) => {
    try {
      const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROK_API_KEY; // Support both env var names for flexibility
      console.log("[AI] Checking for API key...", !!GROQ_API_KEY);

      // Local-first: try to answer from site data (products, categories, blog) before calling external AI.
      const q = (data.message || "").trim().toLowerCase();

      // Booking intent
      if (q.includes("book") || q.includes("consult") || q.includes("reading")) {
        return { reply: "Book a tarot or consultation at /book. Sessions list duration and price there." };
      }

      // Product exact or partial match
      const bySlug = productBySlug(q.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
      if (bySlug) {
        return { reply: `${bySlug.name} — ${bySlug.blurb} Price: ${bySlug.price ? formatPrice(bySlug.price, bySlug.currency) : 'By request'}` };
      }

      const found = products.find(p => p.name.toLowerCase().includes(q) || p.slug === q || (p.blurb || '').toLowerCase().includes(q));
      if (found) {
        return { reply: `${found.name} — ${found.blurb} Price: ${found.price ? formatPrice(found.price, found.currency) : 'By request'}` };
      }

      // Category match
      const cat = categories.find(c => q.includes(c.slug) || q.includes(c.name.toLowerCase()));
      if (cat) {
        return { reply: `${cat.name} — ${cat.blurb} Browse: /shop?category=${cat.slug}` };
      }

      // Blog post title lookup (short list)
      try {
        const posts = await getPublishedContent({ data: { type: 'blog', page: 1, pageSize: 10 } });
        const post = (posts.content || []).find((p: any) => (p.title || '').toLowerCase().includes(q));
        if (post) return { reply: `${post.title} — ${post.excerpt || 'Read the full post on our blog.'}` };
      } catch (e) {
        // ignore and fall back to external AI
      }

      // Contact/social info quick answers
      if (q.includes('contact') || q.includes('social') || q.includes('instagram') || q.includes('facebook') || q.includes('tiktok') || q.includes('whatsapp')) {
        return { reply: `Contact us: Instagram https://www.instagram.com/witchsion, Facebook https://facebook.com/euphemia.uzoeto, TikTok https://www.tiktok.com/@witchsion, WhatsApp +234121224789 (https://wa.me/234121224789).` };
      }

      if (!GROQ_API_KEY) throw new Error("AI key not configured in environment variables (use GROQ_API_KEY)");

      const requestBody = {
        model: "llama-3.1-8b-instant", // Good default Groq model (fast and cost-effective)
        messages: [
          {
              role: "system",
              content: `You are Witchsion's AI. Answer concisely (max 2 sentences) and focus on Witchsion's offerings: charged/conjured oils, incenses, smudge, spell jars, spiritual baths, crystals, tarot readings, and consultations. When asked for product recommendations, suggest up to 3 items by name with a one-line reason and price if known. For bookings, provide the next actionable step (e.g., visit /book). Be clear, knowledgeable, and avoid flowery language.`
            },
          { role: "user", content: data.message }
        ],
        max_tokens: 800,
        temperature: 0.7
      };

      console.log("[AI] Request body:", JSON.stringify(requestBody, null, 2));

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log("[AI] Response status:", response.status);
      const result = await response.json();
      console.log("[AI] Response body:", JSON.stringify(result, null, 2));
      if (!response.ok) {
        const errorMessage = result.error?.message || result.error || `AI request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }
      return { reply: result.choices[0].message.content };
    } catch (err) {
      console.error("[AI] Error:", err);
      throw new Error(err instanceof Error ? err.message : "Failed to get advice");
    }
  });