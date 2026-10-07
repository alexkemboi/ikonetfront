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
  /** M-Pesa online (STK push) passkey. Required for PAYBILL and TILL. */
  passkey?: string;
  /**
   * A Safaricom line of the organisation that owns the paybill / till. With it the
   * account is registered for Safaricom's transaction statement when it is added.
   */
  nominatedNumber?: string;
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

export type CompanyPaymentAccountView = {
  accountType: string;
  shortCode: string;
  accountReference: string | null;
  isDefault: boolean;
  isActive: boolean;
  provider: string;
  maskedConsumerKey: string | null;
  companyBranding: CompanySummary;
  id: string;
  /** True when key, secret and passkey are all stored and readable. */
  credentialsComplete: boolean | null;
  /** REGISTERED, ALREADY_REGISTERED (confirmed on a repeat), FAILED, or null when never attempted. */
  pullRegistrationStatus: string | null;
  /** When Safaricom last answered a registration or a check. Nairobi time, no zone. */
  pullRegisteredAt?: string | null;
  /** What Safaricom said when the registration failed. */
  pullRegistrationError?: string | null;
  pullNominatedNumber?: string | null;
};

/** Safaricom's answer to registering a paybill / till for its transaction statement. */
export type StatementRegistrationResult = {
  paymentAccountId: string;
  status: string;
  shortCode: string;
  succeeded: boolean;
  detail: string;
};

/** Can this company take mobile-money payments right now? */
export type PaymentReadiness = {
  companyCode: string;
  companyName: string;
  ready: boolean;
  /** What is missing when not ready. */
  problem: string | null;
  provider: string | null;
  accountType: string | null;
  shortCode: string | null;
  pullRegistrationStatus: string | null;
};

/** Every field is optional: only what is sent is changed. */
export type PaymentAccountUpdatePayload = {
  clientKey?: string;
  clientSecret?: string;
  passkey?: string;
  /** Setting it registers an account that is not registered yet. */
  nominatedNumber?: string;
  isDefault?: boolean;
  isActive?: boolean;
};

export type UpdateCompanyBrandingRequest = {
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  supportPhone?: string;
  supportEmail?: string;
  subdomain?: string;
  customDomain?: string;
};

export type MpesaProbeResult = {
  ok: boolean;
  message: string;
  latencyMs: number;
};

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
      if (res.status === 401 || res.status === 403) return [];
      return [];
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
    return rows ?? [];
  } catch {
    return [];
  }
}

export async function getCompanyPaymentAccounts(companyCode: string): Promise<ApiResponse<CompanyPaymentAccountView[]>> {
  return apiFetch<CompanyPaymentAccountView[]>(
    `/companies/${encodeURIComponent(companyCode)}/payment-accounts`,
    {
      method: "GET",
      auth: "required",
      cache: "no-store",
    }
  );
}

export async function updateCompanyBranding(companyCode: string, body: UpdateCompanyBrandingRequest): Promise<ApiResponse<CompanySummary>> {
  return apiFetch<CompanySummary>(
    `/companies/${encodeURIComponent(companyCode)}/branding`,
    {
      method: "PUT",
      body,
      auth: "required",
      cache: "no-store",
    }
  );
}

export async function testCompanyPaymentAccount(companyCode: string): Promise<ApiResponse<MpesaProbeResult>> {
  return apiFetch<MpesaProbeResult>(
    `/companies/${encodeURIComponent(companyCode)}/payment-accounts/test`,
    {
      method: "POST",
      auth: "required",
      cache: "no-store",
    }
  );
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

/** SYSADMIN-only: add a payment account to a company (R-01). Step-up gated. */
export async function createPaymentAccountAction(
  companyCode: string,
  payload: PaymentAccountPayload,
  stepUpToken?: string
): Promise<ApiResponse<PaymentAccountSummary>> {
  return apiFetch<PaymentAccountSummary>(
    `/companies/${encodeURIComponent(companyCode)}/payment-accounts`,
    {
      method: "POST",
      body: payload,
      auth: "required",
      cache: "no-store",
      stepUpToken,
    }
  );
}

/** One line per active company (SYSADMIN: all; others: their own). Reads stored data only. */
export async function getPaymentReadiness(): Promise<PaymentReadiness[]> {
  const res = await apiFetch<PaymentReadiness[]>("/companies/payment-readiness", {
    auth: "required",
    cache: "no-store",
  });
  return res.success && Array.isArray(res.data) ? res.data : [];
}

/**
 * SYSADMIN-only: replace credentials of an existing payment account, or change
 * whether it is the default / active. Step-up gated. The short code and type
 * cannot be changed: a different paybill or till is a new account.
 */
export async function updatePaymentAccountAction(
  companyCode: string,
  accountId: string,
  payload: PaymentAccountUpdatePayload,
  stepUpToken?: string
): Promise<ApiResponse<PaymentAccountSummary>> {
  return apiFetch<PaymentAccountSummary>(
    `/companies/${encodeURIComponent(companyCode)}/payment-accounts/${encodeURIComponent(accountId)}`,
    { method: "PUT", body: payload, auth: "required", cache: "no-store", stepUpToken }
  );
}

/**
 * Registers a paybill / till for Safaricom's transaction statement, or confirms a
 * registration when it is already registered. Uses the nominated number stored on the
 * account unless one is given.
 */
export async function registerPaymentAccountStatementAction(
  accountId: string,
  nominatedNumber?: string
): Promise<ApiResponse<StatementRegistrationResult>> {
  const query = nominatedNumber?.trim()
    ? `?nominatedNumber=${encodeURIComponent(nominatedNumber.trim())}`
    : "";
  return apiFetch<StatementRegistrationResult>(
    `/payments/mpesa/pull/register/${encodeURIComponent(accountId)}${query}`,
    { method: "POST", auth: "required", cache: "no-store" }
  );
}
