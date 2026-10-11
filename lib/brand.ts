/**
 * Customer-facing wording for the multi-company captive portal.
 *
 * Raw company keys (CMP-BSM-001, COMPANY-001, ...) must never reach a
 * subscriber: the page shows the company name the backend returns.
 */

/**
 * Shown only when the backend cannot say which company's hotspot this is. Company names
 * are never listed here: they come from the backend (`getHotspotPortalContextAction`),
 * so a newly onboarded company needs no frontend change.
 */
export const DEFAULT_PORTAL_BRAND = "Wi-Fi Hotspot";

const COMPANY_CODE = /^CMP-[A-Z0-9]+-[0-9]{3,}$/;

/** A well-formed company code from the redirect query, upper-cased; null for anything else. */
export function normalizeCompanyCode(company?: string | null): string | null {
  const code = company?.trim().toUpperCase() ?? "";
  return COMPANY_CODE.test(code) ? code : null;
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

/**
 * Helpline shown on the hotspot purchase page for every company: the Ikonex Systems
 * office line, which handles hotspot support for the platform.
 */
export const PORTAL_HELPLINE = {
  label: "Ikonex Systems Support",
  display: "0706 354 194",
  tel: "+254706354194",
  hours: "09:00 – 18:00",
} as const;
