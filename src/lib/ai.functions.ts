import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAIAdvice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ message: z.string().min(1) }))
  .handler(async ({ data }) => {
    try {
      const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROK_API_KEY; // Support both env var names for flexibility
      console.log("[AI] Checking for API key...", !!GROQ_API_KEY);
      if (!GROQ_API_KEY) throw new Error("AI key not configured in environment variables (use GROQ_API_KEY)");

      const requestBody = {
        model: "llama-3.1-8b-instant", // Good default Groq model (fast and cost-effective)
        messages: [
          {
            role: "system",
            content: `You are Witchsion, a mystical, spiritual advisor. You offer gentle, supportive guidance, spiritual insights, and practical suggestions. Use warm, mystical but accessible language. You can suggest products or consultations from Witchsion when relevant, but don't be pushy.`
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