import type { LiveSessionKpis } from "@/lib/types/sessions";

export function LiveSessionHeaderCards({ kpis }: { kpis: LiveSessionKpis }) {
 const cards = [
 {
 label: "ONLINE",
 value: kpis.currentlyConnectedCount,
 footer: "active sessions",
 color: "text-emerald-400",
 },
 {
 label: "DOWNLOAD",
 value: `${kpis.downloadTrafficGb.toFixed(1)} GB`,
 footer: "across all sessions",
 color: "text-foreground",
 },
 {
 label: "UPLOAD",
 value: `${kpis.uploadTrafficGb.toFixed(1)} GB`,
 footer: "across all sessions",
 color: "text-foreground",
 },
 {
 label: "TOTAL",
 value: `${kpis.totalTrafficGb.toFixed(1)} GB`,
 footer: "combined throughput",
 color: "text-amber-400",
 },
 ];

 return (
 <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
 {cards.map(({ label, value, footer, color }) => (
 <div
 key={label}
 className="rounded-2xl border border-border bg-card p-5 shadow-lg"
 >
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 {label}
 </span>
 <div className={`mt-2 text-3xl font-sans tabular-nums font-bold ${color}`}>
 {typeof value === "number" ? value.toLocaleString() : value}
 </div>
 <p className="mt-2 text-xs text-muted-foreground">{footer}</p>
 </div>
 ))}
 </div>
 );
}