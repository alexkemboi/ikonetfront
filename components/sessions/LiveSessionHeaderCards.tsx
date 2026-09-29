import type { LiveSessionKpis } from "@/lib/types/sessions";
import { formatBytes } from "@/lib/utils/formatBytes";

export function LiveSessionHeaderCards({ kpis }: { kpis: LiveSessionKpis }) {
  const cards = [
    { label: "CONNECTED", value: kpis.currentlyConnected.toLocaleString(), footer: `${kpis.pppoeCount} PPPoE · ${kpis.hotspotCount} Hotspot · ${kpis.tvCount} TV`, color: "text-emerald-600" },
    { label: "PAID, NOT CONNECTED", value: kpis.paidNotConnected.toLocaleString(), footer: "Paid hotspot sessions not online", color: "text-amber-600" },
    { label: "LOST CONTACT", value: kpis.lostContact.toLocaleString(), footer: "Router stopped reporting", color: "text-destructive" },
    { label: "DOWNLOAD", value: formatBytes(kpis.downloadBytesTotal), footer: "Cumulative session bytes", color: "text-foreground" },
    { label: "UPLOAD", value: formatBytes(kpis.uploadBytesTotal), footer: "Cumulative session bytes", color: "text-foreground" },
    { label: "TOTAL", value: formatBytes(kpis.totalBytesTotal), footer: kpis.sessionsWithoutCounters > 0 ? `${kpis.sessionsWithoutCounters} sessions missing counters; total is a lower bound` : "Cumulative session bytes", color: "text-amber-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {cards.map(({ label, value, footer, color }) => (
        <div key={label} className="rounded-lg border border-border bg-card p-4">
          <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">{label}</span>
          <div className={`mt-2 text-2xl font-sans tabular-nums font-semibold ${color}`}>{value}</div>
          <p className="mt-1 text-xs text-muted-foreground">{footer}</p>
        </div>
      ))}
    </div>
  );
}
