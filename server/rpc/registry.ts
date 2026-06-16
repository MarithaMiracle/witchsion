import type { HandlerDef } from "./types";
import * as catalog from "./handlers/catalog";
import * as content from "./handlers/content";
import * as orders from "./handlers/orders";
import * as bookings from "./handlers/bookings";
import * as wishlist from "./handlers/wishlist";
import * as community from "./handlers/community";
import * as admin from "./handlers/admin";
import * as ai from "./handlers/ai";
import * as aiConcierge from "./handlers/ai-concierge";
import * as witchsionAi from "./handlers/witchsion-ai";

export const handlers: Record<string, HandlerDef> = {
  getProducts: catalog.getProducts,
  getCategories: catalog.getCategories,
  getProductBySlug: catalog.getProductBySlug,
  getProductsByCategory: catalog.getProductsByCategory,
  getPublishedContent: content.getPublishedContent,
  getContentBySlug: content.getContentBySlug,
  adminGetAllContent: content.adminGetAllContent,
  adminUpsertContent: content.adminUpsertContent,
  adminDeleteContent: content.adminDeleteContent,
  getContentLikes: content.getContentLikes,
  toggleContentLike: content.toggleContentLike,
  createCheckout: orders.createCheckout,
  listMyOrders: orders.listMyOrders,
  getOrder: orders.getOrder,
  verifyOrderPayment: orders.verifyOrderPayment,
  createBooking: bookings.createBooking,
  getServices: bookings.getServices,
  getServiceBySlug: bookings.getServiceBySlug,
  listMyBookings: bookings.listMyBookings,
  createBookingWithPayment: bookings.createBookingWithPayment,
  confirmBookingPayment: bookings.confirmBookingPayment,
  getMyWishlist: wishlist.getMyWishlist,
  addToWishlist: wishlist.addToWishlist,
  removeFromWishlist: wishlist.removeFromWishlist,
  getCommunityGroups: community.getCommunityGroups,
  getCommunityPosts: community.getCommunityPosts,
  createPost: community.createPost,
  toggleReaction: community.toggleReaction,
  adminGetOverview: admin.adminGetOverview,
  adminUpdateOrderStatus: admin.adminUpdateOrderStatus,
  adminUpdateBookingStatus: admin.adminUpdateBookingStatus,
  adminGetProducts: admin.adminGetProducts,
  adminGetCategories: admin.adminGetCategories,
  adminUpsertProduct: admin.adminUpsertProduct,
  adminDeleteProduct: admin.adminDeleteProduct,
  adminUpsertCategory: admin.adminUpsertCategory,
  getAIAdvice: ai.getAIAdvice,
  chatWithConcierge: aiConcierge.chatWithConcierge,
  seedKnowledgeBase: aiConcierge.seedKnowledgeBase,
  getAdvice: witchsionAi.getAdvice,
};
