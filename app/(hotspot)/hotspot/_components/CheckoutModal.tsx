"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getPublicVoucherStatus, initiatePublicHotspotPayment, PENDING_HOTSPOT_PURCHASE_KEY } from "@/lib/hotspotPublicClient";
import type { HotspotPackage, HotspotVoucherStatusResponse, PendingHotspotPurchase } from "@/lib/types/hotspot";
import { sanitizeErrorMessage } from "@/lib/brand";
import { useHotspotBrand } from "@/lib/hotspot/brand-context";

const POLL_INTERVAL_MS = 5_000;
const POLL_LIMIT_MS = 120_000;
const MAC_ADDRESS = /^(?:[0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}$/;
type PaymentView = "checkout" | "pending" | "active" | "failed" | "unavailable";

interface CheckoutModalProps {
  package?: HotspotPackage;
  pendingPurchase?: PendingHotspotPurchase;
  companyCode?: string | null;
  onCompanyResolved?: (companyCode?: string | null) => void;
  onClose: () => void;
  onPendingPurchase: (purchase: PendingHotspotPurchase | null) => void;
  /** Original `mac` redirect value; sent as macAddress. */
  clientMac?: string;
  /** Optional distinct `clientMac` redirect value. */
  redirectClientMac?: string;
  clientIp?: string;
  /** RouterOS $(identity) of the serving router (redirect `identity`/`router`). */
  routerIdentity?: string;
}

function readableExpiry(status?: HotspotVoucherStatusResponse | null): string | null {
  if (!status?.expiresAt) return null;
  const date = new Date(status.expiresAt);
  return Number.isNaN(date.getTime()) ? status.expiresAt : date.toLocaleString();
}

export default function CheckoutModal({ package: pkg, pendingPurchase: initialPendingPurchase, companyCode, onCompanyResolved, onClose, onPendingPurchase, clientMac, redirectClientMac, clientIp, routerIdentity }: CheckoutModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [view, setView] = useState<PaymentView>(initialPendingPurchase ? "pending" : "checkout");
  const [purchase, setPurchase] = useState<PendingHotspotPurchase | null>(initialPendingPurchase ?? null);
  const [status, setStatus] = useState<HotspotVoucherStatusResponse | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = useRef(false);
  const brand = useHotspotBrand();
  const macAddress = clientMac?.trim() ?? "";
  const requestClientMac = redirectClientMac?.trim() || macAddress;
  const hasUsableMac = MAC_ADDRESS.test(macAddress);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    pollingRef.current = false;
  }, []);

  const pollOnce = useCallback(async () => {
    if (!purchase || pollingRef.current) return;
    if (Date.now() - purchase.startedAt >= POLL_LIMIT_MS) {
      stopPolling();
      setView("unavailable");
      setNotice("We are still waiting for payment confirmation. Your session reference is saved; do not pay again.");
      return;
    }
    pollingRef.current = true;
    try {
      const result = await getPublicVoucherStatus(purchase.voucherCode);
      if (!result.success || !result.data) {
        setView("unavailable");
        setNotice(result.message || "We could not check your payment status. Your session reference is saved; do not pay again.");
        return;
      }
      setStatus(result.data);
      if (result.data.sessionStatus === "ACTIVE") {
        stopPolling();
        window.sessionStorage.removeItem(PENDING_HOTSPOT_PURCHASE_KEY);
        onPendingPurchase(null);
        setView("active");
      } else if (result.data.sessionStatus === "FAILED") {
        stopPolling();
        setView("failed");
        setNotice("Payment or provisioning needs attention. Keep this session reference and do not pay again; support can help you safely.");
      } else {
        setView("pending");
      }
    } catch (error) {
      setView("unavailable");
      setNotice(error instanceof Error ? sanitizeErrorMessage(error.message) : "We could not check your payment status. Your session reference is saved; do not pay again.");
    } finally {
      pollingRef.current = false;
    }
  }, [onPendingPurchase, purchase, stopPolling]);

  const beginPolling = useCallback(() => {
    stopPolling();
    void pollOnce();
    intervalRef.current = setInterval(() => void pollOnce(), POLL_INTERVAL_MS);
  }, [pollOnce, stopPolling]);

  useEffect(() => {
    if (purchase && view === "pending") beginPolling();
    return stopPolling;
  }, [beginPolling, purchase, stopPolling, view]);

  const handleConfirm = async () => {
    if (!pkg || !hasUsableMac || !phoneNumber.trim()) return;
    setIsProcessing(true);
try {
        const result = await initiatePublicHotspotPayment({ packageId: pkg.idxno, phone: phoneNumber.trim(), paymentMode: "mpesa", macAddress, clientMac: requestClientMac, clientIp: clientIp?.trim() || "", routerIdentity: routerIdentity?.trim() || undefined, companyId: companyCode ?? undefined });
      if (!result.success || !result.data?.voucherCode) throw new Error(result.message || "Failed to start payment tracking. Please try again.");
      if (result.data.companyId) onCompanyResolved?.(result.data.companyId);
      const nextPurchase: PendingHotspotPurchase = { sessionId: result.data.sessionId, voucherCode: result.data.voucherCode, startedAt: Date.now() };
      window.sessionStorage.setItem(PENDING_HOTSPOT_PURCHASE_KEY, JSON.stringify(nextPurchase));
      onPendingPurchase(nextPurchase);
      setPurchase(nextPurchase);
      setView("pending");
      toast.success("M-Pesa prompt sent", { description: "Check your phone and enter your M-Pesa PIN to complete payment." });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "Please try again.";
      toast.error("Payment could not be started", { description: sanitizeErrorMessage(rawMessage) });
    } finally {
      setIsProcessing(false);
    }
  };

  const retryStatus = () => { setNotice(null); setView("pending"); };
  const reference = purchase?.sessionId ?? status?.sessionId;
  const canClose = !isProcessing;

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Hotspot payment">
    <div className="bg-card rounded-xl max-w-md w-full shadow-lg border border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div><h3 className="text-lg font-normal text-foreground">{view === "active" ? "You’re connected" : view === "checkout" ? "Confirm Purchase" : "Payment status"}</h3><p className="text-xs text-muted-foreground">{brand}</p></div>
        <Button onClick={onClose} disabled={!canClose} variant="ghost" size="icon-sm" aria-label="Close"><X className="w-5 h-5" /></Button>
      </div>
      <div className="p-4 space-y-4">
        {view === "checkout" && pkg && <>
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2 text-sm"><p><span className="font-medium">Package:</span> {pkg.packageName}</p><p><span className="font-medium">Validity:</span> {pkg.validityValue} {pkg.validityType}</p><p className="text-xl font-bold text-primary">KES {pkg.price.toLocaleString()}</p></div>
          {!hasUsableMac && <p role="alert" className="text-sm text-destructive">We can’t identify this Wi-Fi device. Reconnect to the hotspot and open the portal again.</p>}
          <div className="space-y-2"><label htmlFor="phone" className="text-sm font-medium text-foreground block">M-Pesa Phone Number</label><input id="phone" type="tel" placeholder="+254 700 000 000" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} disabled={isProcessing} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm disabled:opacity-50" /></div>
        </>}
        {view === "pending" && <div className="space-y-3 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /><p className="font-medium">Enter your M-Pesa PIN when prompted.</p><p className="text-sm text-muted-foreground">We’ll connect this device as soon as payment is confirmed.</p></div>}
        {view === "active" && <div className="space-y-3 text-center"><CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" /><p className="font-medium">Your hotspot session is active.</p>{status?.voucherCode && <p className="text-sm">Voucher: <span className="font-mono">{status.voucherCode}</span></p>}{readableExpiry(status) && <p className="text-sm text-muted-foreground">Expires: {readableExpiry(status)}</p>}{status?.minutesRemaining !== undefined && <p className="text-sm text-muted-foreground">{status.minutesRemaining} minutes remaining</p>}</div>}
        {(view === "failed" || view === "unavailable") && <div className="space-y-3"><p role="alert" className="text-sm">{notice}</p>{reference !== undefined && <p className="text-xs text-muted-foreground">Session reference: <span className="font-mono">{reference}</span></p>}</div>}
      </div>
      <div className="flex gap-2 p-4 border-t border-border">
        {view === "checkout" ? <><Button onClick={onClose} disabled={!canClose} variant="secondary" className="flex-1">Cancel</Button><Button onClick={handleConfirm} disabled={isProcessing || !phoneNumber.trim() || !hasUsableMac} className="flex-1">{isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}{isProcessing ? "Processing..." : "Pay with M-Pesa"}</Button></> : view === "active" ? <Button onClick={onClose} className="w-full">Done</Button> : <><Button onClick={onClose} variant="secondary" className="flex-1">Close</Button>{(view === "failed" || view === "unavailable") && <Button onClick={retryStatus} className="flex-1"><RefreshCw className="w-4 h-4" />Check status</Button>}</>}
      </div>
    </div>
  </div>;
}
