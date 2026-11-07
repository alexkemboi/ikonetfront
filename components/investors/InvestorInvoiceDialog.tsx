"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FeePayNow, feePaymentInstructions } from "@/components/finance/FeePayNow";
import { feeDate, kes, STANDING_CLASS, STANDING_LABEL } from "@/components/finance/systemFeeFormat";
import { sendInvestorInvoice } from "@/actions/investorRegistry";
import type { InvestorSummary } from "@/lib/types/investor";
import type { FeeReceivingAccount } from "@/lib/types/platformFee";

/**
 * Invoice an investor for the system fee they owe (SYSADMIN), agreement by agreement:
 * - an M-Pesa prompt (STK push) to the investor's phone: the payment records itself;
 * - or a paybill invoice by email and/or text: what is owed and what to enter (paybill and
 *   account = the agreement code). A payment made that way is recorded under System fees.
 */
export default function InvestorInvoiceDialog({
  investor,
  account,
  open,
  onOpenChange,
}: {
  investor: InvestorSummary;
  account: FeeReceivingAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(true);
  const owing = investor.fees?.owing ?? [];

  const invoice = (agreementId: string | null) => {
    if (!email && !sms) return toast.error("Choose email, text message, or both.");
    startTransition(async () => {
      const res = await sendInvestorInvoice(investor.id, { agreementId, email, sms });
      if (!res.success || !res.data) {
        toast.error(res.message || "The invoice was not sent");
        return;
      }
      const d = res.data.deliveries[0];
      toast.success(`Invoice sent: ${d?.emails ?? 0} email · ${d?.texts ?? 0} text${d?.note ? ` (${d.note})` : ""}`);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invoice {investor.legalName}</DialogTitle>
          <DialogDescription>
            {kes(investor.fees?.outstanding ?? 0)} owed on {owing.length} agreement{owing.length === 1 ? "" : "s"}. Send an
            M-Pesa prompt to the investor&apos;s phone (the payment records itself), or a paybill invoice they pay
            themselves (record that payment under System fees once it arrives).
          </DialogDescription>
        </DialogHeader>

        {owing.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing is owed.</p>
        ) : (
          <div className="space-y-4">
            <ul className="space-y-2">
              {owing.map((a) => (
                <li key={a.agreementId} className="rounded-xl border border-border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {a.agreementCode} · {a.companyName ?? a.companyCode}{" "}
                        <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${STANDING_CLASS[a.standing]}`}>
                          {STANDING_LABEL[a.standing]}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {kes(a.outstanding)} owed{a.dueDate ? ` · due ${feeDate(a.dueDate)}` : ""}
                      </p>
                      {account && (
                        <p className="text-xs text-muted-foreground">Paybill route: {feePaymentInstructions(account, a.agreementCode)}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <FeePayNow agreementId={a.agreementId} agreementCode={a.agreementCode} balance={a.outstanding}
                        account={account} defaultPhone={investor.phone} label="Send M-Pesa prompt" />
                      <Button size="sm" variant="outline" disabled={pending} onClick={() => invoice(a.agreementId)}>
                        {pending && <Loader2 className="mr-2 size-4 animate-spin" />} Send paybill invoice
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border p-3 text-sm">
              <div className="flex gap-5">
                <span className="text-muted-foreground">Paybill invoice by</span>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> Email
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} /> Text message
                </label>
              </div>
              {owing.length > 1 && (
                <Button size="sm" disabled={pending} onClick={() => invoice(null)}>
                  Invoice all {owing.length} agreements
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Invoices are kept on the investor&apos;s page under Messages sent. The investor&apos;s phone on record
              ({investor.phone ?? "none"}) is filled in for the prompt; change it there if they pay from another number.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
