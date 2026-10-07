"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { compensateHotspotPayment } from "@/actions/vouchers";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
 isOpen: boolean;
 onClose: () => void;
}

/**
 * Re-instates a paid hotspot purchase that never connected. The operator keys in
 * the M-Pesa receipt from the customer's SMS; the backend revokes the original
 * session and issues a voucher for the same package. No new revenue is posted —
 * the sale was recorded when M-Pesa settled.
 */
export function CompensatePaymentModal({ isOpen, onClose }: Props) {
 const [receipt, setReceipt] = useState("");
 const [reason, setReason] = useState("");
 const [error, setError] = useState<string | null>(null);
 const [issued, setIssued] = useState<{ code: string; packageName?: string } | null>(null);
 const [isSubmitting, setIsSubmitting] = useState(false);

 function reset() {
 setReceipt("");
 setReason("");
 setError(null);
 setIssued(null);
 }

 async function handleIssue() {
 setError(null);
 setIsSubmitting(true);
 const res = await compensateHotspotPayment(receipt, reason);
 setIsSubmitting(false);
 if (res.success && res.voucherCode) {
 setIssued({ code: res.voucherCode, packageName: res.packageName });
 } else {
 setError(res.message);
 }
 }

 return (
 <Dialog
 open={isOpen}
 onOpenChange={(open) => {
 if (!open) {
 reset();
 onClose();
 }
 }}
 >
 <DialogContent className="max-w-md border-border bg-card text-foreground">
 <DialogHeader>
 <DialogTitle className="text-base font-semibold text-foreground">
 Compensate a hotspot payment
 </DialogTitle>
 <p className="text-xs text-muted-foreground">
 For a customer who paid by M-Pesa but never got connected. Their original
 session is cancelled and replaced by a voucher for the same package. No new
 revenue is recorded.
 </p>
 </DialogHeader>

 {issued ? (
 <div className="space-y-4 py-2">
 <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-500">
 <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
 <span>
 Give this code to the customer. They enter it on the Wi-Fi page under
 &ldquo;Activate Voucher&rdquo;{issued.packageName ? ` (${issued.packageName})` : ""}.
 Validity starts when they activate it.
 </span>
 </div>
 <div className="rounded-lg border border-border bg-muted p-4 text-center font-mono text-2xl tracking-widest">
 {issued.code}
 </div>
 <div className="flex justify-end gap-3 border-t border-border pt-4">
 <Button
 type="button"
 variant="secondary"
 onClick={reset}
 >
 Compensate another
 </Button>
 <Button
 type="button"
 onClick={() => {
 reset();
 onClose();
 }}
 >
 Done
 </Button>
 </div>
 </div>
 ) : (
 <div className="space-y-4 py-2">
 <div>
 <label className="text-xs font-sans tabular-nums text-muted-foreground">
 M-Pesa receipt *
 </label>
 <input
 type="text"
 value={receipt}
 onChange={(e) => setReceipt(e.target.value.toUpperCase())}
 placeholder="e.g. UIOAC7SJ5A"
 maxLength={12}
 className="mt-1 w-full rounded-lg border border-border bg-muted p-2.5 font-mono text-sm text-foreground placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
 />
 </div>
 <div>
 <label className="text-xs font-sans tabular-nums text-muted-foreground">
 Reason (for the audit log)
 </label>
 <input
 type="text"
 value={reason}
 onChange={(e) => setReason(e.target.value)}
 placeholder="e.g. paid, never connected"
 maxLength={200}
 className="mt-1 w-full rounded-lg border border-border bg-muted p-2.5 text-sm text-foreground placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
 />
 </div>

 {error && (
 <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
 <AlertCircle className="h-4 w-4 shrink-0" />
 <span>{error}</span>
 </div>
 )}

 <div className="flex justify-end gap-3 border-t border-border pt-4">
 <Button
 type="button"
 onClick={handleIssue}
 disabled={isSubmitting || receipt.trim().length < 8}
 >
 {isSubmitting ? "Issuing..." : "Issue voucher"}
 </Button>
 </div>
 </div>
 )}
 </DialogContent>
 </Dialog>
 );
}
