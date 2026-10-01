import { daysBetweenDateOnly, todayEatIso } from "@/lib/dates";

export type SubscriberStatusBadge = {
  label: string;
  badgeClass: string;
};

/**
 * Effective subscription status derived by comparing the expiry date against
 * the current time, so stale DB flags (e.g. isActive = true) never render an
 * expired subscription as green "Active".
 */
export function getEffectiveSubscriberStatus(
  expiryDateStr?: string | null,
  dbStatus?: string
): SubscriberStatusBadge {
  if (!expiryDateStr) {
    return {
      label: dbStatus || "Active",
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    };
  }

  const daysUntilExpiry = daysBetweenDateOnly(todayEatIso(), expiryDateStr);
  if (daysUntilExpiry == null) {
    return {
      label: dbStatus || "Active",
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    };
  }

  if (daysUntilExpiry < 0) {
    return {
      label: "Expired",
      badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/20 font-semibold",
    };
  }

  // Expiring within the next 24 hours.
  if (daysUntilExpiry === 0) {
    return {
      label: "Expiring Today",
      badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/20 font-semibold",
    };
  }

  return {
    label: dbStatus || "Active",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  };
}