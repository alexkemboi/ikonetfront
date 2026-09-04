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