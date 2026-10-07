"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  assignPppoePackageAction,
  getPppoePackagesAction,
  requestPppoePaymentAction,
  type PppoePackage,
} from "@/actions/pppoe";
import type { Customer } from "@/lib/types/customer";

export type PppoeServiceRequest = { kind: "package" | "payment"; customer: Customer };

const PHONE = /^\+?[0-9]{7,15}$/;

function packageLabel(pkg: PppoePackage): string {
  const parts = [pkg.name];
  if (pkg.durationDays) parts.push(`${pkg.durationDays} days`);
  if (pkg.price != null) parts.push(`KES ${pkg.price}`);
  return parts.join(" · ");
}

/**
 * Package assignment and M-Pesa payment request for one PPPoE customer.
 * Both go through the subscription engine: the customer is reconnected by the
 * backend, on their serving router, with no further step here.
 */
export function PppoeServiceDialog({
  request,
  onClose,
}: {
  request: PppoeServiceRequest | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={request !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        {request && (
          <ServiceForm
            key={`${request.kind}-${request.customer.userIdxno}`}
            request={request}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ServiceForm({ request, onClose }: { request: PppoeServiceRequest; onClose: () => void }) {
  const { kind, customer } = request;
  const router = useRouter();
  const [packages, setPackages] = useState<PppoePackage[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [packageId, setPackageId] = useState("");
  const [phone, setPhone] = useState(customer.phoneNumber ?? "");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPppoePackagesAction().then((res) => {
      if (cancelled) return;
      if (!res.success) {
        setLoadError(res.message);
        setPackages([]);
        return;
      }
      const list = res.data ?? [];
      setPackages(list);
      // Start from the customer's current package and its price.
      const current = list.find((p) => p.name === customer.packageName);
      if (current) {
        setPackageId(current.id);
        if (current.price != null) setAmount(String(current.price));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [customer.packageName]);

  const customerId = customer.customerId ?? "";
  const name = customer.fullName || customer.username;
  const amountValue = Number(amount);
  const valid =
    kind === "package"
      ? packageId !== ""
      : PHONE.test(phone.trim()) && Number.isFinite(amountValue) && amountValue > 0;

  async function submit() {
    setSaving(true);
    const res =
      kind === "package"
        ? await assignPppoePackageAction(customerId, packageId)
        : await requestPppoePaymentAction({ customerId, phoneNumber: phone.trim(), amount: amountValue });
    setSaving(false);
    if (!res.success) {
      toast.error(kind === "package" ? "Could not assign the package" : "Could not request the payment", {
        description: res.message,
      });
      return;
    }
    if (kind === "package") {
      toast.success("Package assigned", { description: `${name} is connected for one package period.` });
      router.refresh();
    } else {
      toast.success("Payment prompt sent", {
        description: `${name} is renewed and reconnected as soon as the payment is confirmed.`,
      });
    }
    onClose();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{kind === "package" ? "Assign package" : "Request M-Pesa payment"}</DialogTitle>
        <DialogDescription>
          {kind === "package"
            ? `Sets the speed and period for ${name} and connects them now, for one package period.`
            : `Sends a payment prompt to the phone below. Once paid, ${name} is renewed for one package period and reconnected.`}
        </DialogDescription>
      </DialogHeader>

      {packages === null ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading packages…
        </p>
      ) : kind === "package" ? (
        <div className="space-y-1.5">
          <Label htmlFor="pppoe-package">PPPoE package</Label>
          <select
            id="pppoe-package"
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select a package…</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {packageLabel(p)}
              </option>
            ))}
          </select>
          {loadError ? (
            <p className="text-xs text-destructive">Packages could not be loaded: {loadError}</p>
          ) : packages.length === 0 ? (
            <p className="text-xs text-destructive">This company has no PPPoE package yet. Create one first.</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Replaces the current package{customer.packageName ? ` (${customer.packageName})` : ""}.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {!customer.packageName && (
            <p className="rounded-md border border-warning/30 bg-warning/5 p-2 text-xs text-foreground">
              This customer has no package yet. Assign one first: a payment renews the package they are on.
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="pppoe-pay-phone">M-Pesa phone number</Label>
            <Input id="pppoe-pay-phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pppoe-pay-amount">Amount (KES)</Label>
            <Input
              id="pppoe-pay-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 2500"
            />
          </div>
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!valid || saving || !customerId}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {kind === "package" ? "Assign package" : "Send payment prompt"}
        </Button>
      </DialogFooter>
    </>
  );
}
