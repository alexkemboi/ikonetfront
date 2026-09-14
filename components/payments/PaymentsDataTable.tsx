"use client";

import { useMemo, useState } from "react";
import {
  Search,
  CheckCircle2,
  MoreHorizontal,
  Download,
  Mail,
  Eye,
  Loader2,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import type { PaymentLedgerItem } from "@/lib/types/payments";
import { downloadReceiptPdf, emailReceipt } from "@/actions/payments";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

interface Props {
  payments: PaymentLedgerItem[];
}

export function PaymentsDataTable({ payments }: Props) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [emailTarget, setEmailTarget] = useState<PaymentLedgerItem | null>(null);
  const [viewTarget, setViewTarget] = useState<PaymentLedgerItem | null>(null);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter(
      (p) =>
        (p.receiptNumber ?? "").toLowerCase().includes(q) ||
        (p.subscriberCode ?? "").toLowerCase().includes(q) ||
        (p.subscriberPhone ?? "").includes(q)
    );
  }, [payments, search]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));
  const someFilteredSelected = filtered.some((p) => selectedIds.has(p.id));

  function toggleAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const p of filtered) next.delete(p.id);
      } else {
        for (const p of filtered) next.add(p.id);
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

 return (
 <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
 <div className="flex items-center justify-between border-b border-border pb-4">
 <div className="relative w-72">
 <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search by Receipt, phone, user..."
 className="h-9 w-full rounded-lg border border-border bg-muted pl-9 pr-4 text-xs text-foreground placeholder-zinc-500 focus:border-amber-500 focus:outline-none font-sans tabular-nums"
 />
 </div>
 </div>

 <div className="mt-4 overflow-x-auto">
 <table className="w-full text-left text-xs min-w-[920px]">
 <thead>
<tr className="border-b border-border text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
    <th className="py-3 px-3 w-10">
      <Checkbox
        checked={someFilteredSelected && !allFilteredSelected ? "indeterminate" : allFilteredSelected}
        onCheckedChange={toggleAll}
        aria-label="Select all payments"
      />
    </th>
 <th className="py-3 px-3">SUBSCRIBER</th>
 <th className="py-3 px-3">RECEIPT</th>
 <th className="py-3 px-3">METHOD</th>
 <th className="py-3 px-3">TYPE</th>
 <th className="py-3 px-3 text-center">RECONCILED</th>
 <th className="py-3 px-3">PAYOUT</th>
 <th className="py-3 px-3">AMOUNT</th>
 <th className="py-3 px-3">DATE</th>
 <th className="py-3 px-3 text-right" />
 </tr>
 </thead>
<tbody className="divide-y divide-zinc-800/50 font-sans tabular-nums">
    {filtered.length === 0 ? (
      <tr>
        <td
          colSpan={10}
          className="px-4 py-14 text-center text-sm text-muted-foreground font-sans"
        >
          {payments.length === 0 ? (
            <div className="flex flex-col items-center gap-2">
              <Inbox className="h-8 w-8 text-muted-foreground/60" />
              <span>
                No postings recorded for Account 1110 (M-Pesa Clearing).
              </span>
              <span className="text-xs text-muted-foreground/70">
                Confirmed M-Pesa payments will appear here automatically.
              </span>
            </div>
          ) : (
            "No payments match your search."
          )}
        </td>
      </tr>
    ) : (
      filtered.map((p) => (
        <tr key={p.id} className="hover:bg-zinc-800/30 transition">
          <td className="py-3.5 px-3">
            <Checkbox
              checked={selectedIds.has(p.id)}
              onCheckedChange={() => toggleOne(p.id)}
              aria-label={`Select payment ${p.receiptNumber}`}
            />
          </td>

          <td className="py-3.5 px-3 font-sans">
            <div className="font-semibold text-foreground">{p.subscriberCode}</div>
            <div className="text-[11px] text-muted-foreground font-sans tabular-nums">
              {p.subscriberPhone}
            </div>
          </td>

          <td className="py-3.5 px-3">
            <span className="font-bold text-amber-400 tracking-wider text-sm">
              {p.receiptNumber}
            </span>
          </td>

 <td className="py-3.5 px-3 font-sans text-muted-foreground">
 {p.paymentMethod}
 </td>

 <td className="py-3.5 px-3 font-sans text-muted-foreground">{p.serviceType}</td>

 <td className="py-3.5 px-3 text-center">
 {p.isReconciled ? (
 <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
 <CheckCircle2 className="h-4 w-4" />
 </span>
 ) : (
 <span className="text-muted-foreground">—</span>
 )}
 </td>

 <td className="py-3.5 px-3 font-sans text-muted-foreground">{p.payoutType}</td>

 <td className="py-3.5 px-3 font-bold text-foreground">Ksh {p.amount}</td>

 <td className="py-3.5 px-3 text-muted-foreground">
 <span>{p.dateFormatted}</span>
 <span className="ml-2 text-[10px] text-muted-foreground font-sans tabular-nums">
 {p.latencyText}
 </span>
 </td>

 <td className="py-3.5 px-3 text-right relative">
 <button
 onClick={() =>
 setActiveMenuId(activeMenuId === p.id ? null : p.id)
 }
 className="text-muted-foreground hover:text-accent-foreground"
 aria-label="Payment actions"
 >
 <MoreHorizontal className="h-4 w-4" />
 </button>

 {activeMenuId === p.id && (
 <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-border bg-popover py-1 shadow-2xl">
 <button
 onClick={() => openViewDialog(p)}
 className="flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
 >
 <Eye className="h-3.5 w-3.5" /> View payment
 </button>
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
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

<div className="mt-2 border-t border-border pt-3 text-xs font-sans tabular-nums text-muted-foreground">
    Showing {filtered.length} of {payments.length} payments
    {selectedIds.size > 0 && (
      <span className="text-amber-400"> · {selectedIds.size} selected</span>
    )}
  </div>

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
 <div className="flex justify-between border-b border-border pb-2">
 <span className="text-muted-foreground">Payout</span>
 <span className="text-foreground">{viewTarget.payoutType}</span>
 </div>
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
