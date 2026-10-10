"use server";

/**
 * Router operations page (`/network/routers/[id]`): figures, payments, and what the page
 * reads or changes on the router itself. `routerId` is network_routers.idxno throughout.
 *
 * The investor variants read the same figures through `/investor/routers/{deviceId}/*`,
 * which answer bare payloads (no envelope) and only for a router the investor holds.
 */
import { apiFetch } from "@/lib/apiClient";
import { withCompanyContext } from "@/lib/companyContext";
import { auth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/constants";
import type {
  RouterBackupFile,
  RouterConnectionInfo,
  RouterHotspotSettings,
  RouterIpService,
  RouterLogEntry,
  RouterOverview,
  RouterPayment,
  RouterReachability,
  RouterScheduleItem,
  RouterScriptItem,
  RouterSecrets,
  RouterSeries,
  RouterSeriesRange,
} from "@/lib/types/network";
import type { ProvisioningStatusResponse } from "@/lib/types/provisioning";

export type OpsResult<T> = { data: T | null; error: string | null; status?: number };

/** Live router reads open a RouterOS API connection; give them longer than a database read. */
const LIVE_TIMEOUT_MS = 25_000;

async function read<T>(path: string, fallback: string, live = false): Promise<OpsResult<T>> {
  const res = await apiFetch<T>(path, {
    auth: "required",
    cache: "no-store",
    ...(live ? { timeoutMs: LIVE_TIMEOUT_MS } : {}),
  });
  return res.success
    ? { data: (res.data ?? null) as T | null, error: null, status: res.status }
    : { data: null, error: res.message || fallback, status: res.status };
}

async function write<T>(
  path: string,
  method: "POST" | "PUT",
  body: unknown,
  fallback: string,
  stepUpToken?: string
): Promise<OpsResult<T> & { success: boolean; message: string }> {
  const res = await apiFetch<T>(path, {
    method,
    body,
    auth: "required",
    cache: "no-store",
    timeoutMs: LIVE_TIMEOUT_MS,
    stepUpToken,
  });
  return res.success
    ? { success: true, message: res.message || "Done", data: (res.data ?? null) as T | null, error: null, status: res.status }
    : { success: false, message: res.message || fallback, data: null, error: res.message || fallback, status: res.status };
}

const base = (routerId: number) => `/network/routers/${routerId}`;

export async function getRouterOverview(routerId: number) {
  return read<RouterOverview>(`${base(routerId)}/overview`, "Could not load the router's figures.");
}

export async function getRouterPayments(routerId: number, days = 30) {
  return read<RouterPayment[]>(`${base(routerId)}/payments?days=${days}`, "Could not load this router's payments.");
}

export async function getRouterLog(routerId: number) {
  return read<RouterLogEntry[]>(`${base(routerId)}/logs`, "Could not read the router's log.", true);
}

export async function getRouterScheduler(routerId: number) {
  return read<RouterScheduleItem[]>(`${base(routerId)}/scheduler`, "Could not read the router's scheduler.", true);
}

export async function getRouterScripts(routerId: number) {
  return read<RouterScriptItem[]>(`${base(routerId)}/scripts`, "Could not read the router's scripts.", true);
}

export async function getRouterBackups(routerId: number) {
  return read<RouterBackupFile[]>(`${base(routerId)}/backups`, "Could not list the router's backups.", true);
}

export async function createRouterBackup(routerId: number) {
  return write<{ name: string }>(`${base(routerId)}/backups`, "POST", {}, "The backup could not be saved.");
}

export async function getRouterServices(routerId: number) {
  return read<RouterIpService[]>(`${base(routerId)}/services`, "Could not read the router's services.", true);
}

export async function setRouterWinbox(routerId: number, enabled: boolean) {
  return write<RouterIpService[]>(`${base(routerId)}/services/winbox`, "PUT", { enabled }, "WinBox could not be changed.");
}

export async function getRouterHotspot(routerId: number) {
  return read<RouterHotspotSettings>(`${base(routerId)}/hotspot`, "Could not read the router's hotspot settings.", true);
}

export async function updateRouterHotspot(
  routerId: number,
  timeouts: { idleTimeout?: string; keepaliveTimeout?: string }
) {
  return write<RouterHotspotSettings>(`${base(routerId)}/hotspot`, "PUT", timeouts, "The hotspot timeouts could not be changed.");
}

export async function getRouterConnection(routerId: number) {
  return read<RouterConnectionInfo>(`${base(routerId)}/connection`, "Could not load the connection details.");
}

/** SYSADMIN only; the first call answers 428 until the operator has stepped up. */
export async function revealRouterSecrets(routerId: number, stepUpToken?: string) {
  return write<RouterSecrets>(`${base(routerId)}/secrets/reveal`, "POST", {}, "The secrets could not be revealed.", stepUpToken);
}

/** Zero-touch provisioning progress of the router's device row (network_device.id). */
export async function getProvisioningChecklist(deviceId: number) {
  return read<ProvisioningStatusResponse>(`/provision/devices/${deviceId}/status`, "Could not load provisioning status.");
}

// ── Investor read-only view ──

async function investorRead<T>(path: string, fallback: string): Promise<OpsResult<T>> {
  const session = await auth();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) headers.Authorization = `Bearer ${session.user.apiToken}`;
  await withCompanyContext(headers);
  try {
    const res = await fetch(buildApiUrl(path), { headers, cache: "no-store" });
    if (!res.ok) {
      return { data: null, error: res.status === 404 ? "This router is not assigned to you." : fallback, status: res.status };
    }
    return { data: (await res.json()) as T, error: null, status: res.status };
  } catch {
    return { data: null, error: fallback };
  }
}

const investorBase = (deviceId: number) => `/investor/routers/${deviceId}`;

export async function getInvestorRouterOverview(deviceId: number) {
  return investorRead<RouterOverview>(`${investorBase(deviceId)}/overview`, "Could not load the router's figures.");
}

export async function getInvestorRouterSeries(deviceId: number, range: RouterSeriesRange) {
  return investorRead<RouterSeries>(`${investorBase(deviceId)}/series?range=${range}`, "Could not load the router history.");
}

export async function getInvestorRouterReachability(deviceId: number, days = 7) {
  return investorRead<RouterReachability>(`${investorBase(deviceId)}/reachability?days=${days}`, "Could not load the router's uptime.");
}

export async function getInvestorRouterPayments(deviceId: number, days = 30) {
  return investorRead<RouterPayment[]>(`${investorBase(deviceId)}/payments?days=${days}`, "Could not load this router's payments.");
}
