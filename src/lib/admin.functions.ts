import { createApiFn } from "@/lib/api/create-api-fn";

export const adminGetOverview = createApiFn("adminGetOverview");
export const adminUpdateOrderStatus = createApiFn("adminUpdateOrderStatus");
export const adminUpdateBookingStatus = createApiFn("adminUpdateBookingStatus");
export const adminGetProducts = createApiFn("adminGetProducts");
export const adminGetCategories = createApiFn("adminGetCategories");
export const adminUpsertProduct = createApiFn("adminUpsertProduct");
export const adminDeleteProduct = createApiFn("adminDeleteProduct");
export const adminUpsertCategory = createApiFn("adminUpsertCategory");
