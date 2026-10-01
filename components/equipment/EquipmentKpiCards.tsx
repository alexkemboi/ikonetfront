import type { EquipmentKpis } from "@/lib/types/equipment";

export function EquipmentKpiCards({ kpis }: { kpis: EquipmentKpis }) {
  const cards = [["ASSETS", String(kpis.totalAssets)], ["INSTALLED", String(kpis.byStatus.INSTALLED ?? 0)], ["TOTAL COST", `KES ${kpis.totalCost}`], ["UNPAID", `KES ${kpis.totalUnpaid}`], ["NEEDS CORRECTION", String(kpis.needsCorrectionCount)], ["DAMAGED", String(kpis.damagedCount)]];
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{cards.map(([label, value]) => <div key={label} className="rounded-lg border border-border bg-card p-4"><p className="text-[11px] uppercase text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold tabular-nums">{value}</p></div>)}</div>;
}
