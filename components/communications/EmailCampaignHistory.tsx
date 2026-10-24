import type { EmailCampaignSummary } from "@/actions/communications";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Recent bulk emails of the company and how far each has got. Read-only. */
export function EmailCampaignHistory({ campaigns }: { campaigns: EmailCampaignSummary[] }) {
  if (campaigns.length === 0) return null;
  return (
    <section aria-label="Recent bulk emails" className="mt-6 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-lg font-normal text-foreground">Recent bulk emails</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Emails go out in batches within a few minutes. &quot;No address&quot; counts people whose account has no email.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-2 pr-4 font-medium">Sent</th>
              <th className="py-2 pr-4 font-medium">Subject</th>
              <th className="py-2 pr-4 text-right font-medium">Delivered to NotifyHub</th>
              <th className="py-2 pr-4 text-right font-medium">Waiting</th>
              <th className="py-2 pr-4 text-right font-medium">Failed</th>
              <th className="py-2 pr-4 text-right font-medium">No address</th>
              <th className="py-2 font-medium">By</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="py-2 pr-4 whitespace-nowrap">{when(c.createdAt)}</td>
                <td className="py-2 pr-4">
                  {c.subject}
                  {c.category === "MARKETING" && <span className="ml-2 text-xs text-muted-foreground">marketing</span>}
                </td>
                <td className="py-2 pr-4 text-right font-sans tabular-nums">{c.sent}</td>
                <td className="py-2 pr-4 text-right font-sans tabular-nums">{c.queued}</td>
                <td className={`py-2 pr-4 text-right font-sans tabular-nums ${c.failed > 0 ? "text-rose-500" : ""}`}>{c.failed}</td>
                <td className="py-2 pr-4 text-right font-sans tabular-nums">{c.skipped}</td>
                <td className="py-2 text-muted-foreground">{c.createdBy ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
