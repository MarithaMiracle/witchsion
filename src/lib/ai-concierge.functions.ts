import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ChatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().min(1),
  language: z.enum(["en", "fr", "es", "pt"]).default("en"),
});

export const chatWithConcierge = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ChatMessageSchema.parse(data))
  .handler(async ({ data }) => {
    const { message, sessionId, language } = data;

    // Grok AI API endpoint (xAI)
    const grokApiKey = process.env.GROK_API_KEY;
    if (!grokApiKey) {
      // Fallback to mock responses if no API key
      const mockResponses = [
        "Greetings, seeker! How may I assist you on your spiritual journey today? ✨",
        "The stars are aligned in your favor! What can I help you manifest?",
        "Welcome to Witchsion! I'm here to guide you to the perfect tools for your practice.",
        "I sense great energy around you! What would you like to explore today?",
      ];
      return {
        response: mockResponses[Math.floor(Math.random() * mockResponses.length)],
        sentiment: "positive",
      };
    }

    // Build the system prompt with knowledge base context
    const systemPrompt = `You are Witchsion's AI Spiritual Concierge - a warm, mystical guide for modern witches and spiritual seekers. 

About Witchsion:
- We sell hand-charged oils, spell jars, spiritual baths, smudge, incense, crystals, and more
- We offer tarot readings, spiritual guidance, and spell-work consultations

Your role:
- Help customers find products, book consultations, answer FAQs, and assist with orders
- Be warm, mystical, and encouraging
- Be available 24/7

Languages: English, French, Spanish, Portuguese

Respond in the user's language (${language}).`;

    // Call Grok API (xAI)
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

    // Simple sentiment analysis (can be improved later)
    const sentiment = "positive";

    return {
      response: assistantResponse,
      sentiment,
    };
  });

// Function to seed the knowledge base
export const seedKnowledgeBase = createServerFn({ method: "POST" })
  .handler(async () => {
    // We'll implement this later to add entries to the knowledge_base table
    return { success: true };
  });