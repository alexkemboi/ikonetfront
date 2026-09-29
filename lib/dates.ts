/**
 * Date helpers anchored to the backend's business timezone (Africa/Nairobi).
 *
 * The backend's default reconciliation day is `BusinessTime.nowEat().toLocalDate()`,
 * so the UI must compute "today" in EAT too — `toISOString()` would yield the UTC
 * date and drift a day behind EAT between 00:00–02:59 Nairobi time.
 */

/** Today's calendar date in Africa/Nairobi, as `YYYY-MM-DD`. */
export function todayEatIso(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const pick = (type: string): string =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

function parseDateOnly(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return { year, month, day };
}

/** Format a business date without interpreting it as a UTC instant. */
export function formatDateOnly(value: string | null | undefined, locale?: string): string {
  if (!value) return "N/A";
  const parts = parseDateOnly(value);
  if (!parts) return value;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12)));
}

/** Return the whole calendar-day distance from `from` to `to` (not elapsed hours). */
export function daysBetweenDateOnly(from: string, to: string): number | null {
  const fromParts = parseDateOnly(from);
  const toParts = parseDateOnly(to);
  if (!fromParts || !toParts) return null;
  const fromDay = Date.UTC(fromParts.year, fromParts.month - 1, fromParts.day);
  const toDay = Date.UTC(toParts.year, toParts.month - 1, toParts.day);
  return Math.round((toDay - fromDay) / 86_400_000);
}

/** Add calendar days to a YYYY-MM-DD value without local-timezone drift. */
export function addDaysToDateOnly(value: string, days: number): string {
  const parts = parseDateOnly(value);
  if (!parts || !Number.isInteger(days)) return value;
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}