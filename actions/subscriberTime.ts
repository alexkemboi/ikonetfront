"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/apiClient";
import type { ActionResult, HotspotSessionTime, PppoeSubscriptionTime, TvCustomerTime } from "@/lib/types/subscriberTime";

/**
 * Customer care actions on one subscriber: add time, pause, resume.
 * The backend decides who may do what (staff, management and administrators; adding more
 * than a day needs an administrator) and which packages can be paused, and answers with a
 * sentence that is shown to the operator as it is.
 */

const BASE = "/subscriber-time";

async function post<T>(path: string, body: unknown, fallback: string): Promise<ActionResult<T>> {
  const res = await apiFetch<T>(`${BASE}${path}`, { method: "POST", auth: "required", body });
  if (!res.success || !res.data) return { success: false, message: res.message || fallback };
  revalidatePath("/customers/all");
  revalidatePath("/network/live-sessions");
  return { success: true, data: res.data, message: res.message || "Done" };
}

async function get<T>(path: string, fallback: string): Promise<ActionResult<T>> {
  const res = await apiFetch<T>(`${BASE}${path}`, { auth: "required", cache: "no-store" });
  return res.success && res.data
    ? { success: true, data: res.data, message: res.message || "" }
    : { success: false, message: res.message || fallback };
}

export async function getPausedHotspotSessions(): Promise<ActionResult<HotspotSessionTime[]>> {
  return get<HotspotSessionTime[]>("/hotspot-sessions/paused", "Could not load paused customers.");
}

export async function getHotspotSessionTime(sessionId: number): Promise<ActionResult<HotspotSessionTime>> {
  return get<HotspotSessionTime>(`/hotspot-sessions/${sessionId}`, "Could not load this customer's session.");
}

export async function addHotspotTime(sessionId: number, minutes: number, reason: string) {
  return post<HotspotSessionTime>(`/hotspot-sessions/${sessionId}/add-time`, { minutes, reason }, "Could not add the time.");
}

/** `resumeAt`: ISO time the pause ends by itself; omit for a person to resume it. */
export async function pauseHotspotSession(sessionId: number, reason: string, resumeAt?: string | null) {
  return post<HotspotSessionTime>(`/hotspot-sessions/${sessionId}/pause`, { reason, resumeAt: resumeAt || null }, "Could not pause the session.");
}

/** Admin and management: tie the purchase to another device, or remove its device (blank address). */
export async function changeHotspotDevice(sessionId: number, macAddress: string, reason: string) {
  return post<HotspotSessionTime>(`/hotspot-sessions/${sessionId}/device`, { macAddress, reason }, "Could not change the device.");
}

/** Admin and management: block the customer without losing the time left (any package length). Activate = resume. */
export async function deactivateHotspotSession(sessionId: number, reason: string) {
  return post<HotspotSessionTime>(`/hotspot-sessions/${sessionId}/deactivate`, { reason }, "Could not deactivate the package.");
}

/** Administrators: set when the package started and ends (ISO times). An end that has passed ends it now. */
export async function correctHotspotDates(sessionId: number, startsAt: string, endsAt: string, reason: string) {
  return post<HotspotSessionTime>(`/hotspot-sessions/${sessionId}/correct-dates`, { startsAt, endsAt, reason },
    "Could not correct the dates.");
}

export async function resumeHotspotSession(sessionId: number) {
  return post<HotspotSessionTime>(`/hotspot-sessions/${sessionId}/resume`, {}, "Could not resume the session.");
}

export async function getPppoeSubscriptionTime(subscriptionId: string): Promise<ActionResult<PppoeSubscriptionTime>> {
  return get<PppoeSubscriptionTime>(`/pppoe-subscriptions/${subscriptionId}`, "Could not load this subscription.");
}

export async function addPppoeDays(subscriptionId: string, days: number, reason: string) {
  return post<PppoeSubscriptionTime>(`/pppoe-subscriptions/${subscriptionId}/add-time`, { days, reason }, "Could not add the days.");
}

/** `resumeAt`: ISO time the pause ends by itself; omit for a person to resume it. */
export async function pausePppoeSubscription(subscriptionId: string, reason: string, resumeAt?: string | null) {
  return post<PppoeSubscriptionTime>(`/pppoe-subscriptions/${subscriptionId}/pause`, { reason, resumeAt: resumeAt || null }, "Could not pause the subscription.");
}

export async function resumePppoeSubscription(subscriptionId: string) {
  return post<PppoeSubscriptionTime>(`/pppoe-subscriptions/${subscriptionId}/resume`, {}, "Could not resume the subscription.");
}

/** Administrators: set both dates of an active subscription (can shorten; records no payment). */
export async function correctPppoeDates(subscriptionId: string, startDate: string, expiryDate: string, reason: string) {
  return post<PppoeSubscriptionTime>(`/pppoe-subscriptions/${subscriptionId}/correct-dates`, { startDate, expiryDate, reason },
    "Could not correct the dates.");
}

/** One past hotspot purchase or voucher, as the session history lists it. */
export type HotspotPurchase = {
  sessionId: number;
  packageName?: string | null;
  amountPaid?: number | null;
  sessionStatus?: string | null;
  mpesaReference?: string | null;
  voucherCode?: string | null;
  createdAt?: string | null;
  expiresAt?: string | null;
};

/** The latest purchases of a hotspot customer, by phone number, newest first. */
export async function getHotspotPurchaseHistory(phone: string): Promise<ActionResult<HotspotPurchase[]>> {
  const params = new URLSearchParams({ clientPhone: phone, page: "0", size: "20", sort: "createdAt,desc" });
  const res = await apiFetch<{ content?: HotspotPurchase[] }>(`/hotspot/sessions/history?${params.toString()}`, {
    auth: "required",
    cache: "no-store",
  });
  return res.success
    ? { success: true, data: res.data?.content ?? [], message: res.message }
    : { success: false, message: res.message };
}

// ── TV customers ────────────────────────────────────────────────────────────

export async function getTvCustomers(): Promise<ActionResult<TvCustomerTime[]>> {
  return get<TvCustomerTime[]>("/tv-customers", "Could not load TV customers.");
}

export async function getTvCustomer(entitlementId: string): Promise<ActionResult<TvCustomerTime>> {
  return get<TvCustomerTime>(`/tv-customers/${entitlementId}`, "Could not load this TV.");
}

export async function addTvTime(entitlementId: string, minutes: number, reason: string) {
  return post<TvCustomerTime>(`/tv-customers/${entitlementId}/add-time`, { minutes, reason }, "Could not add the time.");
}

/** `resumeAt`: ISO time the pause ends by itself; omit for a person to resume it. */
export async function pauseTvCustomer(entitlementId: string, reason: string, resumeAt?: string | null) {
  return post<TvCustomerTime>(`/tv-customers/${entitlementId}/pause`, { reason, resumeAt: resumeAt || null }, "Could not pause the TV.");
}

export async function resumeTvCustomer(entitlementId: string) {
  return post<TvCustomerTime>(`/tv-customers/${entitlementId}/resume`, {}, "Could not resume the TV.");
}

/** Admin and management: correct the TV's MAC address. */
export async function changeTvDevice(entitlementId: string, macAddress: string, reason: string) {
  return post<TvCustomerTime>(`/tv-customers/${entitlementId}/device`, { macAddress, reason }, "Could not change the TV's address.");
}

/** Admin and management: block the TV without losing the time left (any package length). Activate = resume. */
export async function deactivateTvCustomer(entitlementId: string, reason: string) {
  return post<TvCustomerTime>(`/tv-customers/${entitlementId}/deactivate`, { reason }, "Could not deactivate the TV.");
}

/** Admin and management: end the TV's package now; the time left is lost. */
export async function endTvPackage(entitlementId: string, reason: string): Promise<ActionResult<null>> {
  const res = await apiFetch<null>(`${BASE}/tv-customers/${entitlementId}/end`, { method: "POST", auth: "required", body: { reason } });
  if (!res.success) return { success: false, message: res.message || "Could not end the package." };
  revalidatePath("/customers/all");
  return { success: true, data: null, message: res.message || "Package ended" };
}

/** Administrators: set when the TV's access started and ends (ISO times). An end that has passed ends it. */
export async function correctTvDates(entitlementId: string, startsAt: string, endsAt: string, reason: string) {
  return post<TvCustomerTime>(`/tv-customers/${entitlementId}/correct-dates`, { startsAt, endsAt, reason },
    "Could not correct the dates.");
}
