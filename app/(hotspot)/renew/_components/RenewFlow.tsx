"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPppoeRenewalPaymentAction, startPppoeRenewalPaymentAction } from "@/actions/pppoeRenewal";
import type { PppoeRenewalInfo } from "@/lib/types/pppoeRenewal";

const PHONE = /^(?:\+?254|0)?(7|1)\d{8}$/;
const POLL_MS = 4000;
const POLL_FOR_MS = 120_000;

function formatDay(iso: string | null): string {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

/** The day before the expiry date: service stops at midnight at the start of the expiry date. */
function lastDay(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

type Stage = "idle" | "sending" | "waiting" | "paid" | "failed";

export function RenewFlow({ info }: { info: PppoeRenewalInfo }) {
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const price = info.price != null ? `KES ${Number(info.price).toLocaleString("en-KE")}` : null;
  const validPhone = PHONE.test(phone.replace(/\s/g, ""));

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function poll(paymentId: string, startedAt: number) {
    timer.current = setTimeout(async () => {
      const res = await getPppoeRenewalPaymentAction(info.accountNumber, paymentId);
      const status = res.success ? res.data?.status : null;
      if (status === "COMPLETED") {
        setStage("paid");
        return;
      }
      if (status === "FAILED") {
        setStage("failed");
        setMessage("The payment was not completed. You can try again.");
        return;
      }
      if (Date.now() - startedAt > POLL_FOR_MS) {
        setStage("failed");
        setMessage("We have not received the payment yet. If you paid, you will be reconnected as soon as it arrives.");
        return;
      }
      poll(paymentId, startedAt);
    }, POLL_MS);
  }

  async function pay() {
    setStage("sending");
    setMessage("");
    const res = await startPppoeRenewalPaymentAction(info.accountNumber, phone.replace(/\s/g, ""));
    if (!res.success || !res.data) {
      setStage("failed");
      setMessage(res.message || "The payment prompt could not be sent. Try again in a moment.");
      return;
    }
    setStage("waiting");
    poll(res.data.paymentId, Date.now());
  }

  const statusLine =
    info.status === "RUNNING" ? `Your internet runs until midnight on ${lastDay(info.expiryDate)}.`
    : info.status === "PAUSED" ? "Your subscription is paused."
    : info.status === "NO_PACKAGE" ? "This account has no package yet. Contact us."
    : `Your internet stopped on ${formatDay(info.expiryDate)}.`;

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-lg border border-border bg-card p-4 text-sm">
        <p className="font-medium text-foreground">{info.customerName ?? "Account"} · {info.accountNumber}</p>
        {info.companyName && <p className="text-muted-foreground">{info.companyName}</p>}
        {info.packageName && <p className="mt-2">{info.packageName}{price ? ` · ${price}` : ""}</p>}
        <p className="mt-1 text-muted-foreground">{statusLine}</p>
      </div>

      {stage === "paid" ? (
        <div role="status" className="flex items-start gap-2 rounded-lg border border-success/40 bg-success/10 p-4 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
          <p>Paid, thank you. Your internet is back within a minute. If it is not, switch your router off and on.</p>
        </div>
      ) : info.canPayByPrompt ? (
        <div className="space-y-3">
          <Label htmlFor="phone">M-Pesa number to pay from</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678"
            inputMode="tel" autoComplete="tel" disabled={stage === "sending" || stage === "waiting"} />
          {info.phoneHint && <p className="text-xs text-muted-foreground">Your registered number: {info.phoneHint}</p>}
          <Button className="w-full" onClick={pay} disabled={!validPhone || stage === "sending" || stage === "waiting"}>
            {stage === "sending" || stage === "waiting" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {stage === "waiting" ? "Enter your M-Pesa PIN on your phone…" : `Pay ${price ?? ""} with M-Pesa`}
          </Button>
          {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Payment by prompt is not available for this account. Contact us.</p>
      )}

      {info.paybill && stage !== "paid" && (
        <p className="text-xs text-muted-foreground">
          Or pay {price ?? "the package price"} to Paybill <span className="font-medium text-foreground">{info.paybill}</span>,
          Account <span className="font-medium text-foreground">{info.accountNumber}</span>. You are reconnected when it arrives.
        </p>
      )}
    </div>
  );
}
