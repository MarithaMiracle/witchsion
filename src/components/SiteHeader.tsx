import { Link } from "@tanstack/react-router";
import owlArt from "@/assets/mystic-owl.png";
import { useEffect, useState } from "react";
import { Menu, X, ShoppingBag, User, Globe } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n.jsx";

const navKeys = ["home", "shop", "consultations", "blog", "about", "howToOrder"] as const;

const iconBtn =
  "touch-target inline-flex items-center justify-center rounded-sm p-2.5 text-muted-foreground transition-colors hover:text-foreground";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const { count } = useCart();
  const { user } = useAuth();
  const { t, language, setLanguage } = useI18n();

  const nav = navKeys.map((key) => ({
    to:
      key === "home"
        ? "/"
        : key === "consultations"
          ? "/book"
          : key === "howToOrder"
            ? "/how-to-order"
            : `/${key}`,
    label: t(key),
  }));

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl safe-bottom">
      <div className="mx-auto flex h-14 min-h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
        <Link
          to="/"
          className="flex min-w-0 shrink items-center text-witchy text-xl tracking-wider text-foreground transition-opacity hover:opacity-80 sm:text-2xl"
          aria-label="Witchsion home"
          onClick={() => setOpen(false)}
        >
          <img src={owlArt} alt="" className="mr-2 h-6 w-6 shrink-0 object-contain sm:mr-3" />
          <span className="truncate">witchsion</span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Main">
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

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <div className="relative">
            <button
              type="button"
              className={iconBtn}
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              aria-label="Switch language"
              aria-expanded={langMenuOpen}
            >
              <Globe size={18} />
              <span className="ml-1 hidden text-xs uppercase tracking-[0.2em] sm:inline">
                {language.toUpperCase()}
              </span>
            </button>
            {langMenuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default bg-transparent"
                  aria-label="Close language menu"
                  onClick={() => setLangMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[5rem] border border-border bg-background p-1 shadow-lg">
                  {(["en", "es", "fr"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setLanguage(lang);
                        setLangMenuOpen(false);
                      }}
                      className={`touch-target block w-full px-4 py-2.5 text-left text-xs uppercase tracking-[0.2em] transition-colors ${language === lang ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <Link
            to={user ? "/account" : "/auth"}
            className={iconBtn}
            aria-label={user ? "Account" : "Sign in"}
            onClick={() => setOpen(false)}
          >
            <User size={18} />
          </Link>
          <Link
            to="/cart"
            className={`relative ${iconBtn}`}
            aria-label="Bag"
            onClick={() => setOpen(false)}
          >
            <ShoppingBag size={18} />
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-medium text-ember-foreground">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className={`${iconBtn} md:hidden`}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/40 bg-background md:hidden">
          <nav className="flex max-h-[calc(100dvh-3.5rem)] flex-col overflow-y-auto px-4 py-2" aria-label="Mobile">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="touch-target flex items-center border-b border-border/30 py-3 text-sm uppercase tracking-[0.2em] text-muted-foreground transition-colors last:border-0 hover:text-foreground"
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
