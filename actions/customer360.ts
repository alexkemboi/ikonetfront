"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "@/lib/types/api";
import type {
  ActivityHeatmapPoint,
  CustomerNote,
  CustomerPppoeOverview,
  LiveSpeedGauge,
  PaymentHistoryItem,
  PeakHourDensity,
  SmsHistoryItem,
  TicketSummaryItem,
} from "@/lib/types/customer360";

function nullOnFailure<T>(res: ApiResponse<T>): ApiResponse<T> {
  return { ...res, data: res.success && res.data !== undefined ? res.data : null };
}

function failed<T>(message: string): ApiResponse<T> {
  return {
    status: 500,
    success: false,
    message,
    data: null,
    timestamp: new Date().toISOString(),
  };
}

export async function getLiveSpeed(
  customerId: number
): Promise<ApiResponse<LiveSpeedGauge>> {
  try {
    const res = await apiFetch<LiveSpeedGauge>(
      `/customers/${customerId}/live-speed`,
      { auth: "required", cache: "no-store", timeoutMs: 8000 }
    );
    return nullOnFailure(res);
  } catch (error: unknown) {
    return failed(
      (error instanceof Error ? error.message : String(error)) ||
        "Unable to read live speed"
    );
  }
}

export interface CustomerDeviceCheck {
  state: "REACHABLE" | "NO_REPLY" | "SESSION_OFFLINE" | "NO_PPPOE_ACCOUNT" | "NO_ROUTER" | "ROUTER_UNREACHABLE";
  message: string;
  checkedAt: string;
  pppoeUsername?: string;
  routerName?: string;
  sessionAddress?: string;
  deviceMac?: string;
  sessionUptime?: string;
  sent?: number;
  received?: number;
  packetLossPct?: number | null;
  avgRttMs?: number | null;
  maxRttMs?: number | null;
}

/** Pings the customer's own router from the MikroTik that serves their PPPoE session (takes about 4 seconds). */
export async function checkCustomerDevice(
  customerId: number
): Promise<ApiResponse<CustomerDeviceCheck>> {
  try {
    const res = await apiFetch<CustomerDeviceCheck>(
      `/customers/${customerId}/device-ping`,
      { method: "POST", auth: "required", cache: "no-store", timeoutMs: 20_000 }
    );
    return nullOnFailure(res);
  } catch (error: unknown) {
    return failed(
      (error instanceof Error ? error.message : String(error)) ||
        "Unable to test the customer's device"
    );
  }
}

export async function getActivityHeatmap(
  customerId: number
): Promise<ApiResponse<ActivityHeatmapPoint[]>> {
  try {
    const res = await apiFetch<ActivityHeatmapPoint[]>(
      `/customers/${customerId}/analytics/activity-heatmap`,
      { auth: "required", tags: [`customer-activity-${customerId}`] }
    );
    return nullOnFailure(res);
  } catch (error: unknown) {
    return failed(
      (error instanceof Error ? error.message : String(error)) ||
        "Unable to load activity heatmap"
    );
  }
}

export async function getPeakHours(
  customerId: number
): Promise<ApiResponse<PeakHourDensity[]>> {
  try {
    const res = await apiFetch<PeakHourDensity[]>(
      `/customers/${customerId}/analytics/peak-hours`,
      { auth: "required", tags: [`customer-peak-${customerId}`] }
    );
    return nullOnFailure(res);
  } catch (error: unknown) {
    return failed(
      (error instanceof Error ? error.message : String(error)) ||
        "Unable to load peak hours"
    );
  }
}

export async function getCustomerNotes(
  customerId: number
): Promise<ApiResponse<CustomerNote[]>> {
  try {
    const res = await apiFetch<CustomerNote[]>(
      `/customers/${customerId}/notes`,
      { auth: "required", tags: [`customer-notes-${customerId}`] }
    );
    return nullOnFailure(res);
  } catch (error: unknown) {
    return failed(
      (error instanceof Error ? error.message : String(error)) ||
        "Unable to load notes"
    );
  }
}

export async function createCustomerNote(
  customerId: number,
  note: string
): Promise<ApiResponse<CustomerNote>> {
  try {
    const res = await apiFetch<CustomerNote>(`/customers/${customerId}/notes`, {
      method: "POST",
      body: { note },
      auth: "required",
    });
    if (res.success) {
      revalidatePath(`/customers/${customerId}`);
    }
    return res;
  } catch (error: unknown) {
    return failed(
      (error instanceof Error ? error.message : String(error)) ||
        "Unable to save note"
    );
  }
}

export async function getCustomerPayments(
  customerId: number
): Promise<ApiResponse<PaymentHistoryItem[]>> {
  try {
    const res = await apiFetch<PaymentHistoryItem[]>(
      `/customers/${customerId}/payments`,
      { auth: "required", tags: [`customer-payments-${customerId}`] }
    );
    return nullOnFailure(res);
  } catch (error: unknown) {
    return failed(
      (error instanceof Error ? error.message : String(error)) ||
        "Unable to load payments"
    );
  }
}

export async function getPppoeOverview(
  customerId: number
): Promise<ApiResponse<CustomerPppoeOverview>> {
  try {
    const res = await apiFetch<CustomerPppoeOverview>(
      `/customers/${customerId}/pppoe-accounts`,
      { auth: "required", tags: [`customer-pppoe-${customerId}`] }
    );
    return nullOnFailure(res);
  } catch (error: unknown) {
    return failed(
      (error instanceof Error ? error.message : String(error)) ||
        "Unable to load PPPoE details"
    );
  }
}

export async function getSmsHistory(
  customerId: number
): Promise<ApiResponse<SmsHistoryItem[]>> {
  try {
    const res = await apiFetch<SmsHistoryItem[]>(
      `/customers/${customerId}/sms`,
      { auth: "required", tags: [`customer-sms-${customerId}`] }
    );
    return nullOnFailure(res);
  } catch (error: unknown) {
    return failed(
      (error instanceof Error ? error.message : String(error)) ||
        "Unable to load SMS history"
    );
  }
}

export async function getCustomerTickets(
  customerId: number
): Promise<ApiResponse<TicketSummaryItem[]>> {
  try {
    const res = await apiFetch<TicketSummaryItem[]>(
      `/customers/${customerId}/tickets`,
      { auth: "required", tags: [`customer-tickets-${customerId}`] }
    );
    return nullOnFailure(res);
  } catch (error: unknown) {
    return failed(
      (error instanceof Error ? error.message : String(error)) ||
        "Unable to load tickets"
    );
  }
}