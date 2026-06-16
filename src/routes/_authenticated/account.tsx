import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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
import { getUserBadges, getUserTotalPoints, getUserPointsHistory, getBadges } from "@/lib/gamification.functions";
import { formatPrice, type Currency } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Your account — Witchsion" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, isAdmin, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'orders' | 'bookings' | 'wishlist' | 'ai-advisor' | 'rewards'>('orders');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const aiAdviceFn = useServerFn(getAIAdvice);
  const fetchOrders = useServerFn(listMyOrders);
  const fetchBookings = useServerFn(listMyBookings);
  const fetchWishlist = useServerFn(getMyWishlist);
  const removeWishlistItem = useServerFn(removeFromWishlist);
  const fetchBadges = useServerFn(getBadges);
  const fetchUserBadges = useServerFn(getUserBadges);
  const fetchUserTotalPoints = useServerFn(getUserTotalPoints);
  const fetchUserPointsHistory = useServerFn(getUserPointsHistory);

  const ordersQuery = useQuery({ queryKey: ["my-orders"], queryFn: () => fetchOrders() });
  const bookingsQuery = useQuery({ queryKey: ["my-bookings"], queryFn: () => fetchBookings() });
  const wishlistQuery = useQuery({ queryKey: ["my-wishlist"], queryFn: () => fetchWishlist() });
  const badgesQuery = useQuery({ queryKey: ["all-badges"], queryFn: () => fetchBadges() });
  const userBadgesQuery = useQuery({ queryKey: ["my-badges"], queryFn: () => fetchUserBadges() });
  const userTotalPointsQuery = useQuery({ queryKey: ["my-total-points"], queryFn: () => fetchUserTotalPoints() });
  const userPointsHistoryQuery = useQuery({ queryKey: ["my-points-history"], queryFn: () => fetchUserPointsHistory({ data: { page: 1, pageSize: 10 } }) });

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
        {(['orders', 'bookings', 'wishlist', 'ai-advisor', 'rewards'] as const).map((tab) => (
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
                      {o.order_items.length} item{o.order_items.length === 1 ? "" : "s"} —{" "}
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
          ) : !wishlistQuery.data?.length ? (
            <p className="font-serif text-base italic text-muted-foreground">
              No items saved yet. <Link to="/shop" className="underline">Explore the shop</Link>.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {wishlistQuery.data.map((item) => (
                <div key={item.id} className="border border-border bg-card/40 p-5">
                  {item.products?.image && (
                    <div className="aspect-square overflow-hidden bg-background mb-4">
                      <img src={item.products.image} alt={item.products.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    {item.products?.category?.name || item.products?.category_slug}
                  </div>
                  <div className="font-serif mt-1 text-lg italic">{item.products?.name}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm">
                      {formatPrice(Number(item.products?.price || 0), (item.products?.currency || 'NGN') as Currency)}
                    </span>
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
                    >
                      <Heart size={16} fill="currentColor" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Advisor Tab */}
      {activeTab === 'ai-advisor' && (
        <div className="mt-8 border border-border bg-card/40 p-6 max-w-3xl">
          <h3 className="text-witchy text-2xl mb-6">AI Spiritual Advisor</h3>
          <div className="h-96 overflow-y-auto space-y-4 mb-6 border border-border/50 p-4">
            {chatMessages.length === 0 && (
              <p className="font-serif text-lg italic text-muted-foreground text-center">
                Ask me anything about spirituality, guidance, or what products might resonate with you.
              </p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-sm ${msg.role === 'user' ? 'bg-foreground text-background' : 'bg-card border border-border'}`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
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
                setChatMessages((prev) => [...prev, { role: 'assistant', content: result.reply }]);
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

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <div className="mt-8">
          {badgesQuery.isLoading || userBadgesQuery.isLoading || userTotalPointsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Unveiling your rewards…</p>
          ) : (
            <>
              {/* Total Points Card */}
              <div className="border border-border bg-card/40 p-6 mb-8">
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Total Points</div>
                <div className="font-serif mt-2 text-5xl">{userTotalPointsQuery.data?.totalPoints || 0}</div>
              </div>

              {/* User Badges */}
              <div className="mb-8">
                <h3 className="text-witchy text-2xl mb-4">Your Badges</h3>
                {userBadgesQuery.data?.userBadges.length === 0 ? (
                  <p className="font-serif text-base italic text-muted-foreground">
                    No badges yet. Keep exploring to earn rewards!
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {userBadgesQuery.data?.userBadges.map((ub) => (
                      <div key={ub.id} className="border border-border bg-card/40 p-5">
                        {ub.badges?.image && (
                          <div className="aspect-square overflow-hidden bg-background mb-4">
                            <img src={ub.badges.image} alt={ub.badges.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="text-witchy text-xl">{ub.badges?.name}</div>
                        {ub.badges?.description && (
                          <p className="font-serif mt-2 text-sm italic text-muted-foreground">
                            {ub.badges.description}
                          </p>
                        )}
                        <div className="mt-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                          Earned {format(new Date(ub.earned_at), "d MMM yyyy")}
                        </div>
                        {ub.badges?.points > 0 && (
                          <div className="mt-1 text-sm font-serif italic">+{ub.badges.points} points</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* All Available Badges */}
              <div className="mb-8">
                <h3 className="text-witchy text-2xl mb-4">Available Badges</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {badgesQuery.data?.badges.map((badge) => {
                    const earned = userBadgesQuery.data?.userBadges.some(ub => ub.badge_id === badge.id);
                    return (
                      <div key={badge.id} className={`border p-5 ${earned ? 'border-foreground bg-card/60' : 'border-border bg-card/40 opacity-60'}`}>
                        {badge.image && (
                          <div className="aspect-square overflow-hidden bg-background mb-4">
                            <img src={badge.image} alt={badge.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="text-witchy text-xl">{badge.name}</div>
                        {badge.description && (
                          <p className="font-serif mt-2 text-sm italic text-muted-foreground">
                            {badge.description}
                          </p>
                        )}
                        {badge.points > 0 && (
                          <div className="mt-3 text-sm font-serif italic">+{badge.points} points</div>
                        )}
                        {earned && (
                          <div className="mt-3 text-[10px] uppercase tracking-[0.3em] text-green-600">
                            Earned!
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Points History */}
              <div>
                <h3 className="text-witchy text-2xl mb-4">Points History</h3>
                {userPointsHistoryQuery.data?.points.length === 0 ? (
                  <p className="font-serif text-base italic text-muted-foreground">
                    No points history yet.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {userPointsHistoryQuery.data?.points.map((p) => (
                      <li key={p.id} className="border border-border bg-card/40 p-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                              {format(new Date(p.created_at), "d MMM yyyy")}
                            </div>
                            <div className="font-serif mt-2 text-base italic">{p.reason}</div>
                          </div>
                          <div className={`font-serif text-xl ${p.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {p.points > 0 ? '+' : ''}{p.points}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      )}
      </section>
      <SiteFooter />
    </div>
  );
}
