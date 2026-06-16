import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth";

const search = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Sign in — Witchsion" },
      { name: "description", content: "Sign in or create an account to track orders and consultations with Witchsion." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    navigate({ to: redirect ?? "/account" });
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = mode === "signin"
      ? await signIn(email, password)
      : await signUp(email, password, fullName);
    setBusy(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    if (mode === "signup") {
      toast.success("Account created", { description: "Check your inbox to confirm." });
    }
    navigate({ to: redirect ?? "/account" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-md px-6 py-24">
        <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          {mode === "signin" ? "return to the circle" : "join the circle"}
        </span>
        <h1 className="text-witchy mt-3 text-5xl">
          {mode === "signin" ? "sign in" : "create account"}
        </h1>
        <form onSubmit={submit} className="mt-10 space-y-4">
          {mode === "signup" && (
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              required
              className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:border-foreground focus:outline-none"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full border border-border bg-transparent px-4 py-3 text-sm focus:border-foreground focus:outline-none"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="w-full border border-border bg-transparent px-4 py-3 pr-10 text-sm focus:border-foreground focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-foreground px-7 py-4 text-xs uppercase tracking-[0.3em] text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="font-serif mt-8 block w-full text-center text-sm italic text-muted-foreground hover:text-foreground"
        >
          {mode === "signin"
            ? "No account yet? Create one →"
            : "Already a witch? Sign in →"}
        </button>

        <Link
          to="/"
          className="mt-6 block text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
        >
          ← Back home
        </Link>
      </section>
      <SiteFooter />
    </div>
  );
}
