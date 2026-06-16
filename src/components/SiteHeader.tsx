import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ShoppingBag, User, Globe } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n.jsx"; // Or just "@/lib/i18n" after renaming file

const navKeys = ["home", "shop", "consultations", "blog", "about", "howToOrder"] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const { count } = useCart();
  const { user } = useAuth();
  const { t, language, setLanguage } = useI18n();

  const nav = navKeys.map((key) => ({
    to: key === "home" ? "/" : key === "consultations" ? "/book" : key === "howToOrder" ? "/how-to-order" : `/${key}`,
    label: t(key),
  }));

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          to="/"
          className="text-witchy text-2xl tracking-wider text-foreground transition-opacity hover:opacity-80"
          aria-label="Witchsion home"
        >
          witchsion
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-1 p-2 text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              aria-label="Switch language"
            >
              <Globe size={16} />
              <span className="text-xs uppercase tracking-[0.2em]">{language.toUpperCase()}</span>
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 top-full mt-1 border border-border bg-background p-1 shadow-lg z-50">
                {(['en', 'es', 'fr'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setLangMenuOpen(false);
                    }}
                    className={`block w-full px-3 py-2 text-left text-xs uppercase tracking-[0.2em] transition-colors ${language === lang ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            to={user ? "/account" : "/auth"}
            className="p-2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={user ? "Account" : "Sign in"}
          >
            <User size={18} />
          </Link>
          <Link
            to="/cart"
            className="relative p-2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Bag"
          >
            <ShoppingBag size={18} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-medium text-ember-foreground">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="md:hidden p-2 text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/40 bg-background md:hidden">
          <nav className="flex flex-col px-6 py-4">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="py-3 text-sm uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
