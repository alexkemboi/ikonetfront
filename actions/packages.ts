"use server";

import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/lib/types/auth";
import { apiFetch } from "@/lib/apiClient";

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

const REVALIDATE = () => revalidatePath("/system/packages");

// ── GET all packages ──────────────────────────────────────────────────────────
export async function getPackagesAction(): Promise<ApiResponse<InternetPackage[]>> {
  const res = await apiFetch<InternetPackage[]>("/system/packages", {
    auth: "required",
    cache: "no-store",
  });
  return res.success && Array.isArray(res.data)
    ? res
    : { status: res.status, success: false, message: res.message || "Failed to fetch packages", data: [], timestamp: res.timestamp };
}

// ── CREATE package ────────────────────────────────────────────────────────────
export async function createPackageAction(
  payload: PackagePayload
): Promise<ApiResponse<InternetPackage>> {
  const res = await apiFetch<InternetPackage>("/system/packages", {
    method: "POST",
    body: payload,
    auth: "required",
    cache: "no-store",
  });
  if (res.success) REVALIDATE();
  return res;
}

// ── UPDATE package ────────────────────────────────────────────────────────────
export async function updatePackageAction(
  id: number,
  payload: PackageUpdatePayload
): Promise<ApiResponse<InternetPackage>> {
  const res = await apiFetch<InternetPackage>(`/system/packages/${id}`, {
    method: "PATCH",
    body: payload,
    auth: "required",
    cache: "no-store",
  });
  if (res.success) REVALIDATE();
  return res;
}

// ── DELETE package ────────────────────────────────────────────────────────────
export async function deletePackageAction(
  id: number
): Promise<ApiResponse<string>> {
  const res = await apiFetch<string>(`/system/packages/${id}`, {
    method: "DELETE",
    auth: "required",
    cache: "no-store",
  });
  if (res.success) REVALIDATE();
  return res;
}

// ── DEACTIVATE package ────────────────────────────────────────────────────────
export async function deactivatePackageAction(
  id: number
): Promise<ApiResponse<InternetPackage>> {
  const res = await apiFetch<InternetPackage>(`/system/packages/${id}/deactivate`, {
    method: "PATCH",
    auth: "required",
    cache: "no-store",
  });
  if (res.success) REVALIDATE();
  return res;
}