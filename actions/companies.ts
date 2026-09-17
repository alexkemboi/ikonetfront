"use server";

import { auth } from "@/lib/auth";
import { apiFetch } from "@/lib/apiClient";
import { buildApiUrl } from "@/lib/constants";
import type { ApiResponse } from "@/lib/types/api";

export type CompanySummary = {
  id: string;
  code: string;
  name: string;
  alias: string;
};

export type PaymentAccountPayload = {
  accountType: "PAYBILL" | "TILL" | "BANK";
  shortCode: string;
  tillNumber?: string;
  clientKey?: string;
  clientSecret?: string;
  isDefault: boolean;
};

export type PaymentAccountSummary = {
  id: string;
  companyCode: string;
  accountType: string;
  shortCode: string;
  accountReference: string | null;
  isDefault: boolean;
  isActive: boolean;
};

/**
 * Static fallback kept in sync with `lib/brand.ts` (the 3 bootstrap companies).
 * Used only while the R-01 backend (`GET /api/v1/companies`) is unreachable,
 * so the SYSADMIN switcher never renders empty.
 */
const FALLBACK_COMPANIES: CompanySummary[] = [
  { id: "bootstrap-bsm", code: "CMP-BSM-001", name: "Beesmart High-Speed Wi-Fi", alias: "BSM" },
  { id: "bootstrap-bdk", code: "CMP-BDK-001", name: "Bedak Networks", alias: "BDK" },
  { id: "bootstrap-adr", code: "CMP-ADR-001", name: "Adrinold Broadband", alias: "ADR" },
];

/**
 * Fetches the active company list for the tenant-context switcher and the
 * Companies admin screen. Backend: `GET /api/v1/companies` (SYSADMIN/ADMIN/01).
 */
export async function listCompanies(): Promise<CompanySummary[]> {
  const session = await auth();
  const token = session?.user?.apiToken;
  if (!token) return [];

  try {
    const res = await fetch(buildApiUrl("/companies"), {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      // 401/403 (role without access) → empty; transient backend failure →
      // static fallback so the switcher stays usable.
      if (res.status === 401 || res.status === 403) return [];
      return FALLBACK_COMPANIES;
    }

    const body = (await res.json()) as unknown;
    const unwrap = (value: unknown): CompanySummary[] | null => {
      if (Array.isArray(value)) return value as CompanySummary[];
      if (value && typeof value === "object" && Array.isArray((value as Record<string, unknown>).data)) {
        return (value as { data: CompanySummary[] }).data;
      }
      return null;
    };
    const rows = unwrap(body);
    return rows && rows.length > 0 ? rows : FALLBACK_COMPANIES;
  } catch {
    return FALLBACK_COMPANIES;
  }
}

/** SYSADMIN-only: create a company (R-01). */
export async function createCompanyAction(input: {
  code: string;
  name: string;
  alias: string;
}): Promise<ApiResponse<CompanySummary>> {
  return apiFetch<CompanySummary>("/companies", {
    method: "POST",
    body: input,
    auth: "required",
    cache: "no-store",
  });
}

/** SYSADMIN-only: add a payment account to a company (R-01). */
export async function createPaymentAccountAction(
  companyCode: string,
  payload: PaymentAccountPayload
): Promise<ApiResponse<PaymentAccountSummary>> {
  return apiFetch<PaymentAccountSummary>(
    `/companies/${encodeURIComponent(companyCode)}/payment-accounts`,
    {
      method: "POST",
      body: payload,
      auth: "required",
      cache: "no-store",
    }
  );
}