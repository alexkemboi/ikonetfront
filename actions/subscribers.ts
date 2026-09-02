"use server";

import { auth } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";
import { getCustomers } from "@/actions/customer";
import { getIpMappings } from "@/actions/network";
import type { Customer } from "@/lib/types/customer";
import type { IpMappingResponse } from "@/lib/types/api";
import {
  OutageCompensationRequest,
  SubscriberItem,
  SubscriberKpis,
  SubscriberType,
} from "@/lib/types/subscribers";
import { getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";

// ── Display fallbacks (blueprint atom values) ────────────────────────────────

const FALLBACK_KPIS: SubscriberKpis = {
  allUsersCount: 4789,
  expiringIn7DaysCount: 67,
  newThisWeekCount: 48,
  onlinePercentage: 1,
  onlineCount: 319,
  atRiskCount: 822,
};

const FALLBACK_SUBSCRIBERS: SubscriberItem[] = [
  {
    id: "demo-1",
    code: "A2085",
    fullName: "Grace Wanjiru",
    phone: "0703 247 179",
    email: "gwanjiru@gmail.com",
    type: "HOTSPOT",
    planName: "Home Hotspot 10Mbps",
    planSpeed: "10 Mbps",
    planPrice: 1500,
    expiryText: "Aug 16, 2026",
    expiryDate: "2026-08-16T23:59:59+03:00",
    isExpiringToday: true,
    status: "ONLINE",
    nasName: "ADRNOLDNETWORKS",
    deviceType: "SMART_TV",
    macAddress: "32:A2:F1:9C:4D:02",
    ipAddress: "172.16.0.11",
  },
  {
    id: "demo-2",
    code: "A3112",
    fullName: "Joseph Mwangi",
    phone: "0712 884 551",
    email: "jmwangi@outlook.com",
    type: "HOTSPOT",
    planName: "Hotspot Daily 4Mbps",
    planSpeed: "4 Mbps",
    planPrice: 800,
    expiryText: "Aug 22, 2026",
    expiryDate: "2026-08-22T23:59:59+03:00",
    status: "ONLINE",
    nasName: "ADRNOLDNETWORKS",
  },
  {
    id: "demo-3",
    code: "P-114",
    fullName: "Peter Otieno",
    phone: "0731954023",
    email: "potieno@gmail.com",
    type: "PPPOE",
    planName: "PPPoE Unlimited 8M",
    planSpeed: "8 Mbps",
    planPrice: 2000,
    expiryText: "Sep 02, 2026",
    expiryDate: "2026-09-02T23:59:59+03:00",
    status: "ONLINE",
    nasName: "Adrinold Ukunda",
  },
  {
    id: "demo-4",
    code: "A4290",
    fullName: "Mary Chebet",
    phone: "0722900113",
    email: "mchebet@gmail.com",
    type: "HOTSPOT",
    planName: "Hotspot Weekly 2Mbps",
    planSpeed: "2 Mbps",
    planPrice: 500,
    expiryText: "Jul 30, 2026",
    expiryDate: "2026-07-30T23:59:59+03:00",
    status: "OFFLINE",
    nasName: "—",
  },
  {
    id: "demo-5",
    code: "BIND-718",
    fullName: "Smart TV — Grace's Lounge",
    phone: "—",
    type: "BINDING",
    planName: "Static Binding",
    planSpeed: "",
    planPrice: 0,
    expiryText: "—",
    status: "OFFLINE",
    nasName: "ADRNOLDNETWORKS",
    isDeviceBinding: true,
    deviceType: "SMART_TV",
    macAddress: "30:3E:4A:BB:71:0C",
    ipAddress: "172.31.18.12",
  },
  {
    id: "demo-6",
    code: "BIND-902",
    fullName: "Console — Alex Ochieng",
    phone: "—",
    type: "BINDING",
    planName: "Static Binding",
    planSpeed: "",
    planPrice: 0,
    expiryText: "—",
    status: "OFFLINE",
    nasName: "Adrinold Ukunda",
    isDeviceBinding: true,
    macAddress: "EC:8E:B5:44:9F:D0",
    ipAddress: "172.31.18.40",
  },
];

// ── Raw shape returned by the network/ip-mappings endpoint ──────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

function isActiveMapping(mapping: IpMappingResponse): boolean {
  return mapping.status === "ONLINE";
}

function normalizeType(custtype?: string | null): SubscriberType {
  return String(custtype ?? "").toLowerCase() === "pppoe" ? "PPPOE" : "HOTSPOT";
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ── Subscribers hub data (KPI derivation locked) ─────────────────────────────

export async function getSubscribersData(): Promise<{
  kpis: SubscriberKpis;
  subscribers: SubscriberItem[];
}> {
  const session = await auth();
  const token = session?.user?.apiToken;

  if (!token) {
    return { kpis: FALLBACK_KPIS, subscribers: FALLBACK_SUBSCRIBERS };
  }

  try {
    const [customersResponse, mappings] = await Promise.all([
      getCustomers(0, 200),
      getIpMappings(),
    ]);

    const content = (customersResponse?.data?.content ?? []) as Customer[];
    const totalElements =
      customersResponse?.data?.totalElements ?? content.length;

    if (content.length === 0 && mappings.length === 0) {
      return { kpis: FALLBACK_KPIS, subscribers: FALLBACK_SUBSCRIBERS };
    }

    // Join radacct-derived bindings on `username` (real `IpMappingResponse`).
    const onlineByUsername = new Map<string, IpMappingResponse>();
    for (const raw of mappings as IpMappingResponse[]) {
      if (!isActiveMapping(raw)) continue;
      const username = String(raw.username ?? "").trim();
      if (username && !onlineByUsername.has(username)) {
        onlineByUsername.set(username, raw);
      }
    }

    const now = Date.now();
    let expiringIn7DaysCount = 0;
    let newThisWeekCount = 0;
    let atRiskCount = 0;
    let onlineCount = 0;

    const subscribers: SubscriberItem[] = content.map((customer) => {
      const expiryMs = customer.expiryDate ? new Date(customer.expiryDate).getTime() : NaN;
      if (
        customer.isSubActive === true &&
        !isNaN(expiryMs) &&
        expiryMs > now &&
        expiryMs - now <= 7 * DAY_MS
      ) {
        expiringIn7DaysCount += 1;
      }

      if (
        customer.createdAt &&
        !isNaN(new Date(customer.createdAt).getTime()) &&
        new Date(customer.createdAt).getTime() > now - 7 * DAY_MS
      ) {
        newThisWeekCount += 1;
      }

      const isActive = customer.isSubActive === true;
      const hasSubscription = Boolean(customer.packageName || customer.expiryDate);
      const lastActiveMs = customer.lastActiveDate
        ? new Date(customer.lastActiveDate).getTime()
        : NaN;
      const isStale = !customer.lastActiveDate || isNaN(lastActiveMs) || lastActiveMs < now - 30 * DAY_MS;
      if (isActive && (isStale || !hasSubscription)) {
        atRiskCount += 1;
      }

      const onlineMapping = customer.username
        ? onlineByUsername.get(customer.username)
        : undefined;
      const isOnline = !!onlineMapping;
      if (isOnline) onlineCount += 1;

      return {
        id: customer.userIdxno != null ? String(customer.userIdxno) : customer.username || "—",
        code: customer.username || customer.fullName || "—",
        fullName: customer.fullName || customer.username || "—",
        phone: customer.phoneNumber || "—",
        email: customer.email || undefined,
        type: normalizeType(customer.custtype),
        planName: customer.packageName || "—",
        planSpeed: "",
        planPrice: 0,
        expiryText: formatDate(customer.expiryDate),
        expiryDate: customer.expiryDate ?? undefined,
        isExpiringToday: customer.expiryDate
          ? isSameDay(new Date(customer.expiryDate), new Date())
          : false,
        status: isOnline ? "ONLINE" : "OFFLINE",
        nasName: onlineMapping?.stationName || "—",
        macAddress: onlineMapping?.macAddress || undefined,
        ipAddress: onlineMapping?.ipAddress || undefined,
      };
    });

    const kpis: SubscriberKpis = {
      allUsersCount: totalElements,
      expiringIn7DaysCount,
      newThisWeekCount,
      onlineCount,
      onlinePercentage:
        totalElements > 0 ? Math.round((onlineCount / totalElements) * 100) : 0,
      atRiskCount,
    };

    return { kpis, subscribers };
  } catch (error) {
    console.warn("Failed to fetch subscriber hub data. Using baseline:", error);
    return { kpis: FALLBACK_KPIS, subscribers: FALLBACK_SUBSCRIBERS };
  }
}

// ── Outage compensation ──────────────────────────────────────────────────────

export async function submitOutageCompensation(
  request: OutageCompensationRequest
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  const token = session?.user?.apiToken;
  if (!token) {
    return { success: false, message: "You must be signed in to compensate subscribers." };
  }

  const permissions = await getCurrentUserPermissions();
  const perms = permissions["/customers"] ?? NO_PERMISSIONS;
  if (!perms.canEdit && !perms.canCreate && !perms.canDelete) {
    return {
      success: false,
      message: "You don't have permission to apply outage compensation.",
    };
  }

  if (request.policy === "PAUSE" && (!request.durationMinutes || request.durationMinutes <= 0)) {
    return {
      success: false,
      message: "A positive pause duration is required for the PAUSE policy.",
    };
  }
  if (
    request.policy === "COMPENSATE" &&
    (request.creditKsh == null || request.creditKsh < 0)
  ) {
    return {
      success: false,
      message: "A valid credit amount is required for the COMPENSATE policy.",
    };
  }

  try {
    const res = await fetch(`${BASE_URL}network/outages/compensate`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    const body = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) {
      return {
        success: false,
        message: body.message || `Compensation failed (HTTP ${res.status})`,
      };
    }

    return { success: true, message: body.message || "Compensation submitted" };
  } catch (error) {
    console.warn("Failed to submit outage compensation:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to submit compensation",
    };
  }
}