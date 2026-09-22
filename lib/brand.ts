/**
 * Customer-facing brand resolution for the multi-company captive portal.
 *
 * Raw company keys (CMP-BSM-001, COMPANY-001, ...) must never reach a
 * subscriber. All brand strings here are clean, human-readable names.
 */

export type CompanyCode =
  | "CMP-BSM-001"
  | "CMP-BDK-001"
  | "CMP-ADR-001";

const COMPANY_CODES: Record<CompanyCode, string> = {
  "CMP-BSM-001": "Beesmart High-Speed Wi-Fi",
  "CMP-BDK-001": "Bedak Networks",
  "CMP-ADR-001": "Adrinold Broadband",
};

/** Normalize any canonical spelling of a company to its CMP-* code, or null. */
export function normalizeCompanyCode(company?: string | null): CompanyCode | null {
  if (!company) return null;
  const normalized = company.trim().toUpperCase();
  if (normalized.includes("BSM") || normalized.includes("BEESMART")) return "CMP-BSM-001";
  if (normalized.includes("ADR") || normalized.includes("ADRINOLD")) return "CMP-ADR-001";
  if (normalized.includes("BDK") || normalized.includes("BEDAK")) return "CMP-BDK-001";
  return null;
}

/** Clean customer-facing brand name for a company code (neutral fallback). */
export function getCustomerFacingBrand(companyCode?: string | null): string {
  const code = normalizeCompanyCode(companyCode);
  return code ? COMPANY_CODES[code] : "Ikonex Wi-Fi";
}

/**
 * Resolve the canonical company code from a router asset tag
 * ("RTR-BSM-A", "RTR-ADR-UKD-A", "RTR-BDK-MSA-A", ...).
 */
export function resolveCompanyFromRouterTag(tag?: string | null): CompanyCode | null {
  if (!tag) return null;
  const match = /^RTR-(BSM|BDK|ADR)(?:-[A-Z0-9]+)?-[A-Z]$/i.exec(tag.trim());
  if (!match) return null;
  switch (match[1].toUpperCase()) {
    case "BSM":
      return "CMP-BSM-001";
    case "ADR":
      return "CMP-ADR-001";
    case "BDK":
    default:
      return "CMP-BDK-001";
  }
}

/**
 * Sanitize backend exception strings before displaying them on a captive
 * portal screen. Technical database / account-missing errors become a
 * reassuring maintenance message; network failures become a signal message.
 */
export function sanitizeErrorMessage(errorMsg: string): string {
  if (!errorMsg) return errorMsg;
  if (
    errorMsg.includes("payment account found") ||
    errorMsg.includes("payment_account") ||
    errorMsg.includes("COMPANY-") ||
    errorMsg.includes("CMP-") ||
    errorMsg.includes("company:")
  ) {
    return "Payment gateway is currently undergoing scheduled maintenance. Please retry in a few moments.";
  }
  if (
    errorMsg.toLowerCase().includes("timeout") ||
    errorMsg.toLowerCase().includes("connection")
  ) {
    return "Network connection timed out. Please verify your phone has signal and try again.";
  }
  return errorMsg;
}