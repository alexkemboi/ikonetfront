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
import { Input } from "@/components/ui/input";

interface Props {
  payments: PaymentLedgerItem[];
}

export function PaymentsDataTable({ payments }: Props) {
  const [search, setSearch] = useState("");
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
      const ok = await downloadReceiptPdf(p.receiptNumber);
      if (ok) {
        toast.success(`Receipt ${p.receiptNumber} downloading…`);
      } else {
        toast.error("Failed to generate PDF receipt.");
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
      const res = await emailReceipt(emailTarget.receiptNumber, email);
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
    <div className="rounded-2xl border border-[#262626] bg-[#161616] p-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-[#262626] pb-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Receipt, phone, user..."
            className="h-9 w-full rounded-lg border border-[#262626] bg-[#121212] pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none font-mono"
          />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[920px]">
          <thead>
            <tr className="border-b border-[#262626] text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
              <th className="py-3 px-3 w-10">
                <input type="checkbox" className="rounded border-zinc-700 bg-zinc-800" />
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
          <tbody className="divide-y divide-zinc-800/50 font-mono">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-14 text-center text-sm text-zinc-500 font-sans"
                >
                  No payments match your search.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-800/30 transition">
                  <td className="py-3.5 px-3">
                    <input type="checkbox" className="rounded border-zinc-700 bg-zinc-800" />
                  </td>

                  <td className="py-3.5 px-3 font-sans">
                    <div className="font-semibold text-white">{p.subscriberCode}</div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      {p.subscriberPhone}
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="font-bold text-amber-400 tracking-wider text-sm">
                      {p.receiptNumber}
                    </span>
                    {p.isFallback && (
                      <span className="ml-2 rounded-full bg-amber-500/10 px-1.5 py-0.5 align-middle text-[9px] font-mono uppercase tracking-wider text-amber-400/80">
                        demo
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 font-sans text-zinc-300">
                    {p.paymentMethod}
                  </td>

                  <td className="py-3.5 px-3 font-sans text-zinc-300">{p.serviceType}</td>

                  <td className="py-3.5 px-3 text-center">
                    {p.isReconciled ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 font-sans text-zinc-400">{p.payoutType}</td>

                  <td className="py-3.5 px-3 font-bold text-white">Ksh {p.amount}</td>

                  <td className="py-3.5 px-3 text-zinc-400">
                    <span>{p.dateFormatted}</span>
                    <span className="ml-2 text-[10px] text-zinc-600 font-mono">
                      {p.latencyText}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-right relative">
                    <button
                      onClick={() =>
                        setActiveMenuId(activeMenuId === p.id ? null : p.id)
                      }
                      className="text-zinc-500 hover:text-white"
                      aria-label="Payment actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {activeMenuId === p.id && (
                      <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-[#262626] bg-[#1a1a1a] py-1 shadow-2xl">
                        <button
                          onClick={() => openViewDialog(p)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        >
                          <Eye className="h-3.5 w-3.5" /> View payment
                        </button>
                        <button
                          onClick={() => handleDownload(p)}
                          disabled={downloadingId === p.id}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
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
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
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

      <div className="mt-2 border-t border-[#262626] pt-3 text-xs font-mono text-zinc-500">
        Showing {filtered.length} of {payments.length} payments
      </div>

      {/* View payment dialog */}
      <Dialog open={viewTarget !== null} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent className="bg-[#161616] border-[#262626] text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-white">Payment {viewTarget?.receiptNumber}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Transaction details from the ledger.
            </DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-[#262626] pb-2">
                <span className="text-zinc-400">Subscriber</span>
                <span className="text-white">{viewTarget.subscriberCode} · {viewTarget.subscriberPhone}</span>
              </div>
              <div className="flex justify-between border-b border-[#262626] pb-2">
                <span className="text-zinc-400">Method</span>
                <span className="text-white">{viewTarget.paymentMethod} · {viewTarget.serviceType}</span>
              </div>
              <div className="flex justify-between border-b border-[#262626] pb-2">
                <span className="text-zinc-400">Reconciled</span>
                <span className={viewTarget.isReconciled ? "text-emerald-400" : "text-zinc-500"}>
                  {viewTarget.isReconciled ? "Confirmed" : "Pending"}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#262626] pb-2">
                <span className="text-zinc-400">Payout</span>
                <span className="text-white">{viewTarget.payoutType}</span>
              </div>
              <div className="flex justify-between border-b border-[#262626] pb-2">
                <span className="text-zinc-400">Amount</span>
                <span className="text-amber-400 font-bold">Ksh {viewTarget.amount} {viewTarget.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Date</span>
                <span className="text-white">{viewTarget.dateFormatted} · {viewTarget.latencyText}</span>
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
        <DialogContent className="bg-[#161616] border-[#262626] text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-white">Email receipt</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Send PDF receipt {emailTarget?.receiptNumber} to a recipient.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400">Recipient email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="border-[#262626] bg-[#121212] text-zinc-100 placeholder:text-zinc-600"
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
