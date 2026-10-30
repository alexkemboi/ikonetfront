import type { SentAlert } from "@/actions/alerts-preferences";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** What the system told people recently, and whether the emails went out. */
export function RecentStaffAlerts({ alerts }: { alerts: SentAlert[] }) {
  return (
    <section aria-label="Recently sent alerts" className="max-w-3xl space-y-3 rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="text-lg font-normal text-foreground">Recently sent</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Alerts sent to your company&apos;s staff and investors, newest first.
        </p>
      </div>
      {alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No alerts yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {alerts.map((a) => (
            <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{a.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {a.label} · {when(a.createdAt)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{deliveryLine(a)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function deliveryLine(a: Pick<SentAlert, "emails" | "emailsSent" | "emailsFailed" | "texts">): string {
  if (a.emails === 0 && a.texts === 0) return "nobody to tell";
  const parts: string[] = [];
  if (a.emails > 0) {
    const waiting = a.emails - a.emailsSent - a.emailsFailed;
    const bits = [`${a.emailsSent} of ${a.emails} emailed`];
    if (a.emailsFailed > 0) bits.push(`${a.emailsFailed} failed`);
    if (waiting > 0) bits.push(`${waiting} waiting`);
    parts.push(bits.join(", "));
  }
  if (a.texts > 0) parts.push(`${a.texts} text${a.texts === 1 ? "" : "s"} queued`);
  return parts.join(" · ");
}
