import { createApiFn } from "@/lib/api/create-api-fn";

export const getCommunityGroups = createApiFn("getCommunityGroups");
export const getCommunityPosts = createApiFn("getCommunityPosts");
export const createPost = createApiFn("createPost");
export const toggleReaction = createApiFn("toggleReaction");
