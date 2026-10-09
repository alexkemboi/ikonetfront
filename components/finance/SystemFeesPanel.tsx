import type { CompanyFeeStatus } from "@/lib/types/platformFee";
import { feeDate, kes, STANDING_CLASS, STANDING_LABEL } from "./systemFeeFormat";

/** What the standing means for the company, in one sentence. */
export function feeHeadline(status: CompanyFeeStatus): string {
  if (status.suspendedForFees) {
    return "Service is suspended for the whole company: every agreement is past its suspension day. New hotspot purchases and PPPoE renewals are blocked until fees are paid.";
  }
  switch (status.standing) {
    case "SUSPENDED":
      return "At least one investor is suspended: new hotspot purchases and PPPoE renewals are blocked on their routers until their fees are paid.";
    case "OVERDUE":
      return `Fees were due on ${feeDate(status.nextDueDate)}. Service on the affected routers is suspended from ${feeDate(status.nextSuspendDate)} if they stay unpaid.`;
    case "DUE":
      return `Fees are due by ${feeDate(status.nextDueDate)}.`;
    default:
      return "System fees are paid up.";
  }
}

/**
 * System (maintenance) fees of the company: the terms, what is outstanding and by when,
 * and each investor agreement's share. Read-only; payments are recorded by the platform.
 */
export function SystemFeesPanel({ status }: { status: CompanyFeeStatus }) {
  const owing = status.totalOutstanding > 0;
  return (
    <section aria-label="System fees" className="rounded-2xl border border-border bg-card p-5 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-normal text-foreground">System fees</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {status.terms.hotspotFeePercent}% of hotspot income (TV included, refunds excluded) plus {kes(status.terms.pppoeFeePerCustomer)} for
            each PPPoE customer who paid in the month. Due on day {status.terms.dueDay}; service is suspended from day {status.terms.suspendDay}.
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STANDING_CLASS[status.standing]}`}>
          {STANDING_LABEL[status.standing]}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-muted p-4">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="mt-1 text-xl font-sans tabular-nums text-foreground">{kes(Math.max(status.totalOutstanding, 0))}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted p-4">
          <p className="text-xs text-muted-foreground">Due by</p>
          <p className="mt-1 text-xl font-sans tabular-nums text-foreground">{owing ? feeDate(status.nextDueDate) : "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted p-4">
          <p className="text-xs text-muted-foreground">Suspension from</p>
          <p className="mt-1 text-xl font-sans tabular-nums text-foreground">{owing ? feeDate(status.nextSuspendDate) : "—"}</p>
        </div>
      </div>

      <p role={status.standing === "GOOD" ? undefined : "alert"} className="mt-4 text-sm text-foreground">
        {feeHeadline(status)}
      </p>

      {status.agreements.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No investor agreement yet, so no system fee is charged. Fees start with the first agreement.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-4 font-medium">Investor</th>
                <th className="py-2 pr-4 font-medium">Agreement</th>
                <th className="py-2 pr-4 text-right font-medium">Charged</th>
                <th className="py-2 pr-4 text-right font-medium">Paid</th>
                <th className="py-2 pr-4 text-right font-medium">Balance</th>
                <th className="py-2 pr-4 font-medium">Due</th>
                <th className="py-2 font-medium">Standing</th>
              </tr>
            </thead>
            <tbody>
              {status.agreements.map((a) => (
                <tr key={a.agreementId} className="border-t border-border">
                  <td className="py-2 pr-4">{a.investorName}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{a.agreementCode}</td>
                  <td className="py-2 pr-4 text-right font-sans tabular-nums">{kes(a.charged)}</td>
                  <td className="py-2 pr-4 text-right font-sans tabular-nums">{kes(a.paid)}</td>
                  <td className="py-2 pr-4 text-right font-sans tabular-nums">{kes(a.balance)}</td>
                  <td className="py-2 pr-4">{a.balance > 0 ? feeDate(a.oldestDueDate) : "—"}</td>
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STANDING_CLASS[a.feeStatus]}`}>
                      {STANDING_LABEL[a.feeStatus]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
