import type { FeeStanding } from "@/lib/types/platformFee";

export function kes(amount: number | null | undefined): string {
  return `KES ${Number(amount ?? 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "10 Oct 2026" from an ISO date; "—" when absent. */
export function feeDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const STANDING_LABEL: Record<FeeStanding, string> = {
  GOOD: "Paid up",
  DUE: "Due",
  OVERDUE: "Overdue",
  SUSPENDED: "Suspended",
};

export const STANDING_CLASS: Record<FeeStanding, string> = {
  GOOD: "bg-emerald-500/15 text-emerald-500",
  DUE: "bg-amber-500/15 text-amber-500",
  OVERDUE: "bg-orange-500/15 text-orange-500",
  SUSPENDED: "bg-rose-500/15 text-rose-500",
};
