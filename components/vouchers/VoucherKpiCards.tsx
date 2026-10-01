import { VoucherKpis } from "@/lib/types/vouchers";

interface Props {
  /** null when the statistics read failed — rendered as unavailable, never as zero. */
  kpis: VoucherKpis | null;
  error?: string;
}

export function VoucherKpiCards({ kpis, error }: Props) {
  if (!kpis) {
    return (
    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <p className="font-medium text-destructive">Voucher totals are unavailable.</p>
      <p className="mt-1 text-xs text-muted-foreground">
      {error ?? "The voucher statistics request did not complete, so these figures are unknown — not zero."}
      </p>
    </div>
    );
  }

  return (
 <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
 {/* Total */}
 <div className="rounded-lg border border-border bg-card p-4">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 TOTAL
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">
 {kpis.totalVoucherCodes}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">generated codes</p>
 </div>

 {/* Used */}
 <div className="rounded-lg border border-border bg-card p-4">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 USED
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-emerald-400">
 {kpis.usedCodes}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">
 {kpis.redemptionRatePercent}% redemption rate
 </p>
 </div>

 {/* Unused */}
 <div className="rounded-lg border border-border bg-card p-4">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 UNUSED
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-amber-400">
 {kpis.unusedCodes}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">available to distribute</p>
 </div>

 {/* Expired */}
 <div className="rounded-lg border border-border bg-card p-4">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">EXPIRED UNUSED</span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">{kpis.expiredUnusedCodes}</div>
 <p className="mt-1 text-xs text-muted-foreground">not redeemed before expiry</p>
 </div>
 {/* Batches */}
 <div className="rounded-lg border border-border bg-card p-4">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 BATCHES
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">
 {kpis.batches}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">minting runs</p>
 </div>
 </div>
 );
}