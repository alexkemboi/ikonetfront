import type { AudienceScope, AudienceTree, SmsNoticeSummary } from "@/actions/communications";
import { EMPTY_SCOPE, describeScope } from "@/lib/communications/audience";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Where a notice went, from the scope stored with it. */
export function noticeAudience(tree: AudienceTree | null, stored: string | null): string {
  if (!stored) return "Whole company";
  try {
    const parsed = JSON.parse(stored) as Partial<AudienceScope>;
    return describeScope(tree, { ...EMPTY_SCOPE, ...parsed });
  } catch {
    return "Part of the network";
  }
}

/** Recent SMS sent from this screen and how far each has got. Read-only. */
export function SmsNoticeHistory({ notices, tree }: { notices: SmsNoticeSummary[]; tree: AudienceTree | null }) {
  if (notices.length === 0) return null;
  return (
    <section aria-label="Recent SMS" className="mt-6 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-lg font-normal text-foreground">Recent SMS</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Texts go out within a minute while SMS sending is on. &quot;Expired&quot; texts waited more than two hours and
        were not sent.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-2 pr-4 font-medium">Sent</th>
              <th className="py-2 pr-4 font-medium">Message</th>
              <th className="py-2 pr-4 font-medium">To</th>
              <th className="py-2 pr-4 text-right font-medium">Sent</th>
              <th className="py-2 pr-4 text-right font-medium">Waiting</th>
              <th className="py-2 pr-4 text-right font-medium">Failed</th>
              <th className="py-2 pr-4 text-right font-medium">Expired</th>
              <th className="py-2 font-medium">By</th>
            </tr>
          </thead>
          <tbody>
            {notices.map((n) => (
              <tr key={n.id} className="border-t border-border align-top">
                <td className="py-2 pr-4 whitespace-nowrap">{when(n.createdAt)}</td>
                <td className="py-2 pr-4 max-w-xs truncate" title={n.message}>{n.message}</td>
                <td className="py-2 pr-4 text-muted-foreground">
                  {noticeAudience(tree, n.audience)} ({n.recipients.toLocaleString()})
                </td>
                <td className="py-2 pr-4 text-right font-sans tabular-nums">{n.sent}</td>
                <td className="py-2 pr-4 text-right font-sans tabular-nums">{n.queued}</td>
                <td className={`py-2 pr-4 text-right font-sans tabular-nums ${n.failed > 0 ? "text-rose-500" : ""}`}>{n.failed}</td>
                <td className={`py-2 pr-4 text-right font-sans tabular-nums ${n.expired > 0 ? "text-amber-500" : ""}`}>{n.expired}</td>
                <td className="py-2 text-muted-foreground">{n.createdBy ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
