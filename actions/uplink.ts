"use server";

import { apiFetch } from "@/lib/apiClient";
import type { RouterContact, UplinkCheck } from "@/lib/types/uplink";

type Result<T> = { data: T | null; error: string | null };

/** Latest uplink check of every router the caller may see, worst first. */
export async function getUplink(): Promise<Result<UplinkCheck[]>> {
  const res = await apiFetch<UplinkCheck[]>("/network/uplink", { auth: "required", cache: "no-store" });
  return res.success && res.data
    ? { data: res.data, error: null }
    : { data: null, error: res.message || "Could not load the uplink checks." };
}

/** One router's checks over the last `hours`, newest first. */
export async function getUplinkHistory(routerId: number, hours: number = 24): Promise<Result<UplinkCheck[]>> {
  const res = await apiFetch<UplinkCheck[]>(`/network/uplink/router/${routerId}/history?hours=${hours}`, {
    auth: "required",
    cache: "no-store",
  });
  return res.success && res.data
    ? { data: res.data, error: null }
    : { data: null, error: res.message || "Could not load this router's uplink history." };
}

/** Run the check now, from inside the router where its tunnel is up. Takes up to about 30 s. */
export async function checkUplinkNow(routerId: number): Promise<Result<UplinkCheck>> {
  const res = await apiFetch<UplinkCheck>(`/network/uplink/router/${routerId}/check`, {
    method: "POST",
    auth: "required",
    timeoutMs: 45_000,
  });
  return res.success && res.data
    ? { data: res.data, error: null }
    : { data: null, error: res.message || "The check could not be run." };
}

/** When the system last heard from one router, by each channel, and what to do about a silence. */
export async function getRouterContact(routerId: number): Promise<Result<RouterContact>> {
  const res = await apiFetch<RouterContact>(`/network/uplink/router/${routerId}/contact`, {
    auth: "required",
    cache: "no-store",
  });
  return res.success && res.data
    ? { data: res.data, error: null }
    : { data: null, error: res.message || "Could not load this router's contact." };
}
