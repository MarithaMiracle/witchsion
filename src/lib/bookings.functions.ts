import { createApiFn } from "@/lib/api/create-api-fn";

export const createBooking = createApiFn("createBooking");
export const getServices = createApiFn("getServices");
export const getServiceBySlug = createApiFn("getServiceBySlug");
export const listMyBookings = createApiFn("listMyBookings");
export const createBookingWithPayment = createApiFn("createBookingWithPayment");
export const confirmBookingPayment = createApiFn("confirmBookingPayment");
