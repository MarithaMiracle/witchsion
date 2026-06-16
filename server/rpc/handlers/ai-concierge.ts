import type { HandlerDef } from "../types";
import { z } from "zod";

const ChatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().min(1),
  language: z.enum(["en", "fr", "es", "pt"]).default("en"),
});

export const chatWithConcierge: HandlerDef = {
  handler: async ({ data }) => {
    const { message, language } = ChatMessageSchema.parse(data);

    const grokApiKey = process.env.GROK_API_KEY;
    if (!grokApiKey) {
      const mockResponses = [
        "We offer charged oils, spell jars, incenses, crystals, and tarot/consultations—what are you seeking?",
        "Tell me a goal (e.g., 'protection') and I will suggest 1–3 products and a next step.",
        "To book a reading, visit /book or tell me a preferred date and I will guide you.",
      ];
      return {
        response: mockResponses[Math.floor(Math.random() * mockResponses.length)],
        sentiment: "neutral",
      };
    }

    const systemPrompt = `You are Witchsion's AI Concierge. Be concise (max 2 sentences). Focus only on what Witchsion directly offers: charged oils, conjured oils, incenses, smudge, spell jars, spiritual baths, crystals, tarot readings, and consultations. When asked for product recommendations, suggest up to 3 items by name with a one-line reason and price if known. For bookings, direct users to /book or provide a single next step. For shipping/returns/orders, give a brief actionable reply. Avoid flowery language; be clear, knowledgeable and helpful. Languages: English, French, Spanish, Portuguese. Respond in the user's language (${language}).`;

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${grokApiKey}`,
      },
      body: JSON.stringify({
        model: "grok-3-latest",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get response from Grok AI");
    }

    const result = await response.json();
    const assistantResponse = result.choices[0].message.content;

    return {
      response: assistantResponse,
      sentiment: "positive",
    };
  },
};

export const seedKnowledgeBase: HandlerDef = {
  handler: async () => {
    return { success: true };
  },
};
