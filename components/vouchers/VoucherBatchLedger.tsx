"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import type { VoucherBatchItem, VoucherBatchKpis } from "@/lib/types/payments";
import { generateVoucherBatch, getVoucherBatchDetails } from "@/actions/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  kpis: VoucherBatchKpis;
  batches: VoucherBatchItem[];
  packageOptions: { value: string; label: string }[];
  routerOptions?: { value: string; label: string }[];
}

function toKsh(value: number): string {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function VoucherBatchLedger({ kpis, batches, packageOptions, routerOptions = [] }: Props) {
  const [mintOpen, setMintOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [packageId, setPackageId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [channel, setChannel] = useState<"CASH" | "BANK_TRANSFER">("CASH");
  const [codePrefix, setCodePrefix] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const [priceOverride, setPriceOverride] = useState<string | null>(null);

  const summaryCards = useMemo(
    () => [
      { label: "ACTIVE BATCHES", value: String(kpis.activeCount) },
      { label: "ACTIVE VALUE", value: `Ksh ${toKsh(kpis.activeValue)}` },
      { label: "TOTAL MINTED", value: `Ksh ${toKsh(kpis.totalValue)}` },
    ],
    [kpis]
  );

  async function openBatchDetails(batch: VoucherBatchItem) {
    setSelectedBatch(batch);
    setBatchDetails(null);
    setDetailError("");
    setDetailLoading(true);
    const result = await getVoucherBatchDetails(batch.batchId);
    setDetailLoading(false);
    if (result.success && result.data) setBatchDetails(result.data);
    else setDetailError(`${result.message}${result.requestId ? ` · Ref: ${result.requestId}` : ""}`);
  }

  async function handleMint() {
    const pkgId = Number(packageId);
    const qty = Number(quantity);
    if (!Number.isInteger(pkgId) || pkgId <= 0) {
      toast.error("Select a package first.");
      return;
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > 500) {
      toast.error("Quantity must be between 1 and 500.");
      return;
    }
    if (!deviceId) {
      toast.error("Select the router these vouchers are sold for.");
      return;
    }
    setSaving(true);
    try {
      const selected = packageOptions.find((option) => option.value === packageId);
      if (!selected) { toast.error("Selected package is no longer available."); return; }
      const key = idempotencyKey || crypto.randomUUID();
      setIdempotencyKey(key);
      const expectedUnitPrice = priceOverride ?? selected.unitPrice;
      const res = await generateVoucherBatch({
        packageId: pkgId,
        quantity: qty,
        channel,
        codePrefix: codePrefix.trim() || undefined,
        deviceId: Number(deviceId),
      });
      if (res.success && res.data) {
        toast.success(`Batch ${res.data.batchNumber} minted (${qty} codes).`);
        setMintOpen(false);
        setQuantity("");
        setCodePrefix("");
        setIdempotencyKey("");
        setConfirmDuplicate(false);
        setPriceOverride(null);
      } else {
        if (res.message === "POSSIBLE_DUPLICATE_BATCH") {
          setConfirmDuplicate(true);
          setIdempotencyKey(crypto.randomUUID());
          toast.error("A matching batch was created in the last minute. Confirm and retry to create another.");
        } else if (res.code === "PACKAGE_CHANGED" && res.serverUnitPrice) {
          setPriceOverride(res.serverUnitPrice);
          setIdempotencyKey("");
          toast.error(`Package price changed to KES ${res.serverUnitPrice}. Click Mint batch again to confirm.`);
        } else toast.error(res.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border bg-card p-5 shadow-lg"
          >
            <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
              {card.label}
            </span>
            <div className="mt-2 text-2xl font-sans tabular-nums font-bold text-foreground">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
          Paid voucher batches — minted through the RADIUS path, GL at sale
        </span>
        <Button
          onClick={() => setMintOpen(true)}
          disabled={packageOptions.length === 0}
          className="bg-amber-500 text-black hover:bg-amber-400"
          size="sm"
        >
          <Plus className="h-4 w-4" /> Mint batch
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {batches.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No voucher batches yet. Mint the first paid batch to post revenue.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs font-sans tabular-nums">
              <thead>
                <tr className="border-b border-border text-[11px] tracking-wider text-muted-foreground uppercase">
                  <th className="py-3 px-3">BATCH</th>
                  <th className="py-3 px-3">PACKAGE</th>
                  <th className="py-3 px-3">QTY</th>
                  <th className="py-3 px-3">UNIT</th>
                  <th className="py-3 px-3">VALUE</th>
                  <th className="py-3 px-3">CHANNEL</th>
                  <th className="py-3 px-3">STATUS</th>
                  <th className="py-3 px-3">BY</th>
                  <th className="py-3 px-3">CREATED</th>
                  <th className="py-3 px-3">DETAILS / CODES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {batches.map((b) => (
                  <tr key={b.batchId} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3.5 px-3 font-bold text-amber-400">{b.batchNumber}</td>
                    <td className="py-3.5 px-3 text-muted-foreground">{b.packageName}</td>
                    <td className="py-3.5 px-3">{b.quantity}</td>
                    <td className="py-3.5 px-3">{toKsh(b.unitPrice)}</td>
                    <td className="py-3.5 px-3 font-bold text-foreground">{toKsh(b.totalValue)}</td>
                    <td className="py-3.5 px-3 text-muted-foreground">{b.channel}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          b.status === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-zinc-500/15 text-muted-foreground"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-muted-foreground">{b.createdByUsername}</td>
                    <td className="py-3.5 px-3 text-muted-foreground">
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <button type="button" className="text-primary underline" onClick={() => void openBatchDetails(b)}>Details</button>
                        {b.sessionBatchId ? <Link className="text-primary underline" href={`/api/vouchers/batch-print?voucherBatchId=${encodeURIComponent(b.sessionBatchId)}`} target="_blank" rel="noreferrer">Print codes</Link> : <span className="text-muted-foreground">Codes unavailable</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t px-3 py-3 text-xs text-muted-foreground"><span>Showing {page.totalElements === 0 ? 0 : page.number * page.size + 1}-{Math.min((page.number + 1) * page.size, page.totalElements)} of {page.totalElements} batches</span><div className="flex items-center gap-2"><button type="button" disabled={page.number <= 0} onClick={() => { const query = new URLSearchParams(window.location.search); query.set("batchPage", String(page.number - 1)); router.push(`/finance/vouchers?${query}`); }} className="rounded border px-2 py-1 disabled:opacity-40">Previous</button><span>{page.number + 1}/{Math.max(1, page.totalPages)}</span><button type="button" disabled={page.number + 1 >= page.totalPages} onClick={() => { const query = new URLSearchParams(window.location.search); query.set("batchPage", String(page.number + 1)); router.push(`/finance/vouchers?${query}`); }} className="rounded border px-2 py-1 disabled:opacity-40">Next</button></div></div>

      <Dialog open={mintOpen} onOpenChange={setMintOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Mint paid voucher batch</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Mints codes through the proven RADIUS path and posts GL revenue
              (Dr 1130 / 1120, Cr 4100) at sale.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 font-sans tabular-nums text-xs">
            <div className="space-y-1.5">
              <label className="text-muted-foreground">Package</label>
              <Select value={packageId} onValueChange={(value) => { setPackageId(value); setIdempotencyKey(""); setPriceOverride(null); }}>
                <SelectTrigger className="border-border bg-muted text-foreground">
                  <SelectValue placeholder="Select a package" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  {packageOptions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-muted-foreground">Router (vouchers work only here)</label>
              <Select value={deviceId} onValueChange={setDeviceId}>
                <SelectTrigger className="border-border bg-muted text-foreground">
                  <SelectValue placeholder={routerOptions.length ? "Select a router" : "No active routers"} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  {routerOptions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-muted-foreground">Quantity (1–500)</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); setIdempotencyKey(""); }}
                placeholder="e.g. 100"
                className="border-border bg-muted text-foreground placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-muted-foreground">Channel</label>
              <Select
                value={channel}
                onValueChange={(v) => { setChannel(v as "CASH" | "BANK_TRANSFER"); setIdempotencyKey(""); }}
              >
                <SelectTrigger className="border-border bg-muted text-foreground">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-muted-foreground">Code prefix (optional)</label>
              <Input
                value={codePrefix}
                onChange={(e) => { setCodePrefix(e.target.value.toUpperCase()); setIdempotencyKey(""); }}
                placeholder="e.g. ADR"
                className="border-border bg-muted text-foreground placeholder:text-zinc-600"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMintOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleMint}
              disabled={saving}
              className="bg-amber-500 text-black hover:bg-amber-400"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mint batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedBatch)} onOpenChange={(open) => { if (!open) { setSelectedBatch(null); setBatchDetails(null); setDetailError(""); } }}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Voucher batch details</DialogTitle>
            <DialogDescription>{(batchDetails ?? selectedBatch)?.batchNumber}</DialogDescription>
          </DialogHeader>
          {detailLoading ? <p className="py-4 text-sm text-muted-foreground">Loading batch details…</p> : detailError ? <p role="alert" className="py-4 text-sm text-destructive">{detailError}</p> : (batchDetails ?? selectedBatch) && <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Batch ID</dt><dd className="break-all font-mono text-xs">{(batchDetails ?? selectedBatch)?.batchId}</dd>
            <dt className="text-muted-foreground">Session batch ID</dt><dd className="break-all font-mono text-xs">{(batchDetails ?? selectedBatch)?.sessionBatchId ?? "—"}</dd>
            <dt className="text-muted-foreground">Package</dt><dd>{(batchDetails ?? selectedBatch)?.packageName}</dd>
            <dt className="text-muted-foreground">Quantity</dt><dd>{(batchDetails ?? selectedBatch)?.quantity}</dd>
            <dt className="text-muted-foreground">Unit price</dt><dd>KES {(batchDetails ?? selectedBatch)?.unitPrice}</dd>
            <dt className="text-muted-foreground">Total value</dt><dd>KES {(batchDetails ?? selectedBatch)?.totalValue}</dd>
            <dt className="text-muted-foreground">Minted / redeemed</dt><dd>{(batchDetails ?? selectedBatch)?.mintedCount} / {(batchDetails ?? selectedBatch)?.redeemedCount}</dd>
            <dt className="text-muted-foreground">Status</dt><dd>{(batchDetails ?? selectedBatch)?.status}</dd>
          </dl>}
          <DialogFooter>
            {(batchDetails ?? selectedBatch)?.sessionBatchId && <Link className="text-sm text-primary underline" target="_blank" rel="noreferrer" href={`/api/vouchers/batch-print?voucherBatchId=${encodeURIComponent((batchDetails ?? selectedBatch)!.sessionBatchId!)}`}>Print codes</Link>}
            <Button type="button" variant="outline" onClick={() => setSelectedBatch(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}