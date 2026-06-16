import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { adminGetOverview, adminUpdateOrderStatus, adminUpdateBookingStatus, adminGetProducts, adminGetCategories, adminUpsertProduct, adminDeleteProduct } from "@/lib/admin.functions";
import { adminGetAllContent, adminUpsertContent, adminDeleteContent } from "@/lib/content.functions";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

import { z } from "zod";

const searchSchema = z.object({
  tab: z.enum(["overview", "products", "orders", "bookings", "content"]).default("overview"),
  ordersPage: z.number().min(1).default(1).optional(),
  bookingsPage: z.number().min(1).default(1).optional(),
  productsPage: z.number().min(1).default(1).optional(),
  contentPage: z.number().min(1).default(1).optional(),
  ordersSearch: z.string().optional(),
  ordersStatus: z.enum(["pending", "paid", "fulfilled", "cancelled", "failed"]).optional(),
  bookingsSearch: z.string().optional(),
  bookingsStatus: z.enum(["requested", "confirmed", "completed", "cancelled"]).optional(),
  productsSearch: z.string().optional(),
  productsCategory: z.string().optional(),
  contentType: z.enum(["blog", "resource"]).optional(),
});

export const Route = createFileRoute("/_authenticated/admin")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Admin - Witchsion" }] }),
  component: AdminPage,
});

function AdminPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const activeTab = search.tab;
  const setActiveTab = (tab: string) => navigate({ search: (prev) => ({ ...prev, tab }) });
  
  const fetchOverview = useServerFn(adminGetOverview);
  const fetchProducts = useServerFn(adminGetProducts);
  const fetchCategories = useServerFn(adminGetCategories);
  const fetchContent = useServerFn(adminGetAllContent);
  const upsertContentFn = useServerFn(adminUpsertContent);
  const deleteContentFn = useServerFn(adminDeleteContent);
  const updateOrderStatus = useServerFn(adminUpdateOrderStatus);
  const updateBookingStatus = useServerFn(adminUpdateBookingStatus);
  const upsertProduct = useServerFn(adminUpsertProduct);
  const deleteProduct = useServerFn(adminDeleteProduct);
  
  const pageSize = 20;
  const overviewQuery = useQuery({ 
    queryKey: ["admin-overview", search.ordersPage || 1, search.bookingsPage || 1, search.ordersSearch, search.ordersStatus, search.bookingsSearch, search.bookingsStatus], 
    queryFn: () => fetchOverview({ data: { 
      page: search.ordersPage || 1, 
      pageSize, 
      ordersSearch: search.ordersSearch, 
      ordersStatus: search.ordersStatus, 
      bookingsSearch: search.bookingsSearch, 
      bookingsStatus: search.bookingsStatus 
    }}) 
  });
  const productsQuery = useQuery({ 
    queryKey: ["admin-products", search.productsPage || 1, search.productsSearch, search.productsCategory], 
    queryFn: () => fetchProducts({ data: { 
      page: search.productsPage || 1, 
      pageSize, 
      search: search.productsSearch, 
      category: search.productsCategory 
    }}) 
  });
  const categoriesQuery = useQuery({ queryKey: ["admin-categories"], queryFn: () => fetchCategories() });
  const contentQuery = useQuery({ 
    queryKey: ["admin-content", search.contentPage || 1, search.contentType], 
    queryFn: () => fetchContent({ data: { 
      page: search.contentPage || 1, 
      pageSize, 
      type: search.contentType 
    }}) 
  });
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  if (overviewQuery.isLoading || productsQuery.isLoading || categoriesQuery.isLoading || contentQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <p className="px-6 py-24 text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (overviewQuery.error || productsQuery.error || categoriesQuery.error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="px-6 py-24">
          <h1 className="text-witchy text-4xl">forbidden</h1>
          <p className="font-serif mt-3 text-sm italic text-muted-foreground">
            This altar is for admins only.
          </p>
        </div>
      </div>
    );
  }

  const d = overviewQuery.data!;
  const productsData = productsQuery.data!;
  const categories = categoriesQuery.data!;
  const contentData = contentQuery.data!;
  
  const ordersPage = search.ordersPage || 1;
  const productsPage = search.productsPage || 1;
  const bookingsPage = search.bookingsPage || 1;
  const contentPage = search.contentPage || 1;
  
  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    queryClient.invalidateQueries({ queryKey: ["admin-content"] });
    toast.success("Data refreshed!");
  };
  
  const ordersTotalPages = Math.ceil((d.ordersTotal || 0) / pageSize);
  const productsTotalPages = Math.ceil((productsData.total || 0) / pageSize);
  const bookingsTotalPages = Math.ceil((d.bookingsTotal || 0) / pageSize);
  const contentTotalPages = Math.ceil((contentData.total || 0) / pageSize);
  
  const generatePaginationPages = (currentPage: number, totalPages: number) => {
    const pages: Array<number | 'ellipsis'> = [];
    const delta = 2;
    
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== 'ellipsis') {
        pages.push('ellipsis');
      }
    }
    
    return pages;
  };

  const TabButton = ({ id, label }: { id: any; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-6 py-3 border-b-2 text-sm tracking-widest uppercase transition-colors ${
        activeTab === id
          ? 'border-foreground text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const productData = {
      id: editingProduct?.id,
      slug: form.get('slug') as string,
      name: form.get('name') as string,
      category_id: form.get('category_id') as string,
      category_slug: form.get('category_slug') as string,
      price: Number(form.get('price')),
      currency: form.get('currency') as 'NGN' | 'USD',
      image: (form.get('image') as string) || undefined,
      blurb: (form.get('blurb') as string) || undefined,
      description: (form.get('description') as string) || undefined,
      intention: (form.get('intention') as string) || undefined,
      use_case: (form.get('use_case') as string)?.split('\n').filter(Boolean) || undefined,
      is_active: true
    };
    try {
      await upsertProduct({ data: productData });
      toast.success('Product saved!');
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (err) {
      console.error(err);
      toast.error('Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct({ data: { id } });
      toast.success('Product deleted!');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete product');
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      console.log('Updating order:', { id, status });
      await updateOrderStatus({ data: { id, status: status as any } });
      toast.success("Order status updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (err: any) {
      console.error('Error updating order:', err);
      toast.error(`Failed to update order status: ${err.message || "Unknown error"}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      console.log('Updating booking:', { id, status });
      await updateBookingStatus({ data: { id, status: status as any } });
      toast.success("Booking status updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (err: any) {
      console.error('Error updating booking:', err);
      toast.error(`Failed to update booking status: ${err.message || "Unknown error"}`);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          the inner sanctum
        </span>
        <h1 className="text-witchy mt-3 text-5xl md:text-6xl">admin</h1>
        
        {/* Refresh Button */}
        <button
          onClick={refreshAll}
          className="mt-4 px-4 py-2 border border-border text-[10px] uppercase tracking-[0.2em] hover:border-foreground transition-colors"
        >
          Refresh Data
        </button>

        {/* Tabs */}
        <div className="mt-8 border-b border-border">
          <TabButton id="overview" label="Overview" />
          <TabButton id="products" label="Products" />
          <TabButton id="orders" label="Orders" />
          <TabButton id="bookings" label="Bookings" />
          <TabButton id="content" label="Content" />
        </div>

        {/* Tab Content */}
        <div className="mt-12">
          {activeTab === 'overview' && (
        <div>
          {/* Stats Grid */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Customers" value={d.customerCount.toString()} />
            <Stat label="Orders" value={d.ordersTotal.toString()} />
            <Stat label="Revenue (NGN)" value={`₦${d.revenueNgn.toLocaleString()}`} />
            <Stat label="Revenue (USD)" value={`${d.revenueUsd.toLocaleString()}`} />
          </div>

          {/* Monthly Orders Chart (simple text-based) */}
          <div className="mt-8 border border-border bg-card/40 p-6">
            <h3 className="text-witchy text-2xl mb-6">Orders (Last 12 Months)</h3>
            <div className="space-y-3">
              {d.monthlyOrders?.map((mo) => (
                <div key={mo.month} className="flex items-center gap-4">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground w-12">{mo.month}</span>
                  <div className="flex-1 bg-background border border-border h-6 overflow-hidden">
                    <div 
                      className="h-full bg-foreground" 
                      style={{ width: `${Math.min((mo.count / Math.max(...d.monthlyOrders.map(m => m.count), 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">{mo.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="mt-8 border border-border bg-card/40 p-6">
            <h3 className="text-witchy text-2xl mb-6">Top Products</h3>
            {d.topProducts?.length === 0 ? (
              <p className="font-serif text-sm italic text-muted-foreground">No sales data yet.</p>
            ) : (
              <div className="space-y-4">
                {d.topProducts?.map((p) => (
                  <div key={p.id} className="flex items-center gap-4">
                    {p.image && (
                      <div className="w-12 h-12 bg-background border border-border overflow-hidden">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm">{p.name}</div>
                      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{p.count} sold</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="mt-8">
            <h3 className="text-witchy text-2xl mb-6">Recent Orders</h3>
            <div className="overflow-x-auto border border-border">
              <table className="w-full text-sm">
                <thead className="bg-card/60 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {d.orders.map((o) => (
                    <tr key={o.id} className="border-t border-border/60">
                      <td className="px-4 py-3">{format(new Date(o.created_at), "d MMM")}</td>
                      <td className="px-4 py-3">{o.contact_name}<br /><span className="text-xs text-muted-foreground">{o.contact_email}</span></td>
                      <td className="px-4 py-3">{o.order_items.length}</td>
                      <td className="px-4 py-3">{o.currency} {Number(o.total).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <select
                          defaultValue={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          disabled={updating === o.id}
                          className="bg-transparent border border-border px-2 py-1 text-sm focus:outline-none focus:border-foreground"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="fulfilled">Fulfilled</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="failed">Failed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {updating === o.id && <span className="text-muted-foreground">Updating…</span>}
                      </td>
                    </tr>
                  ))}
                  {!d.orders.length && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No orders yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

          {activeTab === 'products' && (
            <div>
              <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={search.productsSearch || ""}
                    onChange={(e) => navigate({ search: (prev) => ({ ...prev, productsSearch: e.target.value || undefined, productsPage: 1 }) })}
                    className="bg-card border border-border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground rounded-sm"
                  />
                  <select
                    value={search.productsCategory || ""}
                    onChange={(e) => navigate({ search: (prev) => ({ ...prev, productsCategory: e.target.value || undefined, productsPage: 1 }) })}
                    className="bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground rounded-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setEditingProduct({})}
                  className="px-6 py-3 border border-foreground text-sm tracking-widest uppercase hover:bg-foreground hover:text-background transition-colors"
                >
                  Add New Product
                </button>
              </div>

              {/* Product Form */}
              {editingProduct && (
                <div className="mb-12 border border-border p-6">
                  <h3 className="text-witchy text-2xl mb-6">
                    {editingProduct.id ? 'Edit Product' : 'New Product'}
                  </h3>
                  <form onSubmit={handleSaveProduct} className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">Name</label>
                      <input
                        name="name"
                        defaultValue={editingProduct.name}
                        required
                        className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">Slug</label>
                      <input
                        name="slug"
                        defaultValue={editingProduct.slug}
                        required
                        className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">Category</label>
                      <select
                        name="category_id"
                        defaultValue={editingProduct.category_id}
                        onChange={(e) => {
                          const cat = categories.find(c => c.id === e.target.value);
                          if (cat) {
                            setEditingProduct({ ...editingProduct, category_id: cat.id, category_slug: cat.slug });
                          }
                        }}
                        required
                        className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-foreground"
                      >
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="hidden"
                      name="category_slug"
                      value={editingProduct.category_slug || (categories[0]?.slug)}
                    />
                    <div>
                      <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">Price</label>
                      <input
                        type="number"
                        name="price"
                        step="0.01"
                        defaultValue={editingProduct.price}
                        required
                        className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">Currency</label>
                      <select
                        name="currency"
                        defaultValue={editingProduct.currency || 'NGN'}
                        required
                        className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-foreground"
                      >
                        <option value="NGN">NGN</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">Image URL</label>
                      <input
                        name="image"
                        defaultValue={editingProduct.image}
                        className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-foreground"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">Blurb</label>
                      <input
                        name="blurb"
                        defaultValue={editingProduct.blurb}
                        className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-foreground"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">Description</label>
                      <textarea
                        name="description"
                        defaultValue={editingProduct.description}
                        rows={4}
                        className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-foreground"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">Intention</label>
                      <input
                        name="intention"
                        defaultValue={editingProduct.intention}
                        className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-foreground"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">Use Cases (one per line)</label>
                      <textarea
                        name="use_case"
                        defaultValue={editingProduct.use_case?.join('\n')}
                        rows={4}
                        className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-foreground"
                      />
                    </div>
                    <div className="md:col-span-2 flex gap-4">
                      <button
                        type="submit"
                        className="px-6 py-3 border border-foreground text-sm tracking-widest uppercase hover:bg-foreground hover:text-background transition-colors"
                      >
                        Save Product
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="px-6 py-3 border border-border text-sm tracking-widest uppercase hover:border-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Product List */}
              <div className="overflow-x-auto border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-card/60 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsData.products.map((p) => (
                      <tr key={p.id} className="border-t border-border/60">
                        <td className="px-4 py-3">{p.name}</td>
                        <td className="px-4 py-3">{p.category?.name}</td>
                        <td className="px-4 py-3">{p.currency} {Number(p.price).toLocaleString()}</td>
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="text-xs uppercase tracking-widest hover:text-foreground text-muted-foreground"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="text-xs uppercase tracking-widest hover:text-red-500 text-muted-foreground"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!productsData.products.length && (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No products yet. Add one above!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Products Pagination */}
              {productsTotalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => navigate({ search: (prev) => ({ ...prev, productsPage: Math.max(1, productsPage - 1) }) })}
                        className={productsPage === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {generatePaginationPages(productsPage, productsTotalPages).map((page, i) => (
                      <PaginationItem key={i}>
                        {page === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            isActive={page === productsPage}
                            onClick={() => navigate({ search: (prev) => ({ ...prev, productsPage: page }) })}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => navigate({ search: (prev) => ({ ...prev, productsPage: Math.min(productsTotalPages, productsPage + 1) }) })}
                        className={productsPage === productsTotalPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              {/* Orders Search and Filters */}
              <div className="mb-4 flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={search.ordersSearch || ""}
                  onChange={(e) => navigate({ search: (prev) => ({ ...prev, ordersSearch: e.target.value || undefined, ordersPage: 1 }) })}
                  className="bg-card border border-border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground rounded-sm"
                />
                <select
                  value={search.ordersStatus || ""}
                  onChange={(e) => navigate({ search: (prev) => ({ ...prev, ordersStatus: (e.target.value as any) || undefined, ordersPage: 1 }) })}
                  className="bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground rounded-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="mt-6 overflow-x-auto border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-card/60 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Items</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.orders.map((o) => (
                      <tr key={o.id} className="border-t border-border/60">
                        <td className="px-4 py-3">{format(new Date(o.created_at), "d MMM")}</td>
                        <td className="px-4 py-3">{o.contact_name}<br /><span className="text-xs text-muted-foreground">{o.contact_email}</span></td>
                        <td className="px-4 py-3">{o.order_items.length}</td>
                        <td className="px-4 py-3">{o.currency} {Number(o.total).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <select
                            defaultValue={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            disabled={updating === o.id}
                            className="bg-transparent border border-border px-2 py-1 text-sm focus:outline-none focus:border-foreground"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="fulfilled">Fulfilled</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="failed">Failed</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {updating === o.id && <span className="text-muted-foreground">Updating…</span>}
                        </td>
                      </tr>
                    ))}
                    {!d.orders.length && (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No orders yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Orders Pagination */}
              {ordersTotalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => navigate({ search: (prev) => ({ ...prev, ordersPage: Math.max(1, ordersPage - 1) }) })}
                        className={ordersPage === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {generatePaginationPages(ordersPage, ordersTotalPages).map((page, i) => (
                      <PaginationItem key={i}>
                        {page === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            isActive={page === ordersPage}
                            onClick={() => navigate({ search: (prev) => ({ ...prev, ordersPage: page }) })}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => navigate({ search: (prev) => ({ ...prev, ordersPage: Math.min(ordersTotalPages, ordersPage + 1) }) })}
                        className={ordersPage === ordersTotalPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              {/* Bookings Search and Filters */}
              <div className="mb-4 flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={search.bookingsSearch || ""}
                  onChange={(e) => navigate({ search: (prev) => ({ ...prev, bookingsSearch: e.target.value || undefined, bookingsPage: 1 }) })}
                  className="bg-card border border-border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground rounded-sm"
                />
                <select
                  value={search.bookingsStatus || ""}
                  onChange={(e) => navigate({ search: (prev) => ({ ...prev, bookingsStatus: (e.target.value as any) || undefined, bookingsPage: 1 }) })}
                  className="bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground rounded-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="requested">Requested</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="mt-6 overflow-x-auto border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-card/60 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">When</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.bookings.map((b) => (
                      <tr key={b.id} className="border-t border-border/60">
                        <td className="px-4 py-3">{format(new Date(b.scheduled_date), "d MMM")} · {b.scheduled_time}</td>
                        <td className="px-4 py-3">{b.service_name}</td>
                        <td className="px-4 py-3">{b.contact_name}<br /><span className="text-xs text-muted-foreground">{b.contact_email}</span></td>
                        <td className="px-4 py-3">
                          <select
                            defaultValue={b.status}
                            onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value)}
                            disabled={updating === b.id}
                            className="bg-transparent border border-border px-2 py-1 text-sm focus:outline-none focus:border-foreground"
                          >
                            <option value="requested">Requested</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {updating === b.id && <span className="text-muted-foreground">Updating…</span>}
                        </td>
                      </tr>
                    ))}
                    {!d.bookings.length && (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No bookings yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Bookings Pagination */}
              {bookingsTotalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => navigate({ search: (prev) => ({ ...prev, bookingsPage: Math.max(1, bookingsPage - 1) }) })}
                        className={bookingsPage === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {generatePaginationPages(bookingsPage, bookingsTotalPages).map((page, i) => (
                      <PaginationItem key={i}>
                        {page === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            isActive={page === bookingsPage}
                            onClick={() => navigate({ search: (prev) => ({ ...prev, bookingsPage: page }) })}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => navigate({ search: (prev) => ({ ...prev, bookingsPage: Math.min(bookingsTotalPages, bookingsPage + 1) }) })}
                        className={bookingsPage === bookingsTotalPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}

          {activeTab === 'content' && (
            <div>
              <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-2 items-center">
                  <select
                    value={search.contentType || ""}
                    onChange={(e) => navigate({ search: (prev) => ({ ...prev, contentType: (e.target.value as any) || undefined, contentPage: 1 }) })}
                    className="bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground rounded-sm"
                  >
                    <option value="">All Types</option>
                    <option value="blog">Blog Posts</option>
                    <option value="resource">Resources</option>
                  </select>
                </div>
                <>
                  <button
                    onClick={() => {
                      const hasEdits = editingContent && (editingContent.id || Object.values(editingContent || {}).some((v) => Boolean(v)));
                      if (hasEdits) {
                        setDiscardDialogOpen(true);
                        return;
                      }
                      setEditingContent({});
                    }}
                    className="px-6 py-3 border border-foreground text-sm tracking-widest uppercase hover:bg-foreground hover:text-background transition-colors"
                  >
                    Add New Content
                  </button>

                  <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You have unsaved edits. Discard them and start a new content draft?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDiscardDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            setEditingContent({});
                            setDiscardDialogOpen(false);
                          }}
                        >
                          Discard and create
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              </div>

              {/* Content Form */}
              {editingContent && (
                <div className="mb-12 border border-border p-6">
                  <h3 className="text-witchy text-2xl mb-6">
                    {editingContent.id ? 'Edit Content' : 'New Content'}
                  </h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    const contentData = {
                      id: editingContent?.id,
                      slug: form.get('slug') as string,
                      title: form.get('title') as string,
                      content: form.get('content') as string,
                      excerpt: form.get('excerpt') as string || undefined,
                      type: form.get('type') as 'blog' | 'resource',
                      image: form.get('image') as string || undefined,
                      is_published: form.get('is_published') === 'on',
                      published_at: form.get('published_at') as string || undefined,
                    };
                    try {
                      await upsertContentFn({ data: contentData });
                      toast.success('Content saved!');
                      setEditingContent(null);
                      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
                    } catch (err) {
                      console.error(err);
                      toast.error('Failed to save content');
                    }
                  }} className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">Title</label>
                      <input
                        name="title"
                        defaultValue={editingContent.title}
                        required
                        className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">Slug</label>
                      <input
                        name="slug"
                        defaultValue={editingContent.slug}
                        required
                        className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">Type</label>
                      <select
                        name="type"
                        defaultValue={editingContent.type || 'blog'}
                        required
                        className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-foreground"
                      >
                        <option value="blog">Blog Post</option>
                        <option value="resource">Resource</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">Image URL</label>
                      <input
                        name="image"
                        defaultValue={editingContent.image}
                        className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-foreground"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">Excerpt</label>
                      <textarea
                        name="excerpt"
                        defaultValue={editingContent.excerpt}
                        rows={2}
                        className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-foreground"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">Content</label>
                      <RichTextEditor
                        name="content"
                        defaultValue={editingContent.content}
                        required={true}
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                        <input
                          type="checkbox"
                          name="is_published"
                          defaultChecked={editingContent.is_published}
                          className="rounded"
                        />
                        Published
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">Published At (ISO date)</label>
                      <input
                        type="datetime-local"
                        name="published_at"
                        defaultValue={editingContent.published_at ? editingContent.published_at.slice(0, 16) : undefined}
                        className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-foreground"
                      />
                    </div>
                    <div className="md:col-span-2 flex gap-4">
                      <button
                        type="submit"
                        className="px-6 py-3 border border-foreground text-sm tracking-widest uppercase hover:bg-foreground hover:text-background transition-colors"
                      >
                        Save Content
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingContent(null)}
                        className="px-6 py-3 border border-border text-sm tracking-widest uppercase hover:border-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Content List */}
              <div className="overflow-x-auto border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-card/60 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Author</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contentData.content.map((c) => (
                      <tr key={c.id} className="border-t border-border/60">
                        <td className="px-4 py-3">{c.title}</td>
                        <td className="px-4 py-3">{c.type}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs uppercase tracking-widest ${c.is_published ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {c.is_published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-4 py-3">{c.profiles?.full_name}</td>
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => setEditingContent(c)}
                            className="text-xs uppercase tracking-widest hover:text-foreground text-muted-foreground"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this content?')) {
                                try {
                                  await deleteContentFn({ data: { id: c.id } });
                                  toast.success('Content deleted');
                                  queryClient.invalidateQueries({ queryKey: ['admin-content'] });
                                } catch (err) {
                                  toast.error('Failed to delete content');
                                }
                              }
                            }}
                            className="text-xs uppercase tracking-widest text-red-500 hover:text-red-400"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!contentData.content.length && (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No content yet. Add one above!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Content Pagination */}
              {contentTotalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => navigate({ search: (prev) => ({ ...prev, contentPage: Math.max(1, contentPage - 1) }) })}
                        className={contentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {generatePaginationPages(contentPage, contentTotalPages).map((page, i) => (
                      <PaginationItem key={i}>
                        {page === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            isActive={page === contentPage}
                            onClick={() => navigate({ search: (prev) => ({ ...prev, contentPage: page }) })}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => navigate({ search: (prev) => ({ ...prev, contentPage: Math.min(contentTotalPages, contentPage + 1) }) })}
                        className={contentPage === contentTotalPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card/40 p-6">
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="font-serif mt-2 text-3xl">{value}</div>
    </div>
  );
}
