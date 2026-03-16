"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { ApiResponse } from "@/lib/types/auth";

// ── Types ─────────────────────────────────────────────────────────────────────
export type InternetPackage = {
  idxno:           number;
  packageName:     string;
  price:           number;
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
};

export type PackagePayload = {
  packageName:     string;
  price:           number;
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

// ── Auth headers ──────────────────────────────────────────────────────────────
async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.user.apiToken}`;
  }
  return headers;
}

const BASE = () => `${process.env.BASE_API_URL}system/packages`;
const REVALIDATE = () => revalidatePath("/system/internet-packages");

// ── GET all packages ──────────────────────────────────────────────────────────
export async function getPackagesAction(): Promise<ApiResponse<InternetPackage[]>> {
  try {
    const res = await fetch(BASE(), {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
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
