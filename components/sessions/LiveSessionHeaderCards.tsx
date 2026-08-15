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
      color: "text-white",
    },
    {
      label: "UPLOAD",
      value: `${kpis.uploadTrafficGb.toFixed(1)} GB`,
      footer: "across all sessions",
      color: "text-white",
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
          className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg"
        >
          <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
            {label}
          </span>
          <div className={`mt-2 text-3xl font-mono font-bold ${color}`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </div>
          <p className="mt-2 text-xs text-zinc-500">{footer}</p>
        </div>
      ))}
    </div>
  );
}