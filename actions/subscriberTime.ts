"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/apiClient";
import type { ActionResult, HotspotSessionTime, PppoeSubscriptionTime } from "@/lib/types/subscriberTime";

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

export async function pauseHotspotSession(sessionId: number, reason: string) {
  return post<HotspotSessionTime>(`/hotspot-sessions/${sessionId}/pause`, { reason }, "Could not pause the session.");
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

export async function pausePppoeSubscription(subscriptionId: string, reason: string) {
  return post<PppoeSubscriptionTime>(`/pppoe-subscriptions/${subscriptionId}/pause`, { reason }, "Could not pause the subscription.");
}

export async function resumePppoeSubscription(subscriptionId: string) {
  return post<PppoeSubscriptionTime>(`/pppoe-subscriptions/${subscriptionId}/resume`, {}, "Could not resume the subscription.");
}
