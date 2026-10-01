import type { LiveSessionKpis } from "@/lib/types/sessions";
import { formatBytes } from "@/lib/utils/formatBytes";

export function LiveSessionHeaderCards({ kpis }: { kpis: LiveSessionKpis }) {
 const cards = [
 {
 label: "ONLINE",
 value: kpis.currentlyConnectedCount,
 footer: `${kpis.hotspotCount} hotspot · ${kpis.pppoeCount} PPPoE${
 kpis.lostContact > 0 ? ` · ${kpis.lostContact} lost contact` : ""
 }`,
 color: "text-emerald-400",
 },
 {
 label: "PAID, NOT CONNECTED",
 value: kpis.paidNotConnected,
 footer:
 kpis.paidNotConnected > 0
 ? "paid hotspot time with no device online"
 : "every paid customer is online",
 color: kpis.paidNotConnected > 0 ? "text-amber-400" : "text-foreground",
 },
 {
 label: "DOWNLOAD",
 value: `${kpis.downloadTrafficGb.toFixed(1)} GB`,
 footer: "reported by the routers",
 color: "text-foreground",
 },
 {
 label: "UPLOAD",
 value: `${kpis.uploadTrafficGb.toFixed(1)} GB`,
 footer: "reported by the routers",
 color: "text-foreground",
 },
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
