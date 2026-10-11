"use server";

import { withCompanyContext } from "@/lib/companyContext";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/constants";
import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "@/lib/types/auth";

// ── Types ─────────────────────────────────────────────────────────────────────
export type InternetPackage = {
  idxno:           number;
  packageName:     string;
  price:           string;
  packageCategory: string;
  validityType:    string;
  validityValue:   number;
  bandwidthType:   string;
  activeStatus:    boolean;
  speedDownload:   number;
  speedUpload:     number;
  enableBurst:     boolean;
  rateLimit:       string;
  burstLimit:      string;
  burstThreshold:  string;
  burstTime:       string;
  dateCreated:     string;
  createdBy:       string;
  approvedBy:      string | null;
  isApproved:      boolean;
  /** Owning company (code). Shown when a SYSADMIN views all companies. */
  companyId?:      string | null;
  /** ALL = sold on every router of the company; SELECTED = only on chosen routers. */
  routerScope?:    "ALL" | "SELECTED";
};

// ── Where each package is sold (per router) ───────────────────────────────────
export type PackageRouter = { id: number; name: string; location: string | null; online: boolean };

export type PackageAvailability = {
  idxno:           number;
  packageName:     string;
  packageCategory: string;
  price:           number;
  active:          boolean;
  approved:        boolean;
  routerScope:     "ALL" | "SELECTED";
  /** Routers the package is switched on for; empty when the scope is ALL. */
  routerIds:       number[];
};

export type CompanyPackageAvailability = {
  companyCode: string;
  routers:     PackageRouter[];
  packages:    PackageAvailability[];
};

export type PackagePayload = {
  packageName:     string;
  price:           string;
  packageCategory: string;
  validityType:    string;
  validityValue:   number;
  bandwidthType:   string;
  activeStatus:    boolean;
  speedDownload:   number;
  speedUpload:     number;
  enableBurst:     boolean;
  rateLimit:       string;
  burstLimit:      string;
  burstThreshold:  string;
  burstTime:       string;
  createdBy:       string;
};

export type PackageUpdatePayload = PackagePayload & {
  approvedBy?: string;
  isApproved?: boolean;
};

export type VoucherPackageOption = Pick<InternetPackage, "idxno" | "packageName" | "packageCategory" | "validityType" | "validityValue" | "speedDownload" | "speedUpload" | "rateLimit" | "activeStatus" | "price" | "routerScope">;

/**
 * The packages a voucher batch can be minted for: the company's active and
 * approved hotspot packages, as the mint endpoint itself judges them. Not
 * `/system/packages/category/HOTSPOT` — a package's category is its duration
 * bucket (Hourly, Daily, Weekly, Monthly), so that filter matches none of them.
 */
export async function getActiveHotspotPackagesAction(deviceId?: number) {
  // with a router named, only the packages sold on that router (the ones the mint accepts for it)
  const query = deviceId ? `?deviceId=${deviceId}` : "";
  return apiFetch<VoucherPackageOption[]>(`/finance/voucher-batches/packages${query}`, {
    auth: "required",
    cache: "no-store",
  });
}

// ── Auth headers ──────────────────────────────────────────────────────────────
async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.user.apiToken}`;
  }
  // Forward the SYSADMIN-selected company so the backend scopes the call.
  return withCompanyContext(headers as Record<string, string>);
}

const BASE = () => buildApiUrl("/system/packages");
const REVALIDATE = () => revalidatePath("/system/packages");

// ── GET all packages ──────────────────────────────────────────────────────────
export async function getPackagesAction(): Promise<ApiResponse<InternetPackage[]>> {
  try {
    const res = await fetch(BASE(), {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });
    const data = await res.json();
    return data;
  } catch {
    return { status: 500, success: false, message: "Failed to fetch packages", data: [], timestamp: "" };
  }
}

// ── CREATE package ────────────────────────────────────────────────────────────
export async function createPackageAction(
  payload: PackagePayload
): Promise<ApiResponse<InternetPackage>> {
  try {
    const res = await fetch(BASE(), {
      method:  "POST",
      headers: await getAuthHeaders(),
      body:    JSON.stringify(payload),
      cache:   "no-store",
    });
    const data: ApiResponse<InternetPackage> = await res.json();
    if (data.success) REVALIDATE();
    return data;
  } catch {
    return { status: 500, success: false, message: "Network error. Please try again.", data: {} as InternetPackage, timestamp: "" };
  }
}

// ── UPDATE package ────────────────────────────────────────────────────────────
export async function updatePackageAction(
  id: number,
  payload: PackageUpdatePayload
): Promise<ApiResponse<InternetPackage>> {
  try {
    const res = await fetch(`${BASE()}/${id}`, {
      method:  "PATCH",
      headers: await getAuthHeaders(),
      body:    JSON.stringify(payload),
      cache:   "no-store",
    });
    const data: ApiResponse<InternetPackage> = await res.json();
    if (data.success) REVALIDATE();
    return data;
  } catch {
    return { status: 500, success: false, message: "Network error. Please try again.", data: {} as InternetPackage, timestamp: "" };
  }
}

// ── DELETE package ────────────────────────────────────────────────────────────
export async function deletePackageAction(
  id: number
): Promise<ApiResponse<string>> {
  try {
    const res = await fetch(`${BASE()}/${id}`, {
      method:  "DELETE",
      headers: await getAuthHeaders(),
      cache:   "no-store",
    });
    const data: ApiResponse<string> = await res.json();
    if (data.success) REVALIDATE();
    return data;
  } catch {
    return { status: 500, success: false, message: "Network error. Please try again.", data: "", timestamp: "" };
  }
}

// ── APPROVE package ───────────────────────────────────────────────────────────
/**
 * Approve a package. A new package is always created unapproved ("Pending"),
 * and customers and the hotspot portal are only offered approved packages.
 * The approver is the signed-in user, never a value from the browser.
 */
export async function approvePackageAction(
  id: number
): Promise<ApiResponse<InternetPackage>> {
  try {
    const session = await auth();
    const res = await fetch(`${BASE()}/${id}`, {
      method:  "PATCH",
      headers: await getAuthHeaders(),
      body:    JSON.stringify({ isApproved: true, approvedBy: session?.user?.username ?? session?.user?.name }),
      cache:   "no-store",
    });
    const data: ApiResponse<InternetPackage> = await res.json();
    if (data.success) REVALIDATE();
    return data;
  } catch {
    return { status: 500, success: false, message: "Network error. Please try again.", data: {} as InternetPackage, timestamp: "" };
  }
}

// ── DEACTIVATE package ────────────────────────────────────────────────────────
export async function deactivatePackageAction(
  id: number
): Promise<ApiResponse<InternetPackage>> {
  try {
    const res = await fetch(`${BASE()}/${id}/deactivate`, {
      method:  "PATCH",
      headers: await getAuthHeaders(),
      cache:   "no-store",
    });
    const data: ApiResponse<InternetPackage> = await res.json();
    if (data.success) REVALIDATE();
    return data;
  } catch {
    return { status: 500, success: false, message: "Network error. Please try again.", data: {} as InternetPackage, timestamp: "" };
  }
}

// ── Where each package is sold ────────────────────────────────────────────────
/**
 * Routers and packages of the selected company. Null when no company is selected
 * (a SYSADMIN viewing all companies): availability is set per company.
 */
export async function getPackageAvailabilityAction(): Promise<CompanyPackageAvailability | null> {
  const res = await apiFetch<CompanyPackageAvailability>("/system/packages/availability", {
    auth: "required",
    cache: "no-store",
  });
  return res.success && res.data ? res.data : null;
}

/** One switch of the grid: this package on this router, on or off. */
export async function togglePackageRouterAction(
  packageId: number,
  routerId: number,
  offered: boolean
): Promise<{ success: boolean; message: string; data?: PackageAvailability }> {
  const res = await apiFetch<PackageAvailability>(`/system/packages/${packageId}/routers/${routerId}`, {
    method: "PUT",
    auth: "required",
    body: { offered },
  });
  if (!res.success) return { success: false, message: res.message || "The change was refused." };
  REVALIDATE();
  return { success: true, message: res.message || "Saved", data: res.data ?? undefined };
}

/** Sold on every router again (also routers added later). */
export async function offerPackageOnAllRoutersAction(
  packageId: number
): Promise<{ success: boolean; message: string; data?: PackageAvailability }> {
  const res = await apiFetch<PackageAvailability>(`/system/packages/${packageId}/routers`, {
    method: "PUT",
    auth: "required",
    body: { scope: "ALL" },
  });
  if (!res.success) return { success: false, message: res.message || "The change was refused." };
  REVALIDATE();
  return { success: true, message: res.message || "Saved", data: res.data ?? undefined };
}
