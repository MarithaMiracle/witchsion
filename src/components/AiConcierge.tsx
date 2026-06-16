import { useState, useRef, useEffect } from "react";
import { useApiFn } from "@/lib/api/create-api-fn";
import { X, MessageSquare, Mic, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { chatWithConcierge } from "@/lib/ai-concierge.functions";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export function AiConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Ask me anything about spirituality, guidance, or what products might resonate with you.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const submitChat = useApiFn(chatWithConcierge);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const result = await submitChat({ data: { question: input } });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result?.answer ?? "No response.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Unable to respond. Try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  function renderMessageContent(text: string) {
    if (!text) return null;
    const urlHttp = /(https?:\/\/[\S]+)/i;
    const wwwRegex = /(www\.[\S]+)/i;
    const domainRegex = /\b([a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s]*)?)\b/i;
    const phoneRegex = /(\+?\d[\d\s\-().]{6,}\d)/g;
    // Split into tokens by spaces so we can test each token
    const tokens = text.split(/(\s+)/);
    return (
      <>
        {tokens.map((tok, i) => {
          // preserve display but clean trailing punctuation for href
          const trailingMatch = tok.match(/[.,!?;:)]+$/);
          const trailing = trailingMatch ? trailingMatch[0] : "";
          const display = tok;
          const clean = tok.replace(/[.,!?;:)]+$/g, "");

          if (urlHttp.test(clean)) {
            const href = clean;
            return (
              <span key={i}>
                <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
                  {clean}
                </a>
                {trailing}
              </span>
            );
          }
          if (wwwRegex.test(clean) || domainRegex.test(clean)) {
            let href = clean;
            if (!/^https?:\/\//i.test(href)) href = 'https://' + href;
            return (
              <span key={i}>
                <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
                  {clean}
                </a>
                {trailing}
              </span>
            );
          }
          if (phoneRegex.test(clean)) {
            const number = clean.replace(/[^+0-9]/g, '');
            return (
              <span key={i}>
                <a href={`tel:${number}`} className="underline">
                  {clean}
                </a>
                {trailing}
              </span>
            );
          }
          if (clean.startsWith('/')) {
            return (
              <span key={i}>
                <a href={clean} className="underline">
                  {clean}
                </a>
                {trailing}
              </span>
            );
          }
          return <span key={i}>{display}</span>;
        })}
      </>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[1000px] max-w-[98vw] h-[600px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-card/60 p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h3 className="text-witchy text-lg">Witchsion AI</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] p-3 rounded-2xl",
                    msg.role === "user" ? "bg-foreground text-background" : "bg-card/60 text-foreground border border-border"
                  )}
                >
                  <div className="font-serif text-sm italic">
                    {renderMessageContent(msg.content)}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-card/60 p-3 rounded-2xl">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <button className="p-2 text-muted-foreground hover:text-foreground">
                <Mic className="h-5 w-5" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask a short question or describe a goal (e.g. 'protection')"
                className="flex-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-foreground"
              />
              <Button onClick={handleSend} disabled={isTyping} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-foreground text-background rounded-full shadow-2xl shadow-amber-500/20 flex items-center justify-center hover:opacity-90 transition-all hover:scale-105"
      >
        <MessageSquare className="h-7 w-7" />
      </button>
    </div>
  );
}