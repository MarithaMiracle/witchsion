import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { products, productBySlug, categories } from "./catalog";
import { getPublishedContent } from "./content.functions";

// Minimal server-side advisor: Witchsion AI
// Delivers concise, direct answers based on site data (products, categories, blog).

export const getAdvice = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ question: z.string().min(1) }).parse(data))
  .handler(async ({ data: { question } }) => {
    const q = question.trim().toLowerCase();

    // Very short, direct response helper (limit to ~30 words)
    const concise = (text: string, maxWords = 30) => {
      const cleaned = text.replace(/—/g, '-').replace(/\s+/g, ' ').trim();
      const words = cleaned.split(' ');
      const clipped = words.length > maxWords ? words.slice(0, maxWords).join(' ') + '...' : cleaned;
      return clipped;
    };

    const reply = (text: string) => ({
      provider: "Witchsion AI",
      tone: "direct",
      answer: concise(text),
    });

    // If user asks for generic guidance or gives a very short prompt,
    // prioritize a clarifying question that lists core service areas.
    const isGeneric = q.length < 6 || /^(help|advice|guidance|i need guidance|i need help|need help)$/.test(q);
    if (isGeneric || q === 'i need guidance') {
      return reply("I can help with products, bookings, shipping, returns, or blog posts. Which would you like? If product, say name or goal (e.g. 'Citrine' or 'protection').");
    }

    // Product specific queries: try to match slug or product name
    const bySlug = productBySlug(q.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
    if (bySlug) {
      return reply(`${bySlug.name}: ${bySlug.blurb} Price: ${bySlug.price ? bySlug.price : 'By request'}`);
    }

    // Match by product name token
    const found = products.find(p => p.name.toLowerCase().includes(q) || p.slug === q);
    if (found) return reply(`${found.name}: ${found.blurb} Price: ${found.price ? found.price : 'By request'}`);

    // Category intents
    const cat = categories.find(c => q.includes(c.slug) || q.includes(c.name.toLowerCase()));
    if (cat) return reply(`${cat.name}: ${cat.blurb} Browse the shop category for options.`);

    // Basic site info questions
    if (q.includes('book') || q.includes('consult')) {
      return reply('Book a consultation via the /book page. Sessions are advertised with duration and price there.');
    }
    if (q.includes('shipping') || q.includes('deliver')) {
      return reply('Shipping: We ship worldwide. Local carriers and rates vary; see checkout for exact costs.');
    }
    if (q.includes('returns') || q.includes('refund')) {
      return reply('Returns: Most products are handmade and final sale — contact support for exceptions.');
    }

    // Fall back to searching blog content titles
    try {
      const posts = await getPublishedContent({ data: { type: 'blog', page: 1, pageSize: 10 } });
      const p = (posts.content || []).find((post: any) => (post.title || '').toLowerCase().includes(q));
      if (p) return reply(`${p.title}: ${p.excerpt || 'Read the full post for details.'}`);
    } catch (e) {
      // ignore
    }

    // Default concise fallback
    return reply("I don't have a direct answer. Tell me one of: product (name or goal, e.g. 'Citrine' or 'protection'), booking (e.g. 'book tarot June 20'), shipping (country), returns, or a blog post title. Give a short phrase.");
  });
