import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Currency, Product } from "@/lib/catalog";

export type CartItem = {
  slug: string;
  name: string;
  category: string;
  price: number;
  currency: Currency;
  image: string;
  quantity: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  currency: Currency | null;
  add: (p: Product, qty?: number) => void;
  remove: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "witchsion.cart.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const currency = items[0]?.currency ?? null;
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  const value: CartCtx = {
    items,
    count,
    subtotal,
    currency,
    add(p, qty = 1) {
      setItems((prev) => {
        if (prev.length && prev[0].currency !== p.currency) {
          toast.error("Mixed currencies", {
            description: `Your bag is in ${prev[0].currency}. Clear it to add ${p.currency} items.`,
          });
          return prev;
        }
        const existing = prev.find((i) => i.slug === p.slug);
        if (existing) {
          return prev.map((i) =>
            i.slug === p.slug ? { ...i, quantity: i.quantity + qty } : i,
          );
        }
        return [
          ...prev,
          {
            slug: p.slug,
            name: p.name,
            category: p.category,
            price: p.price,
            currency: p.currency,
            image: p.image,
            quantity: qty,
          },
        ];
      });
      toast.success("Added to your bag", { description: p.name });
    },
    remove(slug) {
      setItems((prev) => prev.filter((i) => i.slug !== slug));
    },
    setQty(slug, qty) {
      setItems((prev) =>
        qty <= 0
          ? prev.filter((i) => i.slug !== slug)
          : prev.map((i) => (i.slug === slug ? { ...i, quantity: qty } : i)),
      );
    },
    clear() {
      setItems([]);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
