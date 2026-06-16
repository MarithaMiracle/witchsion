import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiFn } from "@/lib/api/create-api-fn";
import { format } from "date-fns";
import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth";
import { listMyOrders } from "@/lib/orders.functions";
import { listMyBookings } from "@/lib/bookings.functions";
import { getMyWishlist, removeFromWishlist } from "@/lib/wishlist.functions";
import { getAIAdvice } from "@/lib/ai.functions";
import { formatPrice, type Currency } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Your account - Witchsion" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, isAdmin, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'orders' | 'bookings' | 'wishlist' | 'ai-advisor'>('orders');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const aiAdviceFn = useApiFn(getAIAdvice);

  function renderChatContent(text: string) {
    if (!text) return null;
    const urlHttp = /(https?:\/\/[\S]+)/i;
    const wwwRegex = /(www\.[\S]+)/i;
    const domainRegex = /\b([a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s]*)?)\b/i;
    const phoneRegex = /(\+?\d[\d\s\-().]{6,}\d)/g;
    const tokens = text.split(/(\s+)/);
    return (
      <>
        {tokens.map((tok, i) => {
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
  const fetchOrders = useApiFn(listMyOrders);
  const fetchBookings = useApiFn(listMyBookings);
  const fetchWishlist = useApiFn(getMyWishlist);
  const removeWishlistItem = useApiFn(removeFromWishlist);

  const ordersQuery = useQuery({ queryKey: ["my-orders"], queryFn: () => fetchOrders() });
  const bookingsQuery = useQuery({ queryKey: ["my-bookings"], queryFn: () => fetchBookings() });
  const wishlistQuery = useQuery({ queryKey: ["my-wishlist"], queryFn: () => fetchWishlist() });
  // rewards/badges removed

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              the witch's ledger
            </span>
            <h1 className="text-witchy mt-3 text-5xl md:text-6xl">your account</h1>
            <p className="font-serif mt-3 text-sm italic text-muted-foreground">
              {user?.email}
            </p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="border border-foreground/40 px-5 py-3 text-[10px] uppercase tracking-[0.3em] hover:bg-foreground hover:text-background"
              >
                Admin
              </Link>
            )}
            <button
              onClick={() => signOut()}
              className="border border-border px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </div>

      {/* Tabs */}
      <div className="mt-12 flex gap-6 border-b border-border">
        {(['orders', 'bookings', 'wishlist', 'ai-advisor'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-[10px] uppercase tracking-[0.3em] transition-colors ${activeTab === tab ? 'text-foreground border-b-2 border-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="mt-8">
          {ordersQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Reading the cards…</p>
          ) : !ordersQuery.data?.length ? (
            <p className="font-serif text-base italic text-muted-foreground">
              No orders yet. <Link to="/shop" className="underline">Visit the shop</Link>.
            </p>
          ) : (
            <ul className="space-y-4">
              {ordersQuery.data.map((o) => (
                <li
                  key={o.id}
                  className="border border-border bg-card/40 p-5 sm:flex sm:items-start sm:justify-between"
                >
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      {format(new Date(o.created_at), "d MMM yyyy")} ·{" "}
                      <span className="text-foreground">{o.status}</span>
                    </div>
                    <div className="font-serif mt-2 text-base italic">
                      {o.order_items.length} item{o.order_items.length === 1 ? "" : "s"} -{" "}
                      {o.order_items.map((i) => i.product_name).slice(0, 2).join(", ")}
                      {o.order_items.length > 2 ? ", …" : ""}
                    </div>
                  </div>
                  <div className="mt-3 text-right sm:mt-0">
                    <div className="font-serif text-lg">
                      {formatPrice(Number(o.total), o.currency as Currency)}
                    </div>
                    {o.status === "pending" && o.checkout_url && (
                      <a
                        href={o.checkout_url}
                        className="mt-2 inline-block text-[10px] uppercase tracking-[0.3em] underline"
                      >
                        Resume payment
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="mt-8">
          {bookingsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">…</p>
          ) : !bookingsQuery.data?.length ? (
            <p className="font-serif text-base italic text-muted-foreground">
              No bookings yet. <Link to="/book" className="underline">Sit with the witch</Link>.
            </p>
          ) : (
            <ul className="space-y-4">
              {bookingsQuery.data.map((b) => (
                <li
                  key={b.id}
                  className="border border-border bg-card/40 p-5 sm:flex sm:items-start sm:justify-between"
                >
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      {b.status}
                    </div>
                    <div className="font-serif mt-2 text-base italic">{b.service_name}</div>
                  </div>
                  <div className="mt-3 text-right sm:mt-0">
                    <div className="text-sm">
                      {format(new Date(b.scheduled_date), "EEE d MMM")} · {b.scheduled_time}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Wishlist Tab */}
      {activeTab === 'wishlist' && (
        <div className="mt-8">
          {wishlistQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Checking the shelves…</p>
          ) : wishlistQuery.error ? (
            <div className="text-sm text-red-500">
              Failed to load wishlist: {String(wishlistQuery.error)}
            </div>
          ) : !wishlistQuery.data?.length ? (
            <p className="font-serif text-base italic text-muted-foreground">
              No items saved yet. <Link to="/shop" className="underline">Explore the shop</Link>.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {wishlistQuery.data.map((item) => (
                  <div key={item.id} className="border border-border bg-card/40 p-5">
                    <div className="flex items-start justify-between">
                      <Link
                        to={item.products?.slug ? `/shop/${item.products.slug}` : "/shop"}
                        className="flex-1"
                      >
                        {item.products?.image && (
                          <div className="aspect-square overflow-hidden bg-background mb-4">
                            <img src={item.products.image} alt={item.products.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                          {item.products?.category?.name || item.products?.category_slug}
                        </div>
                        <div className="font-serif mt-1 text-lg italic">{item.products?.name}</div>
                        <div className="mt-3">
                          <span className="text-sm">
                            {formatPrice(Number(item.products?.price || 0), (item.products?.currency || 'NGN') as Currency)}
                          </span>
                        </div>
                      </Link>

                      <div className="ml-4">
                        <button
                          onClick={async () => {
                            try {
                              await removeWishlistItem({ data: { productId: item.product_id } });
                              toast.success("Removed from wishlist");
                              queryClient.invalidateQueries({ queryKey: ["my-wishlist"] });
                            } catch (err) {
                              toast.error("Failed to remove item");
                            }
                          }}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                          aria-label="Remove from wishlist"
                        >
                          <Heart size={16} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* AI Advisor Tab */}
      {activeTab === 'ai-advisor' && (
        <div className="mt-8 border border-border bg-card/40 p-6 w-full max-w-5xl mx-auto">
          <h3 className="text-witchy text-2xl mb-6">Witchsion AI</h3>
          <div className="h-96 overflow-y-auto space-y-4 mb-6 border border-border/50 p-4">
            {chatMessages.length === 0 && (
              <p className="font-serif text-lg italic text-muted-foreground text-center">
                Ask me anything about spirituality, guidance, or what products might resonate with you.
              </p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-sm ${msg.role === 'user' ? 'bg-foreground text-background' : 'bg-card border border-border'}`}>
                  <div className="text-sm leading-relaxed">{renderChatContent(msg.content)}</div>
                </div>
              </div>
            ))}
            {chatBusy && (
              <div className="flex gap-3 justify-start">
                <div className="max-w-[80%] p-4 rounded-sm bg-card border border-border">
                  <p className="text-sm text-muted-foreground">Receiving guidance...</p>
                </div>
              </div>
            )}
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!chatInput.trim()) return;
              const userMessage = chatInput;
              setChatMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
              setChatInput("");
              setChatBusy(true);
              try {
                  const result = await aiAdviceFn({ data: { message: userMessage } });
                  setChatMessages((prev) => [...prev, { role: 'assistant', content: result?.reply ?? 'No response.' }]);
              } catch (err) {
                toast.error("Failed to get advice");
              } finally {
                setChatBusy(false);
              }
            }}
            className="flex gap-3"
          >
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask for guidance..."
              className="flex-1 bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground"
              disabled={chatBusy}
            />
            <button
              type="submit"
              disabled={chatBusy || !chatInput.trim()}
              className="bg-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] text-background hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Send
            </button>
          </form>

        </div>
      )}

      {/* rewards/badges removed */}
      </section>
      <SiteFooter />
    </div>
  );
}
