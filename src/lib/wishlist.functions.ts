import { createApiFn } from "@/lib/api/create-api-fn";

export const getMyWishlist = createApiFn("getMyWishlist");
export const addToWishlist = createApiFn("addToWishlist");
export const removeFromWishlist = createApiFn("removeFromWishlist");
