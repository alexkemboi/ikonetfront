"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  MoreHorizontal,
  Download,
  Mail,
  Eye,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import type { PaymentConnection, PaymentLedgerItem } from "@/lib/types/payments";
import { downloadReceiptPdf, emailReceipt } from "@/actions/payments";
import { compensateHotspotPayment } from "@/actions/vouchers";
import { requestRefund } from "@/actions/refunds";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/data-table";

interface Props {
  payments: PaymentLedgerItem[];
  /** Hidden for the customer care desk; the backend refuses them anyway. */
  canIssueVoucher?: boolean;
  /** Raise a refund against a payment (not for the customer care desk). */
  canRefund?: boolean;
}

const CONNECTION_STYLE: Record<PaymentConnection, { label: string; className: string; hint: string }> = {
  CONNECTED: { label: "Connected", className: "bg-emerald-500/10 text-emerald-400", hint: "The router reported traffic for this purchase." },
  CONNECTING: { label: "Connecting", className: "bg-sky-500/10 text-sky-400", hint: "Paid in the last 5 minutes; waiting for the router to report." },
  NOT_CONNECTED: { label: "Paid, not connected", className: "bg-rose-500/10 text-rose-400", hint: "Paid, but the router never reported this device. Issue a voucher." },
  COMPENSATED: { label: "Compensated", className: "bg-amber-500/10 text-amber-400", hint: "A compensation voucher was issued for this payment." },
  NO_DEVICE: { label: "No device", className: "bg-zinc-500/10 text-muted-foreground", hint: "Paid through a path that bound no device (legacy)." },
  NOT_APPLICABLE: { label: "Account renewal", className: "bg-zinc-500/10 text-muted-foreground", hint: "PPPoE renewal — connection is tracked on the account." },
  UNLINKED: { label: "Unlinked", className: "bg-zinc-500/10 text-muted-foreground", hint: "The ledger line references no payment record." },
};

function ConnectionBadge({ connection }: { connection: PaymentConnection }) {
  const style = CONNECTION_STYLE[connection];
  return (
    <span
      title={style.hint}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.className}`}
    >
      {style.label}
    </span>
  );
}

export function PaymentsDataTable({ payments, canIssueVoucher = true, canRefund = false }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [emailTarget, setEmailTarget] = useState<PaymentLedgerItem | null>(null);
  const [viewTarget, setViewTarget] = useState<PaymentLedgerItem | null>(null);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  // Local changes (e.g. a just-issued compensation) layered over server rows, so a
  // page refresh still shows fresh data.
  const [overrides, setOverrides] = useState<Record<string, Partial<PaymentLedgerItem>>>({});
  const rows = useMemo(
    () => payments.map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p)),
    [payments, overrides]
  );
  const [compensateTarget, setCompensateTarget] = useState<PaymentLedgerItem | null>(null);
  const [compensating, setCompensating] = useState(false);
  const [issuedVoucher, setIssuedVoucher] = useState<string | null>(null);
  // Refund against one payment: recorded now, confirmed as paid back in the Refunds list.
  const [refundTarget, setRefundTarget] = useState<PaymentLedgerItem | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);

  const openRefund = (p: PaymentLedgerItem) => {
    setActiveMenuId(null);
    setRefundTarget(p);
    setRefundAmount(String(p.amount));
    setRefundReason("");
  };

  const handleRefund = async () => {
    if (!refundTarget?.paymentId) return;
    const amount = Number(refundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter an amount above zero.");
      return;
    }
    if (!refundReason.trim()) {
      toast.error("Say why the payment is being refunded.");
      return;
    }
    setRefunding(true);
    try {
      const res = await requestRefund({
        // TV is sold on the hotspot side and refunded as a hotspot payment
        paymentType: refundTarget.serviceType === "PPPOE" ? "PPPOE" : "HOTSPOT",
        paymentId: refundTarget.paymentId,
        amount,
        reason: refundReason.trim(),
      });
      if (res.success) {
        toast.success("Refund recorded. Pay the customer back, then confirm it in the Refunds list.");
        setRefundTarget(null);
      } else {
        toast.error(res.message);
      }
    } finally {
      setRefunding(false);
    }
  };

  function openCompensate(p: PaymentLedgerItem) {
    setCompensateTarget(p);
    setIssuedVoucher(null);
    setActiveMenuId(null);
  }

  async function handleCompensate() {
    if (!compensateTarget?.mpesaReceipt) return;
    setCompensating(true);
    try {
      const res = await compensateHotspotPayment(compensateTarget.mpesaReceipt, "Paid, never connected (Payments ledger)");
      if (res.success && res.voucherCode) {
        setIssuedVoucher(res.voucherCode);
        const target = compensateTarget.id;
        const voucherCode = res.voucherCode;
        setOverrides((prev) => ({
          ...prev,
          [target]: { connection: "COMPENSATED", compensationVoucher: voucherCode },
        }));
        toast.success(`Voucher ${res.voucherCode} issued.`);
      } else {
        toast.error(res.message);
      }
    } finally {
      setCompensating(false);
    }
  }

 function openEmailDialog(p: PaymentLedgerItem) {
 setEmailTarget(p);
 setEmail("");
 setActiveMenuId(null);
 }

 function openViewDialog(p: PaymentLedgerItem) {
 setViewTarget(p);
 setActiveMenuId(null);
 }

 async function handleDownload(p: PaymentLedgerItem) {
 setActiveMenuId(null);
 setDownloadingId(p.id);
 try {
 const pdf = await downloadReceiptPdf(p.statementId);
 if (pdf) {
 const blob = new Blob([pdf], { type: "application/pdf" });
 const url = URL.createObjectURL(blob);
 const anchor = document.createElement("a");
 anchor.href = url;
 anchor.download = `receipt-${p.receiptNumber}.pdf`;
 document.body.appendChild(anchor);
 anchor.click();
 document.body.removeChild(anchor);
 URL.revokeObjectURL(url);
 toast.success(`Receipt ${p.receiptNumber} downloaded.`);
 } else {
 toast.error("No statement/receipt PDF is available for this payment.");
 }
 } finally {
 setDownloadingId(null);
 }
 }

 async function handleEmailSubmit() {
 if (!emailTarget) return;
 if (!email.includes("@")) {
 toast.error("Please enter a valid email address.");
 return;
 }
 setSending(true);
 try {
 const res = await emailReceipt(emailTarget.statementId, email);
 if (res.success) {
 toast.success(res.message);
 setEmailTarget(null);
 } else {
 toast.error(res.message);
 }
 } finally {
 setSending(false);
 }
 }

 const columns = useMemo<ColumnDef<PaymentLedgerItem>[]>(
 () => [
 {
 id: "subscriber",
 header: "Subscriber",
 accessorFn: (p) =>
 [p.subscriberCode, p.subscriberPhone, p.phone, p.customerName, p.voucherCode, p.compensationVoucher]
 .filter(Boolean)
 .join(" "),
 cell: ({ row }) => {
 const p = row.original;
 return (
 <div className="font-sans">
 <div className="font-semibold text-foreground">{p.subscriberCode}</div>
 <div className="text-[11px] text-muted-foreground font-sans tabular-nums">
 {p.customerName ? p.subscriberPhone : p.voucherCode ? `Voucher ${p.voucherCode}` : p.subscriberPhone}
 </div>
 </div>
 );
 },
 },
 {
 accessorKey: "receiptNumber",
 header: "Receipt",
 cell: ({ row }) => (
 <span className="font-bold text-amber-400 tracking-wider text-sm">{row.original.receiptNumber}</span>
 ),
 },
 {
 accessorKey: "paymentMethod",
 header: "Method",
 cell: ({ row }) => <span className="font-sans text-muted-foreground">{row.original.paymentMethod}</span>,
 },
 {
 accessorKey: "serviceType",
 header: "Type",
 cell: ({ row }) => <span className="font-sans text-muted-foreground">{row.original.serviceType}</span>,
 },
 {
 id: "connection",
 header: "Connection",
 accessorFn: (p) => p.connection ?? (p.isReconciled ? "reconciled" : ""),
 cell: ({ row }) => {
 const p = row.original;
 return p.connection ? (
 <div>
 <ConnectionBadge connection={p.connection} />
 {p.compensationVoucher && (
 <div className="mt-1 text-[10px] text-muted-foreground">Voucher {p.compensationVoucher}</div>
 )}
 </div>
 ) : p.isReconciled ? (
 <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
 <CheckCircle2 className="h-4 w-4" />
 </span>
 ) : (
 <span className="text-muted-foreground">—</span>
 );
 },
 },
 {
 id: "packageRouter",
 header: "Package · Router",
 accessorFn: (p) => [p.packageName, p.routerName].filter(Boolean).join(" "),
 cell: ({ row }) => {
 const p = row.original;
 return p.packageName || p.routerName ? (
 <>
 <div className="text-foreground">{p.packageName ?? "—"}</div>
 <div className="text-[11px] text-muted-foreground">{p.routerName ?? "—"}</div>
 </>
 ) : (
 <span className="text-muted-foreground">{p.payoutType}</span>
 );
 },
 },
 {
 accessorKey: "amount",
 header: "Amount",
 cell: ({ row }) => <span className="font-bold text-foreground">Ksh {row.original.amount}</span>,
 },
 {
 id: "date",
 header: "Date",
 accessorFn: (p) => p.dateFormatted,
 cell: ({ row }) => (
 <span className="text-muted-foreground">
 {row.original.dateFormatted}
 <span className="ml-2 text-[10px] text-muted-foreground font-sans tabular-nums">
 {row.original.latencyText}
 </span>
 </span>
 ),
 },
 {
 id: "actions",
 header: "",
 enableSorting: false,
 enableHiding: false,
 cell: ({ row }) => {
 const p = row.original;
 return (
 <div className="relative text-right">
 <button
 onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
 className="text-muted-foreground hover:text-accent-foreground"
 aria-label="Payment actions"
 >
 <MoreHorizontal className="h-4 w-4" />
 </button>

 {activeMenuId === p.id && (
 <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-border bg-popover py-1 shadow-2xl text-left">
 <button
 onClick={() => openViewDialog(p)}
 className="flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
 >
 <Eye className="h-3.5 w-3.5" /> View payment
 </button>
 {canIssueVoucher && p.connection === "NOT_CONNECTED" && p.mpesaReceipt && (
 <button
 onClick={() => openCompensate(p)}
 className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-accent"
 >
 <RotateCcw className="h-3.5 w-3.5" /> Issue voucher
 </button>
 )}
 {canRefund && p.paymentId && (
 <button
 onClick={() => openRefund(p)}
 className="flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
 >
 <RotateCcw className="h-3.5 w-3.5" /> Refund…
 </button>
 )}
 <button
 onClick={() => handleDownload(p)}
 disabled={downloadingId === p.id || !p.statementId}
 className="flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:pointer-events-none"
 >
 {downloadingId === p.id ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 ) : (
 <Download className="h-3.5 w-3.5" />
 )}{" "}
 Download PDF receipt
 </button>
 <button
 onClick={() => openEmailDialog(p)}
 disabled={!p.statementId}
 className="flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:pointer-events-none"
 >
 <Mail className="h-3.5 w-3.5" /> Email receipt
 </button>
 </div>
 )}
 </div>
 );
 },
 },
 ],
 [activeMenuId, downloadingId, canIssueVoucher, canRefund]
 );

 return (
 <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
 <DataTable
 columns={columns}
 data={rows}
 searchPlaceholder="Phone, receipt, voucher, customer, package…"
 enableRowSelection
 getRowId={(p) => p.id}
 onRowSelectionChange={setSelectedIds}
 toolbar={
 selectedIds.length > 0 ? (
 <span className="text-xs font-sans tabular-nums text-amber-400">{selectedIds.length} selected</span>
 ) : undefined
 }
 />

 {/* View payment dialog */}
 <Dialog open={viewTarget !== null} onOpenChange={(o) => !o && setViewTarget(null)}>
 <DialogContent className="bg-card border-border text-foreground">
 <DialogHeader>
 <DialogTitle className="text-foreground">Payment {viewTarget?.receiptNumber}</DialogTitle>
 <DialogDescription className="text-muted-foreground">
 Transaction details from the ledger.
 </DialogDescription>
 </DialogHeader>
 {viewTarget && (
 <div className="space-y-3 font-sans tabular-nums text-xs">
 <div className="flex justify-between border-b border-border pb-2">
 <span className="text-muted-foreground">Subscriber</span>
 <span className="text-foreground">{viewTarget.subscriberCode} · {viewTarget.subscriberPhone}</span>
 </div>
 <div className="flex justify-between border-b border-border pb-2">
 <span className="text-muted-foreground">Method</span>
 <span className="text-foreground">{viewTarget.paymentMethod} · {viewTarget.serviceType}</span>
 </div>
 <div className="flex justify-between border-b border-border pb-2">
 <span className="text-muted-foreground">Reconciled</span>
 <span className={viewTarget.isReconciled ? "text-emerald-400" : "text-muted-foreground"}>
 {viewTarget.isReconciled ? "Confirmed" : "Pending"}
 </span>
 </div>
 {viewTarget.connection && (
 <div className="flex justify-between border-b border-border pb-2">
 <span className="text-muted-foreground">Connection</span>
 <ConnectionBadge connection={viewTarget.connection} />
 </div>
 )}
 {(viewTarget.packageName || viewTarget.routerName) && (
 <div className="flex justify-between border-b border-border pb-2">
 <span className="text-muted-foreground">Package · Router</span>
 <span className="text-foreground">{viewTarget.packageName ?? "—"} · {viewTarget.routerName ?? "—"}</span>
 </div>
 )}
 {(viewTarget.voucherCode || viewTarget.compensationVoucher) && (
 <div className="flex justify-between border-b border-border pb-2">
 <span className="text-muted-foreground">Voucher</span>
 <span className="text-foreground">
 {viewTarget.voucherCode ?? "—"}
 {viewTarget.compensationVoucher ? ` → compensated with ${viewTarget.compensationVoucher}` : ""}
 </span>
 </div>
 )}
 <div className="flex justify-between border-b border-border pb-2">
 <span className="text-muted-foreground">Amount</span>
 <span className="text-amber-400 font-bold">Ksh {viewTarget.amount} {viewTarget.currency}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Date</span>
 <span className="text-foreground">{viewTarget.dateFormatted} · {viewTarget.latencyText}</span>
 </div>
 </div>
 )}
 <DialogFooter>
 <Button variant="outline" onClick={() => setViewTarget(null)}>
 Close
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Raise a refund */}
 <Dialog open={refundTarget !== null} onOpenChange={(o) => !o && !refunding && setRefundTarget(null)}>
 <DialogContent className="bg-card border-border text-foreground">
 <DialogHeader>
 <DialogTitle className="text-foreground">Refund this payment?</DialogTitle>
 <DialogDescription className="text-muted-foreground">
 {`${refundTarget?.subscriberCode ?? ""} paid Ksh ${refundTarget?.amount ?? ""}${refundTarget?.mpesaReceipt ? ` (M-Pesa ${refundTarget.mpesaReceipt})` : ""}. This records the refund; it does not send money. Income is reduced once someone confirms the customer was paid back.`}
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-3">
 <div className="space-y-1">
 <label htmlFor="refund-amount" className="text-xs text-muted-foreground">Amount to refund (KES)</label>
 <Input id="refund-amount" inputMode="decimal" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
 </div>
 <div className="space-y-1">
 <label htmlFor="refund-reason" className="text-xs text-muted-foreground">Reason</label>
 <Input id="refund-reason" placeholder="e.g. paid twice, could not connect" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
 </div>
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setRefundTarget(null)} disabled={refunding}>
 Cancel
 </Button>
 <Button onClick={handleRefund} disabled={refunding}>
 {refunding ? "Recording…" : "Record refund"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Issue compensation voucher */}
 <Dialog
 open={compensateTarget !== null}
 onOpenChange={(o) => !o && !compensating && setCompensateTarget(null)}
 >
 <DialogContent className="bg-card border-border text-foreground">
 <DialogHeader>
 <DialogTitle className="text-foreground">
 {issuedVoucher ? "Voucher issued" : "Issue a voucher for this payment?"}
 </DialogTitle>
 <DialogDescription className="text-muted-foreground">
 {issuedVoucher
 ? "Give this code to the customer. They enter it on the Wi-Fi page under “Activate Voucher”; validity starts when they activate it."
 : `${compensateTarget?.subscriberCode ?? ""} paid Ksh ${compensateTarget?.amount ?? ""} (M-Pesa ${compensateTarget?.mpesaReceipt ?? ""}) for ${compensateTarget?.packageName ?? "a package"} but never got connected. Their original session is cancelled and replaced by a voucher for the same package. No new revenue is recorded.`}
 </DialogDescription>
 </DialogHeader>
 {issuedVoucher && (
 <div className="rounded-lg border border-border bg-muted p-4 text-center font-mono text-2xl tracking-widest">
 {issuedVoucher}
 </div>
 )}
 <DialogFooter>
 {issuedVoucher ? (
 <Button onClick={() => setCompensateTarget(null)} className="bg-amber-500 text-black hover:bg-amber-400">
 Done
 </Button>
 ) : (
 <>
 <Button variant="outline" onClick={() => setCompensateTarget(null)} disabled={compensating}>
 Cancel
 </Button>
 <Button onClick={handleCompensate} disabled={compensating} className="bg-amber-500 text-black hover:bg-amber-400">
 {compensating ? "Issuing…" : "Issue voucher"}
 </Button>
 </>
 )}
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Email receipt dialog */}
 <Dialog
 open={emailTarget !== null}
 onOpenChange={(o) => !o && setEmailTarget(null)}
 >
 <DialogContent className="bg-card border-border text-foreground">
 <DialogHeader>
 <DialogTitle className="text-foreground">Email receipt</DialogTitle>
 <DialogDescription className="text-muted-foreground">
 Send PDF receipt {emailTarget?.receiptNumber} to a recipient.
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-2">
 <label className="text-xs font-sans tabular-nums text-muted-foreground">Recipient email</label>
 <Input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="recipient@example.com"
 className="border-border bg-muted text-foreground placeholder:text-zinc-600"
 />
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setEmailTarget(null)} disabled={sending}>
 Cancel
 </Button>
 <Button
 onClick={handleEmailSubmit}
 disabled={sending}
 className="bg-amber-500 text-black hover:bg-amber-400"
 >
 {sending ? "Sending…" : "Send receipt"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}
