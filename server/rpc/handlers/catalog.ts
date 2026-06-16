import type { HandlerDef } from "../types";
import { z } from "zod";
import { supabaseAdmin } from "../../../src/integrations/supabase/client.server";
import {
  products,
  categories,
  productBySlug,
  paginateProducts,
  defaultProductImage,
} from "../../../src/lib/catalog-data";

const ProductsInputSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(200).default(12),
  category: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["created_at", "price", "name"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const getProducts: HandlerDef = {
  handler: async ({ data }) => {
    const { page, pageSize, category, search, sortBy, sortOrder } =
      ProductsInputSchema.parse(data || { page: 1, pageSize: 12 });

    try {
      let query = supabaseAdmin
        .from("products")
        .select(`*, categories(name)`, { count: "exact" })
        .eq("is_active", true);

      if (category) {
        query = query.eq("category_slug", category);
      }

      if (search) {
        const { default: Fuse } = await import("fuse.js");
        let allQuery = supabaseAdmin
          .from("products")
          .select(`*, categories(name)`)
          .eq("is_active", true);
        if (category) allQuery = allQuery.eq("category_slug", category);
        const { data: allRows, error: allError } = await allQuery;
        if (allError) throw allError;

        const candidates = (allRows || []).map((r: Record<string, unknown>) => ({
          ...r,
          name: r.name || "",
          blurb: r.blurb || "",
          description: r.description || "",
          intention: r.intention || "",
        }));

        const fuse = new Fuse(candidates, {
          keys: [
            "slug",
            "name",
            "blurb",
            "description",
            "intention",
            "category",
            "category_slug",
            "categorySlug",
          ],
          includeScore: true,
          threshold: 0.5,
          ignoreLocation: true,
          minMatchCharLength: 2,
        });

        const fuseResults = fuse.search(search);
        const normalizedMatched = fuseResults.map((res) => {
          const r = res.item as Record<string, unknown>;
          const staticP = productBySlug(r.slug as string);
          return {
            ...staticP,
            ...r,
            image: r.image || staticP?.image || defaultProductImage,
            category: (r.categories as { name?: string })?.name || staticP?.category || r.category_slug,
            categorySlug: r.category_slug || staticP?.categorySlug,
          };
        });

        normalizedMatched.sort((a, b) => {
          let comparison = 0;
          if (sortBy === "price") comparison = ((a.price as number) || 0) - ((b.price as number) || 0);
          else if (sortBy === "name")
            comparison = String(a.name || "").localeCompare(String(b.name || ""));
          return sortOrder === "desc" ? -comparison : comparison;
        });

        const { items: paginatedProducts, total } = paginateProducts(
          normalizedMatched,
          page,
          pageSize,
        );
        return { products: paginatedProducts, total, page, pageSize };
      }

      try {
        query = query.order(sortBy, { ascending: sortOrder === "asc" });
      } catch {
        // ignore ordering errors
      }

      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      let rows: Record<string, unknown>[] | null = null;
      let count: number | null = null;
      const res = await query.range(start, end);
      const { data: _rows, count: _count, error } = res;
      if (error) {
        if (error.code === "PGRST103") {
          rows = [];
          count = 0;
        } else {
          throw error;
        }
      } else {
        rows = _rows;
        count = _count;
      }

      if (!rows || rows.length === 0) {
        let filteredProducts = [...products];
        if (category) filteredProducts = filteredProducts.filter((p) => p.categorySlug === category);
        if (search) {
          const searchLower = search.toLowerCase();
          filteredProducts = filteredProducts.filter(
            (p) =>
              p.slug.toLowerCase().includes(searchLower) ||
              (p.name || "").toLowerCase().includes(searchLower) ||
              (p.blurb || "").toLowerCase().includes(searchLower) ||
              (p.description || "").toLowerCase().includes(searchLower) ||
              (p.intention || "").toLowerCase().includes(searchLower) ||
              (p.category || "").toLowerCase().includes(searchLower) ||
              (p.categorySlug || "").toLowerCase().includes(searchLower),
          );
        }
        filteredProducts.sort((a, b) => {
          let comparison = 0;
          if (sortBy === "price") comparison = a.price - b.price;
          else if (sortBy === "name") comparison = a.name.localeCompare(b.name);
          return sortOrder === "desc" ? -comparison : comparison;
        });
        const { items: paginatedProducts, total } = paginateProducts(
          filteredProducts,
          page,
          pageSize,
        );
        return { products: paginatedProducts, total, page, pageSize };
      }

      const normalized = (rows || []).map((r) => {
        const staticP = productBySlug(r.slug as string);
        return {
          ...staticP,
          ...r,
          image: r.image || staticP?.image || defaultProductImage,
          category:
            (r.categories as { name?: string })?.name || staticP?.category || r.category_slug,
          categorySlug: r.category_slug || staticP?.categorySlug,
        };
      });

      return {
        products: normalized,
        total: count ?? normalized.length,
        page,
        pageSize,
      };
    } catch (e) {
      console.warn("getProducts supabase fallback due to error:", e);
      let filteredProducts = [...products];
      if (category) filteredProducts = filteredProducts.filter((p) => p.categorySlug === category);
      if (search) {
        const searchLower = search.toLowerCase();
        filteredProducts = filteredProducts.filter(
          (p) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.blurb.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            p.intention.toLowerCase().includes(searchLower),
        );
      }
      filteredProducts.sort((a, b) => {
        let comparison = 0;
        if (sortBy === "price") comparison = a.price - b.price;
        else if (sortBy === "name") comparison = a.name.localeCompare(b.name);
        return sortOrder === "desc" ? -comparison : comparison;
      });
      const { items: paginatedProducts, total } = paginateProducts(
        filteredProducts,
        page,
        pageSize,
      );
      return { products: paginatedProducts, total, page, pageSize };
    }
  },
};

export const getCategories: HandlerDef = {
  handler: async () => categories,
};

export const getProductBySlug: HandlerDef = {
  handler: async ({ data }) => {
    const slug = z.string().parse(data);
    try {
      const { data: dbProduct, error } = await supabaseAdmin
        .from("products")
        .select(`*, categories(name)`)
        .eq("slug", slug)
        .maybeSingle();
      if (error) console.warn("getProductBySlug supabase error:", error.message);
      if (dbProduct) {
        const staticProduct = productBySlug(slug);
        return {
          ...staticProduct,
          ...dbProduct,
          image: dbProduct.image || staticProduct?.image || defaultProductImage,
          category_slug: dbProduct.category_slug || staticProduct?.categorySlug,
          category:
            dbProduct.categories?.name || staticProduct?.category || dbProduct.category_slug,
          categorySlug: dbProduct.category_slug || staticProduct?.categorySlug,
        };
      }
    } catch (e) {
      console.warn("getProductBySlug supabase fetch failed:", e);
    }
    return productBySlug(slug);
  },
};

export const getProductsByCategory: HandlerDef = {
  handler: async ({ data }) => {
    const { categorySlug, page, pageSize } = z
      .object({
        categorySlug: z.string(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(200).default(12),
      })
      .parse(data);
    const filteredProducts = products.filter((p) => p.categorySlug === categorySlug);
    const { items: paginatedProducts, total } = paginateProducts(
      filteredProducts,
      page,
      pageSize,
    );
    return { products: paginatedProducts, total, page, pageSize };
  },
};
