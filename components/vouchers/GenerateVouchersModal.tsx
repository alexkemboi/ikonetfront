"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, ChevronLeft, ArrowRight } from "lucide-react";
import { getActiveHotspotPackagesAction, type VoucherPackageOption } from "@/actions/packages";
import { generateVouchers } from "@/actions/vouchers";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";

interface Props {
 isOpen: boolean;
 onClose: () => void;
 routerOptions?: { value: string; label: string }[];
}

interface PackageOption {
 value: string;
 label: string;
 unitPrice: string;
}

function fmtSpeed(p: VoucherPackageOption): string {
}

type PaymentChannel = "CASH" | "BANK_TRANSFER";
type Source = "SALE" | "MIGRATION";

function fmtSpeed(p: InternetPackage): string {
 if (p.speedDownload > 0 || p.speedUpload > 0) {
 return `${p.speedDownload}M/${p.speedUpload}M`;
 }
 return p.rateLimit || "";
}

function fmtValidity(p: VoucherPackageOption): string {
 return `${p.validityValue} ${p.validityType}`;
}

function mapPackages(rows: VoucherPackageOption[]): PackageOption[] {
 return rows.map((p) => ({
 value: String(p.idxno),
 label: `${p.packageName} · ${fmtSpeed(p)} · Ksh ${p.price} · ${fmtValidity(p)}`,
 unitPrice: String(p.price),
 }));
}

export function GenerateVouchersModal({ isOpen, onClose, routerOptions = [] }: Props) {
 const [step, setStep] = useState<1 | 2>(1);
 // No placeholder catalog: minting posts revenue, so it must only ever run
 // against a real, live package.
 const [packages, setPackages] = useState<PackageOption[]>([]);
 const [packagesError, setPackagesError] = useState(false);
 const [packageId, setPackageId] = useState(0);
 const [voucherType, setVoucherType] = useState<"DEMO" | "MIGRATION">("DEMO");
 const [idempotencyKey, setIdempotencyKey] = useState("");
 const [quantity, setQuantity] = useState("");
 const [codeLength, setCodeLength] = useState("6");
 const [prefix, setPrefix] = useState("");
 const [channel, setChannel] = useState<PaymentChannel>("CASH");
 const [source, setSource] = useState<Source>("SALE");
 const [deviceId, setDeviceId] = useState("");
 const [error, setError] = useState<string | null>(null);
 const [requestId, setRequestId] = useState<string | null>(null);
 const [priceOverride, setPriceOverride] = useState<string | null>(null);
 const [isSubmitting, setIsSubmitting] = useState(false);

 useEffect(() => {
 if (!isOpen) return;
 let cancelled = false;
 getActiveHotspotPackagesAction()
 .then((res) => {
 if (cancelled) return;
 if (!res.success) {
 setPackagesError(true);
 return;
 }
 setPackagesError(false);
 const active = Array.isArray(res.data)
 ? res.data.filter((p) => p.activeStatus === true)
 : [];
 setPackages(mapPackages(active));
 if (active.length === 0) setPackageId(0);
 if (active.length > 0) {
 if (cancelled) return;
 setPackageId((current) =>
 current === 0 || !active.some((p) => p.idxno === current)
 ? active[0].idxno
 : current
 );
 }
 })
 .catch(() => {
 if (cancelled) return;
 setPackagesError(true);
 });
 return () => {
 cancelled = true;
 };
 }, [isOpen]);

 function selectPackage(id: number) {
 setPackageId(id);
 setIdempotencyKey("");
	setPriceOverride(null);
 setError(null);
	setRequestId(null);
 }

 async function handleGenerate() {
 setError(null);
 setRequestId(null);
 if (!packageId) {
 setError("Select a package first.");
 return;
 }
 const qty = Number(quantity);
 if (!Number.isInteger(qty) || qty < 1 || qty > 500) {
 setError("Quantity must be a whole number between 1 and 500 per batch.");
 return;
 }
 const len = Number(codeLength || 6);
 if (!Number.isInteger(len) || len < 4 || len > 12) {
 setError("Code length must be between 4 and 12 characters.");
 return;
 }
 if (source === "SALE" && !deviceId) {
 setError("Select the router these vouchers are sold for.");
 return;
 }
 setIsSubmitting(true);
 const selected = packages.find((option) => Number(option.value) === packageId);
 if (!selected) {
 setIsSubmitting(false);
 setError("The selected package is unavailable. Reload the package list.");
 return;
 }
 const key = idempotencyKey || crypto.randomUUID();
 setIdempotencyKey(key);
 const res = await generateVouchers({
 source,
 deviceId: deviceId ? Number(deviceId) : undefined,
 packageId,
 quantity: qty,
 voucherType,
 codeLength: len,
 prefix: prefix.trim(),
 channel: source === "SALE" ? channel : undefined,
 });
 setIsSubmitting(false);
 setRequestId(res.requestId ?? null);
 if (res.success) {
 setStep(1);
 setQuantity("");
 setPrefix("");
 setChannel("CASH");
 setSource("SALE");
 setDeviceId("");
 setError(null);
 onClose();
 } else if (res.code === "PACKAGE_CHANGED" && res.serverUnitPrice) {
	setPriceOverride(res.serverUnitPrice);
	setIdempotencyKey("");
	setError(`Package price changed to KES ${res.serverUnitPrice}. Confirm the updated price to continue.`);
 } else {
 setError(res.message);
 }
 }

 return (
 <Dialog
 open={isOpen}
 onOpenChange={(open) => {
 if (!open) {
 setError(null);
 onClose();
 }
 }}
 >
 <DialogContent className="max-w-lg border-border bg-card text-foreground">
 <DialogHeader>
 <DialogTitle className="text-base font-semibold text-foreground">
 Generate Vouchers
 </DialogTitle>
 <div className="mt-1 flex items-center gap-2">
 {([1, 2] as const).map((s) => (
 <button
 key={s}
 onClick={() => !isSubmitting && step > s && setStep(s)}
 className={`h-1.5 flex-1 rounded-full transition ${
 step >= s ? "bg-amber-500" : "bg-secondary"
 }`}
 />
 ))}
 </div>
 <p className="text-xs text-muted-foreground">
 Step {step} of 2 —{" "}
 {step === 1 ? "Choose package" : "Configure batch & mint"}
 </p>
 </DialogHeader>

 <div className="space-y-4 py-2">
 {step === 1 ? (
 <div>
 <label className="text-xs font-sans tabular-nums text-muted-foreground">
 Package *
 </label>
 <select
 value={String(packageId)}
 onChange={(e) => selectPackage(Number(e.target.value))}
 className="mt-1 w-full rounded-lg border border-border bg-muted p-2.5 text-sm text-foreground focus:border-amber-500 focus:outline-none"
 >
 <option value="0" disabled>
 Select a package...
 </option>
 {packages.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 <p className="mt-1.5 text-[11px] text-muted-foreground">
 {packagesError
 ? "Live packages unavailable — vouchers cannot be minted right now."
 : packages.length === 0
 ? "Loading live packages…"
 : `Live packages · ${packages.length} active`}
 </p>
 </div>
 ) : (
 <div className="space-y-4">
 <div>
 <label className="text-xs font-sans tabular-nums text-muted-foreground">
 Quantity *
 </label>
 <input
 type="number"
 value={quantity}
 onChange={(e) => { setQuantity(e.target.value); setIdempotencyKey(""); }}
 placeholder="e.g. 100"
 min={1}
 max={500}
 max={500}
 className="mt-1 w-full rounded-lg border border-border bg-muted p-2.5 text-sm text-foreground placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
 />
 </div>
 <div>
 <label className="text-xs font-sans tabular-nums text-muted-foreground">Stock type *</label>
 <select value={voucherType} onChange={(e) => { setVoucherType(e.target.value as "DEMO" | "MIGRATION"); setIdempotencyKey(""); }} className="mt-1 w-full rounded-lg border border-border bg-muted p-2.5 text-sm text-foreground">
 <option value="DEMO">Free demo stock</option><option value="MIGRATION">Migration stock</option>
 </select>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-sans tabular-nums text-muted-foreground">
 Code length
 </label>
 <input
 type="number"
 value={codeLength}
 onChange={(e) => { setCodeLength(e.target.value); setIdempotencyKey(""); }}
 min={4}
 max={12}
 className="mt-1 w-full rounded-lg border border-border bg-muted p-2.5 text-sm text-foreground focus:border-amber-500 focus:outline-none"
 />
 </div>
 <div>
 <label className="text-xs font-sans tabular-nums text-muted-foreground">
 Prefix
 </label>
 <input
 type="text"
 value={prefix}
 onChange={(e) => { setPrefix(e.target.value.toUpperCase()); setIdempotencyKey(""); }}
 placeholder="e.g. ADR"
 maxLength={6}
 className="mt-1 w-full rounded-lg border border-border bg-muted p-2.5 text-sm text-foreground placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
 />
 </div>
 </div>
 <div>
 <label className="text-xs font-sans tabular-nums text-muted-foreground">
 Voucher source *
 </label>
 <select
 value={source}
 onChange={(e) => setSource(e.target.value as Source)}
 className="mt-1 w-full rounded-lg border border-border bg-muted p-2.5 text-sm text-foreground focus:border-amber-500 focus:outline-none"
 >
 <option value="SALE">Sold vouchers (records the sale)</option>
 <option value="MIGRATION">Migrated customers (no payment — from another ISP)</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-sans tabular-nums text-muted-foreground">
 Router {source === "SALE" ? "*" : "(optional)"}
 </label>
 <select
 value={deviceId}
 onChange={(e) => setDeviceId(e.target.value)}
 className="mt-1 w-full rounded-lg border border-border bg-muted p-2.5 text-sm text-foreground focus:border-amber-500 focus:outline-none"
 >
 <option value="">
 {source === "SALE" ? "Select a router…" : "Any site of the company"}
 </option>
 {routerOptions.map((r) => (
 <option key={r.value} value={r.value}>
 {r.label}
 </option>
 ))}
 </select>
 <p className="mt-1.5 text-[11px] text-muted-foreground">
 A voucher minted for a router can only be redeemed on that router.
 </p>
 </div>
 {source === "SALE" && (
 <div>
 <label className="text-xs font-sans tabular-nums text-muted-foreground">
 Paid by *
 </label>
 <select
 value={channel}
 onChange={(e) => setChannel(e.target.value as PaymentChannel)}
 className="mt-1 w-full rounded-lg border border-border bg-muted p-2.5 text-sm text-foreground focus:border-amber-500 focus:outline-none"
 >
 <option value="CASH">Cash</option>
 <option value="BANK_TRANSFER">Bank transfer</option>
 </select>
 <p className="mt-1.5 text-[11px] text-muted-foreground">
 The batch value is recorded as a sale (Cr 4100) against cash or bank.
 </p>
 </div>
 )}
 <p className="text-[11px] text-muted-foreground">
 Each voucher&apos;s validity starts when it is first redeemed on the captive portal.
 </p>
 <p className="text-[11px] text-muted-foreground">
 Ambiguous characters{" "}
 <span className="font-sans tabular-nums text-muted-foreground">I L O 0 1</span> are
 stripped from prefixes and never used in codes.
 </p>
 </div>
 )}

 {error && (
 <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
 <AlertCircle className="h-4 w-4 shrink-0" />
 <span>{error}{requestId ? ` Ref: ${requestId}` : ""}</span>
 </div>
 )}

 {/* Actions */}
 <div className="flex justify-end gap-3 border-t border-border pt-4">
 {step === 2 ? (
 <>
 <button
 type="button"
 onClick={() => setStep(1)}
 disabled={isSubmitting}
 className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-accent disabled:opacity-50"
 >
 <ChevronLeft className="h-3.5 w-3.5" /> Back
 </button>
 <button
 type="button"
 onClick={handleGenerate}
 disabled={isSubmitting}
 className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
 >
 {isSubmitting
 ? "Minting..."
 : priceOverride ? `Confirm new price · KES ${priceOverride}` : "Mint Vouchers"}
 </button>
 </>
 ) : (
 <button
 type="button"
 disabled={packagesError || packages.length === 0}
 onClick={() => {
 if (!packageId) {
 setError("Select a package first.");
 return;
 }
 setError(null);
 setStep(2);
 }}
 className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
 className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
 >
 Next: Configure <ArrowRight className="h-3.5 w-3.5" />
 </button>
 )}
 </div>
 </div>
 </DialogContent>
 </Dialog>
 );
}