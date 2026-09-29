import type { AnalyticsDashboardData } from "@/lib/types/analytics";

const COLORS = ["#059669", "#0284c7", "#d97706", "#dc2626", "#64748b"];

function MixList({ rows, label }: { rows: Array<{ name: string; amount: string; share: number; count: number; average?: string | null }>; label: string }) {
  return <section className="rounded-lg border border-border bg-card p-4"><h2 className="text-sm font-medium">{label}</h2><div className="mt-4 space-y-3">{rows.map((row, index) => <div key={row.name} className="space-y-1.5"><div className="flex flex-wrap justify-between gap-2 text-sm"><span className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />{row.name}</span><span className="font-sans tabular-nums">KES {row.amount}</span></div><div className="h-1.5 overflow-hidden rounded bg-muted"><div className="h-full" style={{ width: `${Math.max(0, Math.min(100, row.share))}%`, backgroundColor: COLORS[index % COLORS.length] }} /></div><p className="text-xs text-muted-foreground">{row.share}% · {row.count} transactions{row.average == null ? "" : ` · average KES ${row.average}`}</p></div>)}</div></section>;
}

export function RevenueMixDonuts({ data }: { data: Pick<AnalyticsDashboardData, "revenueMix" | "paymentMethodsMix"> }) {
  const revenue = data.revenueMix.map((row) => ({ name: row.bucket, amount: row.totalAmount, share: row.sharePct, count: row.count, average: row.averageAmount }));
  const methods = data.paymentMethodsMix.map((row) => ({ name: row.method, amount: row.totalAmount, share: row.sharePct, count: row.count }));
  return <div className="grid gap-4 lg:grid-cols-2"><MixList rows={revenue} label="Revenue mix · 30 days" /><MixList rows={methods} label="Payment methods · 30 days" /></div>;
}
