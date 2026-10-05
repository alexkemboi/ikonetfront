"use client";

import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TvPackage, TvPortalSession } from "@/lib/types/tv";
import { mpesaPhoneSchema, normalizeMpesaPhone } from "@/lib/validation/tv-payment";
import { getTvPaymentStatusAction, initiateTvPaymentAction, prepareTvDeviceAction } from "@/actions/tv";
import { getPortalRouter } from "@/lib/hotspot/portalRouter";

type Status = {
  state: "PENDING" | "SETTLED" | "FAILED" | "TIMED_OUT";
  provisioningState: "NOT_APPLICABLE" | "PENDING" | "PROVISIONED" | "RETRYING" | "PARKED";
  pendingReason: "STK_OUTCOME_UNKNOWN" | "UNDER_REVIEW" | null;
  failedReason: string | null;
  supportReference: string | null;
  mpesaReceipt: string | null;
  amount: string;
  currency: "KES";
  tvEntitlementExpiresAt: string | null;
};

interface Props {
  portal: TvPortalSession;
  onPortalRefreshed: (portal: TvPortalSession) => void;
  customerPhone: string;
  macAddress: string;
  pkg: TvPackage;
  phone: string;
  onPhoneChange: (phone: string) => void;
  onEditDevice: () => void;
  onEditPackage: () => void;
}

export default function TvPurchaseReview({ portal, onPortalRefreshed, customerPhone, macAddress, pkg, phone, onPhoneChange, onEditDevice, onEditPackage }: Props) {
  const [message, setMessage] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [serverAmount, setServerAmount] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [pollDeadline, setPollDeadline] = useState<number | null>(null);

  useEffect(() => {
    if (!transactionReference || !pollDeadline) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const started = Date.now();
    const poll = async () => {
      if (stopped) return;
      if (Date.now() >= pollDeadline) {
        setMessage(`The payment is still unresolved. Contact support with reference ${transactionReference}; do not pay again.`);
        return;
      }
      let result = await getTvPaymentStatusAction(transactionReference, portal.portalToken);
      if (!result.success && result.message === "TV_PORTAL_TOKEN_EXPIRED") {
        const refreshed = await prepareTvDeviceAction({ customerPhone: portal.normalizedPhone, macAddress: portal.normalizedMac, routerIdentity: portal.routerIdentity ?? undefined }, getPortalRouter());
        if (refreshed.success) {
          onPortalRefreshed(refreshed.portal);
          result = await getTvPaymentStatusAction(transactionReference, refreshed.portal.portalToken);
        }
      }
      if (stopped) return;
      if (!result.success) {
        setRequestId(result.requestId ?? null);
      } else {
        setStatus(result.data as Status);
        if (result.data.state === "FAILED") { setIdempotencyKey(""); return; }
        if (result.data.provisioningState === "PROVISIONED" || result.data.provisioningState === "PARKED") return;
      }
      const delay = Date.now() - started < 120_000 ? 3_000 : 10_000;
      timer = setTimeout(poll, delay);
    };
    void poll();
    return () => { stopped = true; clearTimeout(timer); };
  }, [transactionReference, portal.portalToken, portal.normalizedPhone, portal.normalizedMac, portal.routerIdentity, onPortalRefreshed, pollDeadline]);

  const formik = useFormik({
    initialValues: { phone },
    validationSchema: Yup.object({ phone: mpesaPhoneSchema }),
    onSubmit: async (values) => {
      setMessage("");
      setRequestId(null);
      const key = idempotencyKey || crypto.randomUUID();
      setIdempotencyKey(key);
      const request = (portalToken: string) => initiateTvPaymentAction({
        customerPhone: portal.normalizedPhone || customerPhone,
        macAddress: portal.normalizedMac || macAddress,
        packageId: String(pkg.idxno),
        phone: normalizeMpesaPhone(values.phone),
        submittedAmount: serverAmount ?? pkg.price,
        idempotencyKey: key,
        portalToken,
      }, getPortalRouter());
      let result = await request(portal.portalToken);
      if (!result.success && result.code === "TV_PORTAL_TOKEN_EXPIRED") {
        const refreshed = await prepareTvDeviceAction({ customerPhone: portal.normalizedPhone || customerPhone, macAddress: portal.normalizedMac || macAddress, routerIdentity: portal.routerIdentity ?? undefined }, getPortalRouter());
        if (refreshed.success) {
          onPortalRefreshed(refreshed.portal);
          result = await request(refreshed.portal.portalToken);
        }
      }
      if (result.success) {
        setTransactionReference(result.transactionReference);
        setPollDeadline(Date.now() + 35 * 60_000);
        setMessage(result.mpesaStkPushTriggered ? "Check your phone and enter your M-Pesa PIN." : "Payment request accepted. Checking status.");
        return;
      }
      setRequestId(result.requestId ?? null);
      if (result.code === "AMOUNT_MISMATCH" && result.serverAmount) {
        setServerAmount(result.serverAmount);
        setMessage(`The package price is now KES ${result.serverAmount}. Confirm the updated amount to continue.`);
      } else if (result.code === "TV_PAYMENT_ALREADY_PENDING" && result.transactionReference) {
        setTransactionReference(result.transactionReference);
        setPollDeadline(Date.now() + 35 * 60_000);
        setMessage("A payment is already pending for this TV. Checking its status; do not pay again.");
      } else if (result.code === "TV_STK_OUTCOME_UNKNOWN" && result.transactionReference) {
        setTransactionReference(result.transactionReference);
        setPollDeadline(Date.now() + 35 * 60_000);
        setMessage("The payment result is not yet known. Check your phone. Do not start another payment.");
      } else {
        setMessage(result.message || "Payment request failed.");
        if (result.code === "TV_STK_NOT_ACCEPTED") setIdempotencyKey("");
      }
    },
  });

  const canRetryMismatch = serverAmount != null;
  const completed = status?.provisioningState === "PROVISIONED";
  const parked = status?.provisioningState === "PARKED";
  const terminalFailure = status?.state === "FAILED";
  const busy = formik.isSubmitting || Boolean(transactionReference && !completed && !parked && !terminalFailure);

  return <form onSubmit={formik.handleSubmit} noValidate className="space-y-5 rounded-lg border border-border bg-card p-5">
    <div><h3 className="text-xl font-medium">Review your TV purchase</h3><p className="mt-1 text-sm text-muted-foreground">Payment is sent to the payer phone. TV service belongs to {portal.normalizedPhone}.</p></div>
    <div className="rounded-md bg-muted p-4 text-sm"><p>TV: <span className="font-mono">{portal.normalizedMac || macAddress}</span></p><p className="mt-1">Package: {pkg.packageName}</p><p className="mt-1">Amount: KES {serverAmount ?? pkg.price}</p><p className="mt-1">Validity: {pkg.validity}</p></div>
    <div className="space-y-2"><Label htmlFor="tv-payment-phone">Payer M-Pesa phone</Label><Input id="tv-payment-phone" type="tel" name="phone" autoComplete="tel" inputMode="tel" placeholder="0712 345 678" value={formik.values.phone} disabled={busy} onChange={(event) => { formik.handleChange(event); onPhoneChange(event.target.value); setIdempotencyKey(""); }} onBlur={formik.handleBlur} required/><p className="text-xs text-muted-foreground">The payer may be different from the customer who owns the TV entitlement.</p>{formik.touched.phone && formik.errors.phone && <p role="alert" className="text-sm text-destructive">{formik.errors.phone}</p>}</div>
    {message && <p role="status" className="rounded-md bg-muted p-3 text-sm">{message}{requestId ? ` Ref: ${requestId}` : ""}</p>}
    {status && <div aria-live="polite" className="rounded-md border p-3 text-sm"><p>Payment: {status.state} · Service: {status.provisioningState}</p>{status.state === "TIMED_OUT" && <p className="mt-1">We did not get a result from M-Pesa. This may still settle later; do not pay again while checking. Reference: {status.supportReference ?? transactionReference}</p>}{status.pendingReason === "STK_OUTCOME_UNKNOWN" && <p className="mt-1">M-Pesa has not confirmed the result. Do not pay again.</p>}{status.pendingReason === "UNDER_REVIEW" && <p className="mt-1">Payment is under review.</p>}{status.failedReason && <p className="mt-1">{status.failedReason}</p>}{status.mpesaReceipt && <p className="mt-1">Receipt: {status.mpesaReceipt}</p>}{completed && status.tvEntitlementExpiresAt && <p className="mt-1">Active until {new Date(status.tvEntitlementExpiresAt).toLocaleString()}</p>}{parked && <p className="mt-1">Paid. Activation needs support. Quote {status.supportReference ?? transactionReference}.</p>}</div>}
    {canRetryMismatch ? <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => { setServerAmount(null); setIdempotencyKey(""); }}>Decline</Button><Button type="submit" disabled={busy}>Confirm KES {serverAmount}</Button></div> : <Button type="submit" disabled={busy || !formik.values.phone.trim()} className="w-full">{busy ? "Checking payment…" : `Pay KES ${pkg.price}`}</Button>}
    {transactionReference && <p className="text-xs text-muted-foreground">Reference: {transactionReference}</p>}
    {!transactionReference && <div className="flex gap-2"><Button type="button" variant="outline" onClick={onEditDevice}>Edit TV</Button><Button type="button" variant="outline" onClick={onEditPackage}>Change package</Button></div>}
  </form>;
}
