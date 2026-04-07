/**
 * Pure utility functions for formatting and deriving display state
 * from customer data. No side effects, no imports beyond date math.
 */

type ExpiryStatusVariant = "complete" | "warning" | "danger" | "pending";

/**
 * Returns the number of days between today and a given date string.
 * Negative means the date is in the past.
 */
function calculateDaysUntilExpiry(expiryDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Returns a Tailwind text color class based on how close the expiry date is.
 * - Past expiry  → danger red
 * - Within 7 days → warning orange
 * - Future        → success green
 * - null          → muted
 */
export function resolveExpiryDateColorClass(expiryDate: string | null): string {
  if (!expiryDate) return "text-muted-foreground";
  const days = calculateDaysUntilExpiry(expiryDate);
  if (days < 0) return "text-[var(--danger)]";
  if (days <= 7) return "text-[var(--warning)]";
  return "text-[var(--success)]";
}

/**
 * Returns a semantic status variant used by the lifecycle banner
 * to determine circle color and icon.
 */
export function resolveExpiryStatusVariant(
  expiryDate: string | null
): ExpiryStatusVariant {
  if (!expiryDate) return "pending";
  const days = calculateDaysUntilExpiry(expiryDate);
  if (days < 0) return "danger";
  if (days <= 7) return "warning";
  return "complete";
}

/**
 * Formats a date string or null into a human-readable locale string.
 * Returns "N/A" for null/undefined values.
 */
export function formatCustomerDate(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
