"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reconnectByReceiptAction } from "@/actions/hotspot";
import { getPortalRouter } from "@/lib/hotspot/portalRouter";
import { sanitizeErrorMessage } from "@/lib/brand";
import { signInOnRouter } from "@/lib/hotspot/routerSignIn";

interface AlreadyPaidFormProps {
  /** MikroTik redirect `$(mac)`; the backend recovers it from `clientIp` when a CNA strips it. */
  clientMac?: string;
  clientIp?: string;
}

type State = "idle" | "working" | "connected" | "failed";

/**
 * "Already paid?": a customer whose phone is no longer signed in (its private Wi-Fi address
 * changed, or the sign-in was lost) gets the package back with the number that paid and the
 * M-Pesa code from the payment SMS. The package moves to this device.
 */
export default function AlreadyPaidForm({ clientMac, clientIp }: AlreadyPaidFormProps) {
  const [phone, setPhone] = useState("");
  const [mpesaCode, setMpesaCode] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  const ready = phone.replace(/\D/g, "").length >= 9 && /^[A-Z0-9]{8,12}$/.test(mpesaCode);

  const submit = async () => {
    if (!ready) return;
    setState("working");
    setMessage("Finding your package…");
    try {
      const result = await reconnectByReceiptAction({ phone, mpesaCode, macAddress: clientMac, clientIp, portalRouter: getPortalRouter() });
      if (!result.success || !result.data) {
        setState("failed");
        setMessage(sanitizeErrorMessage(result.message || "We could not reconnect you. Please try again."));
        return;
      }
      const expiry = result.data.expiresAt ? new Date(result.data.expiresAt) : null;
      setState("connected");
      // the device signs itself in on the router ("You are logged in")
      const code = result.data.voucherCode;
      if (code) setTimeout(() => signInOnRouter(code), 1_000);
      setMessage(expiry && !Number.isNaN(expiry.getTime())
        ? `You're connected again. Valid until ${expiry.toLocaleString()}.`
        : "You're connected again.");
    } catch {
      setState("failed");
      setMessage("We could not reconnect you. Please try again.");
    }
  };

  const inputClass = "w-full h-9 px-3 py-1 rounded-md border border-input bg-transparent text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <section id="already-paid" aria-labelledby="already-paid-heading" className="scroll-mt-4 space-y-3 rounded-lg border border-border p-4">
      <div>
        <h3 id="already-paid-heading" className="text-sm font-medium">Already paid? Get back online</h3>
        <p className="text-xs text-muted-foreground">
          Enter the number that paid and the M-Pesa code from the payment SMS. Your package moves to this device.
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor="already-paid-phone" className="text-sm block">Phone number that paid</label>
        <input id="already-paid-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712345678"
          value={phone} onChange={(e) => setPhone(e.target.value)} disabled={state === "working"} className={inputClass} />
      </div>
      <div className="space-y-2">
        <label htmlFor="already-paid-code" className="text-sm block">M-Pesa code</label>
        <input id="already-paid-code" type="text" autoComplete="off" autoCapitalize="characters" placeholder="UK3PC0ENZQ"
          value={mpesaCode} onChange={(e) => setMpesaCode(e.target.value.replace(/\s/g, "").toUpperCase())}
          disabled={state === "working"} className={`${inputClass} font-mono`} />
      </div>
      {message && (
        <div role="status" className={`flex items-center gap-2 text-sm p-3 rounded-lg border ${state === "connected"
          ? "bg-green-50 text-green-800 border-green-200"
          : state === "working" ? "bg-blue-50 text-blue-800 border-blue-200"
          : "bg-red-50 text-red-800 border-red-200"}`}>
          {state === "working" && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {state === "connected" && <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
          {state === "failed" && <XCircle className="w-4 h-4" aria-hidden="true" />}
          {message}
        </div>
      )}
      <Button onClick={submit} disabled={!ready || state === "working"} variant="outline" className="w-full">
        {state === "working" ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Reconnecting…</> : "Reconnect"}
      </Button>
    </section>
  );
}
