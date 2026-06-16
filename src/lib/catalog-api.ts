import { createApiFn } from "@/lib/api/create-api-fn";

export const getProducts = createApiFn("getProducts");
export const getCategories = createApiFn("getCategories");
export const getProductBySlug = createApiFn("getProductBySlug");
export const getProductsByCategory = createApiFn("getProductsByCategory");
