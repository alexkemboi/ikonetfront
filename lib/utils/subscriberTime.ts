/** 254725134318 → 0725 134 318 (staff read and dial the local format). */
export function formatLocalPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("254") && digits.length === 12 ? `0${digits.slice(3)}` : digits;
  return local.length === 10 ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}` : phone;
}

/** "45 min", "3h 05m", "2 days 4h". */
export function formatTimeLeft(seconds?: number | null): string {
  if (seconds == null) return "—";
  const minutes = Math.max(0, Math.floor(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ${hours % 24}h`;
}

/** "0d 4h 29m" → "4h 29m"; "2d 0h 5m" → "2d 0h 5m". */
export function trimZeroDays(duration?: string | null): string {
  if (!duration) return "";
  return duration.replace(/^0d\s+/, "");
}

/** A real M-Pesa receipt is ten letters and digits; checkout request ids (ws_CO_…) are not shown. */
export function mpesaReceiptOrNull(reference?: string | null): string | null {
  if (!reference) return null;
  return /^[A-Z0-9]{10}$/.test(reference.trim()) ? reference.trim() : null;
}

/** Minutes for a number typed with a unit. */
export function toMinutes(amount: number, unit: "minutes" | "hours" | "days"): number {
  const factor = unit === "days" ? 1440 : unit === "hours" ? 60 : 1;
  return Math.round(amount * factor);
}
