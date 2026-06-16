import { createApiFn } from "@/lib/api/create-api-fn";

export const createCheckout = createApiFn("createCheckout");
export const listMyOrders = createApiFn("listMyOrders");
export const getOrder = createApiFn("getOrder");
export const verifyOrderPayment = createApiFn("verifyOrderPayment");
