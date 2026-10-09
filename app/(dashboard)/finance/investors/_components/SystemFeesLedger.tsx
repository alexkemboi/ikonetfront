"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getFeeEntries, recordFeePayment } from "@/actions/platformFees";
import type { FeeAgreementBalance, FeeEntry } from "@/lib/types/platformFee";
import { feeDate, kes, STANDING_CLASS, STANDING_LABEL } from "@/components/finance/systemFeeFormat";

type Props = {
  balances: FeeAgreementBalance[];
  /** Only a system administrator records payments. */
  canRecordPayment: boolean;
};

/**
 * System fees: who owes what, by company, investor and agreement. The platform's
 * register is the source of truth; a payment recorded here settles the oldest
 * charge first and can lift a suspension at once.
 */
export default function SystemFeesLedger({ balances, canRecordPayment }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState<string | null>(null);
  const [entries, setEntries] = useState<Record<string, FeeEntry[]>>({});
  const [paying, setPaying] = useState<FeeAgreementBalance | null>(null);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [method, setMethod] = useState("M-Pesa");

  const totalOwed = balances.reduce((sum, b) => sum + Math.max(b.balance, 0), 0);
  const behind = balances.filter((b) => b.feeStatus === "OVERDUE" || b.feeStatus === "SUSPENDED").length;

  const toggle = (agreementId: string) => {
    if (open === agreementId) {
      setOpen(null);
      return;
    }
    setOpen(agreementId);
    if (!entries[agreementId]) {
      startTransition(async () => {
        const rows = await getFeeEntries(agreementId);
        setEntries((prev) => ({ ...prev, [agreementId]: rows }));
      });
    }
  };

  const startPayment = (balance: FeeAgreementBalance) => {
    setPaying(balance);
    setAmount(balance.balance > 0 ? String(balance.balance) : "");
    setReference("");
    setMethod("M-Pesa");
  };

  const submitPayment = () => {
    if (!paying) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter an amount above zero.");
      return;
    }
    if (!reference.trim()) {
      toast.error("Enter the payment reference (M-Pesa code, bank reference or receipt number).");
      return;
    }
    startTransition(async () => {
      const res = await recordFeePayment({
        agreementId: paying.agreementId,
        amount: value,
        reference: reference.trim(),
        method: method.trim() || undefined,
      });
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(`Payment recorded. Balance now ${kes(res.balance?.balance ?? 0)}.`);
      setEntries((prev) => {
        const next = { ...prev };
        delete next[paying.agreementId];
        return next;
      });
      setPaying(null);
      router.refresh();
    });
  };

  return (
    <div className="px-4 pb-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-normal text-foreground">System fees</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  What each investor owes the platform under each agreement. Due on the 10th; service on their routers is
                  suspended from the 15th while unpaid.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total outstanding</p>
                <p className="text-xl font-sans tabular-nums text-foreground">{kes(totalOwed)}</p>
                {behind > 0 && <p className="text-xs text-rose-500">{behind} agreement(s) overdue or suspended</p>}
              </div>
            </div>

            {balances.length === 0 ? (
              <p className="text-sm text-muted-foreground">No agreements yet, so no fees have been charged.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" />
                      <TableHead>Company</TableHead>
                      <TableHead>Investor</TableHead>
                      <TableHead>Agreement</TableHead>
                      <TableHead className="text-right">Charged</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Standing</TableHead>
                      {canRecordPayment && <TableHead className="text-right">Action</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balances.map((b) => (
                      <Fragment key={b.agreementId}>
                        <TableRow>
                          <TableCell>
                            <button
                              type="button"
                              aria-label={`${open === b.agreementId ? "Hide" : "Show"} entries of ${b.agreementCode}`}
                              onClick={() => toggle(b.agreementId)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {open === b.agreementId ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          </TableCell>
                          <TableCell>{b.companyName}</TableCell>
                          <TableCell>
                            {b.investorName} <span className="text-xs text-muted-foreground">{b.investorCode}</span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{b.agreementCode}</TableCell>
                          <TableCell className="text-right font-sans tabular-nums">{kes(b.charged)}</TableCell>
                          <TableCell className="text-right font-sans tabular-nums">{kes(b.paid)}</TableCell>
                          <TableCell className="text-right font-sans tabular-nums">{kes(b.balance)}</TableCell>
                          <TableCell>{b.balance > 0 ? feeDate(b.oldestDueDate) : "—"}</TableCell>
                          <TableCell>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STANDING_CLASS[b.feeStatus]}`}>
                              {STANDING_LABEL[b.feeStatus]}
                            </span>
                          </TableCell>
                          {canRecordPayment && (
                            <TableCell className="text-right">
                              <Button size="sm" variant="secondary" onClick={() => startPayment(b)}>
                                Record payment
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                        {open === b.agreementId && (
                          <TableRow>
                            <TableCell />
                            <TableCell colSpan={canRecordPayment ? 9 : 8}>
                              {!entries[b.agreementId] ? (
                                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                  <Loader2 className="h-4 w-4 animate-spin" /> Loading entries…
                                </span>
                              ) : entries[b.agreementId].length === 0 ? (
                                <span className="text-sm text-muted-foreground">No charges or payments yet.</span>
                              ) : (
                                <ul className="space-y-1 text-sm">
                                  {entries[b.agreementId].map((e) => (
                                    <li key={e.id} className="flex flex-wrap justify-between gap-2">
                                      <span>
                                        {feeDate(e.createdAt)} ·{" "}
                                        {e.entryType === "CHARGE"
                                          ? `Charge for ${e.period ?? "—"} (due ${feeDate(e.dueDate)})`
                                          : e.entryType === "PAYMENT"
                                            ? `Payment ${e.reference ?? ""}${e.method ? ` · ${e.method}` : ""}`
                                            : `Adjustment ${e.notes ?? ""}`}
                                      </span>
                                      <span className="font-sans tabular-nums">{kes(e.amount)}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={paying !== null} onOpenChange={(v) => !v && setPaying(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record a system fee payment</DialogTitle>
            <DialogDescription>
              {paying
                ? `${paying.investorName} · ${paying.agreementCode} · ${paying.companyName}. Balance ${kes(paying.balance)}. The entry cannot be edited afterwards.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="fee-amount">Amount received (KES)</Label>
              <Input id="fee-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fee-reference">Payment reference</Label>
              <Input
                id="fee-reference"
                placeholder="M-Pesa code, bank reference or receipt number"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fee-method">Method</Label>
              <Input id="fee-method" value={method} onChange={(e) => setMethod(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPaying(null)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={submitPayment} disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Record payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
