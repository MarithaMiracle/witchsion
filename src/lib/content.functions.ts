import { createApiFn } from "@/lib/api/create-api-fn";

export const getPublishedContent = createApiFn("getPublishedContent");
export const getContentBySlug = createApiFn("getContentBySlug");
export const adminGetAllContent = createApiFn("adminGetAllContent");
export const adminUpsertContent = createApiFn("adminUpsertContent");
export const adminDeleteContent = createApiFn("adminDeleteContent");
export const getContentLikes = createApiFn("getContentLikes");
export const toggleContentLike = createApiFn("toggleContentLike");
