"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFeePromptStatus, payFeeNow } from "@/actions/platformFees";
import { toKenyanMobile } from "@/lib/hotspot/phone";
import type { FeePromptStatus, FeeReceivingAccount } from "@/lib/types/platformFee";
import { kes } from "./systemFeeFormat";

type Props = {
  agreementId: string;
  agreementCode: string;
  /** What is owed; the prompt asks for this unless a smaller amount is typed. */
  balance: number;
  /** Null until the platform has chosen where the fee is paid. */
  account: FeeReceivingAccount | null;
  /** Filled in for the payer, e.g. the investor's phone when an administrator sends the prompt. */
  defaultPhone?: string | null;
  /** The button's words; "Pay now" by default. */
  label?: string;
};

const POLL_MS = 3_000;
/** The phone's prompt lasts about a minute; after two the server's own check takes over. */
const POLL_FOR_MS = 120_000;

/** Where to send the money by hand: shown when no prompt can be sent, and as the fallback. */
export function feePaymentInstructions(account: FeeReceivingAccount, agreementCode: string): string {
  if (account.accountType === "BANK") {
    return `Pay by bank transfer to account ${account.shortCode}${account.accountReference ? ` (${account.accountReference})` : ""}, quoting ${agreementCode}, then give the bank reference to the platform administrator.`;
  }
  return account.accountType === "TILL"
    ? `M-Pesa till ${account.accountReference ?? account.shortCode}.`
    : `M-Pesa paybill ${account.shortCode}, account ${agreementCode}.`;
}

/**
 * "Pay now": sends an M-Pesa prompt for a system fee and waits for the answer. The payment
 * records itself when M-Pesa confirms it; nobody types a reference.
 */
export function FeePayNow({ agreementId, agreementCode, balance, account, defaultPhone, label = "Pay now" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sending, startSending] = useTransition();
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<FeePromptStatus | null>(null);
  const [stoppedWaiting, setStoppedWaiting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const owed = Math.ceil(Math.max(balance, 0));
  const waiting = prompt?.status === "PENDING" && !stoppedWaiting;

  useEffect(() => {
    if (!prompt || prompt.status !== "PENDING" || stoppedWaiting) return;
    const started = Date.now();
    let cancelled = false;
    const tick = async () => {
      const next = await getFeePromptStatus(prompt.id);
      if (cancelled) return;
      if (next && next.status !== "PENDING") {
        setPrompt(next);
        if (next.status === "PAID") router.refresh();
        return;
      }
      if (Date.now() - started > POLL_FOR_MS) {
        setStoppedWaiting(true);
        return;
      }
      timer.current = setTimeout(tick, POLL_MS);
    };
    timer.current = setTimeout(tick, POLL_MS);
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
    // one polling run per prompt
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt?.id, stoppedWaiting]);

  const start = () => {
    setPhone(defaultPhone ?? "");
    setAmount(String(owed));
    setError(null);
    setPrompt(null);
    setStoppedWaiting(false);
    setOpen(true);
  };

  const send = () => {
    setError(null);
    const number = toKenyanMobile(phone);
    if (!number) {
      setError("Enter a Safaricom number such as 0712345678.");
      return;
    }
    const value = Math.ceil(Number(amount));
    if (!Number.isFinite(value) || value < 1 || value > owed) {
      setError(`Enter an amount from KES 1 to KES ${owed.toLocaleString("en-KE")}, which is what is owed.`);
      return;
    }
    startSending(async () => {
      const res = await payFeeNow({ agreementId, phone: number, amount: value });
      if (!res.success || !res.prompt) {
        setError(res.message);
        return;
      }
      setStoppedWaiting(false);
      setPrompt(res.prompt);
    });
  };

  if (owed <= 0) return null;

  const canPrompt = account?.promptAvailable === true;
  const finished = prompt && prompt.status !== "PENDING";

  return (
    <>
      <Button size="sm" onClick={start}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={(v) => !sending && setOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay the system fee</DialogTitle>
            <DialogDescription>
              {agreementCode} · {kes(balance)} owed.
              {canPrompt ? " A prompt is sent to the phone; enter the M-Pesa PIN there and the payment records itself." : ""}
            </DialogDescription>
          </DialogHeader>

          {!account ? (
            <p role="alert" className="text-sm text-foreground">
              The platform has not set up the account the system fee is paid into yet. Ask the platform administrator.
            </p>
          ) : !canPrompt ? (
            <p className="text-sm text-foreground">{feePaymentInstructions(account, agreementCode)}</p>
          ) : prompt ? (
            <div className="space-y-3" aria-live="polite">
              <p className="flex items-start gap-2 text-sm text-foreground">
                {prompt.status === "PAID" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                ) : prompt.status === "FAILED" ? (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                ) : (
                  <Loader2 className={`mt-0.5 h-4 w-4 shrink-0 ${waiting ? "animate-spin" : ""}`} />
                )}
                <span>
                  {prompt.status === "PENDING" && stoppedWaiting
                    ? "M-Pesa has not answered yet. If you entered your PIN, the payment is recorded as soon as M-Pesa confirms it; you can close this and check the balance in a few minutes."
                    : prompt.message}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {kes(prompt.amount)} · {prompt.phone}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor={`fee-pay-phone-${agreementId}`}>M-Pesa number</Label>
                <Input
                  id={`fee-pay-phone-${agreementId}`}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`fee-pay-amount-${agreementId}`}>Amount (KES, whole shillings)</Label>
                <Input
                  id={`fee-pay-amount-${agreementId}`}
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Paid to {feePaymentInstructions(account, agreementCode)}
              </p>
              {error && (
                <p role="alert" className="text-sm text-rose-500">
                  {error}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={sending}>
              {finished || (prompt && stoppedWaiting) || !canPrompt ? "Close" : "Cancel"}
            </Button>
            {canPrompt && !prompt && (
              <Button onClick={send} disabled={sending}>
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send prompt
              </Button>
            )}
            {canPrompt && prompt && (prompt.status === "FAILED" || prompt.status === "UNCONFIRMED") && (
              <Button
                onClick={() => {
                  setPrompt(null);
                  setError(null);
                }}
              >
                Try again
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
