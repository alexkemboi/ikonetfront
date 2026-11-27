"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { redeemTvVoucherForDeviceAction, type TvVoucherRedemption } from "@/actions/tv";
import { normalizeTvMacAddress } from "@/lib/validation/tv-device";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCompanyScope } from "@/providers/CompanyScopeProvider";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const MAC = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/;

/**
 * Staff redemption of a TV voucher against a TV's MAC address, for a customer who cannot
 * use the TV setup page. The TV gets the voucher's time (added to any time it still has);
 * nothing is posted, since the voucher batch was recorded when it was sold.
 */
export function RedeemTvVoucherModal({ isOpen, onClose }: Props) {
  // Platform staff reach every company: the voucher's company is chosen here (it starts as the
  // company selected in the header). Everyone else redeems in their own company.
  const scope = useCompanyScope();
  const chooseCompany = scope.isPlatformAdmin && scope.companies.length > 0;
  const [company, setCompany] = useState("");
  const [code, setCode] = useState("");
  const [mac, setMac] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<TvVoucherRedemption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setCompany(scope.companyCode ?? scope.homeCompanyCode ?? "");
  }, [isOpen, scope.companyCode, scope.homeCompanyCode]);

  function close() {
    setCode(""); setMac(""); setPhone(""); setError(null); setDone(null);
    onClose();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const normalizedMac = normalizeTvMacAddress(mac);
    if (chooseCompany && !company) return setError("Choose the company the voucher belongs to.");
    if (!code.trim()) return setError("Enter the voucher code.");
    if (!MAC.test(normalizedMac)) return setError("Enter the TV's MAC address: 12 letters (A–F) and numbers, e.g. AA:BB:CC:DD:EE:FF.");
    if (!phone.trim()) return setError("Enter the customer's phone number.");
    setIsSubmitting(true);
    try {
      const result = await redeemTvVoucherForDeviceAction({
        voucherCode: code, macAddress: normalizedMac, customerPhone: phone,
        companyCode: chooseCompany ? company : undefined,
      });
      if (result.success) setDone(result.data);
      else setError(result.error);
    } catch {
      setError("The voucher could not be redeemed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const until = done?.tvAccessExpiresAt ? new Date(done.tvAccessExpiresAt).toLocaleString() : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redeem a TV voucher</DialogTitle>
        </DialogHeader>
        {done ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
              <div>
                <p className="font-medium">
                  {done.alreadyRedeemed ? "Already redeemed for this TV; nothing changed." : done.extended ? "Time added to the TV." : "TV connected."}
                </p>
                <p>{done.packageName} · {done.macAddress}{until ? ` · until ${until}` : ""}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">If the TV is not online within a minute, ask the customer to turn its Wi-Fi off and on.</p>
            <Button className="w-full" onClick={close}>Done</Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-3">
            {chooseCompany && (
              <label className="block text-xs font-medium text-muted-foreground">
                Company
                <select value={company} onChange={(e) => setCompany(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-muted p-2.5 text-sm text-foreground">
                  <option value="">Choose the company the voucher belongs to</option>
                  {scope.companies.map((c) => (
                    <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </label>
            )}
            <label className="block text-xs font-medium text-muted-foreground">
              Voucher code
              <input value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" spellCheck={false}
                className="mt-1 w-full rounded-lg border border-border bg-muted p-2.5 text-sm text-foreground uppercase" />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">
              TV MAC address
              <input value={mac} onChange={(e) => setMac(e.target.value)} onBlur={() => setMac(normalizeTvMacAddress(mac))}
                placeholder="AA:BB:CC:DD:EE:FF" autoComplete="off" spellCheck={false}
                className="mt-1 w-full rounded-lg border border-border bg-muted p-2.5 text-sm text-foreground tabular-nums" />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">
              Customer phone
              <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="0712 345 678"
                className="mt-1 w-full rounded-lg border border-border bg-muted p-2.5 text-sm text-foreground" />
            </label>
            <p className="text-[11px] text-muted-foreground">
              The phone owns the TV&apos;s access. Use the Wi-Fi MAC for a TV on Wi-Fi, the Ethernet MAC for one on a cable.
            </p>
            {error && (
              <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
              </p>
            )}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Redeeming…" : "Redeem for this TV"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
